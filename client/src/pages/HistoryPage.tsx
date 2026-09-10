import React from 'react';
import {
  History,
  AlertTriangle,
  Repeat,
  CloudRain,
  Flame,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { HistoricalRepeatLocation } from '../types';

interface HistoryPageProps {
  history: HistoricalRepeatLocation[];
  onNavigate: (route: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ history, onNavigate }) => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-sky-800" />
            <span>Historical Intelligence & Recurring Hotspots</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational retrospective answering: <em>Which locations repeatedly experience the same climate disruption?</em>
          </p>
        </div>

        <button
          onClick={() => onNavigate('risk-map')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-900 hover:bg-sky-800 text-white font-medium text-xs shadow-xs transition"
        >
          <span>Correlate on GIS Map</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Recurrence Summary Banner */}
      <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Identified Chronic Hotspots
          </span>
          <span className="text-xl font-black text-slate-900 mt-0.5 block">
            {history.length} Critical Locations
          </span>
          <span className="text-[11px] text-slate-500">
            Locations with $\ge$4 severe disruptions over the past 12 months
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Average Incident MTTR
          </span>
          <span className="text-xl font-black text-sky-800 mt-0.5 block">
            3.3 Hours
          </span>
          <span className="text-[11px] text-slate-500">
            Mean time to dewatering and operational road clearance
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Primary Recurrence Trigger
          </span>
          <span className="text-xl font-black text-rose-700 mt-0.5 block">
            Pluvial Drainage Deficit
          </span>
          <span className="text-[11px] text-slate-500">
            Valley depression terrain & silt intake obstruction
          </span>
        </div>
      </div>

      {/* Chronic Problem Location Cards */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Chronic Disruption Locations & Recurrence Patterns
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((loc) => {
            const isFlood = loc.hazardType === 'FLOOD';

            return (
              <div
                key={loc.assetId}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        {isFlood ? (
                          <CloudRain className="w-4 h-4 text-blue-700" />
                        ) : (
                          <Flame className="w-4 h-4 text-orange-600" />
                        )}
                        <h3 className="font-bold text-sm text-slate-900">{loc.assetName}</h3>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{loc.wardName}</span>
                        <span>&bull;</span>
                        <span>Elevation: {loc.elevationM}m MSL</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-rose-700">
                        {loc.totalIncidentsLast12m}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Incidents (12m)</span>
                    </div>
                  </div>

                  {/* Operational Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium">Average Severity</span>
                      <span className="font-bold text-rose-800">{loc.averageSeverity}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium">Avg Resolution Time</span>
                      <span className="font-bold text-slate-800">{loc.averageResolutionHours} Hours</span>
                    </div>
                  </div>

                  {/* Recurring Trigger Explanation */}
                  <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200 text-xs text-amber-900 mb-3">
                    <span className="font-bold text-[10px] uppercase tracking-wider block text-amber-800 mb-0.5">
                      Recurring Root Trigger:
                    </span>
                    <p className="text-[11px] leading-relaxed">{loc.recurringTrigger}</p>
                  </div>

                  {/* Past Incident Log Table */}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Past Incident Log (Sample)
                    </div>
                    <div className="space-y-1 text-[11px]">
                      {loc.pastIncidents.slice(0, 3).map((past, idx) => (
                        <div
                          key={idx}
                          className="p-1.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-between text-slate-600"
                        >
                          <span className="font-mono text-slate-800 font-semibold">{past.date}</span>
                          <span className="text-slate-500 truncate max-w-[180px]">{past.triggerValue}</span>
                          <span className="font-mono text-slate-700">{past.resolutionTimeHours}h MTTR</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Drainage Rating: <strong className="text-slate-700">{loc.drainageQuality}</strong></span>
                  <button
                    onClick={() => onNavigate('risk-map')}
                    className="text-sky-700 hover:text-sky-900 font-semibold"
                  >
                    Locate on Risk Map &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
