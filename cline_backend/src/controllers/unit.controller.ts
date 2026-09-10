import type { Request, Response } from 'express';
import * as unitService from '../services/unit.service';
import { wrap } from '../utils/wrap';
import type { UnitQuery } from '../services/unit.service';
import type { UnitStatus } from '@prisma/client';

export const list = wrap(async (req: Request, res: Response) => {
  const data = await unitService.listUnits(req.query as unknown as UnitQuery);
  res.json({ success: true, data });
});

export const get = wrap(async (req: Request, res: Response) => {
  const data = await unitService.getUnit(req.params.id);
  res.json({ success: true, data });
});

export const updateStatus = wrap(async (req: Request, res: Response) => {
  const { status, note } = req.body as { status: UnitStatus; note?: string };
  const data = await unitService.updateUnitStatus(req.params.id, status, note, req.user!);
  res.json({ success: true, data });
});
