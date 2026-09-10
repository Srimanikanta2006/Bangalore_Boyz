import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Shield, Search, Bell, User, LayoutDashboard, 
  Map as MapIcon, AlertTriangle, Radio, PlayCircle, 
  Building2, BarChart3, History, Users, Satellite, LogOut
} from 'lucide-react';

interface GovHqLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

export const GovHqLayout: React.FC<GovHqLayoutProps> = ({ children, activePath }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const current = activePath || location.pathname;

  const navItems = [
    { label: 'Overview', path: '/gov/overview', icon: LayoutDashboard },
    { label: 'Live Map', path: '/gov/zone-cascade/4B', icon: MapIcon },
    { label: 'Incidents', path: '/gov/response-center', icon: AlertTriangle },
    { label: 'Response Center', path: '/gov/response-center', icon: Radio },
    { label: 'Simulator', path: '/gov/simulator', icon: PlayCircle },
    { label: 'Infrastructure', path: '/gov/critical-assets', icon: Building2 },
  ];

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen font-sans">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-[#e5eeff] shadow-xs">
        <div className="w-full h-14 px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/gov/overview" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs">
                CS
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-[#0b1c30]">ClimateShield</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#e5eeff] text-[#45464d]">
                  EOC OPS
                </span>
              </div>
            </Link>

            <div className="hidden xl:flex items-center gap-1.5 text-xs text-[#76777d]">
              <span>/</span>
              <span className="text-[#45464d]">Operations Suite</span>
              <span>/</span>
              <span className="text-[#0051d5] font-semibold">HQ Tactical Feed</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl hidden md:flex items-center">
            <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#eff4ff] text-[#45464d] hover:bg-[#e5eeff] cursor-pointer transition-colors border border-[#d3e4fe]">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#76777d]" />
                <span className="text-xs">Search incidents, sectors, telemetry, or dispatch units...</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white rounded border border-[#d3e4fe]">⌘K</span>
            </div>
          </div>

          {/* User & Global Status */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eff4ff] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#0051d5] animate-pulse" />
              <span className="text-[#45464d]">Grid:</span>
              <span className="font-bold text-[#0051d5]">Active • 99.8%</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e5eeff] text-xs text-[#0b1c30] font-semibold">
              <Shield className="w-3.5 h-3.5 text-[#0051d5]" />
              <span>HQ EOC-9</span>
            </div>

            <button 
              onClick={() => navigate('/login')} 
              title="Switch role"
              className="p-1.5 rounded-lg text-[#45464d] hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <div className="w-8 h-8 rounded-full bg-[#0f172a] text-white flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Left Sidebar */}
      <aside className="fixed left-0 top-14 bottom-0 w-64 bg-white border-r border-[#e5eeff] z-40 flex flex-col justify-between shadow-xs">
        <div className="flex flex-col flex-1 py-3 overflow-y-auto">
          <div className="px-4 py-1 text-[11px] font-bold text-[#76777d] uppercase tracking-wider">
            Command Center
          </div>

          <nav className="px-2 space-y-1 mt-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = current === item.path || (item.path !== '/gov/overview' && current.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#0f172a] text-white shadow-xs'
                      : 'text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#4cd7f6]' : 'text-[#45464d]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Dispatch Engine Status */}
        <div className="p-3 bg-[#eff4ff] m-2 rounded-xl border border-[#d3e4fe] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#76777d] uppercase">Dispatch Engine</span>
            <span className="text-[10px] font-mono font-bold text-[#0051d5]">ONLINE</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#0b1c30]">
            <Satellite className="w-3.5 h-3.5 text-[#0051d5]" />
            <span className="truncate">LEO Sat-Link 04 Synced</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="pl-64 pt-14">
        {children}
      </div>
    </div>
  );
};
export default GovHqLayout;
