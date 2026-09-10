import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

// Load .env from the backend working directory (does not override real env vars,
// so CI/tests can inject their own values).
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('12h'),
  CORS_ORIGIN: z.string().default('*'),
  DEMO_USER_PASSWORD: z.string().min(8).default('DemoGov@2024'),
  // --- live weather (Open-Meteo needs no API key; variable reserved for future providers) ---
  WEATHER_PROVIDER: z.enum(['OPEN_METEO']).default('OPEN_METEO'),
  WEATHER_API_KEY: z.string().default(''),
  WEATHER_CACHE_SECONDS: z.coerce.number().int().min(0).max(86400).default(300),
  WEATHER_POLL_INTERVAL_MINUTES: z.coerce.number().int().min(0).max(1440).default(10),
  // --- P4 AI explanation layer (Google Gemini) ---
  // Leave GEMINI_API_KEY blank to run the deterministic fallback (no external call).
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  // --- Supabase configuration ---
  SUPABASE_URL: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_JWKS_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    '[env] Invalid environment configuration:',
    JSON.stringify(parsed.error.flatten().fieldErrors),
  );
  process.exit(1);
}

const corsOrigins = parsed.data.CORS_ORIGIN.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const env = {
  ...parsed.data,
  DIRECT_URL: parsed.data.DIRECT_URL ?? parsed.data.DATABASE_URL,
  isProd: parsed.data.NODE_ENV === 'production',
  isDev: parsed.data.NODE_ENV === 'development',
  isTest: parsed.data.NODE_ENV === 'test',
  corsOrigins,
  allowAllOrigins: corsOrigins.includes('*'),
};

export type Env = typeof env;
