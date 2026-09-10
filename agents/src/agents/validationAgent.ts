/**
 * ValidationAgent (integration + grounding guard)
 * ==============================================
 *
 * This is the final, DETERMINISTIC stage. It never calls an LLM. It:
 *  1. Re-validates every planned action against the controlled catalog, the
 *     verified asset set, and the available units (defence in depth — even if an
 *     upstream agent's own validation was bypassed).
 *  2. Enforces the global confidence ceiling (engine confidence).
 *  3. Verifies action dependencies reference actions that are actually present.
 *  4. Integrates the specialist outputs into a single PROPOSED ResponsePlan that
 *     always requires operator approval.
 *
 * Every correction is surfaced as a warning — nothing is silently dropped.
 */

import type {
  ActionDependency,
  AgentName,
  AgentResult,
  CascadeAnalysis,
  CommsBriefings,
  DispatchPlan,
  IncidentFacts,
  PlanAction,
  ResponsePlan,
  RiskAssessment,
} from "../types";
import { isPriorityAllowed, isValidActionId } from "../actionCatalog";
import { clamp01, nowIso } from "../util";

export interface ValidationInput {
  facts: IncidentFacts;
  risk: RiskAssessment;
  cascade: CascadeAnalysis;
  dispatch: DispatchPlan;
  comms: CommsBriefings;
  usedFallbackAgents: AgentName[];
  llmModel: string | null;
  priorWarnings: string[];
}

export class ValidationAgent {
  readonly name: AgentName = "validation";

  integrate(input: ValidationInput): AgentResult<ResponsePlan> {
    const startedAt = nowIso();
    const warnings: string[] = [...input.priorWarnings];
    const { facts } = input;

    const validAssetCodes = new Set(facts.cascadeNodes.map((n) => n.assetCode));
    validAssetCodes.add(facts.rootAsset.assetCode);
    const validCallsigns = new Set((facts.availableUnits ?? []).map((u) => u.callsign));

    // 1. Re-validate actions (defence in depth).
    const cleanActions: PlanAction[] = [];
    for (const action of input.dispatch.recommendedActions) {
      if (!isValidActionId(action.actionId)) {
        warnings.push(`Dropped non-catalog action "${action.actionId}".`);
        continue;
      }
      if (!isPriorityAllowed(action.actionId, action.priority)) {
        warnings.push(
          `Dropped action "${action.actionId}" with disallowed priority "${action.priority}".`,
        );
        continue;
      }
      if (action.targetAssetCode && !validAssetCodes.has(action.targetAssetCode)) {
        warnings.push(
          `Dropped action "${action.actionId}" targeting unknown asset "${action.targetAssetCode}".`,
        );
        continue;
      }
      let suggestedUnitCallsign = action.suggestedUnitCallsign;
      if (suggestedUnitCallsign && !validCallsigns.has(suggestedUnitCallsign)) {
        warnings.push(
          `Cleared unknown unit "${suggestedUnitCallsign}" from action "${action.actionId}".`,
        );
        suggestedUnitCallsign = undefined;
      }
      cleanActions.push({ ...action, suggestedUnitCallsign });
    }

    if (cleanActions.length === 0) {
      warnings.push("No valid actions survived validation; operator review required.");
    }

    // 2. Dependencies must reference actions that are present in the final plan.
    const presentActionIds = new Set(cleanActions.map((a) => a.actionId));
    const cleanDeps: ActionDependency[] = [];
    for (const dep of input.dispatch.actionDependencies) {
      if (presentActionIds.has(dep.actionId) && presentActionIds.has(dep.dependsOnActionId)) {
        cleanDeps.push(dep);
      } else {
        warnings.push(
          `Dropped dependency ${dep.actionId} -> ${dep.dependsOnActionId} (missing action).`,
        );
      }
    }

    // 3. Global confidence ceiling = engine confidence.
    const engineConfidence = clamp01(facts.baseRisk.confidence);
    let confidence = clamp01(input.risk.confidence);
    if (confidence > engineConfidence) {
      warnings.push(
        `Capped confidence ${confidence} to engine confidence ${engineConfidence}.`,
      );
      confidence = engineConfidence;
    }

    // 4. Integrate into the final PROPOSED plan (approval always required).
    const plan: ResponsePlan = {
      incidentId: facts.incidentId,
      status: "PROPOSED",
      requiresOperatorApproval: true,
      generatedAt: nowIso(),
      confidence,
      riskAssessment: { ...input.risk, confidence },
      cascadeAnalysis: input.cascade,
      dispatch: {
        recommendedActions: cleanActions,
        actionDependencies: cleanDeps,
        rationale: input.dispatch.rationale,
      },
      comms: input.comms,
      usedFallbackAgents: input.usedFallbackAgents,
      warnings,
      provenance: {
        engine: "ClimateShield deterministic risk & cascade engine",
        llmModel: input.llmModel,
        factsIncidentId: facts.incidentId,
      },
    };

    return {
      agent: this.name,
      data: plan,
      usedFallback: true, // validation is always deterministic by design
      attempts: 1,
      startedAt,
      finishedAt: nowIso(),
      warnings,
    };
  }
}
