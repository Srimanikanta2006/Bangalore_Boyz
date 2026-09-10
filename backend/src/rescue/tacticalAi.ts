/**
 * ClimateShield AI Tactical Mission Dossier Generator
 * Integrates Gemini AI API (GEMINI_API_KEY) with a deterministic fallback engine.
 */

import type { Mission } from "./rescueEngine";

export interface TacticalDossierResponse {
  missionId: string;
  provider: "gemini" | "deterministic_fallback";
  modelUsed: string | null;
  tacticalBriefing: string;
  recommendedEquipment: string[];
  safetyWarnings: string[];
  evacuationPriority: string;
}

export async function generateTacticalDossier(mission: Mission): Promise<TacticalDossierResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== "") {
    try {
      const prompt = `You are the ClimateShield AI Tactical Mission Dispatch Advisor.
Generate a concise 3-bullet tactical briefing, recommended equipment, safety warnings, and evacuation priority for the following mission:
Mission Title: ${mission.title}
Target Sector: ${mission.targetSector}
Hazard Severity: ${mission.hazardSeverity}
Water Depth: ${mission.waterDepthMm} mm
Current Velocity: ${mission.currentVelocityMs} m/s

Return JSON format:
{
  "tacticalBriefing": "string",
  "recommendedEquipment": ["item1", "item2"],
  "safetyWarnings": ["warning1", "warning2"],
  "evacuationPriority": "CRITICAL | HIGH | MEDIUM"
}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (res.ok) {
        const jsonRes = await res.json();
        const rawText = jsonRes.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return {
            missionId: mission.id,
            provider: "gemini",
            modelUsed: "gemini-1.5-flash",
            tacticalBriefing: parsed.tacticalBriefing || mission.description,
            recommendedEquipment: parsed.recommendedEquipment || mission.equipmentManifest,
            safetyWarnings: parsed.safetyWarnings || ["Submerged obstacle hazard", "Grid thermal load threshold"],
            evacuationPriority: parsed.evacuationPriority || mission.priority
          };
        }
      }
    } catch (err) {
      console.warn("Gemini API call failed for Rescue Tactical Dossier, using fallback:", (err as Error).message);
    }
  }

  // Deterministic Tactical Fallback Engine
  return {
    missionId: mission.id,
    provider: "deterministic_fallback",
    modelUsed: null,
    tacticalBriefing: `Tactical Deployment Order for ${mission.unitCallsign}: Deploy barrier team to ${mission.targetSector}. Priority is securing ${mission.targetAssetId} against ${mission.waterDepthMm}mm inundation level.`,
    recommendedEquipment: mission.equipmentManifest,
    safetyWarnings: [
      `Water depth at ${mission.waterDepthMm}mm exceeds standard vehicle clearance. Use high-clearance tactical rig.`,
      "Subsurface electrical discharge risk near Substation #09 telemetry node."
    ],
    evacuationPriority: mission.priority
  };
}
