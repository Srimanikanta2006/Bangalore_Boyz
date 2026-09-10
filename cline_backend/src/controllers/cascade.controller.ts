import type { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { getZoneCascade } from '../services/cascade.service';
import { wrap } from '../utils/wrap';

export const zoneCascade = wrap(async (req: Request, res: Response) => {
  const data = await getZoneCascade(prisma, req.params.zoneId);
  res.json({ success: true, data });
});
