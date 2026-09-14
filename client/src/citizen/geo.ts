/**
 * Shared geolocation, universal location search, and active region helper for ClimateShield.
 */

// Default Fallback Coordinates set to user's location (Bangalore Urban Catchment)
export const FALLBACK_COORDS = { latitude: 12.9716, longitude: 77.5946 };

export interface GeoState {
  latitude: number;
  longitude: number;
  usingFallback: boolean;
  name?: string;
}

export type RegionKey = 'GPS' | 'NEPAL' | 'CHENNAI' | 'CUSTOM';

export interface CustomLocation {
  name: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  bbox?: [number, number, number, number];
}

export const REGION_COORDS: Record<Extract<RegionKey, 'GPS' | 'NEPAL' | 'CHENNAI'>, { latitude: number; longitude: number; name: string; subtitle: string }> = {
  GPS: { latitude: 12.9716, longitude: 77.5946, name: 'Bangalore Urban Basin (My Location)', subtitle: 'Live Bangalore Telemetry & Risk Corridors' },
  NEPAL: { latitude: 27.7172, longitude: 85.3140, name: 'Kathmandu Valley, Nepal', subtitle: 'Bagmati Basin Flash Flood Zone' },
  CHENNAI: { latitude: 13.0620, longitude: 80.2750, name: 'East Basin, Chennai', subtitle: 'Urban Catchment Area' },
};

export function getActiveRegion(): RegionKey {
  if (typeof window === 'undefined') return 'GPS';
  const saved = localStorage.getItem('climateshield_active_region');
  if (saved === 'NEPAL' || saved === 'CHENNAI' || saved === 'GPS' || saved === 'CUSTOM') return saved as RegionKey;
  return 'GPS';
}

export function setActiveRegion(region: RegionKey): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('climateshield_active_region', region);
  }
}

export function getCustomLocation(): CustomLocation | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem('climateshield_custom_location');
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

export function setCustomLocation(loc: CustomLocation): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('climateshield_custom_location', JSON.stringify(loc));
    localStorage.setItem('climateshield_active_region', 'CUSTOM');
  }
}

export async function searchLocation(query: string): Promise<CustomLocation[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      { headers: { 'User-Agent': 'ClimateShield-DisasterPlatform/1.0' } }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((item: any) => ({
      name: item.display_name.split(',')[0],
      subtitle: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      bbox: item.boundingbox ? item.boundingbox.map(parseFloat) : undefined,
    }));
  } catch (err) {
    console.error('Failed to geocode location:', err);
    return [];
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

/** Resolve coordinates based on active selected region, custom search, or user GPS (defaulting to Bangalore) */
export async function resolveCoords(): Promise<GeoState> {
  const active = getActiveRegion();
  if (active === 'NEPAL') {
    return { latitude: 27.7172, longitude: 85.3140, usingFallback: true, name: 'Kathmandu Valley, Nepal' };
  }
  if (active === 'CHENNAI') {
    return { latitude: 13.0620, longitude: 80.2750, usingFallback: true, name: 'East Basin, Chennai' };
  }
  if (active === 'CUSTOM') {
    const custom = getCustomLocation();
    if (custom) {
      return { latitude: custom.latitude, longitude: custom.longitude, usingFallback: false, name: custom.name };
    }
  }

  try {
    const pos = await getPosition();
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude, usingFallback: false, name: 'Bangalore Urban Location (Live GPS)' };
  } catch {
    return { latitude: 12.9716, longitude: 77.5946, usingFallback: true, name: 'Bangalore Urban Basin (My Location)' };
  }
}

/** Synchronous helper to get current active location info for headers & maps */
export function getActiveLocationDetails(): { latitude: number; longitude: number; name: string; subtitle: string; isCustom: boolean } {
  const active = getActiveRegion();
  if (active === 'NEPAL') {
    return { ...REGION_COORDS.NEPAL, isCustom: false };
  }
  if (active === 'CHENNAI') {
    return { ...REGION_COORDS.CHENNAI, isCustom: false };
  }
  if (active === 'CUSTOM') {
    const custom = getCustomLocation();
    if (custom) {
      return { latitude: custom.latitude, longitude: custom.longitude, name: custom.name, subtitle: custom.subtitle, isCustom: true };
    }
  }
  return { ...REGION_COORDS.GPS, isCustom: false };
}

/** Generate location-anchored synthetic assets around any given lat/lon */
export function getDynamicAssetsForLocation(lat: number, lng: number, placeName: string = 'Bangalore Urban') {
  return [
    {
      id: 'asset-hosp-1',
      assetCode: 'AST-HOSP-01',
      name: `${placeName} Regional Trauma Center`,
      type: 'HOSPITAL',
      latitude: lat + 0.008,
      longitude: lng + 0.006,
      criticality: 'CRITICAL',
      operationalStatus: 'OPERATIONAL',
      vulnerability: 72,
    },
    {
      id: 'asset-sub-1',
      assetCode: 'AST-SUB-02',
      name: `${placeName} Central Power Substation 04`,
      type: 'SUBSTATION',
      latitude: lat - 0.006,
      longitude: lng - 0.008,
      criticality: 'CRITICAL',
      operationalStatus: 'COMPROMISED',
      vulnerability: 88,
    },
    {
      id: 'asset-shelter-1',
      assetCode: 'AST-SHELTER-03',
      name: `${placeName} High-Ground Evacuation Shelter`,
      type: 'EVACUATION_SHELTER',
      latitude: lat + 0.012,
      longitude: lng - 0.004,
      criticality: 'HIGH',
      operationalStatus: 'OPERATIONAL',
      vulnerability: 35,
    },
    {
      id: 'asset-pump-1',
      assetCode: 'AST-PUMP-04',
      name: `${placeName} Catchment Drainage Pumping Station`,
      type: 'PUMPING_STATION',
      latitude: lat - 0.010,
      longitude: lng + 0.010,
      criticality: 'HIGH',
      operationalStatus: 'DEGRADED',
      vulnerability: 65,
    },
  ];
}

/** Generate dynamic rescue vehicle missions anchored to any location */
export function getDynamicVehiclesForLocation(lat: number, lng: number) {
  return [
    {
      id: 'unit-amb-01',
      callsign: 'ALS-AMB-01',
      driverName: 'Dr. Rajesh Sharma',
      type: 'EMS',
      vehicleType: 'AMBULANCE',
      status: 'EN_ROUTE',
      speedKmh: 42,
      headingDeg: 45,
      routeColor: 'GREEN',
      origin: [lat - 0.015, lng - 0.015] as [number, number],
      destination: [lat + 0.008, lng + 0.006] as [number, number],
      routePoints: [
        [lat - 0.015, lng - 0.015],
        [lat - 0.008, lng - 0.005],
        [lat, lng],
        [lat + 0.004, lng + 0.003],
        [lat + 0.008, lng + 0.006],
      ] as [number, number][],
      hazardPoints: [
        { lat: lat, lng: lng, type: 'WATER_LOGGING', label: 'Severe Waterlogging (45cm Depth)', status: 'RED' },
      ],
    },
    {
      id: 'unit-pol-02',
      callsign: 'PATROL-POLICE-09',
      driverName: 'Officer Vikram Singh',
      type: 'POLICE',
      vehicleType: 'POLICE_CAR',
      status: 'ON_SCENE',
      speedKmh: 35,
      headingDeg: 120,
      routeColor: 'BLUE',
      origin: [lat + 0.012, lng - 0.010] as [number, number],
      destination: [lat - 0.006, lng - 0.008] as [number, number],
      routePoints: [
        [lat + 0.012, lng - 0.010],
        [lat + 0.005, lng - 0.008],
        [lat - 0.001, lng - 0.008],
        [lat - 0.006, lng - 0.008],
      ] as [number, number][],
      hazardPoints: [],
    },
    {
      id: 'unit-fire-03',
      callsign: 'FIRE-ENGINE-04',
      driverName: 'Capt. Manoj Kumar',
      type: 'FIRE_RESCUE',
      vehicleType: 'FIRE_EXTINGUISHER',
      status: 'DISPATCHED',
      speedKmh: 50,
      headingDeg: 210,
      routeColor: 'ORANGE',
      origin: [lat - 0.010, lng + 0.015] as [number, number],
      destination: [lat - 0.010, lng + 0.010] as [number, number],
      routePoints: [
        [lat - 0.010, lng + 0.015],
        [lat - 0.010, lng + 0.012],
        [lat - 0.010, lng + 0.010],
      ] as [number, number][],
      hazardPoints: [
        { lat: lat - 0.010, lng: lng + 0.012, type: 'LANDSLIDE', label: 'Mudslide Debris Blockage', status: 'ORANGE' },
      ],
    },
    {
      id: 'unit-boat-04',
      callsign: 'RESCUE-BOAT-02',
      driverName: 'Sgt. Anita Roy',
      type: 'WATER_RESCUE',
      vehicleType: 'RESCUE_BOAT',
      status: 'EN_ROUTE',
      speedKmh: 18,
      headingDeg: 90,
      routeColor: 'TEAL',
      origin: [lat - 0.002, lng - 0.020] as [number, number],
      destination: [lat + 0.001, lng + 0.001] as [number, number],
      routePoints: [
        [lat - 0.002, lng - 0.020],
        [lat - 0.002, lng - 0.010],
        [lat - 0.001, lng - 0.002],
        [lat + 0.001, lng + 0.001],
      ] as [number, number][],
      hazardPoints: [
        { lat: lat - 0.001, lng: lng - 0.002, type: 'WATER_LOGGING', label: 'River Inundation Overflow', status: 'RED' },
      ],
    },
  ];
}
