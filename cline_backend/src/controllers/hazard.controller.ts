import type { Request, Response } from 'express';
import * as hazardService from '../services/hazard.service';
import { hazardToCapXml } from '../services/capExport.service';
import { wrap } from '../utils/wrap';
import type { CreateHazardInput, HazardQuery } from '../services/hazard.service';

export const list = wrap(async (req: Request, res: Response) => {
  const data = await hazardService.listHazards(req.query as unknown as HazardQuery);
  res.json({ success: true, data });
});

export const get = wrap(async (req: Request, res: Response) => {
  const data = await hazardService.getHazard(req.params.id);
  res.json({ success: true, data });
});

export const create = wrap(async (req: Request, res: Response) => {
  const data = await hazardService.createHazard(req.body as CreateHazardInput, req.user!);
  res.status(201).json({ success: true, data });
});

/** GET /api/hazards/:id/cap.xml - CAP 1.2 XML export (protocol-compatibility demo, see capExport.service.ts). */
export const capXml = wrap(async (req: Request, res: Response) => {
  const hazard = await hazardService.getHazard(req.params.id);
  res.type('application/cap+xml').send(hazardToCapXml(hazard as never));
});
