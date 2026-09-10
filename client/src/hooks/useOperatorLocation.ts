import { useEffect, useState } from 'react';

export type LocationSource = 'gps' | 'fallback' | 'pending';

export interface OperatorLocation {
  latitude: number;
  longitude: number;
  source: LocationSource;
  accuracyM: number | null;
  error: string | null;
}

// Demo/pilot fallback (Chennai) used when the browser denies or cannot resolve GPS.
const FALLBACK = { latitude: 13.0827, longitude: 80.2707 };

/**
 * Requests the operator's real device location once on mount (this triggers the
 * browser's permission prompt). Falls back to the demo pilot coordinates if the
 * user denies, the API is unavailable, or the request times out — the dashboard
 * always has coordinates to drive live weather/risk with.
 */
export function useOperatorLocation(): OperatorLocation {
  const [loc, setLoc] = useState<OperatorLocation>({
    latitude: FALLBACK.latitude,
    longitude: FALLBACK.longitude,
    source: 'pending',
    accuracyM: null,
    error: null,
  });

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLoc({ ...FALLBACK, source: 'fallback', accuracyM: null, error: 'Geolocation not supported' });
      return;
    }

    let settled = false;
    const useFallback = (error: string) => {
      if (settled) return;
      settled = true;
      setLoc({ ...FALLBACK, source: 'fallback', accuracyM: null, error });
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return;
        settled = true;
        setLoc({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          source: 'gps',
          accuracyM: pos.coords.accuracy ?? null,
          error: null,
        });
      },
      (err) => useFallback(err.message || 'Location permission denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return loc;
}
