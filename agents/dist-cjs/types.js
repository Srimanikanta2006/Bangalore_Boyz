"use strict";
/**
 * ClimateShield — Agent Layer Shared Schemas
 * ==========================================
 *
 * These are the structured JSON contracts that flow between the orchestrator
 * and the specialist agents. They are deliberately DECOUPLED from the backend's
 * Prisma/domain types: agents only ever receive already-VERIFIED facts produced
 * by the deterministic engine (risk + cascade), and only ever emit structured,
 * validated JSON. The deterministic engine remains the single source of truth;
 * agents interpret and plan, they never recompute risk or invent assets.
 *
 * Grounding rules enforced downstream (see agents + ValidationAgent):
 *  - No invented infrastructure assets (every targetAssetId must exist in facts).
 *  - No invented action IDs (only the controlled action catalog).
 *  - Confidence can never exceed the engine's own confidence for the incident.
 *  - Output is a PROPOSED plan for human/operator approval — never autonomous
 *    execution.
 */
Object.defineProperty(exports, "__esModule", { value: true });
