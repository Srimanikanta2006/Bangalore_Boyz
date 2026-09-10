import { fetchCitizenNearby, type CitizenNearby } from './api';
import { useGeoResource, type GeoResource } from './useGeoResource';

export { FALLBACK_COORDS } from './geo';

export type UseCitizenNearbyResult = GeoResource<CitizenNearby>;

/** Resolves the user's location (with fallback) and loads the citizen snapshot. */
export function useCitizenNearby(radiusKm = 5): UseCitizenNearbyResult {
  return useGeoResource<CitizenNearby>(
    (coords, signal) =>
      fetchCitizenNearby({ latitude: coords.latitude, longitude: coords.longitude, radiusKm, signal }),
    [radiusKm],
  );
}
