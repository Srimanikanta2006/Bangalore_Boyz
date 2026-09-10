# ClimateShield AI explanation module

This module is Person 4's safe explanation layer. It turns verified incident facts into an operator-facing explanation and recommendations from a controlled catalog. It does not calculate risk, invent facts, or create response tasks.

## Run the demo

From the repository root:

```powershell
node backend/src/ai/demo.ts
```

Without a Gemini key, the demo intentionally shows the deterministic fallback. To use Gemini for this terminal session, set the key locally and rerun it:

```powershell
$env:GEMINI_API_KEY = "your-key"
node backend/src/ai/demo.ts
```

Never commit the key or place it in a frontend application.

## Run tests

```powershell
node --test backend/src/ai/*.test.ts
```

## Future backend integration

The backend route should validate the incoming body with `validateExplainRequest`, call `explainWithGeminiOrFallback`, and require operator approval before creating a task. The exact route and framework remain owned by the shared backend foundation.
