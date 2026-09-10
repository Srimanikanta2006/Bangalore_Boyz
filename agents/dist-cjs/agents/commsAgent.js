"use strict";
/**
 * CommsAgent
 * ==========
 * Produces role-specific briefings (operator, hospital manager, field team,
 * public) from the upstream risk + cascade + dispatch outputs. The public
 * briefing must never issue a false "all clear".
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommsAgent = void 0;
const baseAgent_1 = require("./baseAgent");
const util_1 = require("../util");
class CommsAgent extends baseAgent_1.BaseAgent {
    name = "comms";
    buildPrompt(ctx) {
        const { facts, risk, cascade, dispatch } = ctx;
        return [
            "TASK: Write four short role-specific briefings for the incident.",
            "Be factual and grounded in the provided outputs. The public briefing must",
            "not claim an all-clear and must stay zone-scoped.",
            "",
            "Return JSON:",
            "{",
            '  "operator": "string",',
            '  "hospitalManager": "string",',
            '  "fieldTeam": "string",',
            '  "public": "string"',
            "}",
            "",
            "CONTEXT:",
            JSON.stringify({
                incidentId: facts.incidentId,
                title: facts.title,
                zoneName: facts.zoneName,
                riskHeadline: risk?.headline,
                cascadeSummary: cascade?.summary,
                recommendedActions: dispatch?.recommendedActions,
            }, null, 2),
        ].join("\n");
    }
    parseAndValidate(raw) {
        const obj = (0, util_1.parseJsonObject)(raw);
        const briefings = {
            operator: (0, util_1.asString)(obj.operator).trim(),
            hospitalManager: (0, util_1.asString)(obj.hospitalManager).trim(),
            fieldTeam: (0, util_1.asString)(obj.fieldTeam).trim(),
            public: (0, util_1.asString)(obj.public).trim(),
        };
        if (!briefings.operator || !briefings.fieldTeam || !briefings.public) {
            throw new Error("comms: missing one or more required briefings.");
        }
        return { briefings };
    }
    deterministic(ctx) {
        const { facts, risk, cascade, dispatch } = ctx;
        const zone = facts.zoneName ?? "the affected zone";
        const actionsLine = (dispatch?.recommendedActions ?? [])
            .map((a) => `${a.actionId.replace(/_/g, " ")}${a.targetAssetCode ? ` @ ${a.targetAssetCode}` : ""}`)
            .join("; ");
        const briefings = {
            operator: `${facts.incidentId} — ${risk?.headline ?? facts.title}. ${cascade?.summary ?? ""} ${dispatch ? `Proposed actions (approval required): ${actionsLine}.` : ""}`.trim(),
            hospitalManager: `Access risk near ${facts.rootAsset.name} in ${zone}. Review ambulance routing and standby capacity; confirm on-ground conditions before diverting.`,
            fieldTeam: `Deploy to ${facts.rootAsset.name} (${facts.rootAsset.assetCode}) in ${zone}. Expect ${facts.hazard?.type?.replace(/_/g, " ") ?? "hazard"} conditions. Confirm water depth on arrival — modeled, not gauge-measured.`,
            public: `Advisory for ${zone}: avoid ${facts.rootAsset.name} and surrounding low-lying routes due to ${facts.hazard?.type?.replace(/_/g, " ") ?? "hazard"} conditions. Follow official rerouting. This is not an all-clear.`,
        };
        return { briefings };
    }
}
exports.CommsAgent = CommsAgent;
