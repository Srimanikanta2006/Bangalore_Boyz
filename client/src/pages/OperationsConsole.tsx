import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from '../components/layout/TopNav';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardPage } from './DashboardPage';
import { RiskMapPage } from './RiskMapPage';
import { AssetsPage } from './AssetsPage';
import { AlertsPage } from './AlertsPage';
import { IncidentsPage } from './IncidentsPage';
import { TasksPage } from './TasksPage';
import { AnalyticsPage } from './AnalyticsPage';
import { HistoryPage } from './HistoryPage';
import { TeamPage } from './TeamPage';
import { SettingsPage } from './SettingsPage';

import { CreatePlanModal } from '../components/incidents/CreatePlanModal';
import { NewAssetModal } from '../components/NewAssetModal';
import { RiskExplainModal } from '../components/RiskExplainModal';

import {
  Ward,
  Asset,
  WeatherReading,
  AssetRiskAssessment,
  Alert,
  Incident,
  ResponseTask,
  HistoricalRepeatLocation,
  SimulationScenario,
  CitySummaryStats,
  DataQualityStatus,
} from '../types';

import {
  fetchStats,
  fetchWards,
  fetchAssets,
  createAsset,
  fetchWeather,
  refreshLiveWeather,
  applyScenario,
  fetchScenarios,
  fetchRisks,
  fetchAlerts,
  updateAlertStatus,
  fetchIncidents,
  createIncident,
  fetchTasks,
  updateTaskStatus,
  escalateTask,
  fetchHistory,
  fetchDataQuality,
  toggleStaleData,
} from '../services/api';

export const OperationsConsole: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>('risk-map');
  const [searchQuery, setSearchQuery] = useState('');

  // Domain State
  const [stats, setStats] = useState<CitySummaryStats | null>(null);
  const [weather, setWeather] = useState<WeatherReading | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQualityStatus | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [wards, setWards] = useState<Ward[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [risks, setRisks] = useState<AssetRiskAssessment[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [tasks, setTasks] = useState<ResponseTask[]>([]);
  const [history, setHistory] = useState<HistoricalRepeatLocation[]>([]);
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);

  // Modals & Drawers
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  const [planModalAsset, setPlanModalAsset] = useState<Asset | null>(null);
  const [planModalRisk, setPlanModalRisk] = useState<AssetRiskAssessment | null>(null);
  const [explainAsset, setExplainAsset] = useState<Asset | null>(null);
  const [explainRisk, setExplainRisk] = useState<AssetRiskAssessment | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [
        wardsData,
        assetsData,
        scenariosData,
        weatherData,
        risksData,
        alertsData,
        incidentsData,
        tasksData,
        historyData,
        statsData,
        qualityData,
      ] = await Promise.all([
        fetchWards(),
        fetchAssets(),
        fetchScenarios(),
        fetchWeather(),
        fetchRisks(),
        fetchAlerts(),
        fetchIncidents(),
        fetchTasks(),
        fetchHistory(),
        fetchStats(),
        fetchDataQuality(),
      ]);

      setWards(wardsData);
      setAssets(assetsData);
      setScenarios(scenariosData);
      setWeather(weatherData.reading);
      setDataQuality(qualityData);
      setActiveScenarioId(weatherData.activeScenarioId);
      setRisks(risksData);
      setAlerts(alertsData);
      setIncidents(incidentsData);
      setTasks(tasksData);
      setHistory(historyData);
      setStats(statsData);
    } catch (err) {
      console.error('[Console] Failed to load data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();

    const interval = setInterval(async () => {
      try {
        const [weatherData, risksData, alertsData, incidentsData, tasksData, statsData, qualityData] =
          await Promise.all([
            fetchWeather(),
            fetchRisks(),
            fetchAlerts(),
            fetchIncidents(),
            fetchTasks(),
            fetchStats(),
            fetchDataQuality(),
          ]);

        setWeather(weatherData.reading);
        setDataQuality(qualityData);
        setActiveScenarioId(weatherData.activeScenarioId);
        setRisks(risksData);
        setAlerts(alertsData);
        setIncidents(incidentsData);
        setTasks(tasksData);
        setStats(statsData);
      } catch (err) {
        // silent
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [loadData]);

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

  const handleToggleStale = async () => {
    try {
      const res = await toggleStaleData();
      setDataQuality(res.quality);
      const [risksData, statsData] = await Promise.all([fetchRisks(), fetchStats()]);
      setRisks(risksData);
      setStats(statsData);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleOpenCreatePlan = (asset: Asset, risk: AssetRiskAssessment) => {
    setPlanModalAsset(asset);
    setPlanModalRisk(risk);
  };

  const handleCloseCreatePlan = () => {
    setPlanModalAsset(null);
    setPlanModalRisk(null);
  };

  const handleConfirmPlan = async (planData: {
    assetId: string;
    hazardType: 'FLOOD' | 'HEAT' | 'COMPOUND';
    title: string;
    assignedTeam: string;
    leadResponder: string;
    notes?: string;
    taskTitles: string[];
  }) => {
    await createIncident(planData);
    const [incidentsData, tasksData, alertsData, statsData] = await Promise.all([
      fetchIncidents(),
      fetchTasks(),
      fetchAlerts(),
      fetchStats(),
    ]);
    setIncidents(incidentsData);
    setTasks(tasksData);
    setAlerts(alertsData);
    setStats(statsData);
    setCurrentRoute('incidents');
  };

  const handleUpdateTaskStatus = async (
    taskId: string,
    status: ResponseTask['status'],
    notes?: string
  ) => {
    await updateTaskStatus(taskId, status, notes);
    const [incidentsData, tasksData, statsData] = await Promise.all([
      fetchIncidents(),
      fetchTasks(),
      fetchStats(),
    ]);
    setIncidents(incidentsData);
    setTasks(tasksData);
    setStats(statsData);
  };

  const handleEscalateTask = async (taskId: string) => {
    await escalateTask(taskId, 'Incident Supervisor');
    const [incidentsData, tasksData, statsData] = await Promise.all([
      fetchIncidents(),
      fetchTasks(),
      fetchStats(),
    ]);
    setIncidents(incidentsData);
    setTasks(tasksData);
    setStats(statsData);
  };

  const handleUpdateAlertStatus = async (
    alertId: string,
    status: Alert['status'],
    actorName: string,
    notes?: string
  ) => {
    await updateAlertStatus(alertId, status, actorName, notes);
    const [alertsData, statsData] = await Promise.all([fetchAlerts(), fetchStats()]);
    setAlerts(alertsData);
    setStats(statsData);
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

  const activeAlertsCount = alerts.filter((a) => a.status !== 'RESOLVED').length;
  const activeIncidentsCount = incidents.filter((i) => i.status === 'RESPONDING').length;
  const pendingTasksCount = tasks.filter(
    (t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS' || t.status === 'ESCALATED'
  ).length;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Existing Top Navigation */}
      <TopNav
        weather={weather}
        dataQuality={dataQuality}
        activeAlertsCount={activeAlertsCount}
        onNavigate={setCurrentRoute}
        onRefreshLive={handleRefreshLive}
        onToggleStale={handleToggleStale}
        onApplyScenario={handleApplyScenario}
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isRefreshing={isRefreshing}
      />

      {/* Main Shell: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Operational Sidebar */}
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={setCurrentRoute}
          activeAlertsCount={activeAlertsCount}
          activeIncidentsCount={activeIncidentsCount}
          pendingTasksCount={pendingTasksCount}
        />

        {/* Dynamic Route Content */}
        <main
          className={`flex-1 ${
            currentRoute === 'risk-map' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'
          } bg-slate-50`}
        >
          {currentRoute === 'risk-map' && (
            <RiskMapPage
              wards={wards}
              assets={assets}
              risks={risks}
              weather={weather}
              incidents={incidents}
              onOpenCreatePlan={handleOpenCreatePlan}
              onNavigate={setCurrentRoute}
            />
          )}

          {currentRoute === 'dashboard' && (
            <DashboardPage
              wards={wards}
              assets={assets}
              risks={risks}
              weather={weather}
              incidents={incidents}
              dataQuality={dataQuality}
              onNavigate={setCurrentRoute}
              onSelectAssetForExplain={(a, r) => {
                setExplainAsset(a);
                setExplainRisk(r);
              }}
            />
          )}

          {currentRoute === 'assets' && (
            <AssetsPage
              assets={assets}
              wards={wards}
              risks={risks}
              onOpenNewAssetModal={() => setIsNewAssetModalOpen(true)}
              onOpenCreatePlan={handleOpenCreatePlan}
              onSelectAssetForExplain={(a, r) => {
                setExplainAsset(a);
                setExplainRisk(r);
              }}
            />
          )}

          {currentRoute === 'alerts' && (
            <AlertsPage
              alerts={alerts}
              assets={assets}
              risks={risks}
              onUpdateAlertStatus={handleUpdateAlertStatus}
              onOpenCreatePlan={handleOpenCreatePlan}
              onNavigate={setCurrentRoute}
            />
          )}

          {currentRoute === 'incidents' && (
            <IncidentsPage
              incidents={incidents}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onEscalateTask={handleEscalateTask}
              onNavigate={setCurrentRoute}
            />
          )}

          {currentRoute === 'tasks' && (
            <TasksPage
              tasks={tasks}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onEscalateTask={handleEscalateTask}
              onNavigate={setCurrentRoute}
            />
          )}

          {currentRoute === 'analytics' && (
            <AnalyticsPage
              wards={wards}
              assets={assets}
              risks={risks}
              weather={weather}
            />
          )}

          {currentRoute === 'history' && (
            <HistoryPage
              history={history}
              onNavigate={setCurrentRoute}
            />
          )}

          {currentRoute === 'team' && <TeamPage />}

          {currentRoute === 'settings' && (
            <SettingsPage
              dataQuality={dataQuality}
              onToggleStale={handleToggleStale}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <CreatePlanModal
        asset={planModalAsset}
        risk={planModalRisk}
        isOpen={Boolean(planModalAsset && planModalRisk)}
        onClose={handleCloseCreatePlan}
        onSubmitPlan={handleConfirmPlan}
      />

      <RiskExplainModal
        asset={explainAsset}
        risk={explainRisk}
        onClose={() => {
          setExplainAsset(null);
          setExplainRisk(null);
        }}
        onOpenSOP={() => {
          setExplainAsset(null);
          setExplainRisk(null);
          setCurrentRoute('alerts');
        }}
      />

      <NewAssetModal
        wards={wards}
        isOpen={isNewAssetModalOpen}
        onClose={() => setIsNewAssetModalOpen(false)}
        onAddAsset={handleAddAsset}
      />
    </div>
  );
};
