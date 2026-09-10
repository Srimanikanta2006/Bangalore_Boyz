"use strict";
/** Small shared helpers for the agent layer (no external dependencies). */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clampScore = exports.clamp01 = exports.nowIso = void 0;
exports.riskLevelFromScore = riskLevelFromScore;
exports.toRiskLevel = toRiskLevel;
exports.parseJsonObject = parseJsonObject;
exports.asString = asString;
exports.asStringArray = asStringArray;
exports.asNumber = asNumber;
const nowIso = () => new Date().toISOString();
exports.nowIso = nowIso;
const clamp01 = (n) => Math.min(1, Math.max(0, n));
exports.clamp01 = clamp01;
const clampScore = (n) => Math.min(100, Math.max(0, Math.round(n)));
exports.clampScore = clampScore;
/** Maps a 0-100 score to a RiskLevel using the engine's documented bands. */
function riskLevelFromScore(score) {
    if (score >= 80)
        return "critical";
    if (score >= 60)
        return "high";
    if (score >= 40)
        return "medium";
    return "low";
}
/** Normalises assorted severity strings to a RiskLevel. */
function toRiskLevel(value) {
    const v = (value ?? "").toString().toUpperCase();
    if (v === "CRITICAL")
        return "critical";
    if (v === "HIGH")
        return "high";
    if (v === "MODERATE" || v === "MEDIUM")
        return "medium";
    if (v === "LOW")
        return "low";
    const lower = (value ?? "").toString().toLowerCase();
    if (lower === "critical" || lower === "high" || lower === "medium" || lower === "low") {
        return lower;
    }
    return "low";
}
/**
 * Best-effort JSON extraction from raw model text. Tolerates code fences and
 * leading/trailing prose by locating the outermost {...} block. Throws when no
 * JSON object can be found (the caller then falls back deterministically).
 */
function parseJsonObject(raw) {
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
                return parsed;
            }
        }
        catch {
            // try the brace-slice fallback below
        }
    }
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");
    if (start !== -1 && end > start) {
        const slice = withoutFence.slice(start, end + 1);
        const parsed = JSON.parse(slice); // may throw -> caller falls back
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed;
        }
    }
    throw new Error("No JSON object found in model output.");
}
function asString(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
}
function asStringArray(value) {
    if (!Array.isArray(value))
        return [];
    return value.filter((v) => typeof v === "string");
}
function asNumber(value, fallback = 0) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
