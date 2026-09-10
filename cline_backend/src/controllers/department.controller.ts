import type { Request, Response } from 'express';
import * as departmentService from '../services/department.service';
import { wrap } from '../utils/wrap';

export const list = wrap(async (req: Request, res: Response) => {
  const data = await departmentService.listDepartments(req.query as { type?: string; page?: number; limit?: number });
  res.json({ success: true, data });
});

export const get = wrap(async (req: Request, res: Response) => {
  const data = await departmentService.getDepartment(req.params.id);
  res.json({ success: true, data });
});

export const units = wrap(async (req: Request, res: Response) => {
  const data = await departmentService.getDepartmentUnits(req.params.id, req.query as { status?: string; page?: number; limit?: number });
  res.json({ success: true, data });
});

export const readiness = wrap(async (req: Request, res: Response) => {
  const data = await departmentService.getDepartmentReadiness(req.params.id);
  res.json({ success: true, data });
});
