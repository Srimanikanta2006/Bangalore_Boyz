/**
 * DispatchPlannerAgent
 * ====================
 * Proposes response actions drawn strictly from the controlled action catalog.
 * Depends on the RiskAnalyst + Cascade outputs. Every action is validated:
 *  - actionId must be in the catalog;
 *  - priority must be allowed for that action;
 *  - targetAssetCode (if any) must exist in the facts;
 *  - suggestedUnitCallsign (if any) must be an available unit.
 * Invalid actions are dropped (with a warning) rather than executed.
 */

import { BaseAgent } from "./baseAgent";
import type {
  ActionDependency,
  ActionPriority,
  AgentContext,
  AgentName,
  DispatchPlan,
  PlanAction,
} from "../types";
import {
  ACTION_CATALOG,
  actionsForAssetType,
  catalogPromptBlock,
  isPriorityAllowed,
  isValidActionId,
} from "../actionCatalog";
import { asString, parseJsonObject, toRiskLevel } from "../util";

export class DispatchPlannerAgent extends BaseAgent<DispatchPlan> {
  readonly name: AgentName = "dispatch-planner";

  protected buildPrompt(ctx: AgentContext): string {
    const { facts, risk, cascade } = ctx;
    const validAssetCodes = facts.cascadeNodes.map((n) => n.assetCode);
    const units = (facts.availableUnits ?? []).map((u) => `${u.callsign} (${u.type})`);
    return [
      "TASK: Propose response actions for operator approval. Actions are proposals",
      "only — nothing is executed. Prefer the highest-impact assets first.",
      "",
      "You may ONLY use these action IDs (and only at an allowed priority):",
      catalogPromptBlock(),
      "",
      `Valid target asset codes: ${validAssetCodes.join(", ")}.`,
      `Available units: ${units.length ? units.join(", ") : "none"}.`,
      "",
      "Return JSON:",
      "{",
      '  "recommendedActions": [ { "actionId": "string", "priority": "low|medium|high|critical", "reason": "string", "targetAssetCode": "string", "suggestedUnitCallsign": "string" } ],',
      '  "actionDependencies": [ { "actionId": "string", "dependsOnActionId": "string", "rule": "string" } ],',
      '  "rationale": "string"',
      "}",
      "",
      "CONTEXT:",
      JSON.stringify(
        {
          severity: facts.severity,
          riskHeadline: risk?.headline,
          criticalPath: cascade?.criticalPath,
          cascadeNodes: facts.cascadeNodes,
          availableUnits: facts.availableUnits ?? [],
        },
        null,
        2,
      ),
    ].join("\n");
  }

  protected parseAndValidate(raw: string, ctx: AgentContext): DispatchPlan {
    const obj = parseJsonObject(raw);
    const validAssetCodes = new Set(ctx.facts.cascadeNodes.map((n) => n.assetCode));
    const validCallsigns = new Set((ctx.facts.availableUnits ?? []).map((u) => u.callsign));

    const rawActions = Array.isArray(obj.recommendedActions) ? obj.recommendedActions : [];
    const recommendedActions: PlanAction[] = [];
    for (const item of rawActions) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const actionId = asString(rec.actionId);
      const priority = toRiskLevel(asString(rec.priority)) as ActionPriority;

      if (!isValidActionId(actionId)) continue; // grounding: catalog-only
      if (!isPriorityAllowed(actionId, priority)) continue; // grounding: allowed priority

      const targetAssetCode = asString(rec.targetAssetCode) || undefined;
      if (targetAssetCode && !validAssetCodes.has(targetAssetCode)) continue; // no invented assets

      const suggestedUnitCallsign = asString(rec.suggestedUnitCallsign) || undefined;
      const validatedUnit =
        suggestedUnitCallsign && validCallsigns.has(suggestedUnitCallsign)
          ? suggestedUnitCallsign
          : undefined;

      recommendedActions.push({
        actionId,
        priority,
        reason: asString(rec.reason, "Proposed from verified cascade facts."),
        targetAssetCode,
        suggestedUnitCallsign: validatedUnit,
      });
    }

    if (recommendedActions.length === 0) {
      throw new Error("dispatch-planner: no valid catalog actions produced.");
    }

    const actionDependencies = this.coerceDependencies(obj.actionDependencies);
    return {
      recommendedActions,
      actionDependencies,
      rationale: asString(obj.rationale, "Derived from verified risk and cascade facts."),
    };
  }

  private coerceDependencies(value: unknown): ActionDependency[] {
    if (!Array.isArray(value)) return [];
    const out: ActionDependency[] = [];
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const actionId = asString(rec.actionId);
      const dependsOnActionId = asString(rec.dependsOnActionId);
      if (!isValidActionId(actionId) || !isValidActionId(dependsOnActionId)) continue;
      out.push({ actionId, dependsOnActionId, rule: asString(rec.rule, "sequencing constraint") });
    }
    return out;
  }

  protected deterministic(ctx: AgentContext): DispatchPlan {
    const { facts } = ctx;
    const severity = toRiskLevel(facts.severity) as ActionPriority;
    const planPriority: ActionPriority =
      severity === "low" ? "medium" : severity; // never plan below 'medium'

    // Highest-impact assets first.
    const nodesByImpact = [...facts.cascadeNodes].sort((a, b) => b.impactScore - a.impactScore);
    const units = facts.availableUnits ?? [];

    const recommendedActions: PlanAction[] = [];
    const usedActionIds = new Set<string>();

    for (const node of nodesByImpact) {
      const candidates = actionsForAssetType(node.type);
      for (const action of candidates) {
        if (usedActionIds.has(action.id)) continue;
        const priority: ActionPriority = action.allowedPriorities.includes(planPriority)
          ? planPriority
          : action.allowedPriorities[action.allowedPriorities.length - 1];

        const unit = units.find(
          (u) => u.status === "AVAILABLE" && action.suitedUnitTypes.includes(u.type),
        );

        recommendedActions.push({
          actionId: action.id,
          priority,
          reason: `${action.label} for ${node.name} (${node.impactType.replace(/_/g, " ")}, impact ${node.impactScore}/100).`,
          targetAssetCode: node.assetCode,
          suggestedUnitCallsign: unit?.callsign,
        });
        usedActionIds.add(action.id);
        break; // one action per asset in the deterministic baseline
      }
      if (recommendedActions.length >= 4) break;
    }

    // Guarantee at least one action even for sparse cascades.
    if (recommendedActions.length === 0) {
      const advisory = ACTION_CATALOG.find((a) => a.id === "issue_local_advisory")!;
      recommendedActions.push({
        actionId: advisory.id,
        priority: advisory.allowedPriorities.includes(planPriority)
          ? planPriority
          : "medium",
        reason: `Issue a zone-scoped advisory for ${facts.rootAsset.name}.`,
        targetAssetCode: facts.rootAsset.assetCode,
      });
    }

    // Simple, safe dependency: open an alternate route before closing a road.
    const actionDependencies: ActionDependency[] = [];
    const hasClose = recommendedActions.some((a) => a.actionId === "close_road");
    const hasOpen = recommendedActions.some((a) => a.actionId === "open_alternate_route");
    if (hasClose && hasOpen) {
      actionDependencies.push({
        actionId: "close_road",
        dependsOnActionId: "open_alternate_route",
        rule: "Open an alternate route before closing the affected road.",
      });
    }

    return {
      recommendedActions,
      actionDependencies,
      rationale: `Deterministic plan derived from ${facts.cascadeNodes.length} verified cascade node(s), prioritising the highest-impact assets.`,
    };
  }
}
