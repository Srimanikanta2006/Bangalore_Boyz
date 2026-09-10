import type { Request, Response } from 'express';
import { getAnalyticsOverview } from '../services/analytics.service';
import { wrap } from '../utils/wrap';

export const overview = wrap(async (_req: Request, res: Response) => {
  const data = await getAnalyticsOverview();
  res.json({ success: true, data });
});
