import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

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

// Custom Marker Icons for Incident, Hazard, Asset, Unit, User
export const createCustomIcon = (color: string, iconSymbol: string = '•') => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 0 12px ${color}88, 0 2px 6px rgba(0,0,0,0.4);
        border: 2px solid white;
      ">
        ${iconSymbol}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

export const Icons = {
  USER: createCustomIcon('#3b82f6', '👤'),
  INCIDENT_CRITICAL: createCustomIcon('#ef4444', '🚨'),
  INCIDENT_HIGH: createCustomIcon('#f97316', '⚠️'),
  INCIDENT_MODERATE: createCustomIcon('#eab308', '⚡'),
  ASSET: createCustomIcon('#06b6d4', '🏗️'),
  UNIT: createCustomIcon('#22c55e', '🚑'),
  HAZARD: createCustomIcon('#a855f7', '🌊'),
};

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  type?: 'user' | 'incident' | 'asset' | 'unit' | 'hazard';
  severity?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  metadata?: Record<string, any>;
}

interface MapZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters?: number;
  riskLevel?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  boundaryCoordinates?: [number, number][];
}

interface RealLeafletMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  zones?: MapZone[];
  routes?: [number, number][][];
  onMarkerClick?: (marker: MapMarker) => void;
  className?: string;
  tileTheme?: 'dark' | 'light' | 'osm' | 'esri';
  showUserLocation?: boolean;
  hideStyleSwitcher?: boolean;
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
  center = [13.062, 80.275], // Default: Chennai East Basin
  zoom = 13,
  markers = [],
  zones = [],
  routes = [],
  onMarkerClick,
  className = 'h-full w-full rounded-xl overflow-hidden shadow-lg',
  tileTheme = 'osm',
  showUserLocation = true,
  hideStyleSwitcher = false,
  styleSwitcherPosition = 'bottom-left',
}) => {
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);

  // Request real user geolocation if enabled
  useEffect(() => {
    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserCoords(coords);
        },
        (err) => {
          console.log('[Map] Browser geolocation permission fallback to location default:', err.message);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [showUserLocation]);

  useEffect(() => {
    setMapCenter(center);
  }, [center[0], center[1]]);

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

  const getMarkerIcon = (m: MapMarker) => {
    if (m.type === 'user') return Icons.USER;
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
      {/* Non-overlapping Map Style Switcher HUD */}
      {!hideStyleSwitcher && (
        <div className={`absolute ${positionClasses} z-[400] flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 shadow-lg select-none`}>
          <button
            onClick={() => setCurrentTheme('osm')}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
              currentTheme === 'osm' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
            title="OpenStreetMap Standard (Street map with buildings, roads)"
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

        {/* User Real Location Marker */}
        {userCoords && showUserLocation && (
          <Marker position={userCoords} icon={Icons.USER}>
            <Popup className="rounded-lg font-sans">
              <div className="p-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
                  Your Location
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Lat: {userCoords[0].toFixed(4)}, Lng: {userCoords[1].toFixed(4)}
                </div>
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

        {/* Dynamic Navigation Routes */}
        {routes.map((path, idx) => (
          <Polyline
            key={idx}
            positions={path}
            pathOptions={{
              color: idx === 0 ? '#10b981' : '#ef4444',
              weight: 5,
              opacity: 0.8,
              dashArray: idx === 0 ? undefined : '6,6',
            }}
          />
        ))}

        {/* Interactive Feature Markers */}
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
                </div>
                {m.description && <div className="text-xs text-slate-600 mt-1 leading-snug">{m.description}</div>}
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
