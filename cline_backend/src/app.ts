import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { EVIDENCE_DIR, EVIDENCE_URL_PREFIX } from './middleware/upload';
import { requestLogger } from './middleware/requestLogger';
import { blockCitizenFromInternal } from './middleware/auth';
import { globalApiLimiter } from './middleware/rateLimiter';
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
import orchestrateRoutes from './routes/orchestrate.routes';
import notificationRoutes from './routes/notification.routes';
import citizenRoutes from './routes/citizen.routes';
import billingRoutes from './routes/billing.routes';
import phase2ExtensionsRoutes from './routes/phase2Extensions.routes';

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

  // Read-only static serving of citizen-uploaded evidence (local disk storage, Stage D §6 Option B).
  app.use(EVIDENCE_URL_PREFIX, express.static(EVIDENCE_DIR));

  // Block CITIZEN accounts from internal/government read endpoints (defense in
  // depth; government writes are already fail-closed via requireRole).
  app.use(blockCitizenFromInternal);

  // --- API router (mounted at both /api and / for total resilience) ---
  const apiRouter = express.Router();
  apiRouter.use(globalApiLimiter);
  apiRouter.use(healthRoutes);
  apiRouter.use(authRoutes);
  apiRouter.use(overviewRoutes);
  apiRouter.use(incidentRoutes);
  apiRouter.use(responseRoutes);
  apiRouter.use(taskRoutes);
  apiRouter.use(unitRoutes);
  apiRouter.use(infrastructureRoutes);
  apiRouter.use(hazardRoutes);
  apiRouter.use(mapRoutes);
  apiRouter.use(simulatorRoutes);
  apiRouter.use(analyticsRoutes);
  apiRouter.use(hotspotRoutes);
  apiRouter.use(departmentRoutes);
  apiRouter.use(zoneRoutes);
  apiRouter.use(cascadeRoutes);
  apiRouter.use(auditRoutes);
  apiRouter.use(weatherRoutes);
  apiRouter.use(locationRoutes);
  apiRouter.use(explainRoutes);
  apiRouter.use(orchestrateRoutes);
  apiRouter.use(notificationRoutes);
  apiRouter.use(citizenRoutes);
  apiRouter.use(billingRoutes);
  apiRouter.use(phase2ExtensionsRoutes);

  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  // --- 404 + central error handler (must be last) ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
