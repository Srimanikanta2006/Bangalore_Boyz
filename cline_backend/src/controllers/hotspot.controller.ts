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
