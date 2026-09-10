/**
 * Shared geolocation helper for citizen screens. Falls back to a known Chennai
 * coordinate (East Basin demo zone) so screens always render real backend data
 * even when the browser denies/lacks GPS.
 */
export const FALLBACK_COORDS = { latitude: 13.062, longitude: 80.275 };

export interface GeoState {
  latitude: number;
  longitude: number;
  usingFallback: boolean;
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

/** Resolve the user's coordinates, falling back to the demo location on failure. */
export async function resolveCoords(): Promise<GeoState> {
  try {
    const pos = await getPosition();
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude, usingFallback: false };
  } catch {
    return { ...FALLBACK_COORDS, usingFallback: true };
  }
}
