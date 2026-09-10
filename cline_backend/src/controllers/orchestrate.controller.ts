import type { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { orchestrateIncident } from "../services/orchestrate.service";
import { wrap } from "../utils/wrap";

/**
 * POST /api/incidents/:id/orchestrate - runs the incident's verified engine
 * facts through the standalone multi-agent orchestrator (risk-analyst ->
 * cascade -> dispatch-planner -> comms -> validation) and returns a PROPOSED
 * response plan for operator approval. Falls back to the orchestrator's
 * deterministic path (never a 500) if the AI agents are unavailable/fail.
 */
export const orchestrate = wrap(async (req: Request, res: Response) => {
  const data = await orchestrateIncident(prisma, req.params.id);
  res.json({ success: true, data });
});
