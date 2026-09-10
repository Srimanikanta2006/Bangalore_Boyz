import type { Request, Response } from 'express';
import * as hotspotService from '../services/hotspot.service';
import { wrap } from '../utils/wrap';
import type { HotspotQuery } from '../services/hotspot.service';

export const list = wrap(async (req: Request, res: Response) => {
  const data = await hotspotService.listHotspots(req.query as unknown as HotspotQuery);
  res.json({ success: true, data });
});

export const get = wrap(async (req: Request, res: Response) => {
  const data = await hotspotService.getHotspot(req.params.id);
  res.json({ success: true, data });
});

/** GET /api/hotspots/derived - clustering-derived hotspots computed live from HistoricalEvent rows. */
export const derived = wrap(async (_req: Request, res: Response) => {
  const data = await hotspotService.listDerivedHotspots();
  res.json({ success: true, data: { items: data } });
});
