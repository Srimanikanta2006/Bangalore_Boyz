import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const ScreenSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const screens = [
    { label: '1. Login / Preview', path: '/login', icon: 'login' },
    { label: '2. Citizen Map', path: '/citizen/map', icon: 'map' },
    { label: '3. Alerts Feed', path: '/citizen/alerts', icon: 'warning' },
    { label: '4. Flood Detail', path: '/rescue/incident/flood-1', icon: 'flood' },
    { label: '5. Route Select', path: '/rescue/route/corridor-a', icon: 'alt_route' },
    { label: '6. Active Nav', path: '/rescue/navigate/route-a', icon: 'near_me' },
    { label: '7. Emergency SOS', path: '/rescue/sos', icon: 'sos' },
    { label: '8. Hazard Report', path: '/rescue/report', icon: 'assignment_late' },
    { label: '9. Operations Console', path: '/console', icon: 'dashboard' },
  ];

  const isConsole = location.pathname === '/' || location.pathname.startsWith('/console') || location.pathname.startsWith('/gov');

  return (
    <div className={`fixed ${isConsole ? 'bottom-4 right-4' : 'top-2 right-2'} z-[9999] font-sans text-xs`}>
      {isOpen ? (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl p-3 shadow-2xl text-white w-64 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-heading font-bold text-[11px] uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">layers</span>
              Stitch Screen Matrix
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="w-5 h-5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title="Close switcher"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>

          <div className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto pr-1">
            {screens.map((screen) => {
              const isActive = location.pathname === screen.path;
              return (
                <button
                  key={screen.path}
                  onClick={() => {
                    navigate(screen.path);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] shrink-0">{screen.icon}</span>
                  <span className="truncate">{screen.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white ml-auto"></span>}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-2.5 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
          title="Switch Stitch screens"
        >
          <span className="material-symbols-outlined text-[15px] text-sky-400">layers</span>
          <span className="font-heading font-semibold text-[11px]">Screens (8)</span>
        </button>
      )}
    </div>
  );
};
