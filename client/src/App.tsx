import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ScenarioBar } from './components/ScenarioBar';
import { MapView } from './components/MapView';
import { AssetRegister } from './components/AssetRegister';
import { AlertsPanel } from './components/AlertsPanel';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { RiskExplainModal } from './components/RiskExplainModal';
import { NewAssetModal } from './components/NewAssetModal';

import {
  Ward,
  Asset,
  WeatherReading,
  AssetRiskAssessment,
  Alert,
  SimulationScenario,
  CitySummaryStats,
} from './types';

import {
  fetchStats,
  fetchWards,
  fetchAssets,
  createAsset,
  fetchWeather,
  refreshLiveWeather,
  applyScenario,
  applyCustomWeather,
  fetchScenarios,
  fetchRisks,
  fetchAlerts,
  updateAlertStatus,
} from './services/api';

export const App: React.FC = () => {
  // Application State
  const [stats, setStats] = useState<CitySummaryStats | null>(null);
  const [weather, setWeather] = useState<WeatherReading | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [wards, setWards] = useState<Ward[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [risks, setRisks] = useState<AssetRiskAssessment[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'map' | 'assets' | 'alerts' | 'analytics'>('map');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  const [selectedAssetForExplain, setSelectedAssetForExplain] = useState<string | null>(null);

  // Load all initial data
  const loadInitialData = useCallback(async () => {
    try {
      const [wardsData, assetsData, scenariosData, weatherData, risksData, alertsData, statsData] =
        await Promise.all([
          fetchWards(),
          fetchAssets(),
          fetchScenarios(),
          fetchWeather(),
          fetchRisks(),
          fetchAlerts(),
          fetchStats(),
        ]);

      setWards(wardsData);
      setAssets(assetsData);
      setScenarios(scenariosData);
      setWeather(weatherData.reading);
      setActiveScenarioId(weatherData.activeScenarioId);
      setRisks(risksData);
      setAlerts(alertsData);
      setStats(statsData);
    } catch (err) {
      console.error('[App] Error loading initial platform data:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    // Setup WebSocket connection for live telemetry
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connected to ClimateShield real-time telemetry stream');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'INIT_SNAPSHOT' || message.type === 'WEATHER_AND_RISK_UPDATE') {
            const data = message.data || message;
            if (data.weather) setWeather(data.weather);
            if (data.risks) setRisks(data.risks);
            if (data.alerts) setAlerts(data.alerts);
            if (data.stats) setStats(data.stats);
          }
        } catch (e) {
          console.error('[WebSocket] Failed to parse message', e);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WebSocket] Connection error, relying on REST polling:', err);
      };
    } catch (e) {
      console.warn('[WebSocket] Init failed:', e);
    }

    // Periodic polling backup (every 10s)
    const interval = setInterval(async () => {
      try {
        const [weatherData, risksData, alertsData, statsData] = await Promise.all([
          fetchWeather(),
          fetchRisks(),
          fetchAlerts(),
          fetchStats(),
        ]);
        setWeather(weatherData.reading);
        setActiveScenarioId(weatherData.activeScenarioId);
        setRisks(risksData);
        setAlerts(alertsData);
        setStats(statsData);
      } catch (err) {
        // silent fail on poll
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, [loadInitialData]);

  // Handlers
  const handleRefreshLive = async () => {
    setIsRefreshing(true);
    try {
      const res = await refreshLiveWeather();
      setWeather(res.reading);
      setActiveScenarioId('scenario-live');
      const [risksData, alertsData, statsData] = await Promise.all([
        fetchRisks(),
        fetchAlerts(),
        fetchStats(),
      ]);
      setRisks(risksData);
      setAlerts(alertsData);
      setStats(statsData);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApplyScenario = async (scenarioId: string) => {
    try {
      const res = await applyScenario(scenarioId);
      setWeather(res.reading);
      setActiveScenarioId(scenarioId);
      const [risksData, alertsData, statsData] = await Promise.all([
        fetchRisks(),
        fetchAlerts(),
        fetchStats(),
      ]);
      setRisks(risksData);
      setAlerts(alertsData);
      setStats(statsData);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleApplyCustomWeather = async (overrides: {
    precipitationRateMmHr: number;
    temperatureC: number;
    relativeHumidityPct: number;
  }) => {
    try {
      const res = await applyCustomWeather(overrides);
      setWeather(res.reading);
      setActiveScenarioId('scenario-custom');
      const [risksData, alertsData, statsData] = await Promise.all([
        fetchRisks(),
        fetchAlerts(),
        fetchStats(),
      ]);
      setRisks(risksData);
      setAlerts(alertsData);
      setStats(statsData);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAddAsset = async (newAsset: Omit<Asset, 'id'>) => {
    const created = await createAsset(newAsset);
    setAssets((prev) => [...prev, created]);
    const [risksData, alertsData, statsData] = await Promise.all([
      fetchRisks(),
      fetchAlerts(),
      fetchStats(),
    ]);
    setRisks(risksData);
    setAlerts(alertsData);
    setStats(statsData);
  };

  const handleUpdateAlertStatus = async (
    alertId: string,
    newStatus: Alert['status'],
    actorName: string,
    notes?: string
  ) => {
    try {
      await updateAlertStatus(alertId, newStatus, actorName, notes);
      const [alertsData, statsData] = await Promise.all([fetchAlerts(), fetchStats()]);
      setAlerts(alertsData);
      setStats(statsData);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleSelectAssetForSOP = (assetId: string) => {
    setActiveTab('alerts');
  };

  // Find asset and risk for Explainability modal
  const selectedAsset = assets.find((a) => a.id === selectedAssetForExplain) || null;
  const selectedRisk = risks.find((r) => r.assetId === selectedAssetForExplain) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <Header
        weather={weather}
        stats={stats}
        onRefreshLive={handleRefreshLive}
        onOpenNewAsset={() => setIsNewAssetModalOpen(true)}
        onSelectTab={setActiveTab}
        activeTab={activeTab}
        isRefreshing={isRefreshing}
      />

      {/* Interactive Simulation & Stress-Test Bar */}
      <ScenarioBar
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onApplyScenario={handleApplyScenario}
        onApplyCustomWeather={handleApplyCustomWeather}
        currentRain={weather?.precipitationRateMmHr ?? 0}
        currentTemp={weather?.temperatureC ?? 28}
        currentHumidity={weather?.relativeHumidityPct ?? 50}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* TAB 1: OPERATIONS MAP & LIVE VIEW */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            {/* Split layout: Map on Left, Quick Alert & Priority Bar on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <MapView
                  wards={wards}
                  assets={assets}
                  risks={risks}
                  onSelectAssetForExplain={(id) => setSelectedAssetForExplain(id)}
                  onSelectAssetForSOP={handleSelectAssetForSOP}
                />
              </div>

              {/* Side Summary & Rapid Action Feed */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                {/* City Weather & Catchment Status */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Environmental Catchment Monitor
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Rainfall Rate</span>
                      <span className="text-base font-extrabold text-blue-400">
                        {weather?.precipitationRateMmHr ?? 0} mm/h
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Apparent Heat</span>
                      <span className="text-base font-extrabold text-orange-400">
                        {weather?.apparentTempC ?? 28}°C
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Soil Saturation</span>
                      <span className="text-base font-extrabold text-cyan-400">
                        {weather?.soilMoisturePct ?? 35}%
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Drain Surcharge</span>
                      <span className="text-base font-extrabold text-purple-400">
                        {weather?.waterGaugeLevelM ?? 0.3}m
                      </span>
                    </div>
                  </div>
                </div>

                {/* Priority Response Alerts Quickfeed */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Immediate Action Directives
                      </h3>
                      <button
                        onClick={() => setActiveTab('alerts')}
                        className="text-[11px] font-semibold text-cyan-400 hover:underline"
                      >
                        View All ({alerts.length}) &rarr;
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {alerts.slice(0, 3).map((alert) => (
                        <div
                          key={alert.id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
                        >
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span
                              className={`font-black px-1.5 py-0.5 rounded ${
                                alert.severity === 'CRITICAL'
                                  ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse'
                                  : 'bg-orange-950 text-orange-300 border border-orange-700'
                              }`}
                            >
                              {alert.severity}
                            </span>
                            <span className="text-slate-400 font-mono">
                              SLA {alert.sop.prioritySlaMinutes}m
                            </span>
                          </div>
                          <h5 className="font-bold text-xs text-white line-clamp-1">
                            {alert.assetName}
                          </h5>
                          <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">
                            {alert.sop.primaryAction}
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-850">
                            <span className="text-[10px] text-cyan-400 font-medium">
                              {alert.sop.assignedTeam}
                            </span>
                            <button
                              onClick={() => setActiveTab('alerts')}
                              className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] transition"
                            >
                              Dispatch
                            </button>
                          </div>
                        </div>
                      ))}

                      {alerts.length === 0 && (
                        <div className="py-8 text-center text-slate-500 text-xs">
                          No critical alerts currently triggered.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 text-center">
                    <p className="text-[11px] text-slate-400">
                      Closed-loop response workflow active &bull; Auto-dispatch enabled
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Embedded Asset Table Preview */}
            <AssetRegister
              assets={assets}
              wards={wards}
              risks={risks}
              onSelectAssetForExplain={(id) => setSelectedAssetForExplain(id)}
              onSelectAssetForSOP={handleSelectAssetForSOP}
            />
          </div>
        )}

        {/* TAB 2: ASSET REGISTER */}
        {activeTab === 'assets' && (
          <AssetRegister
            assets={assets}
            wards={wards}
            risks={risks}
            onSelectAssetForExplain={(id) => setSelectedAssetForExplain(id)}
            onSelectAssetForSOP={handleSelectAssetForSOP}
          />
        )}

        {/* TAB 3: RESPONSE PLAYBOOKS & ALERTS */}
        {activeTab === 'alerts' && (
          <AlertsPanel
            alerts={alerts}
            onUpdateAlertStatus={handleUpdateAlertStatus}
            onSelectAssetForExplain={(id) => setSelectedAssetForExplain(id)}
          />
        )}

        {/* TAB 4: RESILIENCE ANALYTICS */}
        {activeTab === 'analytics' && (
          <AnalyticsPanel
            wards={wards}
            assets={assets}
            risks={risks}
            weather={weather}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 px-6 border-t border-slate-800 bg-slate-900 text-center text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
          <span>
            ClimateShield &copy; 2026 &bull; Bangalore_Boyz &bull; Swarnandhra College Hackathon 2026 (Problem Statement 5)
          </span>
          <span className="text-[11px] text-slate-400">
            Smart Cities & Climate Resilience Platform &bull; Phase 1 MVP
          </span>
        </div>
      </footer>

      {/* Explainability Modal */}
      <RiskExplainModal
        asset={selectedAsset}
        risk={selectedRisk}
        onClose={() => setSelectedAssetForExplain(null)}
        onOpenSOP={(id) => {
          setSelectedAssetForExplain(null);
          setActiveTab('alerts');
        }}
      />

      {/* New Asset Registration Modal */}
      <NewAssetModal
        wards={wards}
        isOpen={isNewAssetModalOpen}
        onClose={() => setIsNewAssetModalOpen(false)}
        onAddAsset={handleAddAsset}
      />
    </div>
  );
};

export default App;
