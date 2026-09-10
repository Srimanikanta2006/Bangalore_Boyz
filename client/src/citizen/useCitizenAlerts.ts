import { fetchCitizenAlerts, type CitizenAlerts } from './api';
import { useGeoResource, type GeoResource } from './useGeoResource';

export type UseCitizenAlertsResult = GeoResource<CitizenAlerts>;

/** Resolves the user's location (with fallback) and loads computed nearby alerts. */
export function useCitizenAlerts(radiusKm = 5): UseCitizenAlertsResult {
  return useGeoResource<CitizenAlerts>(
    (coords, signal) =>
      fetchCitizenAlerts({ latitude: coords.latitude, longitude: coords.longitude, radiusKm, signal }),
    [radiusKm],
  );
}
