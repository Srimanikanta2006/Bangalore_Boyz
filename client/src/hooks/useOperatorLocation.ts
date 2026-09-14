import { useEffect, useState } from 'react';
import { getActiveLocationDetails } from '../citizen/geo';

export type LocationSource = 'gps' | 'fallback' | 'pending';

export interface OperatorLocation {
  latitude: number;
  longitude: number;
  source: LocationSource;
  accuracyM: number | null;
  error: string | null;
  name?: string;
}

export function useOperatorLocation(): OperatorLocation {
  const [loc, setLoc] = useState<OperatorLocation>(() => {
    const details = getActiveLocationDetails();
    return {
      latitude: details.latitude,
      longitude: details.longitude,
      source: 'gps',
      accuracyM: null,
      error: null,
      name: details.name,
    };
  });

  useEffect(() => {
    const updateLocation = () => {
      const details = getActiveLocationDetails();
      setLoc({
        latitude: details.latitude,
        longitude: details.longitude,
        source: details.isCustom ? 'fallback' : 'gps',
        accuracyM: null,
        error: null,
        name: details.name,
      });
    };

    updateLocation();

    window.addEventListener('climateshield_region_changed', updateLocation);
    return () => window.removeEventListener('climateshield_region_changed', updateLocation);
  }, []);

  return loc;
}

