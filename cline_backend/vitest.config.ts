import { existsSync } from 'node:fs';
import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';

// Prefer .env.test when present (dedicated test database), else .env.
config({ path: existsSync('.env.test') ? '.env.test' : '.env' });

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Integration suites mutate the shared demo database -> run files sequentially.
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 15000,
    env: {
      NODE_ENV: process.env.NODE_ENV ?? 'test',
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      DIRECT_URL: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
      JWT_SECRET: process.env.JWT_SECRET ?? 'test-secret-change-me-32-chars',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '12h',
      DEMO_USER_PASSWORD: process.env.DEMO_USER_PASSWORD ?? 'DemoGov@2024',
    },
  },
});
