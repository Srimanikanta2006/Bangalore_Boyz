import type { Request, Response } from 'express';
import { getLocationOverview } from '../services/location.service';
import { wrap } from '../utils/wrap';
import type { LocationQuery } from '../validators/location.schema';

export const overview = wrap(async (req: Request, res: Response) => {
  const query = req.query as unknown as LocationQuery;
  const data = await getLocationOverview(query);
  res.json({ success: true, data });
});
