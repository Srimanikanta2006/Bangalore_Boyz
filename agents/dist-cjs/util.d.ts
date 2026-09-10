/** Small shared helpers for the agent layer (no external dependencies). */
import type { RiskLevel } from "./types";
export declare const nowIso: () => string;
export declare const clamp01: (n: number) => number;
export declare const clampScore: (n: number) => number;
/** Maps a 0-100 score to a RiskLevel using the engine's documented bands. */
export declare function riskLevelFromScore(score: number): RiskLevel;
/** Normalises assorted severity strings to a RiskLevel. */
export declare function toRiskLevel(value: string | null | undefined): RiskLevel;
/**
 * Best-effort JSON extraction from raw model text. Tolerates code fences and
 * leading/trailing prose by locating the outermost {...} block. Throws when no
 * JSON object can be found (the caller then falls back deterministically).
 */
export declare function parseJsonObject(raw: string): Record<string, unknown>;
export declare function asString(value: unknown, fallback?: string): string;
export declare function asStringArray(value: unknown): string[];
export declare function asNumber(value: unknown, fallback?: number): number;
