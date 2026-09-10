import type { DbClient } from "../db/prisma";
import { Errors } from "../utils/errors";
import { getIncidentCascade } from "./cascade.service";
import { toOrchestratorFacts, type OrchestratorAvailableUnit } from "../ai/orchestrateAdapter";
import type { IncidentCascadeFacts } from "../ai/explainAdapter";
// Require by direct relative file path, NOT bare package specifier (see
// interop note above — extensive testing isolated a reproducible bug where
// `tsx`'s custom require() resolves bare scoped-package specifiers
// ("@climateshield/...") to an EMPTY object, while a concrete relative/
// absolute file path resolves correctly every time, under both plain Node
// and tsx). `node_modules/@climateshield/orchestration` is always a sibling
// of `node_modules/@climateshield/agents` (same scope folder), so this path
// is stable regardless of how the dependency was installed (symlink or copy).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const orchestrationPkg = require("../../node_modules/@climateshield/orchestration/dist-cjs/index.js") as typeof import("@climateshield/orchestration");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const agentsPkg = require("../../node_modules/@climateshield/agents/dist-cjs/index.js") as typeof import("@climateshield/agents");
const { runIncidentResponse } = orchestrationPkg;
const { NullLlmProvider } = agentsPkg;

/**
 * MULTI-AGENT INCIDENT-RESPONSE ORCHESTRATION SERVICE.
 *
 * Pipeline: deterministic engine facts (getIncidentCascade, same source as the
 * P4 explain layer) -> grounded IncidentFacts (orchestrateAdapter) ->
 * standalone @climateshield/orchestration 5-agent pipeline (risk-analyst ->
 * cascade -> dispatch-planner -> comms -> validation) -> PROPOSED ResponsePlan.
 *
 * IMPORTANT INTEROP NOTE (real trial and error — documented so nobody has to
 * re-discover it):
 *
 * `@climateshield/agents`/`@climateshield/orchestration` are pure-ESM,
 * no-build packages by default (`"type": "module"`, raw `src/index.ts`
 * entry). cline_backend compiles to CommonJS (no `"type"` field -> defaults
 * CJS). A static `import` from a CJS file transpiles to `require(...)`,
 * which Node refuses for a genuinely ESM-resolved target (ERR_REQUIRE_ESM).
 *
 * Dynamic `import()` (the usual CJS->ESM interop escape hatch) was tried
 * first and resolved correctly under `vitest` (Vite's own SSR resolver), but
 * silently returned an EMPTY module under the actual dev runtime (`tsx watch
 * src/server.ts` — no error, just missing exports, surfacing downstream as
 * confusing "X is not a function" errors). This reproduced identically with
 * `node --import tsx --watch` and with `--watch` removed entirely, and even
 * transitively inside orchestration's OWN source (its own
 * `import { CascadeAgent, ... } from "@climateshield/agents"`) — so it was a
 * `tsx`-specific bare-specifier resolution gap for `"type": "module"` sibling
 * packages, not something specific to cline_backend's code.
 *
 * FIX: both sibling packages now ALSO ship a real compiled CommonJS build
 * (`dist-cjs/`, via each package's `npm run build:cjs`), exposed through a
 * conditional `"exports"` map (`"require": "./dist-cjs/index.js"`, `"import":
 * "./src/index.ts"`). This preserves their own ESM-based tooling (tsx
 * demo/tests) completely unchanged — Node's conditional-exports resolution
 * is keyed by HOW a module is loaded (`require()` vs `import`/dynamic
 * `import()`), not by the calling file's own module type. cline_backend can
 * therefore use a plain, static, top-level `import` (below) exactly like any
 * other CommonJS dependency: no dynamic import, no loader-hook juggling.
 * `dist-cjs/` is committed (not gitignored) so nobody needs a build step to
 * clone-and-run; if agents/orchestration source changes, re-run
 * `npm run build:cjs` in both packages (agents first) and commit the output.
 *
 * (`orchestration/src/state.ts` also had its `import.meta.url`-based path
 * resolution replaced with a `process.cwd()`-based one, since `import.meta`
 * is invalid syntax under a `module: "commonjs"` TypeScript compilation —
 * required for `build:cjs` to succeed at all. Verified no regression via
 * orchestration's own `tsc --noEmit` / `npm test` / `npm run demo`.)
 */

export type OrchestrationMode = "ai" | "fallback";

export interface OrchestrateIncidentResult {
  incidentId: string;
  incidentCode: string | null;
  mode: OrchestrationMode;
  llmModel: string | null;
  usedFallbackAgents: string[];
  runId: string;
  plan: unknown;
}

export async function orchestrateIncident(
  client: DbClient,
  incidentId: string,
): Promise<OrchestrateIncidentResult> {
  // Reuses the exact same verified-facts source as the P4 explain layer.
  // getIncidentCascade() throws Errors.notFound('Incident', ...) when the
  // incident doesn't exist — this is what gives the endpoint its 404.
  const cascade = (await getIncidentCascade(client, incidentId)) as unknown as IncidentCascadeFacts;

  if (!cascade.rootAsset || !cascade.baseRisk || cascade.nodes.length === 0) {
    throw Errors.businessRule(
      "NO_ASSESSABLE_ASSET",
      "This incident has no assessable infrastructure asset, so no response plan can be orchestrated.",
    );
  }

  const units = await client.responseUnit.findMany({
    where: { status: "AVAILABLE" },
    include: { department: { select: { name: true } } },
    orderBy: [{ etaMinutes: "asc" }, { callsign: "asc" }],
    take: 12,
  });
  const availableUnits: OrchestratorAvailableUnit[] = units.map((u) => ({
    id: u.id,
    callsign: u.callsign,
    type: u.type,
    status: u.status,
    departmentName: u.department?.name ?? null,
    etaMinutes: u.etaMinutes,
  }));

  const facts = toOrchestratorFacts(cascade, availableUnits);

  let mode: OrchestrationMode;
  let result: Awaited<ReturnType<typeof runIncidentResponse>>;
  try {
    // persist: false - this endpoint is stateless per-request; the standalone
    // orchestrator's own .runs/ file persistence is for its offline demo, not
    // needed here (cline_backend has its own AuditLog for operational history).
    result = await runIncidentResponse(facts, { persist: false });
    // Each specialist agent NEVER throws (BaseAgent.run() catches every LLM
    // failure internally and degrades to a deterministic fallback per-agent),
    // so a normal run always resolves. `usedFallbackAgents` reports whether
    // any specialist actually fell back this run.
    mode = result.plan.usedFallbackAgents.length > 0 ? "fallback" : "ai";
  } catch (err) {
    // Defensive last resort: the orchestrator's contract promises agents never
    // throw, but the deterministic fallback path itself is NOT wrapped in a
    // try/catch inside BaseAgent (see agents/src/agents/baseAgent.ts) — a bug
    // there would otherwise propagate as an uncaught rejection. Rather than
    // return a 500 for what is still fundamentally an "AI/agent" problem, we
    // retry once fully offline (forced NullLlmProvider guarantees every agent
    // takes its deterministic path, which cannot fail on LLM/network/JSON
    // grounds). This is logged loudly, never masked silently.
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        level: "error",
        scope: "orchestrate",
        message: "runIncidentResponse threw; retrying fully offline (forced deterministic fallback)",
        incidentId,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    result = await runIncidentResponse(facts, { persist: false, llm: new NullLlmProvider() });
    mode = "fallback";
  }

  return {
    incidentId: cascade.incident.id,
    incidentCode: cascade.incident.incidentCode ?? null,
    mode,
    llmModel: result.plan.provenance.llmModel,
    usedFallbackAgents: result.plan.usedFallbackAgents,
    runId: result.state.runId,
    plan: result.plan,
  };
}
