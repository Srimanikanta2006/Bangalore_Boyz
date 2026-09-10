import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface BottomNavProps {
  activeTab?: 'map' | 'alerts' | 'reports' | 'profile';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab }) => {
  const location = useLocation();

  const current =
    activeTab ||
    (location.pathname.includes('/citizen/alerts')
      ? 'alerts'
      : location.pathname.includes('/citizen/report') || location.pathname.includes('/rescue/report')
      ? 'reports'
      : location.pathname.includes('/login')
      ? 'profile'
      : 'map');

  return (
    <nav
      className="fixed bottom-0 w-full z-50 pb-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-4px_20px_-2px_rgba(15,23,42,0.06)]"
      data-active-classes="text-secondary font-semibold"
    >
      <div className="flex items-center justify-around h-16 px-space-xs">
        <Link
          to="/citizen/map"
          aria-current={current === 'map' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-space-xs transition-colors duration-150 ${
            current === 'map'
              ? 'text-secondary font-semibold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          data-path="map"
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={current === 'map' ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            map
          </span>
          <span className="font-label-sm text-label-sm mt-0.5">Map</span>
        </Link>

        <Link
          to="/citizen/alerts"
          aria-current={current === 'alerts' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-space-xs transition-colors duration-150 ${
            current === 'alerts'
              ? 'text-secondary font-semibold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          data-path="alerts"
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={current === 'alerts' ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            warning
          </span>
          <span className="font-label-sm text-label-sm mt-0.5">Alerts</span>
        </Link>

        <Link
          to="/citizen/report"
          aria-current={current === 'reports' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-space-xs transition-colors duration-150 ${
            current === 'reports'
              ? 'text-secondary font-semibold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          data-path="reports"
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={current === 'reports' ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            assignment_late
          </span>
          <span className="font-label-sm text-label-sm mt-0.5">Reports</span>
        </Link>

        <Link
          to="/login"
          aria-current={current === 'profile' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-space-xs transition-colors duration-150 ${
            current === 'profile'
              ? 'text-secondary font-semibold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          data-path="profile"
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={current === 'profile' ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            person
          </span>
          <span className="font-label-sm text-label-sm mt-0.5">Profile</span>
        </Link>
      </div>
    </nav>
  );
};
