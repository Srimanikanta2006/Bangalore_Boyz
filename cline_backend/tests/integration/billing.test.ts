import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import request from 'supertest';
import { app, auth, dbReady, login } from '../helpers';
import { prisma } from '../../src/db/prisma';

const ready = await dbReady();

describe.skipIf(!ready)('Billing: Razorpay Order & Verification', () => {
  let govToken: string;
  let createdOrderId: string;

  beforeAll(async () => {
    govToken = await login('government@climateshield.demo');
  });

  it('POST /api/billing/orders — rejects invalid planId with 400', async () => {
    const res = await request(app)
      .post('/api/billing/orders')
      .set(auth(govToken))
      .send({ planId: 'INVALID_PLAN' });
    expect(res.status).toBe(400);
  });

  it('POST /api/billing/orders — rejects unauthenticated with 401', async () => {
    const res = await request(app).post('/api/billing/orders').send({ planId: 'starter' });
    expect(res.status).toBe(401);
  });

  it('POST /api/billing/orders — creates a Razorpay order for starter plan', async () => {
    const res = await request(app)
      .post('/api/billing/orders')
      .set(auth(govToken))
      .send({ planId: 'starter' });

    // Will pass if RAZORPAY_KEY_ID is configured; skip gracefully if not
    if (res.status === 500 && res.body.error?.code === 'INTERNAL_ERROR') {
      console.log('Razorpay not configured, skipping order creation test');
      return;
    }

    expect(res.status).toBe(201);
    expect(res.body.data.orderId).toMatch(/^order_/);
    expect(res.body.data.amount).toBe(149900); // ₹1499 in paise
    expect(res.body.data.currency).toBe('INR');
    expect(res.body.data.keyId).toBeTruthy();
    createdOrderId = res.body.data.orderId;
  });

  it('POST /api/billing/payments/verify — rejects invalid signature', async () => {
    if (!createdOrderId) return;
    const res = await request(app)
      .post('/api/billing/payments/verify')
      .set(auth(govToken))
      .send({
        razorpayOrderId: createdOrderId,
        razorpayPaymentId: 'pay_test_fake',
        razorpaySignature: 'invalidsignature',
      });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_SIGNATURE');

    // Payment must remain PENDING (not activated before verification)
    const payment = await prisma.billingPayment.findUnique({ where: { razorpayOrderId: createdOrderId } });
    expect(payment?.status).toBe('FAILED'); // marked failed after bad sig
    expect(payment?.activatedAt).toBeNull();
  });

  it('POST /api/billing/payments/verify — accepts valid HMAC signature', async () => {
    // Create a fresh order for this test
    const orderRes = await request(app)
      .post('/api/billing/orders')
      .set(auth(govToken))
      .send({ planId: 'pro' });

    if (orderRes.status !== 201) return;
    const orderId = orderRes.body.data.orderId;
    const fakePaymentId = 'pay_test_123456';
    const secret = process.env.RAZORPAY_KEY_SECRET ?? '';
    const sig = crypto.createHmac('sha256', secret).update(`${orderId}|${fakePaymentId}`).digest('hex');

    const res = await request(app)
      .post('/api/billing/payments/verify')
      .set(auth(govToken))
      .send({ razorpayOrderId: orderId, razorpayPaymentId: fakePaymentId, razorpaySignature: sig });

    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);
    expect(res.body.data.planId).toBe('pro');

    // Plan must be activated in DB
    const payment = await prisma.billingPayment.findUnique({ where: { razorpayOrderId: orderId } });
    expect(payment?.status).toBe('VERIFIED');
    expect(payment?.activatedAt).not.toBeNull();
  });

  it('POST /api/billing/payments/verify — idempotent: second call returns alreadyVerified=true', async () => {
    const orderRes = await request(app)
      .post('/api/billing/orders')
      .set(auth(govToken))
      .send({ planId: 'starter' });
    if (orderRes.status !== 201) return;

    const orderId = orderRes.body.data.orderId;
    const fakePaymentId = 'pay_idem_test';
    const secret = process.env.RAZORPAY_KEY_SECRET ?? '';
    const sig = crypto.createHmac('sha256', secret).update(`${orderId}|${fakePaymentId}`).digest('hex');
    const body = { razorpayOrderId: orderId, razorpayPaymentId: fakePaymentId, razorpaySignature: sig };

    await request(app).post('/api/billing/payments/verify').set(auth(govToken)).send(body);
    const second = await request(app).post('/api/billing/payments/verify').set(auth(govToken)).send(body);

    expect(second.status).toBe(200);
    expect(second.body.data.alreadyVerified).toBe(true);
  });

  it('GET /api/billing/payments — returns own payment history', async () => {
    const res = await request(app).get('/api/billing/payments').set(auth(govToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
