import type { Request, Response } from 'express';
import { getAnalyticsOverview } from '../services/analytics.service';
import { getHudhudCaseStudy } from '../data/hudhudCaseStudy';
import { wrap } from '../utils/wrap';

export const overview = wrap(async (_req: Request, res: Response) => {
  const data = await getAnalyticsOverview();
  res.json({ success: true, data });
});

/**
 * Static, fully-cited regional reference (not live, not computed from our own DB) - see
 * src/data/hudhudCaseStudy.ts for sourcing. Powers the "Disaster Intelligence" reference
 * panel so the Andhra Pradesh regional context is grounded in real, checkable facts rather
 * than fabricated Visakhapatnam data we don't actually have.
 */
export const disasterIntelligence = wrap(async (_req: Request, res: Response) => {
  res.json({ success: true, data: { hudhud2014: getHudhudCaseStudy() } });
});
