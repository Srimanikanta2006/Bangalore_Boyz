import { explainWithGeminiOrFallback } from "./geminiProvider.ts";
import type { ExplainRequest } from "./schemas.ts";

const demoIncident: ExplainRequest = {
  incidentId: "INC-001",
  hazard: { type: "heavy_rainfall", severity: "high" },
  risk: { score: 82, level: "critical", confidence: 0.91 },
  affectedAssets: [
    { id: "D07", type: "drain", name: "Drain D07", riskLevel: "high" },
    { id: "R24", type: "road", name: "Road R24", riskLevel: "high" },
    { id: "Hospital-A", type: "hospital", name: "Hospital A", riskLevel: "critical" },
  ],
  cascade: { path: ["D07", "R24", "Hospital-A"], etaMinutes: 25 },
  evidence: [
    "Rainfall threshold exceeded",
    "Drain D07 capacity risk is high",
    "Road R24 is downstream of D07",
    "Hospital A depends on R24 for ambulance access",
  ],
};

const result = await explainWithGeminiOrFallback(demoIncident);

console.log(
  JSON.stringify(
    {
      provider: result.usedFallback ? "deterministic fallback" : "Gemini",
      fallbackReason: result.fallbackReason,
      ...result.response,
    },
    null,
    2,
  ),
);
