import type { Request, Response } from 'express';
import { createResponsePlan, getResponseCenter } from '../services/response.service';
import { wrap } from '../utils/wrap';

export const getResponseCenterHandler = wrap(async (_req: Request, res: Response) => {
  const data = await getResponseCenter();
  res.json({ success: true, data });
});

export const createResponsePlanHandler = wrap(async (req: Request, res: Response) => {
  const data = await createResponsePlan(req.params.zoneId, req.user!);
  res.status(201).json({ success: true, data });
});
