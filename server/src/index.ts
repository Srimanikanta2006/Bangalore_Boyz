import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import apiRoutes from './routes/api.js';
import { weatherService } from './services/weatherService.js';
import { stateStore } from './services/stateStore.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Attach REST routes
app.use('/api', apiRoutes);

// Create HTTP server & WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WebSocket] Client connected. Total active clients: ${clients.size}`);

  // Send initial summary snapshot
  ws.send(
    JSON.stringify({
      type: 'INIT_SNAPSHOT',
      stats: stateStore.getSummaryStats(),
      weather: weatherService.getCurrentReading(),
      risks: stateStore.getRiskAssessments(),
      alerts: stateStore.getAlerts(),
    })
  );

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WebSocket] Client disconnected. Total active clients: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('[WebSocket] Client error:', err);
    clients.delete(ws);
  });
});

export function broadcastUpdate(eventType: string, payload: any) {
  const message = JSON.stringify({ type: eventType, data: payload, timestamp: new Date().toISOString() });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Background polling for live weather (every 3 minutes)
setInterval(async () => {
  // Only auto-poll if in live mode
  if (!weatherService.getActiveScenarioId() || weatherService.getActiveScenarioId() === 'scenario-live') {
    try {
      await weatherService.fetchLiveWeather();
      stateStore.recalculateAllRisks();
      broadcastUpdate('WEATHER_AND_RISK_UPDATE', {
        stats: stateStore.getSummaryStats(),
        weather: weatherService.getCurrentReading(),
        risks: stateStore.getRiskAssessments(),
        alerts: stateStore.getAlerts(),
      });
    } catch (err) {
      console.warn('[Server Poll] Weather poll notice:', (err as Error).message);
    }
  }
}, 3 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🛡️  ClimateShield Resilience Server is LIVE on port ${PORT}`);
  console.log(`📡 REST API: http://localhost:${PORT}/api/health`);
  console.log(`⚡ WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`=======================================================`);

  // Attempt initial live weather fetch
  weatherService.fetchLiveWeather().then(() => {
    stateStore.recalculateAllRisks();
    console.log(`[Server] Initial live weather ingested & risk baseline computed.`);
  });
});
