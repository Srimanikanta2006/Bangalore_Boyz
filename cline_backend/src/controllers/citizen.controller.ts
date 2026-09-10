import type { Request, Response } from 'express';
import { getCitizenNearby, getCitizenAlerts, getCitizenHazardDetail } from '../services/citizen.service';
import { createCitizenReport, listMyCitizenReports, getMyCitizenReport } from '../services/citizenReport.service';
import { createSosEvent, listMySosEvents } from '../services/sos.service';
import { wrap } from '../utils/wrap';
import type { CitizenNearbyQuery } from '../validators/citizen.schema';
import type { CreateCitizenReportInput } from '../validators/citizenReport.schema';
import type { CreateSosInput } from '../validators/sos.schema';

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
  const data = await createCitizenReport(req.user!, input, files);
  res.status(201).json({ success: true, data });
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
  const data = await createSosEvent(req.user!, input);
  res.status(201).json({ success: true, data });
});

export const mySos = wrap(async (req: Request, res: Response) => {
  const data = await listMySosEvents(req.user!.id);
  res.json({ success: true, data });
});
