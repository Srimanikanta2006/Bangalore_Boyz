import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GovHqLayout } from '../../components/stitch/GovHqLayout';
import { 
  AlertTriangle, Radio, Users, Timer, CheckCircle2, 
  MapPin, Shield, Plus, ArrowRight, Truck, Hospital, 
  Zap, Search, ChevronRight, Layers, Bell, Check, X, ShieldCheck, Siren
} from 'lucide-react';
import { getActiveLocationDetails } from '../../citizen/geo';

interface RescueDriverRegistration {
  id: string;
  driverName: string;
  department: string;
  vehicleType: string;
  callsign: string;
  licenseId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
}

export const GovResponseCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const locDetails = getActiveLocationDetails();
  const [regionToken, setRegionToken] = useState(0);

  useEffect(() => {
    const handleRegionEvent = () => setRegionToken((t) => t + 1);
    window.addEventListener('climateshield_region_changed', handleRegionEvent);
    return () => window.removeEventListener('climateshield_region_changed', handleRegionEvent);
  }, []);

  const [assignedModal, setAssignedModal] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Rescue Driver Approval Queue State
  const [drivers, setDrivers] = useState<RescueDriverRegistration[]>([
    {
      id: 'drv-01',
      driverName: 'Rahul Sharma',
      department: 'EMS & Medical Emergency',
      vehicleType: 'AMBULANCE',
      callsign: 'ALS-AMB-01',
      licenseId: 'DL-IND-9941',
      status: 'APPROVED',
      requestedAt: '10 mins ago',
    },
    {
      id: 'drv-02',
      driverName: 'Vikram Singh',
      department: 'Police Department Patrol',
      vehicleType: 'POLICE_CAR',
      callsign: 'PATROL-POLICE-09',
      licenseId: 'DL-IND-8820',
      status: 'APPROVED',
      requestedAt: '25 mins ago',
    },
    {
      id: 'drv-03',
      driverName: 'Manoj Kumar',
      department: 'Fire & Emergency Services',
      vehicleType: 'FIRE_EXTINGUISHER',
      callsign: 'FIRE-ENGINE-04',
      licenseId: 'DL-IND-7731',
      status: 'PENDING',
      requestedAt: '2 mins ago',
    },
    {
      id: 'drv-04',
      driverName: 'Anita Roy',
      department: 'Water Rescue Squad',
      vehicleType: 'RESCUE_BOAT',
      callsign: 'RESCUE-BOAT-02',
      licenseId: 'DL-IND-6612',
      status: 'PENDING',
      requestedAt: 'Just now',
    },
  ]);

  const incidents = [
    {
      id: 'INC-204',
      level: 'Critical',
      tag: 'FLOOD',
      dept: 'Rescue / DPW Unified',
      sla: '04:12 remaining',
      title: `Flash Inundation near ${locDetails.name} — Hospital Access Threatened`,
      location: `${locDetails.name} Corridor (Trauma Center Route)`,
      unit: 'ALS-AMB-01 En Route',
      elapsed: '+3m elapsed',
      color: '#ba1a1a',
    },
    {
      id: 'INC-202',
      level: 'Critical',
      tag: 'FLOOD RESCUE',
      dept: 'Fire & Water Rescue',
      sla: '01:45 remaining',
      title: 'Stranded Civilian Vehicle in Underpass (Water Depth 1.1m)',
      location: `${locDetails.name} Lowland Crossing`,
      unit: 'FIRE-ENGINE-04 Assigned',
      elapsed: '+1m elapsed',
      color: '#ba1a1a',
    },
  ];

  const handleAssign = (id: string) => {
    setAssignedModal(id);
    setTimeout(() => {
      setAssignedModal(null);
      setSuccessToast(`Dispatch instructions updated for #${id}`);
      setTimeout(() => setSuccessToast(null), 3000);
    }, 1000);
  };

  const handleApproveDriver = (driverId: string) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, status: 'APPROVED' } : d))
    );
    setSuccessToast('Rescue driver credentials approved and synced to live HQ map!');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleRejectDriver = (driverId: string) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, status: 'REJECTED' } : d))
    );
  };

  return (
    <GovHqLayout activePath="/gov/response-center">
      <div className="flex flex-col w-full">
        {/* Toast Alert */}
        {successToast && (
          <div className="fixed top-16 right-6 z-50 bg-slate-950 text-white border border-slate-700 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Top Command Telemetry Ribbon */}
        <div className="w-full bg-white border-b border-[#e5eeff] px-6 py-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 flex-wrap text-xs">
              <div className="flex items-baseline gap-2">
                <span className="text-[#76777d] uppercase font-bold text-[10px]">Active Incidents</span>
                <span className="text-xl font-extrabold text-[#0b1c30]">12</span>
                <span className="text-[#ba1a1a] font-bold font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-ping" />
                  2 P1 Critical
                </span>
              </div>
              <div className="h-6 w-px bg-[#e5eeff]" />
              <div className="flex items-baseline gap-2">
                <span className="text-[#76777d] uppercase font-bold text-[10px]">Registered Drivers</span>
                <span className="text-xl font-extrabold text-[#0051d5]">{drivers.filter(d => d.status === 'APPROVED').length}</span>
                <span className="text-[#45464d]">/ {drivers.length} total</span>
              </div>
              <div className="h-6 w-px bg-[#e5eeff]" />
              <div className="flex items-baseline gap-2">
                <span className="text-[#76777d] uppercase font-bold text-[10px]">Pending Approvals</span>
                <span className="text-xl font-extrabold text-[#ba1a1a]">
                  {drivers.filter(d => d.status === 'PENDING').length}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => navigate('/gov/zone-cascade/4B')}
                className="px-3.5 py-1.5 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] text-xs font-semibold flex items-center gap-1.5 border border-[#d3e4fe]"
              >
                <Layers className="w-3.5 h-3.5 text-[#0051d5]" />
                <span>Live Map Radar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Operational Split Workspace */}
        <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Incident Priority Queues (Left & Center: 7 Cols) */}
          <div className="xl:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-bold text-base text-[#0b1c30]">Response Dispatch Matrix</h2>
              <span className="text-xs text-[#76777d] font-mono">Location: {locDetails.name}</span>
            </div>

            <div className="flex flex-col gap-3">
              {incidents.map((inc) => (
                <article 
                  key={inc.id}
                  className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl shadow-sm border border-[#e5eeff] hover:border-[#0051d5] transition-all overflow-hidden"
                >
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[#ffdad6] text-[#93000a]">
                        {inc.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0051d5]">
                        {inc.tag}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#0b1c30] mt-0.5">{inc.title}</h3>
                    <p className="text-xs text-[#45464d] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#76777d]" />
                      <span>{inc.location}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs">
                      <div className="font-bold text-[#0b1c30]">{inc.unit}</div>
                      <div className="text-[10px] text-[#76777d]">{inc.sla}</div>
                    </div>
                    <button
                      onClick={() => handleAssign(inc.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#0f172a] text-white font-bold text-xs hover:bg-slate-800 transition-colors"
                    >
                      Dispatch
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Rescue Driver Registration & Approval Management (Right: 5 Cols) */}
          <aside className="xl:col-span-5 bg-white rounded-2xl p-4 shadow-sm border border-[#e5eeff] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#e5eeff] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0051d5]" />
                <h2 className="font-bold text-sm text-[#0b1c30]">Rescue Driver Credential Approvals</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eff4ff] text-[#0051d5]">
                EOC AUTH
              </span>
            </div>

            <p className="text-xs text-[#45464d]">
              Review and approve field rescue teams/drivers requesting clearance to receive dispatch missions and transmit live GPS to the EOC HQ Map.
            </p>

            <div className="space-y-3">
              {drivers.map((d) => (
                <div key={d.id} className="p-3 rounded-xl border border-[#e5eeff] bg-[#f8f9ff] flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#0b1c30] flex items-center gap-1.5">
                        <Siren className="w-3.5 h-3.5 text-[#0051d5]" />
                        <span>{d.driverName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#e5eeff] text-[#0b1c30]">
                          {d.callsign}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#76777d] mt-0.5">
                        {d.department} • License: {d.licenseId}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        d.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : d.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>

                  {d.status === 'PENDING' && (
                    <div className="flex items-center gap-2 pt-1 border-t border-[#e5eeff]">
                      <button
                        onClick={() => handleApproveDriver(d.id)}
                        className="flex-1 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-emerald-700 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Team
                      </button>
                      <button
                        onClick={() => handleRejectDriver(d.id)}
                        className="px-3 py-1 rounded-lg bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center gap-1 hover:bg-red-200 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </GovHqLayout>
  );
};

export default GovResponseCenterPage;
