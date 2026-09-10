import { Router } from 'express';
import { renderPrometheusText } from '../metrics/registry';

const router = Router();

/**
 * GET /metrics - Prometheus text-format exposition (Chunk I). Intentionally
 * top-level (not under /api) and unauthenticated to match standard
 * Prometheus scraping conventions; contains only aggregate request counts/
 * durations, no PII. In a real production deployment this endpoint should be
 * firewalled to the metrics-scraper network only (documented in
 * docs/ARCHITECTURE.md's deployment/scalability section).
 */
router.get('/metrics', (_req, res) => {
  res.type('text/plain; version=0.0.4').send(renderPrometheusText());
});

export default router;
