/**
 * Ambient type declaration for `@climateshield/agents` — used ONLY by the
 * TypeScript compiler for static type-checking (see tsconfig.json `paths`).
 *
 * WHY THIS FILE EXISTS: `@climateshield/agents`/`@climateshield/orchestration`
 * are pure-ESM, no-build packages (they ship raw `.ts` source, `"main":
 * "src/index.ts"`). cline_backend compiles under `module: commonjs`. If tsc is
 * allowed to resolve the REAL package source (via the `file:` link in
 * node_modules), it transitively type-checks files like
 * `orchestration/src/state.ts`, which use `import.meta.url` — syntax tsc
 * rejects under `commonjs` ("TS1343"), even though we only ever consume these
 * packages via a runtime-safe dynamic `import()` (see orchestrate.service.ts).
 *
 * This ambient module is a minimal, hand-written mirror of ONLY the exports
 * cline_backend actually uses (kept in sync with agents/src/types.ts +
 * agents/src/llm/provider.ts). It does NOT change runtime behavior at all —
 * dynamic `import()` is a plain JS expression resolved by Node/tsx against
 * the REAL package regardless of this file. It only gives tsc a safe type to
 * check against instead of parsing the real ESM source. Zero changes were
 * made to agents/ or orchestration/ themselves.
 */
declare module "@climateshield/agents" {
  export type RiskLevel = "low" | "medium" | "high" | "critical";

  export interface HazardFacts {
    type: string;
    severity: RiskLevel;
    rainfallRate?: number | null;
    temperature?: number | null;
    windSpeed?: number | null;
    waterDepth?: number | null;
  }

  export interface AssetFacts {
    id: string;
    assetCode: string;
    name: string;
    type: string;
  }

  export interface RiskFactor {
    name: string;
    contribution: number;
  }

  export interface BaseRiskFacts {
    score: number;
    level: RiskLevel;
    confidence: number;
    factors: RiskFactor[];
    explanation: string;
  }

  export interface CascadeNodeFacts {
    assetId: string;
    assetCode: string;
    name: string;
    type: string;
    depth: number;
    impactType: string;
    impactScore: number;
    dependencyType?: string | null;
  }

  export interface AvailableUnitFacts {
    id: string;
    callsign: string;
    type: string;
    status: string;
    departmentName?: string;
    etaMinutes?: number | null;
  }

  export interface IncidentFacts {
    incidentId: string;
    title: string;
    severity: RiskLevel;
    zoneName?: string;
    hazard: HazardFacts | null;
    rootAsset: AssetFacts;
    baseRisk: BaseRiskFacts;
    cascadeNodes: CascadeNodeFacts[];
    availableUnits?: AvailableUnitFacts[];
  }

  export interface LlmCompleteOptions {
    system?: string;
    temperature?: number;
    timeoutMs?: number;
    json?: boolean;
  }

  export interface LlmProvider {
    readonly model: string | null;
    readonly available: boolean;
    complete(prompt: string, options?: LlmCompleteOptions): Promise<string>;
  }

  export class NullLlmProvider implements LlmProvider {
    readonly model: null;
    readonly available: false;
    complete(): Promise<string>;
  }
}
