import type { Request, Response } from 'express';
import { getCitizenNearby } from '../services/citizen.service';
import { wrap } from '../utils/wrap';
import type { CitizenNearbyQuery } from '../validators/citizen.schema';

export const nearby = wrap(async (req: Request, res: Response) => {
  const query = req.query as unknown as CitizenNearbyQuery;
  const data = await getCitizenNearby(query);
  res.json({ success: true, data });
});
