import type { Request, Response } from 'express';
import * as simulatorService from '../services/simulator.service';
import { wrap } from '../utils/wrap';
import type { CreateSimulationInput, SimulationQuery } from '../validators/simulator.schema';

export const create = wrap(async (req: Request, res: Response) => {
  const data = await simulatorService.runSimulation(req.body as CreateSimulationInput, req.user!);
  res.status(201).json({ success: true, data });
});

export const list = wrap(async (req: Request, res: Response) => {
  const data = await simulatorService.listSimulations(req.query as unknown as SimulationQuery);
  res.json({ success: true, data });
});

export const get = wrap(async (req: Request, res: Response) => {
  const data = await simulatorService.getSimulation(req.params.id);
  res.json({ success: true, data });
});
