/**
 * Minimal, dependency-free Prometheus-text-format metrics registry
 * (Chunk I — Phase 3 hardening: "Monitoring... add a lightweight /metrics
 * endpoint"). No new npm dependency, no external service - real in-memory
 * counters/histograms populated from real request data by requestLogger.ts.
 *
 * Process-local only (resets on restart) - documented honestly as a Phase-3
 * MVP tradeoff; a real production deployment would use prom-client + a
 * shared store, noted in docs/ARCHITECTURE.md's scalability section.
 */

interface CounterMap { [labelKey: string]: number }
interface HistogramState { buckets: number[]; counts: number[]; sum: number; count: number }
interface HistogramMap { [labelKey: string]: HistogramState }

const HTTP_DURATION_BUCKETS_SECONDS = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5];

const httpRequestsTotal: CounterMap = {};
const httpRequestDuration: HistogramMap = {};
const startedAt = Date.now();

function labelKey(labels: Record<string, string>): string {
  return Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${v.replace(/"/g, '\\"')}"`)
    .join(',');
}

export function recordHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number): void {
  const key = labelKey({ method, route, status_code: String(statusCode) });
  httpRequestsTotal[key] = (httpRequestsTotal[key] ?? 0) + 1;

  if (!httpRequestDuration[key]) {
    httpRequestDuration[key] = { buckets: HTTP_DURATION_BUCKETS_SECONDS, counts: new Array(HTTP_DURATION_BUCKETS_SECONDS.length + 1).fill(0), sum: 0, count: 0 };
  }
  const hist = httpRequestDuration[key];
  hist.sum += durationSeconds;
  hist.count += 1;
  let bucketIndex = hist.buckets.findIndex((b) => durationSeconds <= b);
  if (bucketIndex === -1) bucketIndex = hist.buckets.length; // overflow ("+Inf") bucket
  for (let i = bucketIndex; i < hist.counts.length; i++) hist.counts[i] += 1;
}

/** Renders everything collected so far as valid Prometheus text exposition format. */
export function renderPrometheusText(): string {
  const lines: string[] = [];

  lines.push('# HELP climateshield_process_uptime_seconds Process uptime in seconds.');
  lines.push('# TYPE climateshield_process_uptime_seconds gauge');
  lines.push(`climateshield_process_uptime_seconds ${((Date.now() - startedAt) / 1000).toFixed(3)}`);

  lines.push('# HELP climateshield_http_requests_total Total HTTP requests processed.');
  lines.push('# TYPE climateshield_http_requests_total counter');
  for (const [key, value] of Object.entries(httpRequestsTotal)) {
    lines.push(`climateshield_http_requests_total{${key}} ${value}`);
  }

  lines.push('# HELP climateshield_http_request_duration_seconds HTTP request duration in seconds.');
  lines.push('# TYPE climateshield_http_request_duration_seconds histogram');
  for (const [key, hist] of Object.entries(httpRequestDuration)) {
    for (let i = 0; i < hist.buckets.length; i++) {
      lines.push(`climateshield_http_request_duration_seconds_bucket{${key},le="${hist.buckets[i]}"} ${hist.counts[i]}`);
    }
    lines.push(`climateshield_http_request_duration_seconds_bucket{${key},le="+Inf"} ${hist.counts[hist.counts.length - 1]}`);
    lines.push(`climateshield_http_request_duration_seconds_sum{${key}} ${hist.sum.toFixed(6)}`);
    lines.push(`climateshield_http_request_duration_seconds_count{${key}} ${hist.count}`);
  }

  return lines.join('\n') + '\n';
}

/** Test-only reset so metrics tests don't leak state between runs. */
export function __resetMetricsForTests(): void {
  for (const k of Object.keys(httpRequestsTotal)) delete httpRequestsTotal[k];
  for (const k of Object.keys(httpRequestDuration)) delete httpRequestDuration[k];
}
