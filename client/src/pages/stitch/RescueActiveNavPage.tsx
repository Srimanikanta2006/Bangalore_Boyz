import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { Mock } from '../../components/stitch/Mock';
import { RealLeafletMap } from '../../components/stitch/RealLeafletMap';
import { getActiveRegion, type RegionKey } from '../../citizen/geo';

export const RescueActiveNavPage: React.FC = () => {
  const navigate = useNavigate();
  const { routeId } = useParams<{ routeId: string }>();

  const [activeRegion, setActiveRegionState] = useState<RegionKey>(getActiveRegion());
  const isNepal = activeRegion === 'NEPAL';

  const [rerouteVisible, setRerouteVisible] = useState(true);
  const [missionStage, setMissionStage] = useState<'en_route' | 'on_scene' | 'triage' | 'cleared'>('en_route');
  const [isFabPulsing, setIsFabPulsing] = useState(false);

  useEffect(() => {
    const handleRegionEvent = () => setActiveRegionState(getActiveRegion());
    window.addEventListener('climateshield_region_changed', handleRegionEvent);
    return () => window.removeEventListener('climateshield_region_changed', handleRegionEvent);
  }, []);

  const handleArrival = () => {
    const confirmArrival = window.confirm(
      isNepal
        ? 'Confirm tactical rig arrival at Bagmati River Bank Flood Zone, Kathmandu?'
        : 'Confirm tactical rig arrival at 412 Bayshore Blvd?'
    );
    if (confirmArrival) {
      setMissionStage('on_scene');
      alert('Alpha-02 Rig marked ON SCENE. Tactical Command notified. Unlocking Triage checklist.');
    }
  };

  const handleReportHazard = () => {
    navigate('/rescue/report/MIS-104');
  };

  const handleRecenter = () => {
    setIsFabPulsing(true);
    setTimeout(() => setIsFabPulsing(false), 300);
  };

  // Region-Aware Coordinates & Road Directions
  const vehicleCoords: [number, number] = isNepal ? [27.6830, 85.3080] : [13.0650, 80.2700];
  const targetCoords: [number, number] = isNepal ? [27.6950, 85.3150] : [13.0640, 80.2760];

  const mapCenter: [number, number] = isNepal ? [27.6890, 85.3115] : [13.0645, 80.2730];

  // Curved road coordinates following streets
  const roadDirections: [number, number][][] = isNepal
    ? [[[27.6830, 85.3080], [27.6860, 85.3100], [27.6890, 85.3140], [27.6920, 85.3150], [27.6950, 85.3150]]]
    : [[[13.0650, 80.2700], [13.0635, 80.2720], [13.0620, 80.2740], [13.0640, 80.2760]]];

  const mapMarkers = [
    {
      id: 'active_vehicle',
      lat: vehicleCoords[0],
      lng: vehicleCoords[1],
      title: isNepal ? 'KTM RIG-04 (Fire & Water Rescue)' : 'ALPHA-02 RIG (Fire & Water Rescue)',
      description: 'Vehicle GPS Active | En Route to Rescue Scene',
      type: 'unit' as const,
    },
    {
      id: 'target_destination',
      lat: targetCoords[0],
      lng: targetCoords[1],
      title: isNepal ? 'Bagmati River Bank Flood Zone' : '412 Bayshore Blvd (Target)',
      description: 'Threat: Water Inundation | 4 Victims Trapped',
      severity: 'CRITICAL' as const,
      type: 'incident' as const,
    },
  ];

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20 select-none">
      {/* Header with Back Button and Rig Callout */}
      <Header
        title="Active Navigation"
        subtitle="ClimateShield Rescue"
        hasBack={true}
        onBack={() => navigate(-1)}
        rightElement={
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold">
              <Mock label="Unit Callout">{isNepal ? 'KTM Rig-04' : 'Alpha-02'}</Mock>
            </span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">fire_truck</span>
            </div>
          </div>
        }
      />

      {/* Main Viewport */}
      <main className="flex flex-col relative w-full pt-16 bg-surface flex-grow pb-24">
        <div className="flex flex-col w-full relative select-none">
          {/* Pinned Operational Progress Stepper */}
          <div className="sticky top-0 z-30 w-full bg-surface-container-lowest/95 backdrop-blur-md shadow-sm px-edge-margin-mobile py-2.5 border-b border-slate-200">
            <div className="flex items-center justify-between relative max-w-md mx-auto">
              <div className="absolute left-4 right-4 top-3.5 h-[2px] bg-surface-container-highest -z-0"></div>
              <div
                className="absolute left-4 top-3.5 h-[2px] bg-secondary -z-0 transition-all duration-300"
                style={{
                  width:
                    missionStage === 'en_route'
                      ? '16%'
                      : missionStage === 'on_scene'
                      ? '50%'
                      : missionStage === 'triage'
                      ? '80%'
                      : '100%',
                }}
              ></div>

              {/* Stage 1: En Route */}
              <div
                className={`flex flex-col items-center gap-1 z-10 cursor-pointer ${
                  missionStage === 'en_route' ? '' : 'opacity-70'
                }`}
                onClick={() => setMissionStage('en_route')}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center relative ${
                    missionStage === 'en_route'
                      ? 'bg-secondary text-on-secondary shadow-md ring-4 ring-secondary/20'
                      : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">near_me</span>
                </div>
                <span
                  className={`font-label-sm text-label-sm tracking-tight ${
                    missionStage === 'en_route' ? 'text-secondary font-bold' : 'text-on-surface-variant font-medium'
                  }`}
                >
                  En Route
                </span>
              </div>

              {/* Stage 2: On Scene */}
              <div
                className={`flex flex-col items-center gap-1 z-10 cursor-pointer ${
                  missionStage === 'on_scene' ? '' : 'opacity-70'
                }`}
                onClick={() => setMissionStage('on_scene')}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    missionStage === 'on_scene'
                      ? 'bg-secondary text-on-secondary shadow-md ring-4 ring-secondary/20'
                      : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">pin_drop</span>
                </div>
                <span
                  className={`font-label-sm text-label-sm ${
                    missionStage === 'on_scene' ? 'text-secondary font-bold' : 'text-on-surface-variant font-medium'
                  }`}
                >
                  On Scene
                </span>
              </div>

              {/* Stage 3: Triage */}
              <div
                className={`flex flex-col items-center gap-1 z-10 cursor-pointer ${
                  missionStage === 'triage' ? '' : 'opacity-70'
                }`}
                onClick={() => setMissionStage('triage')}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    missionStage === 'triage'
                      ? 'bg-secondary text-on-secondary shadow-md ring-4 ring-secondary/20'
                      : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">medical_services</span>
                </div>
                <span
                  className={`font-label-sm text-label-sm ${
                    missionStage === 'triage' ? 'text-secondary font-bold' : 'text-on-surface-variant font-medium'
                  }`}
                >
                  Triage
                </span>
              </div>

              {/* Stage 4: Cleared */}
              <div
                className={`flex flex-col items-center gap-1 z-10 cursor-pointer ${
                  missionStage === 'cleared' ? '' : 'opacity-70'
                }`}
                onClick={() => setMissionStage('cleared')}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    missionStage === 'cleared'
                      ? 'bg-secondary text-on-secondary shadow-md ring-4 ring-secondary/20'
                      : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">task_alt</span>
                </div>
                <span
                  className={`font-label-sm text-label-sm ${
                    missionStage === 'cleared' ? 'text-secondary font-bold' : 'text-on-surface-variant font-medium'
                  }`}
                >
                  Cleared
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Leaflet Navigation Map Canvas (Street Mode Default + Road Directions) */}
          <div className="relative w-full h-[400px] overflow-hidden bg-surface-dim shadow-inner">
            <RealLeafletMap
              center={mapCenter}
              zoom={15}
              tileTheme="osm" // Default Street Mode as requested
              styleSwitcherPosition="top-right"
              showUserLocation={true}
              markers={mapMarkers}
              routes={roadDirections}
              className="h-full w-full"
            />

            {/* Top Floating Tactical Map Status Ribbon */}
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-20 pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="font-label-sm text-label-sm font-bold text-slate-800 tracking-tight">
                  {isNepal ? 'KATMANDU CORRIDOR SAFE · MSL +16m' : 'CORRIDOR SAFE · MSL +16m'}
                </span>
              </div>
            </div>

            {/* Tactical Obstacle Toast Banner (Floating over Map) */}
            {rerouteVisible && (
              <div className="absolute top-14 inset-x-3 z-30 transition-all duration-300 transform translate-y-0" id="rerouteToast">
                <div className="p-3.5 rounded-xl bg-slate-900 text-white shadow-2xl border border-slate-700">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">warning</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-label-sm text-label-sm font-bold text-rose-300 tracking-wider uppercase">
                          Road Hazard Detected
                        </span>
                        <span className="font-code-sm text-code-sm text-slate-400">320m ahead</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-slate-300 leading-snug">
                        {isNepal
                          ? 'Bagmati river overflow (+2.1m surge). Auto-rerouted via Kantipath Elevation Ramp (+1.4 min safe MSL).'
                          : 'Culvert 4 breached (+1.2m surge). Auto-rerouted via Ridgeview Bypass (+1.4 min safe MSL).'}
                      </p>
                      <div className="mt-2.5 flex items-center justify-end gap-2">
                        <button
                          className="px-3 py-1 rounded-full text-slate-300 hover:text-white font-label-sm text-label-sm transition-colors"
                          type="button"
                          onClick={() => setRerouteVisible(false)}
                        >
                          Dismiss
                        </button>
                        <button
                          className="px-3.5 py-1 rounded-full bg-sky-500 text-white font-label-sm text-label-sm font-bold shadow-sm active:scale-95 transition-transform flex items-center gap-1"
                          type="button"
                          onClick={() => setRerouteVisible(false)}
                        >
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          Accept Safe Route
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Metrics Docked Sheet */}
          <div className="relative w-full -mt-4 bg-surface-container-lowest rounded-t-2xl shadow-xl px-edge-margin-mobile pt-3 pb-8 z-20">
            <div className="w-10 h-1 rounded-full bg-surface-variant mx-auto mb-3"></div>

            {/* Primary Turn Directive Card */}
            <div className="p-3.5 rounded-xl bg-surface-container-low mb-3 flex items-center gap-3 border border-slate-200">
              <div className="w-11 h-11 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shrink-0 shadow-md">
                <span className="material-symbols-outlined text-[28px]">turn_left</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-data-metric-md text-data-metric-md text-secondary font-bold">
                    <Mock label="Next Distance">In 320m</Mock>
                  </span>
                  <span className="font-label-sm text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                    SAFE ELEVATION
                  </span>
                </div>
                <p className="font-title-lg text-title-lg text-on-surface truncate font-bold">
                  <Mock label="Next Instruction">
                    {isNepal ? 'Turn Left onto Kantipath Elevation Ramp' : 'Turn Left onto Highline Elevation Ramp'}
                  </Mock>
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Elevation: <span className="text-emerald-700 font-bold">+16m MSL</span> (Dry street corridor)
                </p>
              </div>
            </div>

            {/* Core Telemetry Triad (ETA | Remaining | Target) */}
            <div className="grid grid-cols-3 gap-2 py-2 mb-3">
              <div className="flex flex-col p-2.5 rounded-lg bg-surface border border-slate-200">
                <span className="font-label-sm text-[10px] text-on-surface-variant font-medium">ETA</span>
                <span className="font-data-metric-lg text-data-metric-lg text-on-surface font-bold tracking-tight mt-0.5">
                  <Mock label="ETA Time">04:18</Mock>
                </span>
                <span className="font-label-sm text-[10px] text-emerald-700 font-bold">On Schedule</span>
              </div>
              <div className="flex flex-col p-2.5 rounded-lg bg-surface border border-slate-200">
                <span className="font-label-sm text-[10px] text-on-surface-variant font-medium">Remaining</span>
                <span className="font-data-metric-lg text-data-metric-lg text-on-surface font-bold tracking-tight mt-0.5">
                  <Mock label="Distance Left">1.1</Mock>{' '}
                  <span className="font-title-lg text-title-lg text-on-surface-variant font-normal">km</span>
                </span>
                <span className="font-label-sm text-[10px] text-secondary font-bold">Bypass Clear</span>
              </div>
              <div className="flex flex-col p-2.5 rounded-lg bg-surface border border-slate-200">
                <span className="font-label-sm text-[10px] text-on-surface-variant font-medium">Target Zone</span>
                <span className="font-body-md text-[11px] font-bold text-on-surface truncate mt-1">
                  {isNepal ? 'Bagmati River' : '412 Bayshore'}
                </span>
                <span className="font-label-sm text-[10px] text-error font-bold flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-error"></span>{' '}
                  <Mock label="Victim Count">4 Trapped</Mock>
                </span>
              </div>
            </div>

            {/* Secondary Hazard Telemetry Card */}
            <div className="p-3 rounded-lg bg-surface-container mb-4 flex items-center justify-between border border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface shadow-sm">
                  <span className="material-symbols-outlined text-[18px] text-sky-600">water</span>
                </div>
                <div>
                  <div className="font-body-sm text-body-sm font-bold text-on-surface">
                    <Mock label="Telemetry Sensor">
                      {isNepal ? 'Bagmati Basin Sensor #KTM-09' : 'Telemetry Sensor S-08'}
                    </Mock>
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                    Flow rate: 3.4 m/s · Sump level: Stable
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-lowest text-on-surface font-code-sm text-code-sm font-bold shadow-sm">
                <Mock label="Water Level">{isNepal ? '2.1m Dep.' : '0.8m Dep.'}</Mock>
              </span>
            </div>

            {/* Operational Action Buttons (Zero Overlap with floating NAV button) */}
            <div className="flex flex-col gap-2.5 pr-14">
              {/* Primary Operational Button */}
              <button
                className="w-full h-11 rounded-lg bg-primary text-on-primary font-title-lg text-title-lg font-bold shadow-md active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
                type="button"
                onClick={handleArrival}
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Mark Arrived On Scene</span>
              </button>

              {/* Secondary Field Hazard Log */}
              <button
                className="w-full h-10 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md font-bold shadow-sm active:bg-surface-container-low transition-colors flex items-center justify-center gap-2 border border-slate-300"
                type="button"
                onClick={handleReportHazard}
              >
                <span className="material-symbols-outlined text-[18px] text-error">report_problem</span>
                <span>Report Road Hazard / Sump</span>
              </button>
            </div>
          </div>

          {/* Pinned Circular 'Navigate' FAB (Positioned cleanly on the right with zero overlap) */}
          <div className="fixed bottom-24 right-3 z-40">
            <button
              aria-label="Center live navigation corridor"
              className={`w-12 h-12 rounded-full bg-secondary text-on-secondary shadow-2xl flex flex-col items-center justify-center transition-transform ring-4 ring-secondary/30 ${
                isFabPulsing ? 'scale-95' : 'active:scale-90'
              }`}
              type="button"
              onClick={handleRecenter}
              title="Recenter Navigation"
            >
              <span className="material-symbols-outlined text-[22px]">navigation</span>
              <span className="font-label-sm tracking-tighter uppercase font-bold text-[9px] leading-none">
                NAV
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RescueActiveNavPage;
