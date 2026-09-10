import { useEffect, useRef, useState, useCallback } from 'react';
import { resolveCoords, type GeoState } from './geo';

export interface GeoResource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  coords: GeoState | null;
  refetch: () => void;
}

/**
 * Resolves the user's coordinates (with fallback) then loads a resource for that
 * point. Handles abort on unmount/refetch and dependency changes.
 */
export function useGeoResource<T>(
  loader: (coords: GeoState, signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
): GeoResource<T> {
  const [data, setData] = useState<T | null>(null);
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
      const geo = await resolveCoords();
      if (cancelled) return;
      setCoords(geo);
      try {
        const result = await loader(geo, controller.signal);
        if (!cancelled) setData(result);
      } catch (err) {
        if (cancelled || (err as Error)?.name === 'AbortError') return;
        setError((err as Error)?.message ?? 'Failed to load live data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadToken, ...deps]);

  return { data, loading, error, coords, refetch };
}
