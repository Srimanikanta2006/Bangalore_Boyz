import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GovHqLayout } from '../../components/stitch/GovHqLayout';
import { getActiveRegion } from '../../citizen/geo';
import { 
  AlertTriangle, Filter, Search, Download, 
  CheckCircle2, Clock, MapPin, Shield, FileText, ArrowRight
} from 'lucide-react';

export const GovIncidentsPage: React.FC = () => {
  const navigate = useNavigate();
  const activeRegion = getActiveRegion();
  const isNepal = activeRegion === 'NEPAL';

  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'high' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const nepalIncidents = [
    {
      id: 'INC-KTM-01',
      code: 'KTM-2026-01',
      title: 'Bagmati River Bank Breach & Inundation',
      location: 'Kathmandu Valley Basin (Kantipath Lowland Route)',
      severity: 'CRITICAL',
      status: 'ACTIVE_DISPATCH',
      category: 'FLASH_FLOOD',
      waterDepth: '2.1m',
      riskScore: 94,
      timestamp: '12 min ago',
      assignedUnit: 'Kathmandu Emergency Water Rescue 01',
    },
    {
      id: 'INC-KTM-02',
      code: 'KTM-2026-02',
      title: 'Balkhu Highway Interchange Submersion',
      location: 'Balkhu Highway Corridor',
      severity: 'HIGH',
      status: 'UNDER_MITIGATION',
      category: 'ROAD_BLOCKED',
      waterDepth: '1.8m',
      riskScore: 82,
      timestamp: '28 min ago',
      assignedUnit: 'High-Pumping Division 03',
    },
    {
      id: 'INC-KTM-03',
      code: 'KTM-2026-03',
      title: 'Tribhuvan Trauma Hub Access Ramp Flooding',
      location: 'Kantipath Arterial Gate B',
      severity: 'CRITICAL',
      status: 'VERIFIED',
      category: 'MEDICAL_ACCESS',
      waterDepth: '1.2m',
      riskScore: 76,
      timestamp: '45 min ago',
      assignedUnit: 'Dam Barrier Unit 02',
    },
    {
      id: 'INC-KTM-HIST-01',
      code: 'KTM-2024-09',
      title: 'Historical Bagmati Monsoon Flash Flood Event',
      location: 'Kathmandu Basin (Historical Record)',
      severity: 'CRITICAL',
      status: 'RESOLVED_HISTORICAL',
      category: 'FLASH_FLOOD',
      waterDepth: '2.4m',
      riskScore: 98,
      timestamp: 'Historical Log (Sept 2024)',
      assignedUnit: 'National Emergency Operation Center',
    },
  ];

  const baseIncidents = [
    {
      id: 'INC-204',
      code: 'EB-2026-04',
      title: 'Flash Inundation on Bayshore Arterial',
      location: 'Bayshore Blvd at Marker 4A (St. Jude Route)',
      severity: 'CRITICAL',
      status: 'ACTIVE_DISPATCH',
      category: 'FLASH_FLOOD',
      waterDepth: '1.4m',
      riskScore: 88,
      timestamp: '3 min ago',
      assignedUnit: 'Unit 4 (Heavy Pump 02)',
    },
    {
      id: 'INC-202',
      code: 'EB-2026-02',
      title: 'Stranded Civilian Vehicle in Underpass',
      location: 'Mission Valley Underpass / 4th St',
      severity: 'CRITICAL',
      status: 'UNDER_RESCUE',
      category: 'CIVILIAN_RESCUE',
      waterDepth: '1.1m',
      riskScore: 84,
      timestamp: '14 min ago',
      assignedUnit: 'Taskforce Alpha-02',
    },
    {
      id: 'INC-198',
      code: 'MT-2026-12',
      title: 'Downed High-Voltage Line across 7th Ave',
      location: '7th Ave @ Pine St • Substation 12G',
      severity: 'HIGH',
      status: 'UNDER_MITIGATION',
      category: 'GRID_FAILURE',
      waterDepth: '0.4m',
      riskScore: 67,
      timestamp: '32 min ago',
      assignedUnit: 'Utility Crew Unit 4',
    },
  ];

  const allIncidents = isNepal ? nepalIncidents : baseIncidents;

  const filteredIncidents = allIncidents.filter((item) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'critical' && item.severity === 'CRITICAL') ||
      (activeFilter === 'high' && item.severity === 'HIGH') ||
      (activeFilter === 'resolved' && item.status.includes('RESOLVED'));

    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleExportIncidentsSitrep = () => {
    const dataStr = JSON.stringify(filteredIncidents, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ClimateShield_Incidents_SITREP_${activeRegion}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <GovHqLayout activePath="/gov/incidents">
      <div className="p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-xs font-bold uppercase tracking-wider">
                Region: {isNepal ? 'Kathmandu Valley, Nepal' : 'East Basin, Chennai'}
              </span>
              <span className="text-xs font-mono text-[#76777d]">INCIDENT LOG & AUDIT FEED</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight mt-1">
              Incidents & Historical Hazard Registry
            </h1>
            <p className="text-xs text-[#45464d] mt-0.5">
              Comprehensive disaster event log, emergency escalation records, and regional incident history.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportIncidentsSitrep}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-bold shadow-sm transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Incidents SITREP</span>
            </button>
          </div>
        </div>

        {/* Filters & Search Strip */}
        <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold">
            {[
              { id: 'all', label: `All Incidents (${allIncidents.length})` },
              { id: 'critical', label: 'Critical P1' },
              { id: 'high', label: 'High Priority' },
              { id: 'resolved', label: 'Historical Logs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                  activeFilter === tab.id
                    ? 'bg-[#0f172a] text-white shadow-xs'
                    : 'bg-[#eff4ff] text-[#45464d] hover:bg-[#e5eeff]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex items-center w-full md:w-72">
            <Search className="w-4 h-4 text-[#76777d] absolute left-3" />
            <input
              type="text"
              placeholder="Search by code, title or location…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#eff4ff] text-xs text-[#0b1c30] border border-[#d3e4fe] focus:outline-none"
            />
          </div>
        </div>

        {/* Incident List Table */}
        <div className="flex flex-col gap-3">
          {filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden hover:border-[#0051d5] transition-all"
            >
              <div
                className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                  inc.severity === 'CRITICAL' ? 'bg-[#dc2626]' : 'bg-[#ea580c]'
                }`}
              />

              <div className="flex flex-col gap-1 pl-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#0051d5] bg-[#eff4ff] px-2 py-0.5 rounded">
                    #{inc.code}
                  </span>
                  <h3 className="font-bold text-sm text-[#0b1c30]">{inc.title}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      inc.severity === 'CRITICAL' ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#ffedd5] text-[#c2410c]'
                    }`}
                  >
                    {inc.severity}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs mt-1 text-[#45464d]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0051d5]" />
                    {inc.location}
                  </span>
                  <span>•</span>
                  <span>Water Depth: <strong className="text-[#dc2626] font-mono">{inc.waterDepth}</strong></span>
                  <span>•</span>
                  <span className="text-[#76777d]">{inc.timestamp}</span>
                </div>
              </div>

              {/* Status & Action */}
              <div className="flex items-center gap-4 px-3 py-2 rounded-xl bg-[#eff4ff] border border-[#d3e4fe] shrink-0 text-xs">
                <div>
                  <span className="text-[10px] text-[#76777d] block uppercase font-bold">Assigned Unit</span>
                  <span className="font-bold text-[#0b1c30]">{inc.assignedUnit}</span>
                </div>
                <button
                  onClick={() => navigate('/gov/zone-cascade/4B')}
                  className="px-3 py-1.5 rounded-lg bg-[#0f172a] text-white font-semibold text-xs hover:bg-[#1e293b] transition flex items-center gap-1"
                >
                  <span>View Cascade</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GovHqLayout>
  );
};

export default GovIncidentsPage;
