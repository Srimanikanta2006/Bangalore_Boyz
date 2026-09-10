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
        {/* Flagship Climate-Risk Resilience Console (Default Entry Point) */}
        <Route path="/" element={<OperationsConsole />} />
        <Route path="/console/*" element={<OperationsConsole />} />
        <Route path="/gov/*" element={<OperationsConsole />} />

        {/* 8 Stitch Mobile Screens */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/citizen/map" element={<CitizenMapPage />} />
        <Route path="/citizen/alerts" element={<AlertsFeedPage />} />
        <Route path="/rescue/incident/:id" element={<FloodDetailPage />} />
        <Route path="/rescue/route/:incidentId" element={<RouteSelectPage />} />
        <Route path="/rescue/navigate/:routeId" element={<ActiveNavPage />} />
        <Route path="/rescue/sos" element={<SosEmergencyPage />} />
        <Route path="/citizen/sos" element={<SosEmergencyPage />} />
        <Route path="/rescue/report" element={<HazardReportPage />} />
        <Route path="/citizen/report" element={<HazardReportPage />} />

        {/* Fallback to Operations Console */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
