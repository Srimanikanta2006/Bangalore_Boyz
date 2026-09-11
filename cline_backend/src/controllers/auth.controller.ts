import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { wrap } from '../utils/wrap';

export const login = wrap(async (req: Request, res: Response) => {
  const data = await authService.login(req.body.email, req.body.password);
  res.json({ success: true, data });
});

export const register = wrap(async (req: Request, res: Response) => {
  const data = await authService.register(req.body);
  res.status(201).json({ success: true, data });
});

export const me = wrap(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  res.json({ success: true, data: { user } });
});
