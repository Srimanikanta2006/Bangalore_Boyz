import React from 'react';
import { Users, Phone, Radio, MapPin, ShieldCheck, Truck } from 'lucide-react';

export const TeamPage: React.FC = () => {
  const teams = [
    {
      name: 'BBMP Stormwater Drain (SWD) Rapid Taskforce',
      lead: 'Chief Engineer M. Chenna',
      contact: '+91 80 2222 1188',
      radioChannel: 'VHF Ch 4 (SWD-Koramangala)',
      headquarters: 'Ward 151 Zone Office, 80ft Road',
      personnelCount: 38,
      equipment: ['4x Trailer Dewatering Pumps (400 m³/h)', '2x Super Sucker Jetting Tankers', 'Modular Flood Deflectors'],
      activeIncidents: 1,
    },
    {
      name: 'BESCOM Grid Defense & Substation Unit',
      lead: 'Executive Engineer S. Patil',
      contact: '1912 / +91 80 2287 3374',
      radioChannel: 'VHF Ch 7 (Grid Dispatch)',
      headquarters: 'Central Load Dispatch, Rajajinagar',
      personnelCount: 24,
      equipment: ['Mobile Diesel Generators (500 kVA)', 'Transformer FLIR Thermal Imagers', 'High-Voltage Insulating Barriers'],
      activeIncidents: 1,
    },
    {
      name: 'Bangalore Traffic Police (Rapid Diversion Squad)',
      lead: 'Inspector S. Rajesh',
      contact: '103 / +91 80 2294 2888',
      radioChannel: 'VHF Ch 1 (Traffic Ops)',
      headquarters: 'Traffic Management Center, Infantry Rd',
      personnelCount: 45,
      equipment: ['Variable Message LED Signs', 'Pneumatic Detour Barriers', 'Interceptor Quick-Response Vehicles'],
      activeIncidents: 1,
    },
    {
      name: 'State Disaster Response Force (SDRF) Quick Squad 3',
      lead: 'Commandant R. Deshmukh',
      contact: '+91 80 2221 4051',
      radioChannel: 'HF Ch 12 (Disaster Command)',
      headquarters: 'SDRF Regional Base, Hebbal',
      personnelCount: 50,
      equipment: ['Inflatable Zodiac Rescue Boats', 'Submersible Mud Sump Pumps', 'Emergency Relief Tents & Generators'],
      activeIncidents: 0,
    },
    {
      name: 'Municipal Public Health & Heat Action Taskforce',
      lead: 'Dr. Ananya Rao',
      contact: '+91 80 2266 0000',
      radioChannel: 'VHF Ch 9 (Health Core)',
      headquarters: 'Directorate of Health Services, Majestic',
      personnelCount: 30,
      equipment: ['Mobile Water Misting Cannons', 'ORS Hydration Distribution Units', 'Core-Body Temperature Triage Baths'],
      activeIncidents: 1,
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-800" />
          <span>Municipal Response Teams & Dispatch Roster</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Authorized disaster response squads, duty supervisors, radio frequencies, and pre-positioned tactical equipment
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                <div>
                  <h3 className="font-bold text-xs text-slate-900 leading-snug">{team.name}</h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">Lead: {team.lead}</div>
                </div>
                {team.activeIncidents > 0 ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                    Deployed
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Standby
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="font-mono">{team.contact}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="font-mono">{team.radioChannel}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{team.headquarters}</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Tactical Equipment:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-600">
                  {team.equipment.map((eq, i) => (
                    <li key={i}>{eq}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Active Personnel: <strong className="text-slate-800">{team.personnelCount}</strong></span>
              <span>Incidents: <strong className="text-slate-800">{team.activeIncidents}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
