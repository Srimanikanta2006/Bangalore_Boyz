import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { Mock } from '../../components/stitch/Mock';
import { RealLeafletMap } from '../../components/stitch/RealLeafletMap';
import { getActiveRegion, setActiveRegion, type RegionKey } from '../../citizen/geo';

export const RescueTacticalMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeRegion, setActiveRegionState] = useState<RegionKey>(getActiveRegion());
  const isNepal = activeRegion === 'NEPAL';

  const [activeFilter, setActiveFilter] = useState<'all' | 'high_water' | 'medical' | 'police'>('all');
  const [activeLayer, setActiveLayer] = useState<'hazards' | 'blocked' | 'corridors' | 'units'>('hazards');
  const [secondsRemaining, setSecondsRemaining] = useState(400); // 06:40 SLA countdown

  useEffect(() => {
    const handleRegionEvent = () => setActiveRegionState(getActiveRegion());
    window.addEventListener('climateshield_region_changed', handleRegionEvent);
    return () => window.removeEventListener('climateshield_region_changed', handleRegionEvent);
  }, []);

  const handleRegionSwitch = (region: RegionKey) => {
    setActiveRegion(region);
    setActiveRegionState(region);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSla = (seconds: number) => {
    if (seconds <= 0) return 'CRITICAL OVERDUE';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s} remaining`;
  };

  const handleOpenDossier = (missionId: string) => {
    navigate(`/rescue/mission/${missionId}`);
  };

  const handleStartMission = (missionId: string) => {
    navigate(`/rescue/navigate/${missionId}`);
  };

  // Region-Specific Coordinates & Data
  const mapCenter: [number, number] = isNepal ? [27.6950, 85.3150] : [13.0620, 80.2750];

  const mapZones = isNepal
    ? [
        {
          id: 'tactical_sector_ktm',
          name: 'Kathmandu Bagmati Inundation Basin Zone',
          lat: 27.6950,
          lng: 85.3150,
          riskLevel: 'CRITICAL' as const,
          radiusMeters: 1400,
        }
      ]
    : [
        {
          id: 'tactical_sector_eb',
          name: 'East Basin Water Resurgence Zone',
          lat: 13.0620,
          lng: 80.2750,
          riskLevel: 'CRITICAL' as const,
          radiusMeters: 1200,
        }
      ];

  const mapMarkers = isNepal
    ? [
        {
          id: 'unit_rig_ktm',
          lat: 27.6890,
          lng: 85.3190,
          title: 'Heavy Flood Rig-04 (Fire & Water Rescue)',
          description: 'High-pumping unit | Status: ON_SCENE',
          type: 'unit' as const,
        },
        {
          id: 'unit_boat_ktm',
          lat: 27.6830,
          lng: 85.3080,
          title: 'Bagmati Rescue Boat-02 (Water Rescue)',
          description: 'Inflatable raft squad | Status: EN_ROUTE',
          type: 'unit' as const,
        },
        {
          id: 'unit_medic_ktm',
          lat: 27.6966,
          lng: 85.3591,
          title: 'Trauma Medic-09 (Hospital & EMS Dept)',
          description: 'ALS Unit | Status: AVAILABLE',
          type: 'unit' as const,
        },
        {
          id: 'unit_police_ktm',
          lat: 27.6920,
          lng: 85.3250,
          title: 'Tactical Police Cruiser-01 (Police & Patrol)',
          description: 'Corridor Security Unit | Status: PATROLLING',
          type: 'unit' as const,
        },
        {
          id: 'incident_ktm_bayshore',
          lat: 27.6950,
          lng: 85.3150,
          title: '#MIS-KTM-104 Bagmati River Breach',
          description: 'Threat: Water depth 2.1m | SLA Countdown: 06:40',
          severity: 'CRITICAL' as const,
          type: 'incident' as const,
        },
        {
          id: 'hospital_tribhuvan',
          lat: 27.6966,
          lng: 85.3591,
          title: 'Tribhuvan Regional Emergency Hub',
          description: 'Level-1 Emergency Center | Capacity 92%',
          type: 'asset' as const,
        }
      ]
    : [
        {
          id: 'unit_rig_04',
          lat: 13.065,
          lng: 80.270,
          title: 'Heavy Pump Rig-04 (Fire & Water Rescue)',
          description: 'Capacity: 1200 L/min | Status: ON_SCENE',
          type: 'unit' as const,
        },
        {
          id: 'unit_boat_02',
          lat: 13.061,
          lng: 80.278,
          title: 'Aquatic Rescue Boat-02',
          description: '4-person inflatable craft | Status: EN_ROUTE',
          type: 'unit' as const,
        },
        {
          id: 'unit_medic_09',
          lat: 13.070,
          lng: 80.265,
          title: 'Trauma Medic-09 (Hospital & EMS Dept)',
          description: 'ALS Unit | Status: AVAILABLE',
          type: 'unit' as const,
        },
        {
          id: 'incident_bayshore',
          lat: 13.064,
          lng: 80.276,
          title: '#INC-204 Bayshore Culvert Inundation',
          description: 'Threat: Water depth 1.4m | SLA Countdown: 06:40',
          severity: 'CRITICAL' as const,
          type: 'incident' as const,
        },
        {
          id: 'hospital_st_jude',
          lat: 13.080,
          lng: 80.285,
          title: 'St. Jude Trauma Hub',
          description: 'Level-1 Emergency Center | Capacity 84%',
          type: 'asset' as const,
        }
      ];

  const mapRoutes: [number, number][][] = isNepal
    ? [[[27.6830, 85.3080], [27.6890, 85.3190], [27.6950, 85.3150], [27.6966, 85.3591]]]
    : [[[13.065, 80.270], [13.064, 80.276], [13.080, 80.285]]];

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20 select-none">
      {/* Tactical Header */}
      <Header
        title="Tactical Map"
        subtitle="ClimateShield Rescue"
        rightElement={
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              <Mock label="Unit Callout">Taskforce Alpha-02</Mock>
            </span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">shield_person</span>
            </div>
          </div>
        }
      />

      {/* Main Tactical Canvas */}
      <main className="flex flex-col relative w-full pt-16 pb-24 bg-surface flex-grow">
        {/* Department Credential & Region Selector Ribbon */}
        <div className="flex flex-col px-edge-margin-mobile py-2 bg-slate-900 text-white gap-2 border-b border-slate-800">
          {/* Quick Region Selector Pills */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-sky-400">travel_explore</span>
              Tactical Region:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleRegionSwitch('NEPAL')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  isNepal ? 'bg-sky-500 text-white shadow' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                🇳🇵 Nepal (Kathmandu)
              </button>
              <button
                type="button"
                onClick={() => handleRegionSwitch('CHENNAI')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  !isNepal ? 'bg-sky-500 text-white shadow' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                🇮🇳 Chennai
              </button>
            </div>
          </div>

          {/* Department Authorization Seal */}
          <div className="flex items-center justify-between bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-[10px]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="material-symbols-outlined text-[13px]">verified_user</span>
              <span>Dept Verified: Fire & Emergency #FR-8821</span>
            </div>
            <span className="text-slate-400 font-mono">GOVT AUTHORIZED</span>
          </div>
        </div>

        {/* Dynamic Map Viewport Area (STREET MODE DEFAULT) */}
        <div className="relative w-full h-[380px] overflow-hidden bg-surface-container-low shadow-sm">
          <RealLeafletMap
            center={mapCenter}
            zoom={14}
            tileTheme="osm" // Default Street Mode as requested
            styleSwitcherPosition="bottom-right"
            showUserLocation={true}
            zones={mapZones}
            markers={mapMarkers}
            routes={mapRoutes}
            onMarkerClick={(m) => {
              if (m.id.includes('204') || m.id.includes('ktm') || m.id.includes('bayshore')) {
                navigate('/rescue/mission/MIS-104');
              }
            }}
          />

          {/* Top Floating Sector Badge */}
          <div className="absolute top-2.5 inset-x-edge-margin-mobile z-20 flex items-center justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-md">
              <span className="material-symbols-outlined text-secondary text-[16px]">pin_drop</span>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface leading-none font-bold">
                  {isNepal ? 'Sector KTM-01 (Bagmati)' : 'Sector 04-B'}
                </span>
                <span className="font-code-sm text-[10px] text-on-surface-variant leading-none pt-0.5">
                  {isNepal ? 'Kathmandu Valley Basin' : 'RTK ±0.2m • Basin'}
                </span>
              </div>
            </div>
            <div className="pointer-events-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-md text-on-surface">
              <span className="material-symbols-outlined text-[16px] text-secondary">wifi_tethering</span>
              <span className="font-label-sm text-label-sm font-semibold">8 Units Active</span>
            </div>
          </div>

          {/* Department Vehicle Indicators Banner (Fire / Police / Medical) */}
          <div className="absolute top-12 left-2.5 z-20 flex flex-col gap-1 pointer-events-auto max-w-[220px]">
            <div className="bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-slate-200 flex items-center gap-1.5 text-[10px]">
              <span className="material-symbols-outlined text-amber-600 text-[14px]">fire_truck</span>
              <span className="font-bold text-slate-800">Fire Rig-04:</span>
              <span className="text-slate-600">On Scene</span>
            </div>
            <div className="bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-slate-200 flex items-center gap-1.5 text-[10px]">
              <span className="material-symbols-outlined text-blue-600 text-[14px]">local_police</span>
              <span className="font-bold text-slate-800">Police Patrol-01:</span>
              <span className="text-slate-600">Route Secure</span>
            </div>
            <div className="bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-slate-200 flex items-center gap-1.5 text-[10px]">
              <span className="material-symbols-outlined text-rose-600 text-[14px]">medical_services</span>
              <span className="font-bold text-slate-800">Medic Ambulance-09:</span>
              <span className="text-slate-600">Standby</span>
            </div>
          </div>

          {/* Quick Layers Ribbon (Clean Position without overlapping Tile Switcher) */}
          <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-[240px]">
            <button
              onClick={() => setActiveLayer('hazards')}
              className={`flex items-center gap-1 px-2 py-1 rounded-full font-label-sm text-[10px] shadow-sm whitespace-nowrap active:scale-95 transition-all ${
                activeLayer === 'hazards' ? 'bg-primary text-on-primary font-bold' : 'bg-white text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">crisis_alert</span>
              <span>Hazards</span>
            </button>
            <button
              onClick={() => setActiveLayer('corridors')}
              className={`flex items-center gap-1 px-2 py-1 rounded-full font-label-sm text-[10px] shadow-sm whitespace-nowrap active:scale-95 transition-all ${
                activeLayer === 'corridors' ? 'bg-primary text-on-primary font-bold' : 'bg-white text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[13px] text-emerald-600">alt_route</span>
              <span>Safe Routes</span>
            </button>
          </div>
        </div>

        {/* Assigned Missions Carousel */}
        <div className="flex flex-col w-full px-edge-margin-mobile pt-space-md gap-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-headline-md text-headline-md text-on-surface font-bold">Assigned Missions</span>
              <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-code-sm text-code-sm font-bold">
                3
              </span>
            </div>
            <span className="font-code-sm text-code-sm text-on-surface-variant flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Live Sync
            </span>
          </div>

          {/* Filter Category Tabs */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold shadow-sm transition-colors ${
                activeFilter === 'all'
                  ? 'bg-secondary-container text-on-secondary-container font-bold'
                  : 'bg-surface-container-high text-on-surface'
              }`}
            >
              All (3)
            </button>
            <button
              onClick={() => setActiveFilter('high_water')}
              className={`px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold transition-colors ${
                activeFilter === 'high_water'
                  ? 'bg-secondary-container text-on-secondary-container font-bold'
                  : 'bg-surface-container-high text-on-surface'
              }`}
            >
              Fire & Water (2)
            </button>
            <button
              onClick={() => setActiveFilter('medical')}
              className={`px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold transition-colors ${
                activeFilter === 'medical'
                  ? 'bg-secondary-container text-on-secondary-container font-bold'
                  : 'bg-surface-container-high text-on-surface'
              }`}
            >
              Medical & EMS (1)
            </button>
          </div>

          {/* Swipeable Mission Carousel Cards */}
          <div className="w-full flex gap-space-sm overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar pt-1">
            {/* Mission Card 1: #MIS-104 (CRITICAL - Fire & Water Dept) */}
            <div className="snap-center shrink-0 w-[88vw] max-w-[340px] bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col relative border-l-4 border-error">
              <div className="p-space-md flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-code-sm text-code-sm font-bold text-on-surface tracking-wider">
                      {isNepal ? '#MIS-KTM-104' : '#MIS-104'}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">• Fire & Water Rescue</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">
                    <span className="material-symbols-outlined text-[13px]">timer</span>
                    <span>{formatSla(secondsRemaining)}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <h3 className="font-title-lg text-title-lg text-on-surface leading-snug font-bold">
                    {isNepal ? 'Stranded Family on Roof — Bagmati River Bank' : 'Stranded Family on Roof — 412 Bayshore Blvd'}
                  </h3>
                  <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 pt-0.5">
                    <span className="material-symbols-outlined text-[14px] text-secondary">explore</span>
                    <span>{isNepal ? '27.6950° N, 85.3150° E' : '27.9102° N, -82.4931° W'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 bg-surface-container-low p-2 rounded-lg text-on-surface">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Water Depth</span>
                    <span className="font-data-metric-md text-[14px] leading-tight text-error font-bold flex items-center gap-0.5">
                      {isNepal ? '2.1m' : '1.4m'} <span className="material-symbols-outlined text-[12px]">trending_up</span>
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Vehicle Dept</span>
                    <span className="font-data-metric-md text-[13px] leading-tight font-bold text-amber-700">Water Rig 🚛</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Distance</span>
                    <span className="font-data-metric-md text-[14px] leading-tight font-bold text-secondary">1.2 km</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-surface-container p-2 rounded-lg text-on-surface">
                  <span className="material-symbols-outlined text-on-tertiary-container text-[18px] shrink-0">info</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
                    Submerged access road. Deploy zodiac inflatable or high-clearance Fire Rig from Alpha depot.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleOpenDossier('MIS-104')}
                    className="flex-1 h-10 px-3 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md font-bold flex items-center justify-center gap-1 hover:bg-surface-container-highest transition-colors active:scale-95"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">folder_open</span>
                    <span>Dossier</span>
                  </button>
                  <button
                    onClick={() => handleStartMission('MIS-104')}
                    className="flex-[2] h-10 px-4 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 shadow-md hover:bg-primary-container transition-all active:scale-95"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">near_me</span>
                    <span>Accept & Start Navigation</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mission Card 2: #MIS-102 (Medical Dept) */}
            <div className="snap-center shrink-0 w-[88vw] max-w-[340px] bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col relative border-l-4 border-[#EA580C]">
              <div className="p-space-md flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-code-sm text-code-sm font-bold text-on-surface tracking-wider">
                      {isNepal ? '#MIS-KTM-102' : '#MIS-102'}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">• Hospital & EMS</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFEDD5] text-[#C2410C] font-label-sm text-label-sm font-bold">
                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                    <span>18:15 remaining</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <h3 className="font-title-lg text-title-lg text-on-surface leading-snug font-bold">
                    {isNepal ? 'Tribhuvan Trauma Hub Gate B Flooding' : 'Elderly Care Facility Power Cut — Sector 4C'}
                  </h3>
                  <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 pt-0.5">
                    <span className="material-symbols-outlined text-[14px] text-secondary">pin_drop</span>
                    <span>{isNepal ? 'Kantipath Medical Access Ramp' : 'Harborview Manor • Generator Offline'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-2 rounded-lg text-on-surface">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Assigned Unit</span>
                    <span className="font-data-metric-md text-[13px] leading-tight text-rose-700 font-bold">ALS Ambulance 🚑</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Distance / ETA</span>
                    <span className="font-data-metric-md text-[14px] leading-tight font-bold">2.1 km (6 min)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleOpenDossier('MIS-102')}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md font-bold flex items-center justify-center gap-1 hover:bg-surface-container-highest transition-colors active:scale-95"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span>Review Details & Assign</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Tactical Navigation Trigger Button (No Overlaps - Positioned Cleanly) */}
      <aside className="fixed right-edge-margin-mobile bottom-20 z-40 pointer-events-auto">
        <button
          onClick={() => navigate('/rescue/navigate/MIS-104')}
          aria-label="Navigate Mission"
          className="w-14 h-14 rounded-full bg-primary text-on-primary shadow-xl flex items-center justify-center hover:bg-surface-tint active:scale-95 transition-all ring-4 ring-primary/30"
          title="Start Live Safe Route Navigation"
        >
          <span className="material-symbols-outlined text-[26px]">navigation</span>
        </button>
      </aside>

      {/* Persistent Tactical Bottom Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-4 items-center h-16 px-space-xs max-w-[440px] mx-auto">
          <button
            onClick={() => navigate('/rescue/tactical')}
            className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-secondary font-bold"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">map</span>
            <span className="font-label-sm text-label-sm">Map</span>
          </button>
          <button
            onClick={() => navigate('/rescue/mission/MIS-104')}
            className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">assignment</span>
            <span className="font-label-sm text-label-sm">Missions</span>
          </button>
          <button
            onClick={() => navigate('/rescue/console')}
            className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">hub</span>
            <span className="font-label-sm text-label-sm">Console</span>
          </button>
          <button
            onClick={() => navigate('/rescue/report/MIS-104')}
            className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">description</span>
            <span className="font-label-sm text-label-sm">Sitrep</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default RescueTacticalMapPage;
