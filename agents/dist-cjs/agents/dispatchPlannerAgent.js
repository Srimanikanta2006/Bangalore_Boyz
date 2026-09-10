"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchPlannerAgent = void 0;
const baseAgent_1 = require("./baseAgent");
const actionCatalog_1 = require("../actionCatalog");
const util_1 = require("../util");
class DispatchPlannerAgent extends baseAgent_1.BaseAgent {
    name = "dispatch-planner";
    buildPrompt(ctx) {
        const { facts, risk, cascade } = ctx;
        const validAssetCodes = facts.cascadeNodes.map((n) => n.assetCode);
        const units = (facts.availableUnits ?? []).map((u) => `${u.callsign} (${u.type})`);
        return [
            "TASK: Propose response actions for operator approval. Actions are proposals",
            "only — nothing is executed. Prefer the highest-impact assets first.",
            "",
            "You may ONLY use these action IDs (and only at an allowed priority):",
            (0, actionCatalog_1.catalogPromptBlock)(),
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
            JSON.stringify({
                severity: facts.severity,
                riskHeadline: risk?.headline,
                criticalPath: cascade?.criticalPath,
                cascadeNodes: facts.cascadeNodes,
                availableUnits: facts.availableUnits ?? [],
            }, null, 2),
        ].join("\n");
    }
    parseAndValidate(raw, ctx) {
        const obj = (0, util_1.parseJsonObject)(raw);
        const validAssetCodes = new Set(ctx.facts.cascadeNodes.map((n) => n.assetCode));
        const validCallsigns = new Set((ctx.facts.availableUnits ?? []).map((u) => u.callsign));
        const rawActions = Array.isArray(obj.recommendedActions) ? obj.recommendedActions : [];
        const recommendedActions = [];
        for (const item of rawActions) {
            if (!item || typeof item !== "object")
                continue;
            const rec = item;
            const actionId = (0, util_1.asString)(rec.actionId);
            const priority = (0, util_1.toRiskLevel)((0, util_1.asString)(rec.priority));
            if (!(0, actionCatalog_1.isValidActionId)(actionId))
                continue; // grounding: catalog-only
            if (!(0, actionCatalog_1.isPriorityAllowed)(actionId, priority))
                continue; // grounding: allowed priority
            const targetAssetCode = (0, util_1.asString)(rec.targetAssetCode) || undefined;
            if (targetAssetCode && !validAssetCodes.has(targetAssetCode))
                continue; // no invented assets
            const suggestedUnitCallsign = (0, util_1.asString)(rec.suggestedUnitCallsign) || undefined;
            const validatedUnit = suggestedUnitCallsign && validCallsigns.has(suggestedUnitCallsign)
                ? suggestedUnitCallsign
                : undefined;
            recommendedActions.push({
                actionId,
                priority,
                reason: (0, util_1.asString)(rec.reason, "Proposed from verified cascade facts."),
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
            rationale: (0, util_1.asString)(obj.rationale, "Derived from verified risk and cascade facts."),
        };
    }
    coerceDependencies(value) {
        if (!Array.isArray(value))
            return [];
        const out = [];
        for (const item of value) {
            if (!item || typeof item !== "object")
                continue;
            const rec = item;
            const actionId = (0, util_1.asString)(rec.actionId);
            const dependsOnActionId = (0, util_1.asString)(rec.dependsOnActionId);
            if (!(0, actionCatalog_1.isValidActionId)(actionId) || !(0, actionCatalog_1.isValidActionId)(dependsOnActionId))
                continue;
            out.push({ actionId, dependsOnActionId, rule: (0, util_1.asString)(rec.rule, "sequencing constraint") });
        }
        return out;
    }
    deterministic(ctx) {
        const { facts } = ctx;
        const severity = (0, util_1.toRiskLevel)(facts.severity);
        const planPriority = severity === "low" ? "medium" : severity; // never plan below 'medium'
        // Highest-impact assets first.
        const nodesByImpact = [...facts.cascadeNodes].sort((a, b) => b.impactScore - a.impactScore);
        const units = facts.availableUnits ?? [];
        const recommendedActions = [];
        const usedActionIds = new Set();
        for (const node of nodesByImpact) {
            const candidates = (0, actionCatalog_1.actionsForAssetType)(node.type);
            for (const action of candidates) {
                if (usedActionIds.has(action.id))
                    continue;
                const priority = action.allowedPriorities.includes(planPriority)
                    ? planPriority
                    : action.allowedPriorities[action.allowedPriorities.length - 1];
                const unit = units.find((u) => u.status === "AVAILABLE" && action.suitedUnitTypes.includes(u.type));
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
            if (recommendedActions.length >= 4)
                break;
        }
        // Guarantee at least one action even for sparse cascades.
        if (recommendedActions.length === 0) {
            const advisory = actionCatalog_1.ACTION_CATALOG.find((a) => a.id === "issue_local_advisory");
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
        const actionDependencies = [];
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
exports.DispatchPlannerAgent = DispatchPlannerAgent;
