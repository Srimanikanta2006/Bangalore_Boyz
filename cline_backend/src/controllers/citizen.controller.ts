import type { Request, Response } from 'express';
import { getCitizenNearby, getCitizenAlerts, getCitizenHazardDetail } from '../services/citizen.service';
import { createCitizenReport, listMyCitizenReports, getMyCitizenReport } from '../services/citizenReport.service';
import { createSosEvent, listMySosEvents, getMySosEvent } from '../services/sos.service';
import { scoreCandidateRoutes } from '../services/routeScoring.service';
import { wrap } from '../utils/wrap';
import type { CitizenNearbyQuery } from '../validators/citizen.schema';
import type { CreateCitizenReportInput } from '../validators/citizenReport.schema';
import type { CreateSosInput } from '../validators/sos.schema';
import type { ScoreRoutesInput } from '../validators/routeScoring.schema';

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

export const submitReport = wrap(async (req: Request, res: Response) => {
  const input = req.body as CreateCitizenReportInput;
  const files = ((req.files as Express.Multer.File[] | undefined) ?? []).map((f) => ({
    filename: f.filename,
    mimetype: f.mimetype,
    size: f.size,
  }));
  const idempotencyKey = typeof req.headers['idempotency-key'] === 'string' ? req.headers['idempotency-key'] : undefined;
  const data = await createCitizenReport(req.user!, input, files, idempotencyKey);
  // 200 for deduplicated (already exists), 201 for newly created
  const status = (data as { _deduplicated?: boolean })._deduplicated ? 200 : 201;
  res.status(status).json({ success: true, data });
});

export const myReports = wrap(async (req: Request, res: Response) => {
  const data = await listMyCitizenReports(req.user!.id);
  res.json({ success: true, data });
});

export const myReportDetail = wrap(async (req: Request, res: Response) => {
  const data = await getMyCitizenReport(req.user!.id, req.params.id);
  res.json({ success: true, data });
});

export const submitSos = wrap(async (req: Request, res: Response) => {
  const input = req.body as CreateSosInput;
  const idempotencyKey = typeof req.headers['idempotency-key'] === 'string' ? req.headers['idempotency-key'] : undefined;
  const data = await createSosEvent(req.user!, input, idempotencyKey);
  // 200 for deduplicated (already exists), 201 for newly created
  const status = (data as { _deduplicated?: boolean })._deduplicated ? 200 : 201;
  res.status(status).json({ success: true, data });
});

export const mySos = wrap(async (req: Request, res: Response) => {
  const data = await listMySosEvents(req.user!.id);
  res.json({ success: true, data });
});

export const mySosDetail = wrap(async (req: Request, res: Response) => {
  const data = await getMySosEvent(req.user!.id, req.params.id);
  res.json({ success: true, data });
});

export const scoreRoutes = wrap(async (req: Request, res: Response) => {
  const input = req.body as ScoreRoutesInput;
  const data = await scoreCandidateRoutes(input.routes);
  res.json({ success: true, data });
});
