import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCitizenNearby, type CitizenNearby } from './api';

/**
 * Default coordinate (Chennai East Basin demo zone) used when the browser
 * denies/lacks geolocation, so the map always shows real backend data.
 */
export const FALLBACK_COORDS = { latitude: 13.062, longitude: 80.275 };

interface GeoState {
  latitude: number;
  longitude: number;
  usingFallback: boolean;
}

function getPosition(): Promise<GeolocationPosition> {
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

export interface UseCitizenNearbyResult {
  data: CitizenNearby | null;
  loading: boolean;
  error: string | null;
  coords: GeoState | null;
  refetch: () => void;
}

/** Resolves the user's location (with fallback) and loads the citizen snapshot. */
export function useCitizenNearby(radiusKm = 5): UseCitizenNearbyResult {
  const [data, setData] = useState<CitizenNearby | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<GeoState | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    (async () => {
      let geo: GeoState;
      try {
        const pos = await getPosition();
        geo = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, usingFallback: false };
      } catch {
        geo = { ...FALLBACK_COORDS, usingFallback: true };
      }
      if (cancelled) return;
      setCoords(geo);

      try {
        const result = await fetchCitizenNearby({
          latitude: geo.latitude,
          longitude: geo.longitude,
          radiusKm,
          signal: controller.signal,
        });
        if (!cancelled) setData(result);
      } catch (err) {
        if (cancelled || (err as Error)?.name === 'AbortError') return;
        setError((err as Error)?.message ?? 'Failed to load live conditions.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [radiusKm, reloadToken]);

  return { data, loading, error, coords, refetch };
}
