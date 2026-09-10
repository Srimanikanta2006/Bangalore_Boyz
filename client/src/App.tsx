import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 8 Stitch Screens (Lossless Consolidated Migration)
import { LoginPage } from './pages/stitch/LoginPage';
import { CitizenMapPage } from './pages/stitch/CitizenMapPage';
import { AlertsFeedPage } from './pages/stitch/AlertsFeedPage';
import { FloodDetailPage } from './pages/stitch/FloodDetailPage';
import { RouteSelectPage } from './pages/stitch/RouteSelectPage';
import { ActiveNavPage } from './pages/stitch/ActiveNavPage';
import { SosEmergencyPage } from './pages/stitch/SosEmergencyPage';
import { HazardReportPage } from './pages/stitch/HazardReportPage';

// Operations Console (Desktop GIS Management Hub)
import { OperationsConsole } from './pages/OperationsConsole';

// Fast Preview HUD
import { ScreenSwitcher } from './components/stitch/ScreenSwitcher';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* Floating Screen Switcher HUD for Instant Navigation Across All 8 Screens */}
      <ScreenSwitcher />

      <Routes>
        {/* 1. Login / Instant Role Preview */}
        <Route path="/login" element={<LoginPage />} />

        {/* 2. Citizen Live Map */}
        <Route path="/citizen/map" element={<CitizenMapPage />} />

        {/* 3. Citizen Alerts Feed */}
        <Route path="/citizen/alerts" element={<AlertsFeedPage />} />

        {/* 4. Rescue Incident / Sector Flood Detail */}
        <Route path="/rescue/incident/:id" element={<FloodDetailPage />} />

        {/* 5. Safe Route Selection (3-Corridor Comparison) */}
        <Route path="/rescue/route/:incidentId" element={<RouteSelectPage />} />

        {/* 6. Active Mission Navigation (Turn-by-Turn Waypoints) */}
        <Route path="/rescue/navigate/:routeId" element={<ActiveNavPage />} />

        {/* 7. Emergency SOS Assistance */}
        <Route path="/rescue/sos" element={<SosEmergencyPage />} />
        <Route path="/citizen/sos" element={<SosEmergencyPage />} />

        {/* 8. Field Hazard Report */}
        <Route path="/rescue/report" element={<HazardReportPage />} />
        <Route path="/citizen/report" element={<HazardReportPage />} />

        {/* Operations Console */}
        <Route path="/console/*" element={<OperationsConsole />} />
        <Route path="/gov/*" element={<OperationsConsole />} />

        {/* Default Entry Point -> Login / Role Preview */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
