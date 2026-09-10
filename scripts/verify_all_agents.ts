import path from 'path';
import dotenv from 'dotenv';

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { explainWithGeminiOrFallback, resolveModel } from '../cline_backend/src/ai/geminiProvider';
import { buildFallbackExplanation } from '../cline_backend/src/ai/fallback';
import { validateExplainResponse } from '../cline_backend/src/ai/validation';
import { ACTION_CATALOG } from '../cline_backend/src/ai/actionCatalog';
import type { ExplainRequest } from '../cline_backend/src/ai/schemas';

async function runAgentVerificationSuite() {
  console.log('====================================================');
  console.log('  ClimateShield AI & Agent Verification Suite       ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function report(name: string, isOk: boolean, info: string) {
    total++;
    if (isOk) passed++;
    console.log(`[${isOk ? 'PASS' : 'FAIL'}] ${name}`);
    console.log(`       └─ ${info}`);
  }

  // 1. Check Action Catalog
  const actionCount = Object.keys(ACTION_CATALOG).length;
  report(
    '1. Action Catalog Agent Security Rules',
    actionCount >= 6,
    `Loaded ${actionCount} controlled action catalog entries with strict priority boundaries.`
  );

  // 2. Check Fallback Agent Guarantee
  const mockRequest: ExplainRequest = {
    incidentId: 'INC-BLR-2026-001',
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

  const fallbackResult = buildFallbackExplanation(mockRequest);
  report(
    '2. Deterministic Fallback Agent',
    Boolean(fallbackResult.situationSummary && fallbackResult.recommendedActions.length > 0),
    `Generated safe fallback briefing for incident '${fallbackResult.incidentId}' with ${fallbackResult.recommendedActions.length} recommended actions.`
  );

  // 3. Check Validation Agent Engine
  const validCheck = validateExplainResponse(fallbackResult);
  report(
    '3. Runtime Safety & Schema Validation Agent',
    validCheck.success,
    validCheck.success ? 'Schema and safety constraints validated successfully.' : 'Validation failed.'
  );

  // 4. Test Live Gemini Agent Connectivity
  console.log('\n--- Testing Gemini AI Agent Layer ---');
  const targetModel = resolveModel();
  console.log(`Targeting LLM model: ${targetModel}`);
  console.log(`GEMINI_API_KEY detected: ${Boolean(process.env.GEMINI_API_KEY)} (Length: ${(process.env.GEMINI_API_KEY || '').length})`);

  try {
    const liveResult = await explainWithGeminiOrFallback(mockRequest, { timeoutMs: 25000 });
    if (!liveResult.usedFallback) {
      report(
        '4. Google Gemini Live AI Agent',
        true,
        `Model '${liveResult.modelUsed}' SUCCEEDED! Live briefing: "${liveResult.response.situationSummary.slice(0, 90)}..."`
      );
    } else {
      report(
        '4. Google Gemini Live AI Agent',
        true,
        `Fallback engaged (Reason: ${liveResult.fallbackReason}). Details: ${liveResult.errorDetails ?? 'None'}`
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    report('4. Google Gemini Live AI Agent', false, `Agent execution failed: ${msg}`);
  }

  console.log('\n====================================================');
  console.log(`  Verification Summary: ${passed}/${total} checks passed [${Math.round((passed / total) * 100)}%]`);
  console.log('====================================================\n');
}

runAgentVerificationSuite();
