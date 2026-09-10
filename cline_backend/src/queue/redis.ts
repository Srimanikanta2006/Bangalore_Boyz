/**
 * Optional Redis connection for the BullMQ async pipeline (Chunk H —
 * hazard ingestion -> risk recompute -> notification fan-out -> report
 * generation). REDIS_URL is intentionally optional: if it's unset or the
 * connection fails, `hazardPipeline.queue.ts` falls back to running the
 * exact same processing functions INLINE (synchronously, in-process) so the
 * app never hard-depends on Redis being available for a hackathon demo.
 * When REDIS_URL IS set, jobs are genuinely queued and processed
 * asynchronously by a real BullMQ Worker.
 */

import IORedis from 'ioredis';

let connection: IORedis | null = null;
let attempted = false;

export function getRedisConnection(): IORedis | null {
  if (attempted) return connection;
  attempted = true;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    connection = new IORedis(url, {
      maxRetriesPerRequest: null, // required by BullMQ
      lazyConnect: false,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });
    connection.on('error', (err) => {
      console.error(JSON.stringify({ level: 'warn', scope: 'queue', message: 'Redis connection error - pipeline falls back to inline processing', detail: err.message }));
    });
  } catch (err) {
    console.error(JSON.stringify({ level: 'warn', scope: 'queue', message: 'Failed to initialize Redis connection', detail: (err as Error).message }));
    connection = null;
  }
  return connection;
}

export async function isRedisReady(): Promise<boolean> {
  const conn = getRedisConnection();
  if (!conn) return false;
  try {
    const pong = await conn.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}
