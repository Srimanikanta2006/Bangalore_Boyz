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
import { GovIncidentsPage } from './pages/stitch/GovIncidentsPage';
import { GovCommercialPortalPage } from './pages/stitch/GovCommercialPortalPage';

// Navigation & Screen Switcher
import { ScreenSwitcher } from './components/stitch/ScreenSwitcher';

// Auth
import { RequireAuth } from './auth/RequireAuth';
import { useAuth } from './auth/AuthContext';
import { homeForRole } from './auth/types';

/** Wraps a citizen page in the CITIZEN-only route guard. */
const Citizen = (element: React.ReactNode) => <RequireAuth roles={['CITIZEN']}>{element}</RequireAuth>;

/** Wraps a Government HQ Desktop page in the Gov-only route guard. */
const GovHq = (element: React.ReactNode) => (
  <RequireAuth roles={['GOVERNMENT_OPERATOR', 'DISPATCHER', 'ADMIN', 'ANALYST']}>{element}</RequireAuth>
);

/** Wraps a Government Mobile Field page in the Field Operator route guard. */
const GovField = (element: React.ReactNode) => (
  <RequireAuth roles={['FIELD_OPERATOR', 'DISPATCHER', 'GOVERNMENT_OPERATOR', 'ADMIN']}>{element}</RequireAuth>
);

/** Wraps Tactical Rescue in the tactical response route guard. */
const Rescue = (element: React.ReactNode) => (
  <RequireAuth roles={['FIELD_OPERATOR', 'DISPATCHER', 'GOVERNMENT_OPERATOR', 'ADMIN']}>{element}</RequireAuth>
);

/**
 * Root and Fallback Route:
 * - Unauthenticated -> /login
 * - Authenticated -> role-specific home (Citizen -> /citizen/map, Gov -> /gov/overview, Field -> /gov/mobile/map)
 */
const RootLanding: React.FC = () => {
  const { user, isAuthenticated, initializing } = useAuth();
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        <span className="font-body-md text-body-md">Restoring session…</span>
      </div>
    );
  }
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={homeForRole(user.role)} replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* Universal Screen Switcher HUD */}
      <ScreenSwitcher />

      <Routes>
        {/* Default Landing: Dynamic Role Home or /login */}
        <Route path="/" element={<RootLanding />} />

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

        {/* 3. Rescue Tactical Routes (Field / Dispatch / Gov guarded) */}
        <Route path="/rescue/tactical" element={Rescue(<RescueTacticalMapPage />)} />
        <Route path="/rescue/mission/:id" element={Rescue(<RescueMissionDossierPage />)} />
        <Route path="/rescue/navigate/:id" element={Rescue(<RescueActiveNavPage />)} />
        <Route path="/rescue/hazard/:id" element={Rescue(<RescueHazardDetailPage />)} />
        <Route path="/rescue/report/:id" element={Rescue(<RescueStatusReportPage />)} />
        <Route path="/rescue/console" element={Rescue(<RescueCommandConsolePage />)} />

        {/* 4. Government Mobile Field Routes (Field / Dispatch / Gov guarded) */}
        <Route path="/gov/mobile/map" element={GovField(<GovMobileMapPage />)} />
        <Route path="/gov/mobile/triage" element={GovField(<GovMobileTriagePage />)} />
        <Route path="/gov/mobile/tasks" element={GovField(<GovMobileTasksPage />)} />

        {/* 5. Government HQ Desktop Routes (Gov Operator / Dispatcher / Analyst / Admin guarded) */}
        <Route path="/gov/overview" element={GovHq(<GovCommandCenterPage />)} />
        <Route path="/gov/critical-assets" element={GovHq(<GovCriticalAssetMonitorPage />)} />
        <Route path="/gov/incidents" element={GovHq(<GovIncidentsPage />)} />
        <Route path="/gov/zone-cascade/:id" element={GovHq(<GovZoneCascadePage />)} />
        <Route path="/gov/simulator" element={GovHq(<GovSimulatorPage />)} />
        <Route path="/gov/response-center" element={GovHq(<GovResponseCenterPage />)} />
        <Route path="/gov/commercial" element={GovHq(<GovCommercialPortalPage />)} />

        {/* Legacy / Console Redirects */}
        <Route path="/console" element={<RootLanding />} />
        <Route path="/console/*" element={<RootLanding />} />
        <Route path="/gov" element={<Navigate to="/gov/overview" replace />} />

        {/* Fallback to dynamic role landing */}
        <Route path="*" element={<RootLanding />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
