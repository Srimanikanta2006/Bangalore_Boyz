import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './db/prisma';
import { startWeatherPoller, stopWeatherPoller } from './services/weather.poller';

const app = createApp();
const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      level: 'info',
      message: `ClimateShield backend listening on port ${env.PORT}`,
      environment: env.NODE_ENV,
    }),
  );
  startWeatherPoller();
});

async function shutdown(signal: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ level: 'info', message: `Received ${signal}, shutting down gracefully` }));
  stopWeatherPoller();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Force-exit if connections refuse to drain.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ level: 'error', scope: 'unhandledRejection', message: String(reason) }));
});

export default server;
