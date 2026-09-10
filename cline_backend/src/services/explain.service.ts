import { env } from "../config/env";
import type { DbClient } from "../db/prisma";
import { Errors } from "../utils/errors";
import { explainWithGeminiOrFallback } from "../ai/geminiProvider";
import { toExplainRequest, type IncidentCascadeFacts } from "../ai/explainAdapter";
import { getIncidentCascade } from "./cascade.service";

/**
 * P4 AI EXPLANATION SERVICE.
 *
 * Pipeline: deterministic engine facts (getIncidentCascade) -> grounded
 * ExplainRequest (explainAdapter) -> Gemini (with deterministic fallback).
 * The AI never calculates risk or invents assets; it only interprets the
 * already-verified facts and recommends actions from the controlled catalog.
 */
export async function explainIncident(client: DbClient, incidentId: string) {
  const cascade = (await getIncidentCascade(client, incidentId)) as unknown as IncidentCascadeFacts;

  if (!cascade.rootAsset || !cascade.baseRisk || cascade.nodes.length === 0) {
    throw Errors.businessRule(
      "NO_ASSESSABLE_ASSET",
      "This incident has no assessable infrastructure asset, so no grounded explanation can be produced.",
    );
  }

  const explainRequest = toExplainRequest(cascade);

  const result = await explainWithGeminiOrFallback(explainRequest, {
    apiKey: env.GEMINI_API_KEY || undefined,
    model: env.GEMINI_MODEL || undefined,
  });

  return {
    incidentId: cascade.incident.id,
    incidentCode: cascade.incident.incidentCode ?? null,
    provider: result.usedFallback ? ("fallback" as const) : ("gemini" as const),
    model: result.modelUsed ?? null,
    usedFallback: result.usedFallback,
    fallbackReason: result.fallbackReason ?? null,
    // Transparency: expose exactly which verified facts the AI was grounded on.
    verifiedFacts: explainRequest,
    explanation: result.response,
  };
}
