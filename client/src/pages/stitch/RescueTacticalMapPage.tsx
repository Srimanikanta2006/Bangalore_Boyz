import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { Mock } from '../../components/stitch/Mock';

export const RescueTacticalMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'high_water' | 'medical'>('all');
  const [activeLayer, setActiveLayer] = useState<'hazards' | 'blocked' | 'corridors' | 'units'>('hazards');
  const [secondsRemaining, setSecondsRemaining] = useState(400); // 06:40 SLA countdown

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
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        }
      />

      {/* Main Tactical Canvas */}
      <main className="flex flex-col relative w-full pt-16 pb-24 bg-surface flex-grow">
        {/* Telemetry Status Ribbon */}
        <div className="flex items-center justify-between px-edge-margin-mobile py-1 bg-surface-container-low text-on-surface-variant font-code-sm text-code-sm border-b border-surface-container">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-secondary">hub</span>
            <span>Mesh P2P Active • 12 Nodes</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="font-label-sm text-label-sm uppercase text-on-surface font-bold">OP-READY</span>
          </div>
        </div>

        {/* Dynamic Map Viewport Area */}
        <div className="relative w-full h-[380px] overflow-hidden bg-surface-container-low shadow-sm">
          {/* Base Vector & Satellite Tactical Layer Pipeline */}
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            data-location="Tampa Bay Florida Coastal Basin"
            style={{
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCtu09UQOXX05juHU7iypfy9kA1R72QRhG7idRC_yJeEiQ-Rp1Uqc_Y7DXIV3Bhl_MyPFm742JdEYlYk4VP-uvCg67JaEvrqpJiOBGp5ISS1-BsuO771sG-3xy3u-5qnz8sBcMXhVFRDYsULFjWnCTOwJNWUqj6g3gTsg-cTprzQ6lInb2nACrPalYgEKRXI6eQaNIuO67M_lhgCnBn0OUuaflqdqVzVul4JxBLri65zwvZkgv4U40h')`,
            }}
          ></div>

          {/* Interactive Tactical Visual Layer (SVG Overlays & Transponders) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 390 380">
            <defs>
              <linearGradient id="floodGrad" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#0090a9" stopOpacity="0.38"></stop>
                <stop offset="100%" stopColor="#0051d5" stopOpacity="0.15"></stop>
              </linearGradient>
              <radialGradient cx="50%" cy="50%" id="beaconGlow" r="50%">
                <stop offset="0%" stopColor="#0051d5" stopOpacity="0.6"></stop>
                <stop offset="100%" stopColor="#0051d5" stopOpacity="0"></stop>
              </radialGradient>
            </defs>
            {/* Coastal Contour Flood Depths */}
            <path d="M-10,210 Q80,160 170,220 T360,190 L410,250 L410,390 L-10,390 Z" fill="url(#floodGrad)" stroke="#0090a9" strokeDasharray="4,3" strokeWidth="2"></path>
            {/* Evacuation Safe Corridor Path Vector */}
            <path d="M 60,320 L 120,270 L 195,260 L 290,170 L 330,110" fill="none" opacity="0.9" stroke="#16a34a" strokeDasharray="6,4" strokeWidth="3.5"></path>
            {/* Radial Mesh Rings around Alpha-02 node */}
            <circle className="animate-pulse" cx="195" cy="255" fill="url(#beaconGlow)" r="44"></circle>
            <circle cx="195" cy="255" fill="none" opacity="0.6" r="26" stroke="#0051d5" strokeDasharray="2,2" strokeWidth="1"></circle>
          </svg>

          {/* Critical Facility: St. Jude Trauma Hub */}
          <div className="absolute top-[65px] right-[16px] z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface shadow-md">
            <span className="material-symbols-outlined text-[16px] text-error">local_hospital</span>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface leading-tight font-bold">St. Jude Trauma</span>
              <span className="font-code-sm text-[9px] text-on-surface-variant leading-none">Level-1 • Cap 84%</span>
            </div>
          </div>

          {/* Active Units: Rig-04, Boat-02, Medic-09 */}
          <div className="absolute top-[145px] left-[36px] z-10 flex items-center gap-1 bg-surface shadow-md px-2 py-0.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
            <span className="font-code-sm text-[11px] font-bold text-on-surface">Rig-04</span>
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">fire_truck</span>
          </div>

          <div className="absolute top-[210px] right-[50px] z-10 flex items-center gap-1 bg-surface-container-lowest shadow-md px-2 py-0.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-on-tertiary-container"></span>
            <span className="font-code-sm text-[11px] font-bold text-on-surface">Boat-02</span>
            <span className="material-symbols-outlined text-[14px] text-on-tertiary-container">kayaking</span>
          </div>

          <div className="absolute top-[95px] left-[150px] z-10 flex items-center gap-1 bg-surface shadow-md px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span className="font-code-sm text-[11px] font-bold text-on-surface">Medic-09</span>
            <span className="material-symbols-outlined text-[14px] text-secondary">medical_services</span>
          </div>

          {/* Blocked Hazard Badges */}
          <div
            className="absolute top-[250px] left-[90px] z-10 flex items-center gap-1 bg-error text-on-error px-2 py-0.5 rounded-full shadow-md cursor-pointer active:scale-95 transition-transform"
            onClick={() => navigate('/rescue/hazard/sec-04b')}
            title="Inspect water depth hazard"
          >
            <span className="material-symbols-outlined text-[14px]">block</span>
            <span className="font-code-sm text-[10px] font-bold uppercase tracking-wider">Water 1.2m</span>
          </div>

          {/* Top Floating Sector Badge */}
          <div className="absolute top-2.5 inset-x-edge-margin-mobile z-20 flex items-center justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/90 backdrop-blur-md shadow-md">
              <span className="material-symbols-outlined text-secondary text-[16px]">pin_drop</span>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface leading-none font-bold">Sector 04-B</span>
                <span className="font-code-sm text-[10px] text-on-surface-variant leading-none pt-0.5">RTK ±0.2m • Basin</span>
              </div>
            </div>
            <div className="pointer-events-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-md text-on-surface">
              <span className="material-symbols-outlined text-[16px] text-secondary">wifi_tethering</span>
              <span className="font-label-sm text-label-sm font-semibold">8 Units Near</span>
            </div>
          </div>

          {/* Quick Layers Ribbon */}
          <div className="absolute bottom-2.5 inset-x-edge-margin-mobile z-20 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setActiveLayer('hazards')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm shadow-sm whitespace-nowrap active:scale-95 transition-all ${
                activeLayer === 'hazards' ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">crisis_alert</span>
              <span>Hazards</span>
            </button>
            <button
              onClick={() => setActiveLayer('blocked')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm shadow-sm whitespace-nowrap active:scale-95 transition-all ${
                activeLayer === 'blocked' ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] text-error">remove_road</span>
              <span>Blocked Arterials</span>
            </button>
            <button
              onClick={() => setActiveLayer('corridors')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm shadow-sm whitespace-nowrap active:scale-95 transition-all ${
                activeLayer === 'corridors' ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] text-emerald-600">alt_route</span>
              <span>Safe Corridors</span>
            </button>
            <button
              onClick={() => setActiveLayer('units')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm shadow-sm whitespace-nowrap active:scale-95 transition-all ${
                activeLayer === 'units' ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] text-secondary">directions_boat</span>
              <span>Units</span>
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
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold shadow-sm transition-colors ${
                activeFilter === 'all'
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-surface-container-high text-on-surface'
              }`}
            >
              All (3)
            </button>
            <button
              onClick={() => setActiveFilter('high_water')}
              className={`px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold transition-colors ${
                activeFilter === 'high_water'
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-surface-container-high text-on-surface'
              }`}
            >
              High Water (2)
            </button>
            <button
              onClick={() => setActiveFilter('medical')}
              className={`px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold transition-colors ${
                activeFilter === 'medical'
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-surface-container-high text-on-surface'
              }`}
            >
              Medical (1)
            </button>
          </div>

          {/* Swipeable Mission Carousel Cards */}
          <div className="w-full flex gap-space-sm overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar pt-1">
            {/* Mission Card 1: #MIS-104 (CRITICAL) */}
            <div className="snap-center shrink-0 w-[88vw] max-w-[340px] bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col relative border-l-4 border-error">
              <div className="p-space-md flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-code-sm text-code-sm font-bold text-on-surface tracking-wider">#MIS-104</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">• Water Rescue</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">
                    <span className="material-symbols-outlined text-[13px]">timer</span>
                    <span>{formatSla(secondsRemaining)}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <h3 className="font-title-lg text-title-lg text-on-surface leading-snug font-bold">
                    Stranded Family on Roof — 412 Bayshore Blvd
                  </h3>
                  <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 pt-0.5">
                    <span className="material-symbols-outlined text-[14px] text-secondary">explore</span>
                    <span>27.9102° N, -82.4931° W</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 bg-surface-container-low p-2 rounded-lg text-on-surface">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Water Depth</span>
                    <span className="font-data-metric-md text-[14px] leading-tight text-error font-bold flex items-center gap-0.5">
                      1.4m <span className="material-symbols-outlined text-[12px]">trending_up</span>
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Affected</span>
                    <span className="font-data-metric-md text-[14px] leading-tight font-bold">4 (1 Infant)</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Distance</span>
                    <span className="font-data-metric-md text-[14px] leading-tight font-bold text-secondary">1.2 km</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-surface-container p-2 rounded-lg text-on-surface">
                  <span className="material-symbols-outlined text-on-tertiary-container text-[18px] shrink-0">info</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
                    Submerged access road. Deploy zodiac inflatable or high-clearance rig from Alpha depot.
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
                    <span>Accept & Start</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mission Card 2: #MIS-102 */}
            <div className="snap-center shrink-0 w-[88vw] max-w-[340px] bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col relative border-l-4 border-[#EA580C]">
              <div className="p-space-md flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-code-sm text-code-sm font-bold text-on-surface tracking-wider">#MIS-102</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">• Evac Escort</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFEDD5] text-[#C2410C] font-label-sm text-label-sm font-bold">
                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                    <span>18:15 remaining</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <h3 className="font-title-lg text-title-lg text-on-surface leading-snug font-bold">
                    Elderly Care Facility Power Cut — Sector 4C
                  </h3>
                  <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 pt-0.5">
                    <span className="material-symbols-outlined text-[14px] text-secondary">pin_drop</span>
                    <span>Harborview Manor • Generator Offline</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-2 rounded-lg text-on-surface">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Critical Need</span>
                    <span className="font-data-metric-md text-[14px] leading-tight text-[#C2410C] font-bold">Oxygen (6 Patients)</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Distance / ETA</span>
                    <span className="font-data-metric-md text-[14px] leading-tight font-bold">3.4 km (9 min)</span>
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

      {/* Floating Tactical Navigation Trigger */}
      <aside className="fixed right-edge-margin-mobile bottom-20 z-40 pointer-events-auto">
        <button
          onClick={() => navigate('/rescue/navigate/MIS-104')}
          aria-label="Navigate Mission"
          className="w-14 h-14 rounded-full bg-primary text-on-primary shadow-xl flex items-center justify-center hover:bg-surface-tint active:scale-95 transition-all"
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
