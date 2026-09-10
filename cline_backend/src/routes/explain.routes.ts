import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as explainController from "../controllers/explain.controller";

const router = Router();

/**
 * POST /api/incidents/:id/explain
 * Runs the incident's verified engine facts through the P4 Gemini AI layer
 * (with deterministic fallback) and returns an operator-facing briefing.
 */
router.post("/incidents/:id/explain", authenticate, explainController.explain);

export default router;
