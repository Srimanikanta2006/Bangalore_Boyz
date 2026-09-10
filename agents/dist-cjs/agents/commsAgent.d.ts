/**
 * CommsAgent
 * ==========
 * Produces role-specific briefings (operator, hospital manager, field team,
 * public) from the upstream risk + cascade + dispatch outputs. The public
 * briefing must never issue a false "all clear".
 */
import { BaseAgent } from "./baseAgent";
import type { AgentContext, AgentName, CommsBriefings } from "../types";
export declare class CommsAgent extends BaseAgent<CommsBriefings> {
    readonly name: AgentName;
    protected buildPrompt(ctx: AgentContext): string;
    protected parseAndValidate(raw: string): CommsBriefings;
    protected deterministic(ctx: AgentContext): CommsBriefings;
}
