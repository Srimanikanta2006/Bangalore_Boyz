export type ApiMode = 'MOCK' | 'BACKEND';

/** Public frontend config only — switch to BACKEND once the Express API is up. */
export const API_MODE: ApiMode = import.meta.env.VITE_API_MODE === 'BACKEND' ? 'BACKEND' : 'MOCK';

export const SCENARIO_IDS = {
  HAZARD: 'HAZ-001',
  DRAIN_D07: 'D07',
  ROAD_R24: 'R24',
  HOSPITAL_A: 'HOSP-A',
  CASCADE: 'CASC-001',
  RESPONSE: 'RESP-001',
  ZONE: 'ZONE-VJA-01',
} as const;

export const VIJAYAWADA_CENTER = {
  lat: 16.5062,
  lng: 80.648,
  zoom: 14,
} as const;
