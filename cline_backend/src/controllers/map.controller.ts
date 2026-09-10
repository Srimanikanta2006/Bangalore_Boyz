import type { Request, Response } from 'express';
import * as mapService from '../services/map.service';
import { wrap } from '../utils/wrap';

export const assets = wrap(async (req: Request, res: Response) => {
  const data = await mapService.mapAssets(req.query as { zoneId?: string; assetType?: string; status?: string; criticality?: string });
  res.json({ success: true, data });
});

export const hazards = wrap(async (req: Request, res: Response) => {
  const data = await mapService.mapHazards(req.query as { zoneId?: string; severity?: string; hazardType?: string; status?: string });
  res.json({ success: true, data });
});

export const incidents = wrap(async (req: Request, res: Response) => {
  const data = await mapService.mapIncidents(req.query as { zoneId?: string; severity?: string; status?: string });
  res.json({ success: true, data });
});

export const units = wrap(async (req: Request, res: Response) => {
  const data = await mapService.mapUnits(req.query as { status?: string; type?: string; departmentId?: string });
  res.json({ success: true, data });
});

export const overlays = wrap(async (_req: Request, res: Response) => {
  const data = await mapService.mapOverlays();
  res.json({ success: true, data });
});
