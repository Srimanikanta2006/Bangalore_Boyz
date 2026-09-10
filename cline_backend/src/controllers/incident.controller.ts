import type { Request, Response } from 'express';
import * as incidentService from '../services/incident.service';
import * as taskService from '../services/task.service';
import { getIncidentCascade } from '../services/cascade.service';
import { prisma } from '../db/prisma';
import { wrap } from '../utils/wrap';
import type { CreateIncidentInput, IncidentQuery, UpdateIncidentInput } from '../validators/incident.schema';

export const list = wrap(async (req: Request, res: Response) => {
  const data = await incidentService.listIncidents(req.query as unknown as IncidentQuery);
  res.json({ success: true, data });
});

export const get = wrap(async (req: Request, res: Response) => {
  const data = await incidentService.getIncident(req.params.id, req.user);
  res.json({ success: true, data });
});

export const create = wrap(async (req: Request, res: Response) => {
  const data = await incidentService.createIncident(req.body as CreateIncidentInput, req.user!);
  res.status(201).json({ success: true, data });
});

export const update = wrap(async (req: Request, res: Response) => {
  const data = await incidentService.updateIncident(req.params.id, req.body as UpdateIncidentInput, req.user!);
  res.json({ success: true, data });
});

export const updateStatus = wrap(async (req: Request, res: Response) => {
  const { status, note } = req.body as { status: 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'; note?: string };
  const data = await incidentService.updateIncidentStatus(req.params.id, status, note, req.user!);
  res.json({ success: true, data });
});

export const getCascade = wrap(async (req: Request, res: Response) => {
  const data = await getIncidentCascade(prisma, req.params.id);
  res.json({ success: true, data });
});

export const dispatch = wrap(async (req: Request, res: Response) => {
  const data = await taskService.dispatchUnitToIncident(req.params.incidentId, req.body.unitId, req.user!);
  res.status(201).json({ success: true, data });
});
