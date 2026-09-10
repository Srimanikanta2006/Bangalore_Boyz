import { describe, expect, it } from 'vitest';
import { hazardToCapXml } from '../../src/services/capExport.service';

function demoHazard(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'hz_demo_1',
    type: 'FLASH_FLOOD',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    startedAt: new Date('2026-09-10T12:00:00Z'),
    endedAt: null,
    rainfallRate: 72,
    waterDepth: 1.2,
    windSpeed: null,
    temperature: null,
    zone: {
      name: 'Zone C — Bayshore',
      latitude: 13.05,
      longitude: 80.28,
      boundaryGeoJson: null,
    },
    ...overrides,
  } as never;
}

describe('hazardToCapXml (CAP 1.2 protocol-compatibility export)', () => {
  it('produces well-formed XML with the required CAP 1.2 elements', () => {
    const xml = hazardToCapXml(demoHazard());
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('xmlns="urn:oasis:names:tc:emergency:cap:1.2"');
    expect(xml).toContain('<identifier>hz_demo_1</identifier>');
    expect(xml).toContain('<msgType>Alert</msgType>');
    expect(xml).toContain('<scope>Public</scope>');
  });

  it('is always status=Exercise (never claims to be a real government alert)', () => {
    const xml = hazardToCapXml(demoHazard());
    expect(xml).toContain('<status>Exercise</status>');
    expect(xml).toContain('hackathon demo');
  });

  it('maps severity/urgency correctly for a CRITICAL hazard', () => {
    const xml = hazardToCapXml(demoHazard());
    expect(xml).toContain('<severity>Extreme</severity>');
    expect(xml).toContain('<urgency>Immediate</urgency>');
  });

  it('maps severity/urgency correctly for a LOW hazard', () => {
    const xml = hazardToCapXml(demoHazard({ severity: 'LOW' }));
    expect(xml).toContain('<severity>Minor</severity>');
    expect(xml).toContain('<urgency>Future</urgency>');
  });

  it('falls back to a <circle> around the real zone centroid when no polygon exists', () => {
    const xml = hazardToCapXml(demoHazard());
    expect(xml).toContain('<circle>13.05,80.28 3.0</circle>');
  });

  it('renders a real polygon when the zone has OSM boundary GeoJSON', () => {
    const xml = hazardToCapXml(demoHazard({
      zone: {
        name: 'Zone D',
        latitude: 13.0,
        longitude: 80.2,
        boundaryGeoJson: { type: 'Polygon', coordinates: [[[80.2, 13.0], [80.21, 13.0], [80.21, 13.01], [80.2, 13.0]]] },
      },
    }));
    expect(xml).toContain('<polygon>13,80.2 13,80.21 13.01,80.21 13,80.2</polygon>');
  });

  it('escapes XML-unsafe characters in zone names/descriptions', () => {
    const xml = hazardToCapXml(demoHazard({ zone: { name: 'Zone "A" & <B>', latitude: 1, longitude: 1, boundaryGeoJson: null } }));
    expect(xml).not.toContain('<B>Zone');
    expect(xml).toContain('&amp;');
    expect(xml).toContain('&quot;');
  });
});
