/**
 * Lightweight in-memory metrics registry.
 * Resets on process restart — acceptable for hackathon demo.
 */

interface MetricsState {
  http: { total: number; s2xx: number; s3xx: number; s4xx: number; s5xx: number; errors: number };
  latency: { totalMs: number; count: number; lastMs: number };
  asyncJobs: { pending: number; processing: number; completed: number; retried: number; failed: number; deadLetter: number };
  providers: { weatherFailures: number; staleFallbacks: number };
  startedAt: number;
}

const state: MetricsState = {
  http: { total: 0, s2xx: 0, s3xx: 0, s4xx: 0, s5xx: 0, errors: 0 },
  latency: { totalMs: 0, count: 0, lastMs: 0 },
  asyncJobs: { pending: 0, processing: 0, completed: 0, retried: 0, failed: 0, deadLetter: 0 },
  providers: { weatherFailures: 0, staleFallbacks: 0 },
  startedAt: Date.now(),
};

export function recordHttpRequest(status: number, durationMs: number): void {
  state.http.total++;
  state.latency.totalMs += durationMs;
  state.latency.count++;
  state.latency.lastMs = durationMs;
  if (status >= 500) { state.http.s5xx++; state.http.errors++; }
  else if (status >= 400) state.http.s4xx++;
  else if (status >= 300) state.http.s3xx++;
  else state.http.s2xx++;
}

export function recordAsyncJob(status: 'pending' | 'processing' | 'completed' | 'retried' | 'failed' | 'deadLetter'): void {
  state.asyncJobs[status]++;
}

export function recordProviderFailure(): void { state.providers.weatherFailures++; }
export function recordStaleFallback(): void { state.providers.staleFallbacks++; }

export function getMetricsSnapshot() {
  const avgMs = state.latency.count > 0 ? Math.round(state.latency.totalMs / state.latency.count) : 0;
  const mem = process.memoryUsage();
  return {
    note: 'In-process counters; reset on restart.',
    uptime: { seconds: Math.round((Date.now() - state.startedAt) / 1000) },
    http: {
      totalRequests: state.http.total,
      requestsByStatus: { '2xx': state.http.s2xx, '3xx': state.http.s3xx, '4xx': state.http.s4xx, '5xx': state.http.s5xx },
      totalErrors: state.http.errors,
    },
    latency: { averageMs: avgMs, lastDurationMs: state.latency.lastMs, count: state.latency.count },
    asyncJobs: { ...state.asyncJobs },
    providers: { ...state.providers },
    process: { uptimeSeconds: Math.round(process.uptime()), memoryUsageMb: Math.round(mem.rss / 1024 / 1024) },
  };
}
