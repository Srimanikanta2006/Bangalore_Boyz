import React, { useState } from 'react';
import { Settings, Database, Clock, Sliders, ShieldCheck } from 'lucide-react';
import { DataQualityStatus } from '../types';

interface SettingsPageProps {
  dataQuality: DataQualityStatus | null;
  onToggleStale: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ dataQuality, onToggleStale }) => {
  const [pollInterval, setPollInterval] = useState('180');
  const [slaMinutes, setSlaMinutes] = useState('15');
  const [criticalThreshold, setCriticalThreshold] = useState('80');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-xs text-slate-700">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-800" />
          <span>Operational Platform Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Environmental data ingestion endpoints, calculation sensitivities, and incident escalation parameters
        </p>
      </div>

      <div className="space-y-4">
        {/* Data Stream Settings */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-sky-700" />
            <span>Meteorological Ingestion Service</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Primary Meteorological API</label>
              <input
                type="text"
                disabled
                value="https://api.open-meteo.com/v1/forecast"
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Ingestion Polling Frequency (seconds)</label>
              <input
                type="number"
                value={pollInterval}
                onChange={(e) => setPollInterval(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800">Simulate Stale/Delayed Weather Data:</span>
              <p className="text-[11px] text-slate-500">
                Tests how the risk engine flags uncertainty and degrades confidence when real-world APIs disconnect.
              </p>
            </div>
            <button
              onClick={onToggleStale}
              className={`px-3 py-1.5 rounded-md font-semibold text-xs border transition ${
                dataQuality?.status === 'STALE'
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {dataQuality?.status === 'STALE' ? 'Stale Simulation Active (Turn Off)' : 'Simulate Telemetry Delay'}
            </button>
          </div>
        </div>

        {/* Escalation & SLA Rules */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-700" />
            <span>Escalation & SLA Automation</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">
                Unacknowledged Escalation Threshold (minutes)
              </label>
              <input
                type="number"
                value={slaMinutes}
                onChange={(e) => setSlaMinutes(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">
                Critical Severity Floor (Risk Score 0–100)
              </label>
              <input
                type="number"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Risk Factor Weights Reference */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-2 text-[11px]">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-sky-700" />
            <span>Mathematical Risk Calibration Formula</span>
          </h2>
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 font-mono text-slate-800">
            Composite Score = (Hazard × 0.42) + (Elevation Exposure × 0.28) + (Drain Deficit Vulnerability × 0.30) - (Pump Resilience × 0.14)
          </div>
          <p className="text-slate-500">
            Formulas are calibrated based on urban hydrological runoff modeling and Steadman/WBGT apparent thermal metrics.
          </p>
        </div>
      </div>
    </div>
  );
};
