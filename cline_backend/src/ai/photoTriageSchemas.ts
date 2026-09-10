/**
 * Strict output schema for Gemini vision-based citizen-photo triage.
 * Mirrors the grounding philosophy of the incident explain layer: the model
 * classifies what it can SEE in the photo only - it never invents a risk
 * score, never overrides the citizen's own category, and every field is
 * explicitly labeled non-authoritative wherever it's surfaced.
 */

export type WaterDepthEstimate = 'NONE' | 'ANKLE' | 'KNEE' | 'WAIST' | 'SUBMERGED' | 'UNKNOWN';

export interface PhotoTriageResponse {
  waterDepthEstimate: WaterDepthEstimate;
  visibleHazards: string[];
  caption: string;
  confidence: number; // 0-1
}

const VALID_DEPTHS: WaterDepthEstimate[] = ['NONE', 'ANKLE', 'KNEE', 'WAIST', 'SUBMERGED', 'UNKNOWN'];

export function validatePhotoTriageResponse(data: unknown): { success: true; data: PhotoTriageResponse } | { success: false; errors: string[] } {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') return { success: false, errors: ['response is not an object'] };
  const d = data as Record<string, unknown>;

  if (typeof d.waterDepthEstimate !== 'string' || !VALID_DEPTHS.includes(d.waterDepthEstimate as WaterDepthEstimate)) {
    errors.push(`waterDepthEstimate must be one of ${VALID_DEPTHS.join('|')}`);
  }
  if (!Array.isArray(d.visibleHazards) || !d.visibleHazards.every((h) => typeof h === 'string')) {
    errors.push('visibleHazards must be a string array');
  }
  if (typeof d.caption !== 'string' || d.caption.length === 0 || d.caption.length > 300) {
    errors.push('caption must be a non-empty string <=300 chars');
  }
  if (typeof d.confidence !== 'number' || d.confidence < 0 || d.confidence > 1) {
    errors.push('confidence must be a number between 0 and 1');
  }

  if (errors.length > 0) return { success: false, errors };
  return {
    success: true,
    data: {
      waterDepthEstimate: d.waterDepthEstimate as WaterDepthEstimate,
      visibleHazards: (d.visibleHazards as string[]).slice(0, 10),
      caption: (d.caption as string).slice(0, 300),
      confidence: d.confidence as number,
    },
  };
}
