import type { Request, Response } from 'express';
import * as hazardService from '../services/hazard.service';
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
