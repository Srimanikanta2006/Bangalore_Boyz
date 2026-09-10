import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const ScreenSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const screens = [
    // Shared Gateway
    { label: 'Login & Role Gateway', path: '/login', icon: 'login', group: 'Auth & Gateway' },

    // Citizen Experience (8 screens)
    { label: 'Citizen Live Feed & Report (Sc.06)', path: '/citizen/report', icon: 'assignment_late', group: 'Citizen (8)' },
    { label: 'Citizen Map & Risk Corridors (Sc.20)', path: '/citizen/map', icon: 'map', group: 'Citizen (8)' },
    { label: 'Citizen Flood Hazard Sheet (Sc.12)', path: '/citizen/hazard/sec-04b', icon: 'flood', group: 'Citizen (8)' },
    { label: 'Citizen Route Selection (Sc.18)', path: '/citizen/routes', icon: 'alt_route', group: 'Citizen (8)' },
    { label: 'Citizen Active Nav & Reroute (Sc.23)', path: '/citizen/navigate', icon: 'turn_right', group: 'Citizen (8)' },
    { label: 'Citizen Alerts Feed (Sc.10)', path: '/citizen/alerts', icon: 'warning', group: 'Citizen (8)' },
    { label: 'Citizen SOS Emergency (Sc.24/04)', path: '/citizen/sos', icon: 'sos', group: 'Citizen (8)' },

    // Rescue Tactical Operations (6 screens)
    { label: 'Rescue Tactical Map (Sc.21)', path: '/rescue/tactical', icon: 'map', group: 'Rescue Tactical (6)' },
    { label: 'Rescue Mission Dossier (Sc.17)', path: '/rescue/mission/MIS-104', icon: 'description', group: 'Rescue Tactical (6)' },
    { label: 'Rescue Active Mission Nav (Sc.16)', path: '/rescue/navigate/MIS-104', icon: 'near_me', group: 'Rescue Tactical (6)' },
    { label: 'Rescue Hazard Detail (Sc.02)', path: '/rescue/hazard/SEC-04B', icon: 'crisis_alert', group: 'Rescue Tactical (6)' },
    { label: 'Rescue Sitrep Report (Sc.13)', path: '/rescue/report/MIS-104', icon: 'fact_check', group: 'Rescue Tactical (6)' },
    { label: 'Rescue Command Console (Sc.19)', path: '/rescue/console', icon: 'grid_view', group: 'Rescue Tactical (6)' },

    // Government Mobile Field (3 screens)
    { label: 'Gov Mobile Live Map (Sc.22)', path: '/gov/mobile/map', icon: 'map', group: 'Gov Mobile (3)' },
    { label: 'Gov Mobile Incident Triage (Sc.11)', path: '/gov/mobile/triage', icon: 'warning', group: 'Gov Mobile (3)' },
    { label: 'Gov Mobile Field Tasks (Sc.01)', path: '/gov/mobile/tasks', icon: 'assignment_turned_in', group: 'Gov Mobile (3)' },

    // Government HQ Desktop (5 screens)
    { label: 'Gov Command Center Overview (Sc.08)', path: '/gov/overview', icon: 'space_dashboard', group: 'Gov HQ Desktop (5)' },
    { label: 'Gov Critical Asset Monitor (Sc.15)', path: '/gov/critical-assets', icon: 'domain', group: 'Gov HQ Desktop (5)' },
    { label: 'Gov Zone Detail Cascade (Sc.05)', path: '/gov/zone-cascade/4B', icon: 'layers', group: 'Gov HQ Desktop (5)' },
    { label: 'Gov Disaster Simulator SIM-CAD (Sc.09)', path: '/gov/simulator', icon: 'model_training', group: 'Gov HQ Desktop (5)' },
    { label: 'Gov Response Center Dispatch (Sc.03)', path: '/gov/response-center', icon: 'emergency_share', group: 'Gov HQ Desktop (5)' },
  ];

  const isDesktop = location.pathname.startsWith('/gov/') && !location.pathname.startsWith('/gov/mobile');

  return (
    <div className={`fixed ${isDesktop ? 'bottom-4 right-4' : 'top-2 right-2'} z-[9999] font-sans text-xs`}>
      {isOpen ? (
        <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-3 shadow-2xl text-white w-80 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-bold text-[11px] uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">layers</span>
              All 22 Stitch Screens
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title="Close switcher"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>

          <div className="flex flex-col gap-1 max-h-[75vh] overflow-y-auto pr-1">
            {screens.map((screen, idx) => {
              const isActive = location.pathname === screen.path;
              const prevScreen = screens[idx - 1];
              const showGroupHeader = !prevScreen || prevScreen.group !== screen.group;

              return (
                <React.Fragment key={screen.path}>
                  {showGroupHeader && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300/80 mt-2 mb-0.5 px-2">
                      {screen.group}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      navigate(screen.path);
                      setIsOpen(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-sky-600 text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] shrink-0">{screen.icon}</span>
                    <span className="truncate text-xs">{screen.label}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white ml-auto shrink-0" />}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
          title="Switch role screens"
        >
          <span className="material-symbols-outlined text-[15px] text-sky-400">layers</span>
          <span className="font-semibold text-xs">All Screens (22)</span>
        </button>
      )}
    </div>
  );
};

export default ScreenSwitcher;
