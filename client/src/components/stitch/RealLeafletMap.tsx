import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocationSearchBar } from './LocationSearchBar';
import { getActiveLocationDetails } from '../../citizen/geo';

// Fix default Leaflet marker icon URLs in React/Vite
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker Icons for Incident, Hazard, Asset, Unit, User, Vehicles
export const createCustomIcon = (color: string, iconSymbol: string = '•', pulse: boolean = false) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 15px;
        box-shadow: 0 0 14px ${color}aa, 0 2px 8px rgba(0,0,0,0.5);
        border: 2px solid white;
        position: relative;
      ">
        ${pulse ? `<span style="position: absolute; inset: -4px; border-radius: 50%; border: 2px solid ${color}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></span>` : ''}
        ${iconSymbol}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

export const Icons = {
  USER: createCustomIcon('#3b82f6', '👤', true),
  INCIDENT_CRITICAL: createCustomIcon('#ef4444', '🚨', true),
  INCIDENT_HIGH: createCustomIcon('#f97316', '⚠️'),
  INCIDENT_MODERATE: createCustomIcon('#eab308', '⚡'),
  ASSET: createCustomIcon('#06b6d4', '🏗️'),
  UNIT: createCustomIcon('#22c55e', '🚑', true),
  AMBULANCE: createCustomIcon('#10b981', '🚑', true),
  POLICE: createCustomIcon('#3b82f6', '🚓', true),
  FIRE: createCustomIcon('#ef4444', '🚒', true),
  BOAT: createCustomIcon('#06b6d4', '🚤', true),
  HAZARD: createCustomIcon('#a855f7', '🌊', true),
  LANDSLIDE: createCustomIcon('#d97706', '⛰️', true),
};

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  type?: 'user' | 'incident' | 'asset' | 'unit' | 'hazard' | 'ambulance' | 'police' | 'fire' | 'boat' | 'landslide';
  severity?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  callsign?: string;
  speedKmh?: number;
  status?: string;
  metadata?: Record<string, any>;
}

export interface MapZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters?: number;
  riskLevel?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  boundaryCoordinates?: [number, number][];
}

export interface RouteSegment {
  points: [number, number][];
  color?: 'RED' | 'ORANGE' | 'GREEN' | 'BLUE' | 'TEAL';
  status?: 'CLEAR' | 'WATER_LOGGING' | 'LANDSLIDE' | 'CONGESTED';
  label?: string;
  dashArray?: string;
}

export interface TrafficNode {
  lat: number;
  lng: number;
  congestion: 'LIGHT' | 'MODERATE' | 'HEAVY' | 'BLOCKED';
  speedKmh: number;
}

interface RealLeafletMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  zones?: MapZone[];
  routes?: [number, number][][];
  routeSegments?: RouteSegment[];
  trafficNodes?: TrafficNode[];
  onMarkerClick?: (marker: MapMarker) => void;
  className?: string;
  tileTheme?: 'dark' | 'light' | 'osm' | 'esri';
  showUserLocation?: boolean;
  hideStyleSwitcher?: boolean;
  showLocationSearch?: boolean;
  styleSwitcherPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

// Controller component to dynamically re-center Leaflet map when center prop changes
const MapRecenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.setView(center, zoom, { animate: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [center, zoom, map]);
  return null;
};

export const RealLeafletMap: React.FC<RealLeafletMapProps> = ({
  center,
  zoom = 13,
  markers = [],
  zones = [],
  routes = [],
  routeSegments = [],
  trafficNodes = [],
  onMarkerClick,
  className = 'h-full w-full rounded-xl overflow-hidden shadow-lg',
  tileTheme = 'osm',
  showUserLocation = true,
  hideStyleSwitcher = false,
  showLocationSearch = true,
  styleSwitcherPosition = 'bottom-left',
}) => {
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(() => {
    if (center) return center;
    const details = getActiveLocationDetails();
    return [details.latitude, details.longitude];
  });

  // Handle region change events
  useEffect(() => {
    const handleRegionEvent = () => {
      const details = getActiveLocationDetails();
      setMapCenter([details.latitude, details.longitude]);
    };
    window.addEventListener('climateshield_region_changed', handleRegionEvent);
    return () => window.removeEventListener('climateshield_region_changed', handleRegionEvent);
  }, []);

  // Request real user geolocation if enabled
  useEffect(() => {
    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserCoords(coords);
        },
        (err) => {
          console.log('[Map] Browser geolocation permission fallback:', err.message);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [showUserLocation]);

  useEffect(() => {
    if (center) {
      setMapCenter(center);
    }
  }, [center?.[0], center?.[1]]);

  const [currentTheme, setCurrentTheme] = useState<'osm' | 'dark' | 'light' | 'esri'>(tileTheme || 'osm');

  const tileUrls = {
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    esri: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  };

  const getZoneColor = (level?: string) => {
    switch (level) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MODERATE': return '#eab308';
      default: return '#3b82f6';
    }
  };

  const getSegmentColor = (colorName?: string, status?: string) => {
    if (status === 'WATER_LOGGING' || colorName === 'RED') return '#ef4444'; // Red for water logging
    if (status === 'LANDSLIDE' || colorName === 'ORANGE') return '#f97316'; // Orange for landslide/calamity
    if (colorName === 'TEAL') return '#0d9488';
    if (colorName === 'BLUE') return '#2563eb';
    return '#10b981'; // Green for clear safe route
  };

  const getMarkerIcon = (m: MapMarker) => {
    if (m.type === 'user') return Icons.USER;
    if (m.type === 'ambulance') return Icons.AMBULANCE;
    if (m.type === 'police') return Icons.POLICE;
    if (m.type === 'fire') return Icons.FIRE;
    if (m.type === 'boat') return Icons.BOAT;
    if (m.type === 'landslide') return Icons.LANDSLIDE;
    if (m.type === 'unit') return Icons.UNIT;
    if (m.type === 'asset') return Icons.ASSET;
    if (m.type === 'hazard') return Icons.HAZARD;
    if (m.severity === 'CRITICAL') return Icons.INCIDENT_CRITICAL;
    if (m.severity === 'HIGH') return Icons.INCIDENT_HIGH;
    return Icons.INCIDENT_MODERATE;
  };

  const positionClasses = {
    'top-left': 'top-3 left-3',
    'top-right': 'top-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-16',
  }[styleSwitcherPosition];

  return (
    <div className={`relative ${className}`}>
      {/* Location Search Bar HUD (Google Maps-style auto-suggest + My GPS) */}
      {showLocationSearch && (
        <div className="absolute top-3 left-3 right-3 z-[400] max-w-[420px]">
          <LocationSearchBar />
        </div>
      )}

      {/* Map Style Switcher HUD */}
      {!hideStyleSwitcher && (
        <div className={`absolute ${positionClasses} z-[400] flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 shadow-lg select-none`}>
          <button
            onClick={() => setCurrentTheme('osm')}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
              currentTheme === 'osm' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
            title="OpenStreetMap Standard Street map"
          >
            🗺️ Street
          </button>
          <button
            onClick={() => setCurrentTheme('esri')}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
              currentTheme === 'esri' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
            title="Esri World Infrastructure Map"
          >
            🏙️ Esri City
          </button>
          <button
            onClick={() => setCurrentTheme('dark')}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
              currentTheme === 'dark' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
            title="Tactical Dark Mode GIS"
          >
            🌙 Dark
          </button>
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
      >
        <MapRecenter center={mapCenter} zoom={zoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileUrls[currentTheme]}
          subdomains={['a', 'b', 'c']}
          maxZoom={19}
        />

        {/* User Real Location Marker (Always Visible) */}
        {showUserLocation && (
          <Marker position={userCoords || mapCenter} icon={Icons.USER}>
            <Popup className="rounded-lg font-sans">
              <div className="p-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
                  Your Current Location
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {(userCoords || mapCenter)[0].toFixed(4)}, {(userCoords || mapCenter)[1].toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Zone Boundaries / Hazard Heatmaps */}
        {zones.map((zone) => {
          const color = getZoneColor(zone.riskLevel);
          return (
            <React.Fragment key={zone.id}>
              {zone.boundaryCoordinates && zone.boundaryCoordinates.length > 0 ? (
                <Polygon
                  positions={zone.boundaryCoordinates}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.25,
                    weight: 2,
                    dashArray: zone.riskLevel === 'CRITICAL' ? '4,4' : undefined,
                  }}
                >
                  <Popup>
                    <div className="p-1 text-slate-900">
                      <div className="font-bold">{zone.name}</div>
                      <div className="text-xs text-slate-600 mt-1">Risk Level: <span className="font-semibold" style={{ color }}>{zone.riskLevel}</span></div>
                    </div>
                  </Popup>
                </Polygon>
              ) : (
                <Circle
                  center={[zone.lat, zone.lng]}
                  radius={zone.radiusMeters || 1200}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.2,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="p-1 text-slate-900">
                      <div className="font-bold">{zone.name}</div>
                      <div className="text-xs text-slate-600 mt-1">Risk Level: <span className="font-semibold" style={{ color }}>{zone.riskLevel}</span></div>
                    </div>
                  </Popup>
                </Circle>
              )}
            </React.Fragment>
          );
        })}

        {/* Traffic Sensor Overlay Nodes */}
        {trafficNodes.map((node, idx) => {
          const cColor = node.congestion === 'BLOCKED' ? '#dc2626' : node.congestion === 'HEAVY' ? '#ea580c' : node.congestion === 'MODERATE' ? '#eab308' : '#22c55e';
          return (
            <Circle
              key={`traffic-${idx}`}
              center={[node.lat, node.lng]}
              radius={250}
              pathOptions={{
                color: cColor,
                fillColor: cColor,
                fillOpacity: 0.4,
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="p-1 text-slate-900 text-xs">
                  <div className="font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cColor }}></span>
                    Traffic Node #{idx + 1}
                  </div>
                  <div>Congestion: <strong>{node.congestion}</strong></div>
                  <div>Average Speed: <strong>{node.speedKmh} km/h</strong></div>
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* Standard Polylines */}
        {routes.map((path, idx) => (
          <Polyline
            key={`route-std-${idx}`}
            positions={path}
            pathOptions={{
              color: idx === 0 ? '#10b981' : '#ef4444',
              weight: 5,
              opacity: 0.8,
              dashArray: idx === 0 ? undefined : '6,6',
            }}
          />
        ))}

        {/* Hazard-Coded Polyline Segments (Water logging = Red, Landslide = Orange, Clear = Green) */}
        {routeSegments.map((seg, idx) => {
          const sColor = getSegmentColor(seg.color, seg.status);
          const isHazardous = seg.status === 'WATER_LOGGING' || seg.status === 'LANDSLIDE' || seg.color === 'RED' || seg.color === 'ORANGE';
          return (
            <Polyline
              key={`route-seg-${idx}`}
              positions={seg.points}
              pathOptions={{
                color: sColor,
                weight: isHazardous ? 6 : 4,
                opacity: 0.9,
                dashArray: seg.dashArray || (isHazardous ? '8,6' : undefined),
              }}
            >
              {seg.label && (
                <Popup>
                  <div className="p-1 text-slate-900 text-xs">
                    <div className="font-bold" style={{ color: sColor }}>{seg.label}</div>
                    <div className="text-[11px] text-slate-600">Status: {seg.status || seg.color}</div>
                  </div>
                </Popup>
              )}
            </Polyline>
          );
        })}

        {/* Interactive Feature & Rescue Vehicle Markers */}
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={getMarkerIcon(m)}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(m),
            }}
          >
            <Popup>
              <div className="p-1 text-slate-900 max-w-xs">
                <div className="font-bold text-sm flex items-center justify-between gap-2">
                  <span>{m.title}</span>
                  {m.severity && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold text-white"
                      style={{ backgroundColor: getZoneColor(m.severity) }}
                    >
                      {m.severity}
                    </span>
                  )}
                  {m.callsign && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-900 text-sky-400">
                      {m.callsign}
                    </span>
                  )}
                </div>
                {m.description && <div className="text-xs text-slate-600 mt-1 leading-snug">{m.description}</div>}
                {(m.speedKmh !== undefined || m.status) && (
                  <div className="mt-2 pt-1 border-t border-slate-200 text-xs flex justify-between items-center">
                    <span className="font-semibold text-emerald-600">Status: {m.status || 'Active'}</span>
                    {m.speedKmh !== undefined && <span className="font-mono text-slate-700">{m.speedKmh} km/h</span>}
                  </div>
                )}
                {m.metadata && (
                  <div className="mt-2 pt-1 border-t border-slate-200 text-[11px] text-slate-500 space-y-0.5 font-mono">
                    {Object.entries(m.metadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="font-semibold text-slate-800">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default RealLeafletMap;
