import type { Request, Response } from 'express';
import * as infrastructureService from '../services/infrastructure.service';
import { wrap } from '../utils/wrap';
import type { InfrastructureQuery } from '../validators/infrastructure.schema';

export const list = wrap(async (req: Request, res: Response) => {
  const data = await infrastructureService.listAssets(req.query as unknown as InfrastructureQuery);
  res.json({ success: true, data });
});

export const get = wrap(async (req: Request, res: Response) => {
  const data = await infrastructureService.getAsset(req.params.id);
  res.json({ success: true, data });
});

export const telemetry = wrap(async (req: Request, res: Response) => {
  const data = await infrastructureService.getTelemetry(req.params.id, req.query as unknown as { metric?: string; limit: number });
  res.json({ success: true, data });
});

export const risk = wrap(async (req: Request, res: Response) => {
  const data = await infrastructureService.getRisk(req.params.id);
  res.json({ success: true, data });
});

export const dependencies = wrap(async (req: Request, res: Response) => {
  const data = await infrastructureService.getDependencies(req.params.id);
  res.json({ success: true, data });
});

export const assignTeam = wrap(async (req: Request, res: Response) => {
  const data = await infrastructureService.assignRapidTeam(req.params.id, req.body as { unitId?: string; note?: string }, req.user!);
  res.status(201).json({ success: true, data });
});

export const maintenance = wrap(async (req: Request, res: Response) => {
  const data = await infrastructureService.requestMaintenance(req.params.id, req.body as { description?: string; priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }, req.user!);
  res.status(201).json({ success: true, data });
});

export const reroute = wrap(async (req: Request, res: Response) => {
  const data = await infrastructureService.rerouteTraffic(req.params.id, req.body as { reason?: string }, req.user!);
  res.json({ success: true, data });
});

export const logs = wrap(async (req: Request, res: Response) => {
  const data = await infrastructureService.getFacilityLogs(req.params.id);
  res.json({ success: true, data });
});
