/** Small shared helpers for the agent layer (no external dependencies). */

import type { RiskLevel } from "./types";

export const nowIso = (): string => new Date().toISOString();

export const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

export const clampScore = (n: number): number => Math.min(100, Math.max(0, Math.round(n)));

/** Maps a 0-100 score to a RiskLevel using the engine's documented bands. */
export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/** Normalises assorted severity strings to a RiskLevel. */
export function toRiskLevel(value: string | null | undefined): RiskLevel {
  const v = (value ?? "").toString().toUpperCase();
  if (v === "CRITICAL") return "critical";
  if (v === "HIGH") return "high";
  if (v === "MODERATE" || v === "MEDIUM") return "medium";
  if (v === "LOW") return "low";
  const lower = (value ?? "").toString().toLowerCase();
  if (lower === "critical" || lower === "high" || lower === "medium" || lower === "low") {
    return lower as RiskLevel;
  }
  return "low";
}

/**
 * Best-effort JSON extraction from raw model text. Tolerates code fences and
 * leading/trailing prose by locating the outermost {...} block. Throws when no
 * JSON object can be found (the caller then falls back deterministically).
 */
export function parseJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  const candidates = [withoutFence, trimmed];
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // try the brace-slice fallback below
    }
  }

  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start !== -1 && end > start) {
    const slice = withoutFence.slice(start, end + 1);
    const parsed = JSON.parse(slice); // may throw -> caller falls back
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  }
  throw new Error("No JSON object found in model output.");
}

export function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
