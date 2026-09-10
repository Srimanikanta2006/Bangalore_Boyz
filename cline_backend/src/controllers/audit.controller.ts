import type { Request, Response } from 'express';
import { listAudit } from '../services/audit.service';
import { wrap } from '../utils/wrap';

export const list = wrap(async (req: Request, res: Response) => {
  const data = await listAudit(req.query as { action?: string; entityType?: string; entityId?: string; userId?: string; page?: number; limit?: number });
  res.json({ success: true, data });
});
