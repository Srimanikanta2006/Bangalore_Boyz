"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRunState = createRunState;
exports.touch = touch;
exports.persistRunState = persistRunState;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const AGENT_ORDER = [
    "risk-analyst",
    "cascade",
    "dispatch-planner",
    "comms",
    "validation",
];
// Resolved relative to the current working directory (not `import.meta.url`)
// so this file compiles/runs identically under both the package's own ESM
// source (tsx demo/tests, cwd = orchestration/) and a CommonJS build consumed
// by another package (cline_backend) — `import.meta` is invalid syntax under
// a `module: "commonjs"` TypeScript compilation. When run via
// `npm --prefix orchestration run demo`/`test`, cwd is `orchestration/`, so
// this resolves to the same `orchestration/.runs/` as before.
const RUNS_DIR = (0, node_path_1.resolve)(process.cwd(), ".runs");
function createRunState(incidentId, llmModel) {
    const now = new Date().toISOString();
    const agents = {};
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
function touch(state) {
    state.updatedAt = new Date().toISOString();
}
/** Persists the run state to `.runs/<runId>.json`. Best-effort (never throws). */
async function persistRunState(state) {
    try {
        await (0, promises_1.mkdir)(RUNS_DIR, { recursive: true });
        const file = (0, node_path_1.resolve)(RUNS_DIR, `${state.runId}.json`);
        await (0, promises_1.writeFile)(file, JSON.stringify(state, null, 2), "utf8");
        return file;
    }
    catch {
        return null;
    }
}
