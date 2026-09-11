import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import type { PlanId } from '@prisma/client';
import { prisma } from '../db/prisma';
import { env } from '../config/env';
import { Errors } from '../utils/errors';
import { recordAudit } from './audit.service';

// Server-side authoritative prices in paise (1 INR = 100 paise)
export const PLAN_PRICES: Record<PlanId, { amountPaise: number; label: string }> = {
  starter:    { amountPaise: 149900,  label: 'Municipal Core — Single EOC Fleet' },
  pro:        { amountPaise: 399900,  label: 'Statewide EOC — Multi-Region Command' },
  enterprise: { amountPaise: 1199000, label: 'Enterprise Resilience' },
};

function getRazorpay() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw Errors.internal('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }
  return new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
}

export async function createOrder(userId: string, planId: string) {
  if (!PLAN_PRICES[planId as PlanId]) {
    throw Errors.validation(`Invalid planId: ${planId}. Must be starter, pro, or enterprise.`);
  }
  const plan = PLAN_PRICES[planId as PlanId];
  const razorpay = getRazorpay();

  // Create Razorpay order
  const rzpOrder = await razorpay.orders.create({
    amount: plan.amountPaise,
    currency: 'INR',
    receipt: `cs_${userId.slice(0, 8)}_${Date.now()}`,
  });

  // Persist pending payment record
  const payment = await prisma.billingPayment.create({
    data: {
      userId,
      planId: planId as PlanId,
      amountPaise: plan.amountPaise,
      currency: 'INR',
      status: 'PENDING',
      razorpayOrderId: rzpOrder.id,
    },
  });

  return {
    orderId: rzpOrder.id,
    amount: plan.amountPaise,
    currency: 'INR',
    keyId: env.RAZORPAY_KEY_ID,
    planLabel: plan.label,
    paymentId: payment.id,
  };
}

export async function verifyPayment(
  userId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
) {
  // Load the pending payment — must belong to this user
  const payment = await prisma.billingPayment.findUnique({ where: { razorpayOrderId } });
  if (!payment) throw Errors.notFound('Payment', razorpayOrderId);
  if (payment.userId !== userId) throw Errors.forbidden();

  // Idempotency: already verified
  if (payment.status === 'VERIFIED') {
    return { success: true, alreadyVerified: true, planId: payment.planId };
  }
  if (payment.status === 'FAILED') {
    throw Errors.businessRule('PAYMENT_FAILED', 'This payment has already been marked as failed.');
  }

  // HMAC-SHA256 verification (server-side, secret never leaves backend)
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expected !== razorpaySignature) {
    await prisma.billingPayment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
    throw Errors.businessRule('INVALID_SIGNATURE', 'Payment signature verification failed.');
  }

  // Atomic: mark verified + record payment id + set activatedAt
  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.billingPayment.update({
      where: { id: payment.id },
      data: { status: 'VERIFIED', razorpayPaymentId, activatedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: 'BILLING_PAYMENT_VERIFIED',
        entityType: 'BILLING_PAYMENT',
        entityId: p.id,
        metadata: { planId: p.planId, amountPaise: p.amountPaise, razorpayOrderId, razorpayPaymentId },
      },
    });
    return p;
  });

  return { success: true, alreadyVerified: false, planId: updated.planId };
}

export async function getMyPayments(userId: string) {
  return prisma.billingPayment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, planId: true, amountPaise: true, currency: true, status: true, activatedAt: true, createdAt: true },
  });
}
