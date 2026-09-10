import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 1. Shared / Auth
import { LoginPage } from './pages/stitch/LoginPage';

// 2. Citizen Experience (8 Stitch Screens)
import { CitizenMapPage } from './pages/stitch/CitizenMapPage';
import { AlertsFeedPage } from './pages/stitch/AlertsFeedPage';
import { CitizenFloodSheetPage } from './pages/stitch/CitizenFloodSheetPage';
import { CitizenRouteSelectPage } from './pages/stitch/CitizenRouteSelectPage';
import { CitizenActiveNavPage } from './pages/stitch/CitizenActiveNavPage';
import { SosEmergencyPage } from './pages/stitch/SosEmergencyPage';
import { HazardReportPage } from './pages/stitch/HazardReportPage';
import { CitizenMyActivityPage } from './pages/stitch/CitizenMyActivityPage';

// 3. Rescue Tactical Operations (6 Stitch Screens)
import { RescueTacticalMapPage } from './pages/stitch/RescueTacticalMapPage';
import { RescueActiveNavPage } from './pages/stitch/RescueActiveNavPage';
import { RescueMissionDossierPage } from './pages/stitch/RescueMissionDossierPage';
import { RescueHazardDetailPage } from './pages/stitch/RescueHazardDetailPage';
import { RescueStatusReportPage } from './pages/stitch/RescueStatusReportPage';
import { RescueCommandConsolePage } from './pages/stitch/RescueCommandConsolePage';

// 4. Government Mobile / Field Team (3 Stitch Screens)
import { GovMobileMapPage } from './pages/stitch/GovMobileMapPage';
import { GovMobileTriagePage } from './pages/stitch/GovMobileTriagePage';
import { GovMobileTasksPage } from './pages/stitch/GovMobileTasksPage';

// 5. Government HQ Desktop Command Center (5 Stitch Screens)
import { GovCommandCenterPage } from './pages/stitch/GovCommandCenterPage';
import { GovCriticalAssetMonitorPage } from './pages/stitch/GovCriticalAssetMonitorPage';
import { GovZoneCascadePage } from './pages/stitch/GovZoneCascadePage';
import { GovSimulatorPage } from './pages/stitch/GovSimulatorPage';
import { GovResponseCenterPage } from './pages/stitch/GovResponseCenterPage';

// Navigation & Screen Switcher
import { ScreenSwitcher } from './components/stitch/ScreenSwitcher';

// Auth
import { RequireAuth } from './auth/RequireAuth';
import { GOV_HQ_ROLES, FIELD_ROLES } from './auth/types';

/** Wraps a citizen page in the CITIZEN-only route guard. */
const Citizen = (element: React.ReactNode) => <RequireAuth roles={['CITIZEN']}>{element}</RequireAuth>;

/** Government HQ desktop console: ADMIN/GOVERNMENT_OPERATOR/DISPATCHER/ANALYST. */
const GovHq = (element: React.ReactNode) => <RequireAuth roles={GOV_HQ_ROLES}>{element}</RequireAuth>;

/**
 * Government Mobile + Rescue: both are the FIELD_OPERATOR backend role (see
 * docs/MASTER_PLAN.md §1) - same role guard, different page sets.
 */
const Field = (element: React.ReactNode) => <RequireAuth roles={FIELD_ROLES}>{element}</RequireAuth>;

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* Universal Screen Switcher HUD */}
      <ScreenSwitcher />

      <Routes>
        {/* Default Landing: Government HQ Command Center */}
        <Route path="/" element={GovHq(<GovCommandCenterPage />)} />

        {/* 1. Shared Gateway */}
        <Route path="/login" element={<LoginPage />} />

        {/* 2. Citizen Experience Routes (CITIZEN-only, JWT-guarded) */}
        <Route path="/citizen/map" element={Citizen(<CitizenMapPage />)} />
        <Route path="/citizen/alerts" element={Citizen(<AlertsFeedPage />)} />
        <Route path="/citizen/hazard/:id" element={Citizen(<CitizenFloodSheetPage />)} />
        <Route path="/citizen/routes" element={Citizen(<CitizenRouteSelectPage />)} />
        <Route path="/citizen/navigate" element={Citizen(<CitizenActiveNavPage />)} />
        <Route path="/citizen/sos" element={Citizen(<SosEmergencyPage />)} />
        <Route path="/citizen/report" element={Citizen(<HazardReportPage />)} />
        <Route path="/citizen/activity" element={Citizen(<CitizenMyActivityPage />)} />

        {/* 3. Rescue Tactical Routes (FIELD_OPERATOR-guarded) */}
        <Route path="/rescue/tactical" element={Field(<RescueTacticalMapPage />)} />
        <Route path="/rescue/mission/:id" element={Field(<RescueMissionDossierPage />)} />
        <Route path="/rescue/navigate/:id" element={Field(<RescueActiveNavPage />)} />
        <Route path="/rescue/hazard/:id" element={Field(<RescueHazardDetailPage />)} />
        <Route path="/rescue/report/:id" element={Field(<RescueStatusReportPage />)} />
        <Route path="/rescue/console" element={Field(<RescueCommandConsolePage />)} />

        {/* 4. Government Mobile Field Routes (FIELD_OPERATOR-guarded) */}
        <Route path="/gov/mobile/map" element={Field(<GovMobileMapPage />)} />
        <Route path="/gov/mobile/triage" element={Field(<GovMobileTriagePage />)} />
        <Route path="/gov/mobile/tasks" element={Field(<GovMobileTasksPage />)} />

        {/* 5. Government HQ Desktop Routes (GOV_HQ_ROLES-guarded) */}
        <Route path="/gov/overview" element={GovHq(<GovCommandCenterPage />)} />
        <Route path="/gov/critical-assets" element={GovHq(<GovCriticalAssetMonitorPage />)} />
        <Route path="/gov/zone-cascade/:id" element={GovHq(<GovZoneCascadePage />)} />
        <Route path="/gov/simulator" element={GovHq(<GovSimulatorPage />)} />
        <Route path="/gov/response-center" element={GovHq(<GovResponseCenterPage />)} />

        {/* Legacy / Console Redirects */}
        <Route path="/console" element={<Navigate to="/gov/overview" replace />} />
        <Route path="/console/*" element={<Navigate to="/gov/overview" replace />} />

        {/* Fallback to Overview */}
        <Route path="*" element={<Navigate to="/gov/overview" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
