import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { blockCitizenFromInternal } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import overviewRoutes from './routes/overview.routes';
import incidentRoutes from './routes/incident.routes';
import responseRoutes from './routes/response.routes';
import taskRoutes from './routes/task.routes';
import unitRoutes from './routes/unit.routes';
import infrastructureRoutes from './routes/infrastructure.routes';
import hazardRoutes from './routes/hazard.routes';
import mapRoutes from './routes/map.routes';
import simulatorRoutes from './routes/simulator.routes';
import analyticsRoutes from './routes/analytics.routes';
import hotspotRoutes from './routes/hotspot.routes';
import departmentRoutes from './routes/department.routes';
import zoneRoutes from './routes/zone.routes';
import cascadeRoutes from './routes/cascade.routes';
import auditRoutes from './routes/audit.routes';
import weatherRoutes from './routes/weather.routes';
import locationRoutes from './routes/location.routes';
import explainRoutes from './routes/explain.routes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // --- security & observability middleware ---
  app.use(helmet());
  app.use(
    cors({
      origin: env.allowAllOrigins ? true : env.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  // Block CITIZEN accounts from internal/government read endpoints (defense in
  // depth; government writes are already fail-closed via requireRole).
  app.use(blockCitizenFromInternal);

  // --- API routes (all mounted under /api) ---
  app.use('/api', healthRoutes);
  app.use('/api', authRoutes);
  app.use('/api', overviewRoutes);
  app.use('/api', incidentRoutes);
  app.use('/api', responseRoutes);
  app.use('/api', taskRoutes);
  app.use('/api', unitRoutes);
  app.use('/api', infrastructureRoutes);
  app.use('/api', hazardRoutes);
  app.use('/api', mapRoutes);
  app.use('/api', simulatorRoutes);
  app.use('/api', analyticsRoutes);
  app.use('/api', hotspotRoutes);
  app.use('/api', departmentRoutes);
  app.use('/api', zoneRoutes);
  app.use('/api', cascadeRoutes);
  app.use('/api', auditRoutes);
  app.use('/api', weatherRoutes);
  app.use('/api', locationRoutes);
  app.use('/api', explainRoutes);

  // --- 404 + central error handler (must be last) ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
