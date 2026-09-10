import { describe, expect, it } from 'vitest';
import { getHudhudCaseStudy } from '../../src/data/hudhudCaseStudy';

describe('getHudhudCaseStudy (static, cited historical reference)', () => {
  it('is always labeled REAL_HISTORICAL_REFERENCE (never presented as live)', () => {
    expect(getHudhudCaseStudy().dataQuality).toBe('REAL_HISTORICAL_REFERENCE');
  });

  it('includes verifiable citations', () => {
    const cs = getHudhudCaseStudy();
    expect(cs.citations.length).toBeGreaterThan(0);
    for (const c of cs.citations) expect(c.url).toMatch(/^https:\/\//);
  });

  it('matches the verified public record for landfall and impact', () => {
    const cs = getHudhudCaseStudy();
    expect(cs.event.landfallLocation).toContain('Visakhapatnam');
    expect(cs.impact.andhraPradeshDeaths).toBe(46);
    expect(cs.response.operationName).toBe('Operation Lehar');
  });
});
