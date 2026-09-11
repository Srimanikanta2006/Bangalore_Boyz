import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import { loginSchema } from '../validators/auth.schema';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/auth/login', authLimiter, validate(loginSchema), authController.login);
router.get('/auth/me', authenticate, authController.me);

export default router;
