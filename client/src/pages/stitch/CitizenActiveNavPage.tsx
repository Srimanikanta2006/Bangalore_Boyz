import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { RealLeafletMap } from '../../components/stitch/RealLeafletMap';
import { getActiveRegion, getActiveLocationDetails } from '../../citizen/geo';

export const CitizenActiveNavPage: React.FC = () => {
  const navigate = useNavigate();
  const activeRegion = getActiveRegion();
  const locDetails = getActiveLocationDetails();

  const [isRerouteVisible, setIsRerouteVisible] = useState(true);
  const [regionToken, setRegionToken] = useState(0);

  useEffect(() => {
    const handleRegionEvent = () => setRegionToken((t) => t + 1);
    window.addEventListener('climateshield_region_changed', handleRegionEvent);
    return () => window.removeEventListener('climateshield_region_changed', handleRegionEvent);
  }, []);

  // Read saved destination or default
  const savedDestRaw = localStorage.getItem('climateshield_active_dest');
  const savedDest = savedDestRaw ? JSON.parse(savedDestRaw) : null;

  const destName =
    savedDest?.name ??
    (activeRegion === 'NEPAL' ? 'Pashupati High-Ground Relief Shelter' : `${locDetails.name} Regional Trauma Hospital`);

  const originName = locDetails.name || (activeRegion === 'NEPAL' ? 'Thamel Quarter, Kathmandu' : 'Current Location');

  const mapCenter: [number, number] = [locDetails.latitude, locDetails.longitude];

  const destCoords: [number, number] = [
    savedDest?.lat ?? (activeRegion === 'NEPAL' ? 27.7080 : locDetails.latitude + 0.015),
    savedDest?.lng ?? (activeRegion === 'NEPAL' ? 85.3400 : locDetails.longitude + 0.012),
  ];

  const hazardCoords: [number, number] = [
    activeRegion === 'NEPAL' ? 27.6830 : locDetails.latitude + (destCoords[0] - locDetails.latitude) * 0.4,
    activeRegion === 'NEPAL' ? 85.3080 : locDetails.longitude + (destCoords[1] - locDetails.longitude) * 0.4,
  ];

  // Smooth curved road polylines for safe vs hazardous route
  const safeRoutePolyline: [number, number][] =
    activeRegion === 'NEPAL'
      ? [
          [27.7172, 85.3140],
          [27.7195, 85.3210],
          [27.7210, 85.3280],
          [27.7180, 85.3340],
          [27.7120, 85.3380],
          [27.7080, 85.3400],
        ]
      : [
          [mapCenter[0], mapCenter[1]],
          [mapCenter[0] + (destCoords[0] - mapCenter[0]) * 0.25 + 0.004, mapCenter[1] + (destCoords[1] - mapCenter[1]) * 0.25 - 0.003],
          [mapCenter[0] + (destCoords[0] - mapCenter[0]) * 0.65 + 0.004, mapCenter[1] + (destCoords[1] - mapCenter[1]) * 0.65 - 0.002],
          [destCoords[0], destCoords[1]],
        ];

  const hazardRoutePolyline: [number, number][] =
    activeRegion === 'NEPAL'
      ? [
          [27.7172, 85.3140],
          [27.7050, 85.3120],
          [27.6910, 85.3090],
          [27.6840, 85.3110],
        ]
      : [
          [mapCenter[0], mapCenter[1]],
          [hazardCoords[0], hazardCoords[1]],
          [destCoords[0], destCoords[1]],
        ];

  const [compassHeading, setCompassHeading] = useState(0);
  const [isCompassActive, setIsCompassActive] = useState(false);
  const [currentPos, setCurrentPos] = useState<[number, number]>([locDetails.latitude, locDetails.longitude]);

  const rotateCompass = () => {
    setIsCompassActive(true);
    setCompassHeading((prev) => (prev + 45) % 360);
  };

  const handleRecenterMap = () => {
    setCurrentPos([locDetails.latitude, locDetails.longitude]);
    setCompassHeading(0);
    setIsCompassActive(false);
  };

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col relative w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20 overflow-hidden">
      {/* Header matching Stitch Nav Active screen */}
      <Header
        title="Nav Active"
        subtitle="CLIMATESHIELD CITIZEN"
        hasBack={true}
        onBack={() => navigate('/citizen/routes')}
      />

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-4 bg-surface">
        <div className="flex flex-col w-full relative h-[calc(100vh-8rem)] min-h-[620px]">
          
          {/* Top Corridor Status & Elevation Pill + Navigation HUD Controls */}
          <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs shadow border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>LOW RISK CORRIDOR</span>
              <span className="text-slate-500 font-normal">Safe MSL +18.2m</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Compass Rotation Rose */}
              <button
                onClick={rotateCompass}
                style={{ transform: `rotate(${compassHeading}deg)` }}
                className={`w-9 h-9 rounded-xl shadow border transition-transform flex items-center justify-center ${
                  isCompassActive ? 'bg-blue-600 text-white border-blue-400' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
                title="Rotate Compass North Heading"
              >
                <span className="material-symbols-outlined text-[18px]">explore</span>
              </button>

              {/* Recenter Camera */}
              <button
                onClick={handleRecenterMap}
                className="w-9 h-9 rounded-xl bg-white text-slate-800 shadow border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
                title="Recenter Camera to My GPS"
              >
                <span className="material-symbols-outlined text-[18px]">my_location</span>
              </button>
            </div>
          </div>

          {/* Primary Next Maneuver HUD Stack matching Stitch */}
          <div className="absolute top-14 left-3 right-3 z-30 flex flex-col gap-2 pointer-events-auto">
            {/* Maneuver Panel */}
            <div className="w-full bg-[#0B1527] text-white rounded-2xl p-4 shadow-xl flex items-start justify-between border border-slate-800">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 text-white shadow">
                  <span className="material-symbols-outlined text-[26px]">turn_right</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 text-blue-400 text-[11px] font-bold uppercase tracking-wider">
                    <span>IN 450 METERS</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300 font-normal">Lane 2 or 3</span>
                  </div>
                  <h2 className="font-bold text-base text-white truncate leading-snug mt-0.5">
                    Turn right on Highline Ridge Rd
                  </h2>
                </div>
              </div>
              <div className="shrink-0 text-right pl-2">
                <div className="text-xl font-bold text-emerald-400">450m</div>
                <div className="text-[10px] text-slate-400">Next 1.2km</div>
              </div>
            </div>

            {/* Dynamic Re-Route Toast Notification matching Stitch */}
            {isRerouteVisible && (
              <div className="w-full bg-red-50 text-red-950 rounded-2xl p-3 shadow-lg border border-red-200 flex items-start gap-2.5 transition-all">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
                      DYNAMIC RE-ROUTE
                    </span>
                    <span className="text-[11px] font-bold text-red-600">+2 min delta</span>
                  </div>
                  <p className="text-xs text-slate-800 mt-0.5 leading-snug font-medium">
                    Flood risk detected 800m ahead on original path. Auto-adjusted via Highline Ridge.
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs font-bold">
                    <button
                      onClick={() => setIsRerouteVisible(false)}
                      className="text-blue-600 hover:underline"
                    >
                      Accept Optimal
                    </button>
                    <button
                      onClick={() => setIsRerouteVisible(false)}
                      className="text-slate-500 hover:underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setIsRerouteVisible(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Interactive Leaflet Navigation Canvas */}
          <div className="relative flex-1 w-full overflow-hidden bg-slate-900">
            <RealLeafletMap
              center={mapCenter}
              zoom={14}
              tileTheme="osm"
              showUserLocation={true}
              hideStyleSwitcher={true}
              zones={[
                {
                  id: 'hazard_zone_active',
                  name: 'Waterlogging Flood Inundation Zone',
                  lat: hazardCoords[0],
                  lng: hazardCoords[1],
                  riskLevel: 'CRITICAL',
                  radiusMeters: 1400,
                },
              ]}
              markers={[
                {
                  id: 'user_active',
                  lat: mapCenter[0],
                  lng: mapCenter[1],
                  title: `Your Location: ${originName}`,
                  type: 'user',
                },
                {
                  id: 'dest_active',
                  lat: destCoords[0],
                  lng: destCoords[1],
                  title: `Destination: ${destName}`,
                  type: 'unit',
                },
                {
                  id: 'hazard_pin',
                  lat: hazardCoords[0],
                  lng: hazardCoords[1],
                  title: 'Blocked Flood Hazard Path (+45cm Waterlogging)',
                  description: 'Avoided via Highline Ridge safe corridor',
                  severity: 'CRITICAL',
                  type: 'hazard',
                },
              ]}
              routeSegments={[
                {
                  points: safeRoutePolyline,
                  color: 'GREEN',
                  status: 'CLEAR',
                  label: '🟢 Safe Resilient Route (Highline Ridge Detour)',
                },
                {
                  points: hazardRoutePolyline,
                  color: 'RED',
                  status: 'WATER_LOGGING',
                  label: '🔴 Impassable Flood Waterlogging Zone (+45cm Depth)',
                  dashArray: '8,6',
                },
              ]}
              routes={[safeRoutePolyline, hazardRoutePolyline]}
            />
          </div>

          {/* Bottom Telemetry Deck matching Stitch mockup */}
          <div className="w-full bg-white border-t border-slate-200 p-4 flex flex-col gap-3">
            
            {/* 3-Column Stats Deck */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  REMAINING
                </span>
                <span className="text-xl font-black text-slate-900">18</span>
                <span className="text-xs text-slate-500 font-bold ml-1">MINUTES</span>
              </div>
              <div className="border-x border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  DISTANCE
                </span>
                <span className="text-xl font-black text-slate-900">6.2</span>
                <span className="text-xs text-slate-500 font-bold ml-1">KM</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  ETA
                </span>
                <span className="text-xl font-black text-slate-900">14:42</span>
                <span className="text-[10px] text-emerald-600 font-bold block">ON TIME</span>
              </div>
            </div>

            {/* Destination Sub-line */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-slate-600 font-bold truncate">
                To: <span className="text-slate-900">{destName}</span>
              </span>
              <button
                onClick={() => navigate('/citizen/routes')}
                className="text-blue-600 font-bold uppercase tracking-wider hover:underline shrink-0 text-[11px]"
              >
                VIEW ALTERNATIVES
              </button>
            </div>

            {/* Bottom Actions Tray matching Stitch */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => navigate('/citizen/report')}
                className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 border border-slate-200"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>Report Hazard</span>
              </button>

              <button
                onClick={() => navigate('/citizen/map')}
                className="h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                <span>End Route</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
