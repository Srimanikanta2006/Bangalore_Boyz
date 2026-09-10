/**
 * Run State
 * =========
 *
 * The orchestrator's state is persisted so it never lives only inside an LLM's
 * conversation memory (per AGENTS.md §8). Each run is a JSON record capturing
 * per-agent status, timing, fallback provenance, warnings, and the final plan.
 * A run is replayable/inspectable after the fact and an agent is replaceable
 * without losing the run's important state.
 *
 * Storage is a plain JSON file per run under `orchestration/.runs/` (gitignored).
 * No database dependency — the backend owns persistence of approved tasks; this
 * layer only records the planning run itself.
 */
import type { AgentName, ResponsePlan } from "@climateshield/agents";
export type AgentStatus = "pending" | "running" | "succeeded" | "fell_back" | "failed";
export interface AgentStateRecord {
    agent: AgentName;
    status: AgentStatus;
    attempts: number;
    usedFallback: boolean;
    fallbackReason?: string;
    startedAt?: string;
    finishedAt?: string;
    warnings: string[];
}
export type RunStatus = "created" | "running" | "completed" | "failed";
export interface RunState {
    runId: string;
    incidentId: string;
    status: RunStatus;
    createdAt: string;
    updatedAt: string;
    llmModel: string | null;
    agents: Record<AgentName, AgentStateRecord>;
    warnings: string[];
    plan: ResponsePlan | null;
}
export declare function createRunState(incidentId: string, llmModel: string | null): RunState;
export declare function touch(state: RunState): void;
/** Persists the run state to `.runs/<runId>.json`. Best-effort (never throws). */
export declare function persistRunState(state: RunState): Promise<string | null>;
