import { describe, expect, it, beforeEach } from 'vitest';
import { recordHttpRequest, renderPrometheusText, __resetMetricsForTests } from '../../src/metrics/registry';

describe('metrics registry (real, dependency-free Prometheus exposition)', () => {
  beforeEach(() => __resetMetricsForTests());

  it('renders a valid Prometheus text exposition with HELP/TYPE lines', () => {
    recordHttpRequest('GET', '/api/hazards', 200, 0.02);
    const text = renderPrometheusText();
    expect(text).toContain('# HELP climateshield_http_requests_total');
    expect(text).toContain('# TYPE climateshield_http_requests_total counter');
    expect(text).toContain('climateshield_http_requests_total{method="GET",route="/api/hazards",status_code="200"} 1');
  });

  it('accumulates counts across repeated requests to the same route+status', () => {
    recordHttpRequest('GET', '/api/hazards', 200, 0.01);
    recordHttpRequest('GET', '/api/hazards', 200, 0.03);
    recordHttpRequest('GET', '/api/hazards', 200, 0.02);
    const text = renderPrometheusText();
    expect(text).toContain('climateshield_http_requests_total{method="GET",route="/api/hazards",status_code="200"} 3');
  });

  it('keeps different status codes as separate label series', () => {
    recordHttpRequest('POST', '/api/citizen/sos', 201, 0.05);
    recordHttpRequest('POST', '/api/citizen/sos', 429, 0.01);
    const text = renderPrometheusText();
    expect(text).toContain('status_code="201"');
    expect(text).toContain('status_code="429"');
  });

  it('produces a real histogram with monotonically non-decreasing cumulative bucket counts', () => {
    recordHttpRequest('GET', '/api/zones', 200, 0.02);
    recordHttpRequest('GET', '/api/zones', 200, 2.0);
    const text = renderPrometheusText();
    const bucketLines = text.split('\n').filter((l) => l.includes('http_request_duration_seconds_bucket') && l.includes('/api/zones'));
    expect(bucketLines.length).toBeGreaterThan(0);
    const counts = bucketLines.map((l) => Number(l.trim().split(' ').pop()));
    for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
    expect(counts[counts.length - 1]).toBe(2); // +Inf bucket sees both requests
  });

  it('tracks process uptime as a gauge', () => {
    const text = renderPrometheusText();
    expect(text).toContain('# TYPE climateshield_process_uptime_seconds gauge');
  });
});
