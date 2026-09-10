/**
 * RiskAnalystAgent
 * ================
 * Interprets the engine's verified risk facts into an operator-facing risk
 * assessment. It NEVER recomputes the score — it echoes the engine score/level
 * and caps its confidence at the engine's confidence.
 */

import { BaseAgent } from "./baseAgent";
import type { AgentContext, AgentName, KeyImpact, RiskAssessment } from "../types";
import {
  asNumber,
  asString,
  asStringArray,
  clamp01,
  parseJsonObject,
  riskLevelFromScore,
  toRiskLevel,
} from "../util";

export class RiskAnalystAgent extends BaseAgent<RiskAssessment> {
  readonly name: AgentName = "risk-analyst";

  protected buildPrompt(ctx: AgentContext): string {
    const { facts } = ctx;
    return [
      "TASK: Produce a concise risk assessment for the incident below.",
      "Echo the engine score exactly; do NOT recompute it.",
      `Constraint: "confidence" must be a number between 0 and ${facts.baseRisk.confidence}.`,
      "",
      "Return JSON:",
      "{",
      '  "headline": "string",',
      '  "severity": "low|medium|high|critical",',
      '  "score": number,',
      '  "confidence": number,',
      '  "drivers": ["string"],',
      '  "keyImpacts": [ { "assetName": "string", "description": "string", "severity": "low|medium|high|critical", "timeHorizonMinutes": 0 } ]',
      "}",
      "",
      "VERIFIED FACTS:",
      JSON.stringify(
        {
          incidentId: facts.incidentId,
          title: facts.title,
          severity: facts.severity,
          hazard: facts.hazard,
          rootAsset: facts.rootAsset,
          baseRisk: facts.baseRisk,
          cascadeNodes: facts.cascadeNodes,
        },
        null,
        2,
      ),
    ].join("\n");
  }

  protected parseAndValidate(raw: string, ctx: AgentContext): RiskAssessment {
    const obj = parseJsonObject(raw);
    const engineConfidence = ctx.facts.baseRisk.confidence;

    const headline = asString(obj.headline).trim();
    if (!headline) throw new Error("risk-analyst: missing headline.");

    // Grounding: score is echoed from the engine, never trusted from the model.
    const score = ctx.facts.baseRisk.score;

    let confidence = asNumber(obj.confidence, engineConfidence);
    if (confidence > engineConfidence) {
      // Enforce the ceiling rather than reject outright.
      confidence = engineConfidence;
    }
    confidence = clamp01(confidence);

    const drivers = asStringArray(obj.drivers);
    if (drivers.length === 0) throw new Error("risk-analyst: missing drivers.");

    const keyImpacts = this.coerceKeyImpacts(obj.keyImpacts);

    return {
      headline,
      severity: toRiskLevel(asString(obj.severity, ctx.facts.baseRisk.level)),
      score,
      confidence,
      drivers,
      keyImpacts,
    };
  }

  private coerceKeyImpacts(value: unknown): KeyImpact[] {
    if (!Array.isArray(value)) return [];
    const out: KeyImpact[] = [];
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const assetName = asString(rec.assetName).trim();
      const description = asString(rec.description).trim();
      if (!assetName || !description) continue;
      out.push({
        assetName,
        description,
        severity: toRiskLevel(asString(rec.severity, "medium")),
        timeHorizonMinutes:
          typeof rec.timeHorizonMinutes === "number" ? rec.timeHorizonMinutes : undefined,
      });
    }
    return out;
  }

  protected deterministic(ctx: AgentContext): RiskAssessment {
    const { facts } = ctx;
    const { baseRisk, rootAsset, hazard } = facts;

    const drivers = baseRisk.factors
      .filter((f) => f.contribution > 0)
      .map((f) => `${f.name}: +${f.contribution} points`);
    if (hazard) {
      drivers.unshift(
        `Active ${hazard.type} at ${hazard.severity} severity${
          hazard.rainfallRate != null ? ` (rainfall ${hazard.rainfallRate} mm/hr)` : ""
        }.`,
      );
    }

    const keyImpacts: KeyImpact[] = facts.cascadeNodes
      .filter((n) => n.depth > 0)
      .slice(0, 4)
      .map((n) => ({
        assetId: n.assetId,
        assetName: n.name,
        description: `${n.impactType.replace(/_/g, " ")} (impact ${n.impactScore}/100).`,
        severity: riskLevelFromScore(n.impactScore),
      }));

    return {
      headline: `${baseRisk.level} risk at ${rootAsset.name} — score ${baseRisk.score}/100.`,
      severity: toRiskLevel(baseRisk.level),
      score: baseRisk.score,
      confidence: clamp01(baseRisk.confidence),
      drivers: drivers.length ? drivers : [baseRisk.explanation],
      keyImpacts,
    };
  }
}
