import React from 'react';
import {
  LayoutDashboard,
  Map,
  Building,
  Bell,
  AlertTriangle,
  CheckSquare,
  BarChart,
  History,
  Users,
  Settings,
  LucideIcon,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  isFlagship?: boolean;
  badge?: number;
  badgeType?: 'alert' | 'incident' | 'task';
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  activeAlertsCount: number;
  activeIncidentsCount: number;
  pendingTasksCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  activeAlertsCount,
  activeIncidentsCount,
  pendingTasksCount,
}) => {
  const navSections: NavSection[] = [
    {
      heading: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'risk-map', label: 'Risk Map', icon: Map, isFlagship: true },
      ],
    },
    {
      heading: 'Operations',
      items: [
        { id: 'assets', label: 'Assets', icon: Building },
        { id: 'alerts', label: 'Alerts', icon: Bell, badge: activeAlertsCount, badgeType: 'alert' },
        { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: activeIncidentsCount, badgeType: 'incident' },
        { id: 'tasks', label: 'Response Tasks', icon: CheckSquare, badge: pendingTasksCount, badgeType: 'task' },
      ],
    },
    {
      heading: 'Intelligence',
      items: [
        { id: 'analytics', label: 'Analytics', icon: BarChart },
        { id: 'history', label: 'History', icon: History },
      ],
    },
    {
      heading: 'Management',
      items: [
        { id: 'team', label: 'Team', icon: Users },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-53px)] sticky top-[53px] select-none">
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5 text-xs">
        {navSections.map((section) => (
          <div key={section.heading}>
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {section.heading}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition font-medium ${
                      isActive
                        ? 'bg-sky-50 text-sky-900 font-semibold border border-sky-200/80 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-sky-700' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <span>{item.label}</span>
                      {item.isFlagship && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                          GIS
                        </span>
                      )}
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          item.badgeType === 'incident'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : item.badgeType === 'alert'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Operational Status Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500">
        <div className="flex items-center justify-between font-semibold text-slate-700">
          <span>System Status</span>
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
            Active
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          Mesh Nodes: 12 Assets &bull; 7 Wards
        </div>
      </div>
    </aside>
  );
};
