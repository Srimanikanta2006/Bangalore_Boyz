import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as orchestrateController from "../controllers/orchestrate.controller";

const router = Router();

/**
 * POST /api/incidents/:id/orchestrate
 * Runs the incident's verified engine facts through the standalone multi-agent
 * orchestrator (agents/ + orchestration/) and returns a PROPOSED response plan
 * (risk assessment, cascade analysis, dispatch actions, comms briefings) for
 * operator approval. 404 if the incident doesn't exist; 422 if it has no
 * assessable infrastructure asset; never 500 for an agent-side failure (falls
 * back to the orchestrator's deterministic path and flags "mode": "fallback").
 */
router.post("/incidents/:id/orchestrate", authenticate, orchestrateController.orchestrate);

export default router;
