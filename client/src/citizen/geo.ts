/**
 * Shared geolocation and active region helper for citizen screens.
 */

export const FALLBACK_COORDS = { latitude: 13.062, longitude: 80.275 };

export interface GeoState {
  latitude: number;
  longitude: number;
  usingFallback: boolean;
}

export type RegionKey = 'GPS' | 'NEPAL' | 'CHENNAI';

export const REGION_COORDS: Record<RegionKey, { latitude: number; longitude: number; name: string; subtitle: string }> = {
  GPS: { latitude: 13.062, longitude: 80.275, name: 'Current Location', subtitle: 'GPS Telemetry' },
  NEPAL: { latitude: 27.7172, longitude: 85.3140, name: 'Kathmandu Valley, Nepal', subtitle: 'Bagmati Basin Flash Flood Zone' },
  CHENNAI: { latitude: 13.062, longitude: 80.275, name: 'East Basin, Chennai', subtitle: 'Urban Catchment Area' },
};

export function getActiveRegion(): RegionKey {
  if (typeof window === 'undefined') return 'GPS';
  const saved = localStorage.getItem('climateshield_active_region');
  if (saved === 'NEPAL' || saved === 'CHENNAI' || saved === 'GPS') return saved;
  return 'GPS';
}

export function setActiveRegion(region: RegionKey): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('climateshield_active_region', region);
  }
}

export function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation unavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 60000,
    });
  });
}

/** Resolve coordinates based on active selected region or user GPS */
export async function resolveCoords(): Promise<GeoState> {
  const active = getActiveRegion();
  if (active === 'NEPAL') {
    return { latitude: 27.7172, longitude: 85.3140, usingFallback: true };
  }
  if (active === 'CHENNAI') {
    return { latitude: 13.062, longitude: 80.275, usingFallback: true };
  }

  try {
    const pos = await getPosition();
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude, usingFallback: false };
  } catch {
    return { latitude: 13.062, longitude: 80.275, usingFallback: true };
  }
}
