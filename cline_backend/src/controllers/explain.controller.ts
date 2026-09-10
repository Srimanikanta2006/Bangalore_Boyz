import type { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { explainIncident } from "../services/explain.service";
import { wrap } from "../utils/wrap";

/** POST /api/incidents/:id/explain - grounded AI explanation for an incident. */
export const explain = wrap(async (req: Request, res: Response) => {
  const data = await explainIncident(prisma, req.params.id);
  res.json({ success: true, data });
});
