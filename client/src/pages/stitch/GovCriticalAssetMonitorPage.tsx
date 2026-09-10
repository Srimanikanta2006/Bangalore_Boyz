import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GovHqLayout } from '../../components/stitch/GovHqLayout';
import { 
  Building2, Search, Filter, Shield, AlertTriangle, 
  Zap, Droplet, Truck, HeartPulse, CheckCircle2, 
  Activity, ArrowUpDown, RefreshCw, FileText, ChevronRight
} from 'lucide-react';

export const GovCriticalAssetMonitorPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'vulnerability' | 'latency' | 'capacity'>('vulnerability');

  const assets = [
    {
      id: 'AST-01',
      name: 'St. Jude Regional Medical Center',
      category: 'healthcare',
      categoryLabel: 'Healthcare Facility',
      vulnerability: 98,
      status: 'CRITICAL VULNERABILITY',
      accessAlert: 'Access: Egress Blocked by Flash Flood (Gate B & C)',
      impactNote: '+14m ambulance diversion delay',
      powerFailover: '100% Nominal Gen-Set',
      telemetryLatency: '18ms',
      actionLabel: 'Dispatch Dam Barrier Rig'
    },
    {
      id: 'AST-02',
      name: 'Substation 9 East Delta',
      category: 'power',
      categoryLabel: 'Power & Grid Substation',
      vulnerability: 82,
      status: 'HIGH RISK',
      accessAlert: 'Inundation margin: 0.35m from perimeter containment berm',
      impactNote: '88% transformer grid load',
      powerFailover: '94% Grid Redundancy',
      telemetryLatency: '24ms',
      actionLabel: 'Deploy Sandbag Perimeter'
    },
    {
      id: 'AST-03',
      name: 'Bayshore Intermodal Underpass & Culvert',
      category: 'transit',
      categoryLabel: 'Transit & Transportation',
      vulnerability: 94,
      status: 'CRITICAL VULNERABILITY',
      accessAlert: 'Complete Submersion: 1.65m depth at culvert intake',
      impactNote: 'Heavy vehicle clearance closed',
      powerFailover: 'N/A',
      telemetryLatency: '12ms',
      actionLabel: 'Inspect Hydraulic Drain'
    },
    {
      id: 'AST-04',
      name: 'Central Water Reclamation Facility #4',
      category: 'water',
      categoryLabel: 'Water Treatment Plant',
      vulnerability: 64,
      status: 'MODERATE CAUTION',
      accessAlert: 'Sump capacity at 82% peak load',
      impactNote: 'Secondary pump activated',
      powerFailover: '100% Redundant',
      telemetryLatency: '32ms',
      actionLabel: 'Check Valve Array'
    }
  ];

  const filteredAssets = assets.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <GovHqLayout activePath="/gov/critical-assets">
      <div className="p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#dce9ff] text-[#0051d5] text-xs font-bold uppercase tracking-wider">
                Sector Telemetry Active
              </span>
              <span className="text-xs font-mono text-[#76777d]">LATENCY: 42ms • GRID-SYNC</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight mt-1">
              Critical Asset & Infrastructure Readiness
            </h1>
            <p className="text-xs text-[#45464d] mt-0.5">
              Real-time municipal vulnerability scoring, flood inundation proximity, and power failover status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#0b1c30] hover:bg-[#eff4ff] text-xs font-semibold border border-[#e5eeff] shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#0051d5]" />
              <span>Refresh Feeds</span>
            </button>
            <button 
              type="button"
              onClick={() => navigate('/gov/response-center')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-bold shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Vulnerability Report</span>
            </button>
          </div>
        </div>

        {/* Summary Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#76777d] uppercase font-bold">
              <span>Monitored Facilities</span>
              <Building2 className="w-4 h-4 text-[#0051d5]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#0b1c30]">84</span>
              <span className="text-xs text-[#76777d]">Sector EOC-9</span>
            </div>
            <span className="text-[11px] text-[#0051d5] font-semibold mt-1">100% In-System Reporting</span>
          </div>

          <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#dc2626] uppercase font-bold">
              <span>Vulnerable Assets</span>
              <AlertTriangle className="w-4 h-4 text-[#dc2626]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#dc2626]">05</span>
              <span className="text-xs text-[#93000a]">Requiring Action</span>
            </div>
            <span className="text-[11px] text-[#dc2626] font-semibold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] animate-pulse" />
              1 Critical Escalation Active
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#76777d] uppercase font-bold">
              <span>Drainage Backup</span>
              <Droplet className="w-4 h-4 text-[#0051d5]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#0b1c30]">96.2%</span>
              <span className="text-xs text-[#0051d5] font-semibold">High Ready</span>
            </div>
            <div className="mt-2 w-full bg-[#e5eeff] rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#0051d5] h-full rounded-full" style={{ width: '96.2%' }} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#76777d] uppercase font-bold">
              <span>Generator Reserves</span>
              <Zap className="w-4 h-4 text-[#0051d5]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#0b1c30]">100%</span>
              <span className="text-xs text-[#0051d5] font-semibold">Full Redundancy</span>
            </div>
            <span className="text-[11px] font-mono text-[#76777d] mt-1">RUN-TIME SECURED &gt; 72H</span>
          </div>
        </div>

        {/* Filters, Tabs & Search Strip */}
        <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Category Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs font-semibold">
              {[
                { id: 'all', label: 'All Facilities (84)' },
                { id: 'healthcare', label: 'Healthcare & Hospitals (14)' },
                { id: 'power', label: 'Power & Grid (18)' },
                { id: 'water', label: 'Water Treatment (12)' },
                { id: 'transit', label: 'Transit & Bridges (22)' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                    activeCategory === cat.id 
                      ? 'bg-[#0f172a] text-white shadow-xs' 
                      : 'bg-[#eff4ff] text-[#45464d] hover:bg-[#e5eeff]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search & Sort */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative flex items-center w-60">
                <Search className="w-4 h-4 text-[#76777d] absolute left-3" />
                <input 
                  type="text"
                  placeholder="Search asset or sector..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#eff4ff] text-xs text-[#0b1c30] border border-[#d3e4fe] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Active Incident Inventory Stream */}
        <div className="flex flex-col gap-3">
          {filteredAssets.map(asset => (
            <div 
              key={asset.id}
              className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden hover:border-[#0051d5] transition-all"
            >
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                asset.vulnerability > 90 ? 'bg-[#dc2626]' : 'bg-[#ea580c]'
              }`} />

              <div className="flex flex-col gap-1 pl-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm text-[#0b1c30]">{asset.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    asset.vulnerability > 90 ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#ffedd5] text-[#c2410c]'
                  }`}>
                    {asset.status} ({asset.vulnerability}/100)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#45464d] text-[10px]">
                    {asset.categoryLabel}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs mt-1">
                  <span className="text-[#0b1c30] font-semibold">{asset.accessAlert}</span>
                  <span className="text-[#76777d]">•</span>
                  <span className="text-[#dc2626] font-mono">{asset.impactNote}</span>
                </div>
              </div>

              {/* Telemetry Figures */}
              <div className="flex items-center gap-4 px-3 py-2 rounded-xl bg-[#eff4ff] border border-[#d3e4fe] shrink-0 text-xs">
                <div>
                  <span className="text-[10px] text-[#76777d] block uppercase font-bold">Failover</span>
                  <span className="font-bold text-[#0b1c30] font-mono">{asset.powerFailover}</span>
                </div>
                <div className="w-px h-6 bg-[#dce9ff]" />
                <div>
                  <span className="text-[10px] text-[#76777d] block uppercase font-bold">Latency</span>
                  <span className="font-bold text-[#0051d5] font-mono">{asset.telemetryLatency}</span>
                </div>
                <button 
                  onClick={() => navigate('/gov/zone-cascade/4B')}
                  className="ml-2 px-3 py-1.5 rounded-lg bg-[#0f172a] text-white font-semibold text-xs hover:bg-[#1e293b] transition-colors"
                >
                  {asset.actionLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GovHqLayout>
  );
};
export default GovCriticalAssetMonitorPage;
