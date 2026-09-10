import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { BottomNav } from '../../components/stitch/BottomNav';
import { SosFab } from '../../components/stitch/SosFab';
import { Mock } from '../../components/stitch/Mock';

interface AlertItem {
  id: string;
  hazardType: string;
  hazardColor: string;
  severity: 'HIGH' | 'MODERATE' | 'SAFE';
  severityBg: string;
  severityText: string;
  severityDot: string;
  borderLeftColor: string;
  updatedTime: string;
  title: string;
  description: string;
  actionText: string;
  actionRoute: string;
  tags: string[];
}

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'alert-1',
    hazardType: 'Flash Flood',
    hazardColor: '#06B6D4',
    severity: 'HIGH',
    severityBg: 'bg-[#FFEDD5]',
    severityText: 'text-[#C2410C]',
    severityDot: 'bg-[#EA580C]',
    borderLeftColor: 'bg-[#EA580C]',
    updatedTime: '4m ago',
    title: 'Rapid Inundation on South Waterfront',
    description:
      'Water levels rising rapidly along 3rd and 5th avenues. Storm drains overloaded. Avoid low-elevation underpasses.',
    actionText: 'View safe detour route',
    actionRoute: '/rescue/route/route-a',
    tags: ['high', 'weather', 'corridors'],
  },
  {
    id: 'alert-2',
    hazardType: 'Heat Warning',
    hazardColor: '#D97706',
    severity: 'MODERATE',
    severityBg: 'bg-[#FEF3C7]',
    severityText: 'text-[#B45309]',
    severityDot: 'bg-[#D97706]',
    borderLeftColor: 'bg-[#D97706]',
    updatedTime: '18m ago',
    title: 'Extreme Urban Heat Island Anomaly',
    description:
      'Surface temperature exceeding 39°C in dense industrial sectors. 4 misting stations active at central transit plazas.',
    actionText: 'Locate hydration station',
    actionRoute: '/citizen/map',
    tags: ['weather'],
  },
  {
    id: 'alert-3',
    hazardType: 'Storm Drainage',
    hazardColor: '#0051d5',
    severity: 'SAFE',
    severityBg: 'bg-[#DCFCE7]',
    severityText: 'text-[#15803D]',
    severityDot: 'bg-[#16A34A]',
    borderLeftColor: 'bg-[#16A34A]',
    updatedTime: '32m ago',
    title: 'Highline Arterial Corridor Cleared',
    description:
      'Culvert 4 pumping units deployed. Northbound lanes fully navigable for passenger vehicles.',
    actionText: 'View corridor status',
    actionRoute: '/rescue/route/route-a',
    tags: ['corridors'],
  },
];

export const AlertsFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<'all' | 'high' | 'weather' | 'corridors'>('all');

  const filteredAlerts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return INITIAL_ALERTS.filter((item) => {
      const textMatch =
        query === '' ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.hazardType.toLowerCase().includes(query);
      const filterMatch = currentFilter === 'all' || item.tags.includes(currentFilter);
      return textMatch && filterMatch;
    });
  }, [searchQuery, currentFilter]);

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col relative w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20">
      {/* Header */}
      <Header title="Alerts" subtitle="ClimateShield Citizen" />

      {/* Main Alerts Feed */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface">
        <div className="flex flex-col w-full">
          {/* Search & Filter Bar */}
          <div className="px-edge-margin-mobile pt-space-xs pb-space-sm">
            <div className="relative w-full mb-space-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input
                className="w-full h-10 pl-9 pr-8 bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md rounded-lg shadow-sm focus:outline-none focus:bg-surface-container-low transition-colors duration-150"
                id="alert-search-input"
                placeholder="Search alerts or neighborhood..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface"
                  id="clear-search-btn"
                  type="button"
                  onClick={() => setSearchQuery('')}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-space-2xs overflow-x-auto no-scrollbar py-0.5" id="filter-chips">
              <button
                className={`filter-chip shrink-0 px-3 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-all duration-150 flex items-center gap-1.5 ${
                  currentFilter === 'all'
                    ? 'bg-primary-container text-on-primary active'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                }`}
                data-filter="all"
                type="button"
                onClick={() => setCurrentFilter('all')}
              >
                <span>All Alerts</span>
                <span className="bg-surface-container-lowest/20 text-on-primary px-1.5 py-0.2 rounded-full font-label-sm text-[10px]">
                  {INITIAL_ALERTS.length}
                </span>
              </button>

              <button
                className={`filter-chip shrink-0 px-3 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-all duration-150 flex items-center gap-1.5 ${
                  currentFilter === 'high'
                    ? 'bg-primary-container text-on-primary active'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                }`}
                data-filter="high"
                type="button"
                onClick={() => setCurrentFilter('high')}
              >
                <span className="w-2 h-2 rounded-full bg-error"></span>
                <span>High Severity</span>
              </button>

              <button
                className={`filter-chip shrink-0 px-3 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-all duration-150 flex items-center gap-1.5 ${
                  currentFilter === 'weather'
                    ? 'bg-primary-container text-on-primary active'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                }`}
                data-filter="weather"
                type="button"
                onClick={() => setCurrentFilter('weather')}
              >
                <span className="material-symbols-outlined text-[15px] text-secondary">cloud</span>
                <span>Weather</span>
              </button>

              <button
                className={`filter-chip shrink-0 px-3 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-all duration-150 flex items-center gap-1.5 ${
                  currentFilter === 'corridors'
                    ? 'bg-primary-container text-on-primary active'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                }`}
                data-filter="corridors"
                type="button"
                onClick={() => setCurrentFilter('corridors')}
              >
                <span className="material-symbols-outlined text-[15px] text-secondary-container">alt_route</span>
                <span>Safe Corridors</span>
              </button>
            </div>
          </div>

          {/* Feed Header */}
          <div className="px-edge-margin-mobile flex items-center justify-between pb-space-xs text-on-surface-variant">
            <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
              Active Citizen Advisories
            </span>
            <span className="font-label-sm text-label-sm flex items-center gap-1 text-secondary font-medium">
              <span className="material-symbols-outlined text-[14px]">sync</span>
              <span>Auto-sync 30s</span>
            </span>
          </div>

          {/* Alerts Card List */}
          <div className="px-edge-margin-mobile flex flex-col gap-space-sm" id="alerts-container">
            {filteredAlerts.map((alert) => (
              <article
                key={alert.id}
                className="relative overflow-hidden bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_-2px_rgba(15,23,42,0.08)] transition-transform duration-150 active:scale-[0.99]"
                data-card={alert.tags.join(' ')}
              >
                {/* Left Edge Severity Indicator Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${alert.borderLeftColor}`}></div>

                <div className="pl-4 pr-space-md py-space-md flex flex-col gap-space-xs">
                  {/* Top Row: Hazard Pill + Severity Badge + Timestamp */}
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm font-bold text-on-surface">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: alert.hazardColor }}></span>
                        <Mock label="Hazard Type">{alert.hazardType}</Mock>
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${alert.severityBg} ${alert.severityText} font-label-sm text-label-sm font-bold`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${alert.severityDot} ${alert.severity === 'HIGH' ? 'animate-ping' : ''}`}></span>
                        {alert.severity}
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-outline tabular-nums flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">schedule</span>
                      <Mock label="Update Delta">Updated {alert.updatedTime}</Mock>
                    </span>
                  </div>

                  {/* Body Text */}
                  <div className="mt-0.5">
                    <h2 className="font-title-lg text-title-lg text-on-surface font-bold leading-snug">
                      <Mock label="Alert Headline">{alert.title}</Mock>
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>

                  {/* Action Link & Share */}
                  <div className="pt-1 mt-0.5 flex items-center justify-between">
                    <button
                      className={`group inline-flex items-center gap-1.5 font-label-md text-label-md font-bold ${
                        alert.severity === 'HIGH'
                          ? 'text-[#EA580C] hover:text-[#C2410C]'
                          : alert.severity === 'MODERATE'
                          ? 'text-[#B45309] hover:text-[#D97706]'
                          : 'text-secondary hover:text-secondary-container'
                      } transition-colors duration-150`}
                      type="button"
                      onClick={() => navigate(alert.actionRoute)}
                    >
                      <span>{alert.actionText}</span>
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform duration-150">
                        arrow_forward
                      </span>
                    </button>
                    <span className="inline-flex items-center text-outline-variant hover:text-on-surface-variant p-1 cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">share</span>
                    </span>
                  </div>
                </div>
              </article>
            ))}

            {/* Empty State */}
            {filteredAlerts.length === 0 && (
              <div
                className="flex flex-col items-center justify-center py-12 px-4 text-center bg-surface-container-lowest rounded-xl shadow-sm"
                id="no-alerts-state"
              >
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-2">
                  <span className="material-symbols-outlined text-[24px]">notifications_paused</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold">No Active Alerts</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  No alerts match your current filter criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating SOS FAB */}
      <SosFab />

      {/* Persistent Bottom Nav */}
      <BottomNav activeTab="alerts" />
    </div>
  );
};
