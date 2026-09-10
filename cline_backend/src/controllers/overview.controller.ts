import type { Request, Response } from 'express';
import { getOverview } from '../services/overview.service';
import { wrap } from '../utils/wrap';

export const getOverviewHandler = wrap(async (_req: Request, res: Response) => {
  const data = await getOverview();
  res.json({ success: true, data });
});
