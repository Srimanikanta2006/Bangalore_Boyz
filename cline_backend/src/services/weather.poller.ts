import { env } from '../config/env';
import { prisma } from '../db/prisma';
import { getCurrentWeather } from './weather.service';

/**
 * Background polling of zone coordinates -> WeatherSnapshot history rows.
 * Dashboard readiness only - it never replaces the on-demand /api/weather/current.
 */

let timer: NodeJS.Timeout | null = null;

export async function pollZonesOnce(): Promise<number> {
  const zones = await prisma.zone.findMany({ select: { id: true, latitude: true, longitude: true } });
  let saved = 0;
  for (const zone of zones) {
    try {
      const weather = await getCurrentWeather({ latitude: zone.latitude, longitude: zone.longitude, forecastHours: 0 });
      await prisma.weatherSnapshot.create({
        data: {
          zoneId: zone.id,
          latitude: zone.latitude,
          longitude: zone.longitude,
          provider: weather.provider,
          dataQuality: weather.dataQuality,
          temperatureC: weather.temperatureC,
          precipitationMm: weather.precipitationMm,
          rainfallMmPerHour: weather.rainfallMmPerHour,
          windSpeedKmh: weather.windSpeedKmh,
          windDirectionDeg: weather.windDirectionDeg,
          weatherCode: weather.weatherCode,
          weatherCondition: weather.weatherCondition,
          observedAt: weather.observedAt ? new Date(weather.observedAt) : null,
        },
      });
      saved++;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify({ level: 'warn', scope: 'weather-poller', zoneId: zone.id, message: err instanceof Error ? err.message : String(err) }));
    }
  }
  return saved;
}

export function startWeatherPoller(): void {
  if (env.isTest || env.WEATHER_POLL_INTERVAL_MINUTES <= 0 || timer) return;
  // Write an initial observation immediately so Docker Postgres has a fresh
  // snapshot after every API restart rather than waiting for the first interval.
  void pollZonesOnce().catch((err) => {
    console.error(JSON.stringify({ level: 'warn', scope: 'weather-poller', message: err instanceof Error ? err.message : String(err) }));
  });
  timer = setInterval(() => {
    void pollZonesOnce().catch(() => undefined);
  }, env.WEATHER_POLL_INTERVAL_MINUTES * 60_000);
  timer.unref();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ level: 'info', message: `Weather poller started (every ${env.WEATHER_POLL_INTERVAL_MINUTES} min)` }));
}

export function stopWeatherPoller(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
