import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { BottomNav } from '../../components/stitch/BottomNav';
import { SosFab } from '../../components/stitch/SosFab';
import { Mock } from '../../components/stitch/Mock';

export const CitizenMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeLayer, setActiveLayer] = useState<'all' | 'rain' | 'aqi'>('all');
  const [recenterActive, setRecenterActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleRecenter = () => {
    setRecenterActive(true);
    setTimeout(() => setRecenterActive(false), 300);
  };

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col relative w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20">
      {/* Header */}
      <Header title="Map" subtitle="ClimateShield Citizen" />

      {/* Main Map Viewport */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface">
        <div className="flex flex-col w-full relative select-none">
          {/* Interactive Map Canvas Container */}
          <div className="relative w-full h-[calc(100vh-8.5rem)] min-h-[560px] overflow-hidden bg-surface-container-low rounded-b-xl shadow-inner">
            {/* Stylized Tactical GIS Vector Map SVG */}
            <svg
              className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-300"
              preserveAspectRatio="xMidYMid slice"
              viewBox="0 0 400 700"
              xmlns="http://www.w3.org/2000/svg"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <defs>
                {/* Map Landmass Grid Texture */}
                <pattern height="40" id="radarGrid" patternUnits="userSpaceOnUse" width="40">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dce9ff" strokeDasharray="2,2" strokeWidth="0.75" />
                  <circle cx="20" cy="20" fill="#7c839b" opacity="0.3" r="1" />
                </pattern>
                <pattern height="12" id="hatchFlood" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse" width="12">
                  <line opacity="0.35" stroke="#0090a9" strokeWidth="1.5" x1="0" x2="0" y1="0" y2="12" />
                </pattern>
              </defs>

              {/* Base Landmass */}
              <rect fill="#f8f9ff" height="700" width="400" />
              <rect fill="url(#radarGrid)" height="700" width="400" />

              {/* Topography / Elevation Contour Lines */}
              <path d="M-20,120 Q120,80 240,160 T450,110" fill="none" opacity="0.8" stroke="#d3e4fe" strokeWidth="1.5" />
              <path d="M-20,180 Q130,140 260,220 T450,170" fill="none" opacity="0.8" stroke="#d3e4fe" strokeWidth="1.5" />
              <path d="M-20,240 Q150,200 280,280 T450,230" fill="none" opacity="0.8" stroke="#d3e4fe" strokeWidth="1.5" />

              {/* Park & Resilience Green Belts */}
              <path d="M220,130 C270,120 340,150 370,220 C340,270 290,280 240,250 C210,210 200,160 220,130 Z" fill="#dce9ff" opacity="0.6" />
              <path d="M40,380 C80,360 140,390 150,440 C140,490 70,510 30,470 C10,430 20,400 40,380 Z" fill="#dce9ff" opacity="0.5" />

              {/* Metro Waterfront Bay & Navigable River */}
              <path d="M-20,490 C60,470 120,430 180,440 C250,450 290,520 340,540 C380,555 420,530 440,520 L440,720 L-20,720 Z" fill="#d3e4fe" opacity="0.85" />
              <path d="M180,440 C160,340 110,280 90,200 C75,130 90,60 80,-20" fill="none" opacity="0.95" stroke="#d3e4fe" strokeLinecap="round" strokeWidth="18" />

              {/* Urban Road Infrastructure Mesh */}
              <path d="M-10,310 L420,290" fill="none" stroke="#ffffff" strokeWidth="6" />
              <path d="M-10,310 L420,290" fill="none" stroke="#cbdbf5" strokeWidth="3" />
              <path d="M260,-20 L240,460 L320,720" fill="none" stroke="#ffffff" strokeWidth="6" />
              <path d="M260,-20 L240,460 L320,720" fill="none" stroke="#cbdbf5" strokeWidth="3" />

              {/* Secondary Street Grid */}
              <path d="M30,110 L380,110 M20,170 L390,170 M30,230 L380,230 M30,360 L380,360 M30,410 L380,410" fill="none" opacity="0.9" stroke="#ffffff" strokeWidth="2" />
              <path d="M120,20 L120,470 M180,20 L180,440 M320,20 L320,480 M360,60 L360,500" fill="none" opacity="0.9" stroke="#ffffff" strokeWidth="2" />

              {/* Hazard Overlay 1: Coastal Water Surge / Flood Polygon */}
              {(activeLayer === 'all' || activeLayer === 'rain') && (
                <g className="animate-pulse" style={{ animationDuration: '2.2s' }}>
                  <path d="M120,430 C190,410 280,470 330,520 C280,580 170,540 100,500 Z" fill="#acedff" fillOpacity="0.45" />
                  <path d="M120,430 C190,410 280,470 330,520 C280,580 170,540 100,500 Z" fill="url(#hatchFlood)" />
                  <path d="M120,430 C190,410 280,470 330,520 C280,580 170,540 100,500 Z" fill="none" stroke="#0090a9" strokeDasharray="4,3" strokeWidth="1.5" />
                </g>
              )}

              {/* Hazard Overlay 2: Inland Microclimate Urban Heat Index Polygon */}
              {(activeLayer === 'all' || activeLayer === 'aqi') && (
                <g className="animate-pulse" style={{ animationDuration: '2.8s', animationDelay: '0.4s' }}>
                  <circle cx="290" cy="180" fill="#ffdad6" fillOpacity="0.42" r="62" />
                  <circle cx="290" cy="180" fill="none" opacity="0.75" r="62" stroke="#ba1a1a" strokeDasharray="6,4" strokeWidth="1.2" />
                  <circle cx="290" cy="180" fill="#ffdad6" fillOpacity="0.5" r="32" />
                </g>
              )}

              {/* User Real-Time Position Dot */}
              <circle className="animate-ping" cx="160" cy="285" fill="#316bf3" fillOpacity="0.2" r="14" />
              <circle cx="160" cy="285" fill="#ffffff" r="7" />
              <circle cx="160" cy="285" fill="#316bf3" r="4.5" />
            </svg>

            {/* Map Floating Hazard Markers */}
            <div
              className="absolute left-[38%] top-[62%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/95 backdrop-blur shadow-md pointer-events-auto cursor-pointer hover:bg-surface transition-colors"
              id="flood-marker"
              onClick={() => navigate('/rescue/incident/flood-1')}
            >
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                <Mock label="Hazard Label">Creek Tidal Surge +0.4m</Mock>
              </span>
            </div>

            <div
              className="absolute left-[70%] top-[25%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/95 backdrop-blur shadow-md pointer-events-auto cursor-pointer hover:bg-surface transition-colors"
              id="heat-marker"
              onClick={() => navigate('/citizen/alerts')}
            >
              <span className="w-2 h-2 rounded-full bg-error"></span>
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                <Mock label="Hazard Label">Heat Stress 38°C</Mock>
              </span>
            </div>

            {/* TOP FLOATING CONTROLS LAYER */}
            <div className="absolute top-space-xs inset-x-space-md z-20 flex flex-col gap-space-2xs pointer-events-none">
              {/* Top Row: Tappable Location Pill */}
              <div className="flex items-center justify-between pointer-events-auto">
                <button
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md shadow-md text-on-surface transition active:scale-95 ${
                    recenterActive
                      ? 'bg-surface-container-highest'
                      : 'bg-surface-container-lowest/95 hover:bg-surface-container-low'
                  }`}
                  id="recenter-location-btn"
                  onClick={handleRecenter}
                  type="button"
                >
                  <span className="material-symbols-outlined text-secondary text-[16px]">my_location</span>
                  <span className="font-label-md text-label-md font-bold tracking-tight truncate max-w-[210px]">
                    <Mock label="Current Ward">Downtown &amp; Waterfront</Mock>
                  </span>
                  <span className="material-symbols-outlined text-outline text-[14px]">expand_more</span>
                </button>

                <div className="flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-md px-2 py-1 rounded-full shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-container animate-pulse"></span>
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">
                    <Mock label="Telemetry Sync">Sensors: 100%</Mock>
                  </span>
                </div>
              </div>

              {/* Search & Tactical Command Bar */}
              <div className="pointer-events-auto w-full mt-1">
                <div className="h-12 w-full px-space-sm bg-surface-container-lowest/95 backdrop-blur-xl rounded-full shadow-lg flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0">search</span>
                  <input
                    className="flex-1 min-w-0 bg-transparent text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none"
                    placeholder="Where are you heading today?"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface transition active:scale-95 shrink-0"
                    title="Voice command"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">mic</span>
                  </button>
                  <button
                    className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface transition active:scale-95 shrink-0"
                    title="Layer filters"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                  </button>
                </div>
              </div>
            </div>

            {/* MAP UTILITY CONTROLS (Right Rail) */}
            <div className="absolute right-space-md top-36 z-20 flex flex-col gap-space-2xs pointer-events-auto">
              <button
                className="w-10 h-10 rounded-xl bg-surface-container-lowest/95 backdrop-blur shadow-md flex items-center justify-center text-on-surface-variant hover:text-primary transition active:scale-95"
                id="btn-layers"
                title="Switch Layers"
                type="button"
                onClick={() => setActiveLayer(activeLayer === 'all' ? 'rain' : activeLayer === 'rain' ? 'aqi' : 'all')}
              >
                <span className="material-symbols-outlined text-[20px]">layers</span>
              </button>
              <button
                className="w-10 h-10 rounded-xl bg-surface-container-lowest/95 backdrop-blur shadow-md flex items-center justify-center text-on-surface-variant hover:text-secondary transition active:scale-95"
                id="btn-recenter"
                title="Center User"
                type="button"
                onClick={handleRecenter}
              >
                <span className="material-symbols-outlined text-[20px]">filter_center_focus</span>
              </button>
              <div className="flex flex-col bg-surface-container-lowest/95 backdrop-blur rounded-xl shadow-md overflow-hidden">
                <button
                  className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition active:bg-surface-container-high"
                  id="btn-zoom-in"
                  title="Zoom In"
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.min(prev + 0.15, 1.6))}
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
                <div className="w-6 h-[1px] bg-surface-container mx-auto"></div>
                <button
                  className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition active:bg-surface-container-high"
                  id="btn-zoom-out"
                  title="Zoom Out"
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.max(prev - 0.15, 0.8))}
                >
                  <span className="material-symbols-outlined text-[20px]">remove</span>
                </button>
              </div>
              <button
                className="w-10 h-10 rounded-xl bg-surface-container-lowest/95 backdrop-blur shadow-md flex items-center justify-center text-secondary hover:text-secondary-container transition active:scale-95"
                title="Wind &amp; Currents"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">air</span>
              </button>
            </div>

            {/* QUICK RADAR & HAZARD OVERLAYS TOGGLE PILLS */}
            <div className="absolute left-space-md top-36 z-20 flex flex-col gap-1.5 pointer-events-auto">
              <button
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur shadow-sm font-label-sm text-label-sm active:scale-95 transition-colors ${
                  activeLayer === 'rain' || activeLayer === 'all'
                    ? 'bg-surface-container-lowest/90 text-on-surface font-semibold ring-1 ring-secondary/30'
                    : 'bg-surface-container-lowest/50 text-on-surface-variant'
                }`}
                type="button"
                onClick={() => setActiveLayer(activeLayer === 'rain' ? 'all' : 'rain')}
              >
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span>Rain Radar</span>
              </button>
              <button
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur shadow-sm font-label-sm text-label-sm active:scale-95 transition-colors ${
                  activeLayer === 'aqi' || activeLayer === 'all'
                    ? 'bg-surface-container-lowest/90 text-on-surface font-semibold ring-1 ring-error/30'
                    : 'bg-surface-container-lowest/50 text-on-surface-variant'
                }`}
                type="button"
                onClick={() => setActiveLayer(activeLayer === 'aqi' ? 'all' : 'aqi')}
              >
                <span className="w-2 h-2 rounded-full bg-error"></span>
                <span><Mock label="Air AQI Value">Air AQI 64</Mock></span>
              </button>
            </div>

            {/* FLOATING RISK-SUMMARY STRIP (Directly above Bottom Deck) */}
            <div className="absolute inset-x-space-md bottom-4 z-20 pointer-events-auto flex justify-center">
              <div
                className="flex items-center justify-between gap-3 px-space-md py-2.5 bg-surface-container-lowest/95 backdrop-blur-xl rounded-full shadow-lg cursor-pointer hover:bg-surface active:scale-[0.99] transition w-full max-w-sm"
                id="risk-toast"
                onClick={() => navigate('/citizen/alerts')}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-container opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary-container"></span>
                  </span>
                  <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                    <Mock label="Nearby Risk Summary">3 risks nearby • Rain arriving in 25m</Mock>
                  </span>
                </div>
                <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLLAPSED RESILIENCE BOTTOM SHEET PREVIEW */}
          <div className="w-full px-space-md pt-space-xs pb-space-sm bg-surface flex flex-col gap-space-xs">
            <div className="w-10 h-1 bg-surface-container-highest rounded-full mx-auto"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                  Metropolitan Safety Index
                </p>
                <p className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">
                  <Mock label="Safety Level">Moderate Caution</Mock>
                </p>
              </div>
              <div className="flex items-center gap-2 bg-surface-container px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  <Mock label="Corridor Status">Safe Corridor Active</Mock>
                </span>
              </div>
            </div>

            {/* Quick Action Tray: Exactly one solid operational CTA */}
            <div className="grid grid-cols-2 gap-space-xs pt-1">
              <button
                className="h-10 px-3 rounded-lg bg-surface-container-lowest shadow-sm flex items-center justify-center gap-2 text-on-surface font-label-md text-label-md font-bold hover:bg-surface-container transition active:scale-95"
                type="button"
                onClick={() => navigate('/rescue/route/route-a')}
              >
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">alt_route</span>
                <span>Plan Dry Route</span>
              </button>

              {/* Strictly ONE Solid Primary Action Button on View */}
              <button
                className="h-10 px-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container transition flex items-center justify-center gap-2 active:scale-95"
                type="button"
                onClick={() => navigate('/rescue/report')}
              >
                <span className="material-symbols-outlined text-[18px]">share_location</span>
                <span>Broadcast Status</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Floating SOS FAB */}
      <SosFab />

      {/* Persistent Bottom Nav */}
      <BottomNav activeTab="map" />
    </div>
  );
};
