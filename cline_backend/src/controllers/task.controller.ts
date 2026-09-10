import type { Request, Response } from 'express';
import * as taskService from '../services/task.service';
import { wrap } from '../utils/wrap';
import type { TaskStatus } from '@prisma/client';
import type { CreateTaskInput, TaskQuery } from '../validators/task.schema';

export const list = wrap(async (req: Request, res: Response) => {
  const data = await taskService.listTasks(req.query as unknown as TaskQuery);
  res.json({ success: true, data });
});

export const get = wrap(async (req: Request, res: Response) => {
  const data = await taskService.getTask(req.params.id);
  res.json({ success: true, data });
});

export const create = wrap(async (req: Request, res: Response) => {
  const data = await taskService.createTask(req.body as CreateTaskInput, req.user!);
  res.status(201).json({ success: true, data: { task: data } });
});

export const updateStatus = wrap(async (req: Request, res: Response) => {
  const { status, note } = req.body as { status: TaskStatus; note?: string };
  const data = await taskService.updateTaskStatus(req.params.id, status, note, req.user!);
  res.json({ success: true, data });
});

export const assign = wrap(async (req: Request, res: Response) => {
  const data = await taskService.assignUnitToTask(req.params.id, req.body.unitId, req.user!);
  res.json({ success: true, data });
});

export const verify = wrap(async (req: Request, res: Response) => {
  const data = await taskService.verifyTask(req.params.id, (req.body as { note?: string }).note, req.user!);
  res.json({ success: true, data });
});

export const history = wrap(async (req: Request, res: Response) => {
  const data = await taskService.getTaskHistory(req.params.id);
  res.json({ success: true, data });
});
