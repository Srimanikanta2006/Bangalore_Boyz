import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { loginSchema } from '../validators/auth.schema';
import * as authController from '../controllers/auth.controller';

const router = Router();

/** Basic rate limiting on the authentication endpoint. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again later.' },
    });
  },
});

router.post('/auth/login', loginLimiter, validate(loginSchema), authController.login);
router.get('/auth/me', authenticate, authController.me);

export default router;
