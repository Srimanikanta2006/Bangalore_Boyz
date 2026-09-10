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

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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

const AGENT_ORDER: AgentName[] = [
  "risk-analyst",
  "cascade",
  "dispatch-planner",
  "comms",
  "validation",
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = resolve(__dirname, "..", ".runs");

export function createRunState(incidentId: string, llmModel: string | null): RunState {
  const now = new Date().toISOString();
  const agents = {} as Record<AgentName, AgentStateRecord>;
  for (const agent of AGENT_ORDER) {
    agents[agent] = { agent, status: "pending", attempts: 0, usedFallback: false, warnings: [] };
  }
  return {
    runId: `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    incidentId,
    status: "created",
    createdAt: now,
    updatedAt: now,
    llmModel,
    agents,
    warnings: [],
    plan: null,
  };
}

export function touch(state: RunState): void {
  state.updatedAt = new Date().toISOString();
}

/** Persists the run state to `.runs/<runId>.json`. Best-effort (never throws). */
export async function persistRunState(state: RunState): Promise<string | null> {
  try {
    await mkdir(RUNS_DIR, { recursive: true });
    const file = resolve(RUNS_DIR, `${state.runId}.json`);
    await writeFile(file, JSON.stringify(state, null, 2), "utf8");
    return file;
  } catch {
    return null;
  }
}
