"use strict";
/**
 * CascadeAgent
 * ============
 * Turns the verified dependency-cascade nodes into an ordered critical path and
 * human-readable projected failures. It only ever references assets present in
 * the facts — the critical path and links are validated against the fact set.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CascadeAgent = void 0;
const baseAgent_1 = require("./baseAgent");
const util_1 = require("../util");
class CascadeAgent extends baseAgent_1.BaseAgent {
    name = "cascade";
    buildPrompt(ctx) {
        const { facts } = ctx;
        const validCodes = facts.cascadeNodes.map((n) => n.assetCode);
        return [
            "TASK: Summarise the failure cascade below as an ordered critical path.",
            `You may ONLY reference these asset codes: ${validCodes.join(", ")}.`,
            "Order the critical path from the root (depth 0) to the deepest impact.",
            "",
            "Return JSON:",
            "{",
            '  "summary": "string",',
            '  "criticalPath": ["assetCode"],',
            '  "links": [ { "fromAssetCode": "string", "toAssetCode": "string", "impact": "string", "impactScore": 0 } ],',
            '  "projectedFailures": ["string"]',
            "}",
            "",
            "VERIFIED CASCADE NODES:",
            JSON.stringify(facts.cascadeNodes, null, 2),
        ].join("\n");
    }
    parseAndValidate(raw, ctx) {
        const obj = (0, util_1.parseJsonObject)(raw);
        const validCodes = new Set(ctx.facts.cascadeNodes.map((n) => n.assetCode));
        const summary = (0, util_1.asString)(obj.summary).trim();
        if (!summary)
            throw new Error("cascade: missing summary.");
        const criticalPath = (0, util_1.asStringArray)(obj.criticalPath).filter((c) => validCodes.has(c));
        if (criticalPath.length === 0) {
            throw new Error("cascade: criticalPath empty or references unknown assets.");
        }
        const links = this.coerceLinks(obj.links, validCodes);
        const projectedFailures = (0, util_1.asStringArray)(obj.projectedFailures);
        return { summary, criticalPath, links, projectedFailures };
    }
    coerceLinks(value, validCodes) {
        if (!Array.isArray(value))
            return [];
        const out = [];
        for (const item of value) {
            if (!item || typeof item !== "object")
                continue;
            const rec = item;
            const fromAssetCode = (0, util_1.asString)(rec.fromAssetCode);
            const toAssetCode = (0, util_1.asString)(rec.toAssetCode);
            // Grounding: drop links that reference assets not in the fact set.
            if (!validCodes.has(fromAssetCode) || !validCodes.has(toAssetCode))
                continue;
            out.push({
                fromAssetCode,
                toAssetCode,
                impact: (0, util_1.asString)(rec.impact, "IMPACTED"),
                impactScore: typeof rec.impactScore === "number" ? rec.impactScore : 0,
            });
        }
        return out;
    }
    deterministic(ctx) {
        const ordered = [...ctx.facts.cascadeNodes].sort((a, b) => a.depth - b.depth);
        const criticalPath = ordered.map((n) => n.assetCode);
        const links = [];
        for (let i = 1; i < ordered.length; i++) {
            links.push({
                fromAssetCode: ordered[i - 1].assetCode,
                toAssetCode: ordered[i].assetCode,
                impact: ordered[i].impactType,
                impactScore: ordered[i].impactScore,
            });
        }
        const root = ordered[0];
        const projectedFailures = ordered
            .filter((n) => n.depth > 0)
            .map((n) => `${root?.name ?? "root"} -> ${n.name}: ${n.impactType.replace(/_/g, " ")} (impact ${n.impactScore}/100).`);
        return {
            summary: `Cascade rooted at ${root?.name ?? "unknown"} propagates across ${Math.max(0, ordered.length - 1)} downstream asset(s).`,
            criticalPath,
            links,
            projectedFailures,
        };
    }
}
exports.CascadeAgent = CascadeAgent;
