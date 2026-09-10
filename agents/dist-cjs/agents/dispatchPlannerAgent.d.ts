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
import type { AgentContext, AgentName, DispatchPlan } from "../types";
export declare class DispatchPlannerAgent extends BaseAgent<DispatchPlan> {
    readonly name: AgentName;
    protected buildPrompt(ctx: AgentContext): string;
    protected parseAndValidate(raw: string, ctx: AgentContext): DispatchPlan;
    private coerceDependencies;
    protected deterministic(ctx: AgentContext): DispatchPlan;
}
