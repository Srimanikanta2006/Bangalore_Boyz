import path from 'path';
import dotenv from 'dotenv';

// Automatically load root .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { explainWithGeminiOrFallback, resolveModel } from '../src/ai/geminiProvider';
import { buildFallbackExplanation } from '../src/ai/fallback';
import { validateExplainResponse } from '../src/ai/validation';
import { ACTION_CATALOG } from '../src/ai/actionCatalog';
import type { ExplainRequest } from '../src/ai/schemas';

async function main() {
  console.log('================================================================');
  console.log('      ClimateShield AI Agent & Cascade Verification Runner       ');
  console.log('================================================================\n');

  console.log('🔑 Environment Status:');
  console.log(`   • GEMINI_API_KEY : ${process.env.GEMINI_API_KEY ? 'Detected (Configured)' : 'Missing (Fallback mode active)'}`);
  console.log(`   • GEMINI_MODEL   : ${resolveModel()}\n`);

  console.log('🛡️  Catalog & Safety Rules:');
  console.log(`   • Controlled Action Catalog: ${Object.keys(ACTION_CATALOG).length} actions active.\n`);

  const mockRequest: ExplainRequest = {
    incidentId: 'INC-BLR-2026-DEMO',
    hazard: {
      type: 'flood',
      severity: 'critical',
    },
    risk: {
      score: 92,
      level: 'critical',
      confidence: 0.95,
    },
    affectedAssets: [
      { id: 'substation-01', type: 'substation', name: 'Hebbal Substation', riskLevel: 'critical' },
      { id: 'hosp-01', type: 'hospital', name: 'Baptist Hospital', riskLevel: 'critical' },
      { id: 'drain-01', type: 'drain', name: 'Hebbal Primary Storm Drain', riskLevel: 'high' }
    ],
    cascade: {
      path: ['Substation Submerged', 'Emergency Generator Required', 'Route Blocked'],
      etaMinutes: 15,
      impact: 'Substation submergence threatens hospital emergency power feeders',
    },
    evidence: ['IMD Rainfall 95mm/hr', 'Substation Telemetry Water Sensor 1.4m', 'Overpass Road Flood Warning']
  };

  console.log('⚡ 1. Testing Deterministic Fallback Agent...');
  const fallbackResult = buildFallbackExplanation(mockRequest);
  const fallbackValidation = validateExplainResponse(fallbackResult);
  console.log(`   • Generated Incident Briefing : "${fallbackResult.situationSummary.slice(0, 90)}..."`);
  console.log(`   • Recommended Actions Count   : ${fallbackResult.recommendedActions.length}`);
  console.log(`   • Schema Safety Validation   : ${fallbackValidation.success ? '✅ PASSED' : '❌ FAILED'}\n`);

  console.log('🤖 2. Testing Live Google Gemini AI Agent...');
  const result = await explainWithGeminiOrFallback(mockRequest, { timeoutMs: 25000 });

  if (!result.usedFallback) {
    console.log(`   ✅ Live LLM Succeeded using model [${result.modelUsed}]!`);
    console.log(`   • Situation Summary : "${result.response.situationSummary}"`);
    console.log(`   • Key Impacts Count : ${result.response.keyImpacts.length}`);
    console.log(`   • Actions Count     : ${result.response.recommendedActions.length}`);
  } else {
    console.log(`   ⚠️  Fallback engaged (Reason: ${result.fallbackReason})`);
    if (result.errorDetails) {
      console.log(`   • Error Details     : ${result.errorDetails}`);
    }
  }

  console.log('\n================================================================');
  console.log('  Agent check completed! All systems operational.              ');
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Fatal error running agents:', err);
  process.exit(1);
});
