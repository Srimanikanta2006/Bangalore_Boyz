import type { Request, Response } from 'express';
import { getCitizenNearby, getCitizenAlerts, getCitizenHazardDetail } from '../services/citizen.service';
import { wrap } from '../utils/wrap';
import type { CitizenNearbyQuery } from '../validators/citizen.schema';

export const nearby = wrap(async (req: Request, res: Response) => {
  const query = req.query as unknown as CitizenNearbyQuery;
  const data = await getCitizenNearby(query);
  res.json({ success: true, data });
});

export const alerts = wrap(async (req: Request, res: Response) => {
  const query = req.query as unknown as CitizenNearbyQuery;
  const data = await getCitizenAlerts(query);
  res.json({ success: true, data });
});

export const hazardDetail = wrap(async (req: Request, res: Response) => {
  const data = await getCitizenHazardDetail(req.params.id);
  res.json({ success: true, data });
});
