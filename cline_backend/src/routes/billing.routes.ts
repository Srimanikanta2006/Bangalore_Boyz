import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { wrap } from '../utils/wrap';
import * as billing from '../services/billing.service';

const router = Router();

const createOrderSchema = z.object({
  planId: z.enum(['starter', 'pro', 'enterprise']),
});

const verifySchema = z.object({
  razorpayOrderId:   z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

/** POST /api/billing/orders — create Razorpay order for a plan */
router.post('/billing/orders', authenticate, validate(createOrderSchema), wrap(async (req, res) => {
  const { planId } = req.body as { planId: string };
  const data = await billing.createOrder(req.user!.id, planId);
  res.status(201).json({ success: true, data });
}));

/** POST /api/billing/payments/verify — verify Razorpay HMAC signature */
router.post('/billing/payments/verify', authenticate, validate(verifySchema), wrap(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as z.infer<typeof verifySchema>;
  const data = await billing.verifyPayment(req.user!.id, razorpayOrderId, razorpayPaymentId, razorpaySignature);
  res.json({ success: true, data });
}));

/** GET /api/billing/payments — own payment history */
router.get('/billing/payments', authenticate, wrap(async (req, res) => {
  const data = await billing.getMyPayments(req.user!.id);
  res.json({ success: true, data });
}));

export default router;
