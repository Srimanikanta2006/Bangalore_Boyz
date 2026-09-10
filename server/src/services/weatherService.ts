import { WeatherReading, SimulationScenario } from '../types.js';
import { SIMULATION_SCENARIOS } from '../data/mockData.js';

class WeatherService {
  private currentReading: WeatherReading;
  private activeScenarioId: string | null = null;
  private lastFetchTime: number = 0;
  private cacheTtlMs: number = 5 * 60 * 1000; // 5 mins

  constructor() {
    // Default baseline reading
    this.currentReading = {
      timestamp: new Date().toISOString(),
      source: 'LIVE_API',
      cityName: 'Bengaluru, India',
      temperatureC: 28.2,
      apparentTempC: 29.5,
      relativeHumidityPct: 58,
      precipitationRateMmHr: 0,
      precipitationAccumulation24hMm: 2.4,
      windSpeedKmh: 14.2,
      uvIndex: 5.6,
      soilMoisturePct: 38,
      waterGaugeLevelM: 0.32,
      status: 'NORMAL',
    };
  }

  public async fetchLiveWeather(): Promise<WeatherReading> {
    // If a manual simulation scenario is active, preserve it
    if (this.activeScenarioId && this.activeScenarioId !== 'scenario-live') {
      return this.currentReading;
    }

    const now = Date.now();
    if (now - this.lastFetchTime < this.cacheTtlMs && this.currentReading.source === 'LIVE_API') {
      return this.currentReading;
    }

    try {
      // Open-Meteo Bengaluru Coordinates: lat 12.9716, lon 77.5946
      const url =
        'https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m&hourly=precipitation,soil_moisture_0_to_1cm&timezone=Asia%2FKolkata';

      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP ${response.status}`);
      }

      const data = (await response.json()) as any;
      const current = data.current;

      const rainMmHr = current?.precipitation ?? current?.rain ?? 0;
      const tempC = current?.temperature_2m ?? 28;
      const apparentC = current?.apparent_temperature ?? tempC;
      const humidity = current?.relative_humidity_2m ?? 50;
      const windKmh = current?.wind_speed_10m ?? 12;

      let status: WeatherReading['status'] = 'NORMAL';
      if (rainMmHr > 50) status = 'CLOUDBURST';
      else if (rainMmHr > 15) status = 'HEAVY_RAIN';
      else if (apparentC > 42) status = 'SEVERE_HEAT';
      else if (apparentC > 38) status = 'HEATWAVE';

      this.currentReading = {
        timestamp: new Date().toISOString(),
        source: 'LIVE_API',
        cityName: 'Bengaluru (Live Open-Meteo)',
        temperatureC: Number(tempC.toFixed(1)),
        apparentTempC: Number(apparentC.toFixed(1)),
        relativeHumidityPct: Math.round(humidity),
        precipitationRateMmHr: Number(rainMmHr.toFixed(1)),
        precipitationAccumulation24hMm: Number((rainMmHr * 3.5).toFixed(1)), // Estimated accumulation
        windSpeedKmh: Number(windKmh.toFixed(1)),
        uvIndex: tempC > 32 ? 8.5 : 5.0,
        soilMoisturePct: rainMmHr > 0 ? 75 : 35,
        waterGaugeLevelM: Number((0.2 + (rainMmHr / 50) * 1.8).toFixed(2)),
        status,
      };

      this.lastFetchTime = now;
      this.activeScenarioId = 'scenario-live';
      return this.currentReading;
    } catch (err) {
      console.warn('[WeatherService] Live API fetch failed or timed out, using robust fallback:', (err as Error).message);
      this.currentReading.source = 'CACHED_FALLBACK';
      this.currentReading.timestamp = new Date().toISOString();
      return this.currentReading;
    }
  }

  public applyScenario(scenarioId: string): WeatherReading {
    if (scenarioId === 'scenario-live') {
      this.activeScenarioId = null;
      this.lastFetchTime = 0; // Force re-fetch
      return this.currentReading;
    }

    const scenario = SIMULATION_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with id ${scenarioId} not found`);
    }

    this.activeScenarioId = scenarioId;
    this.currentReading = {
      ...this.currentReading,
      ...scenario.weatherOverrides,
      timestamp: new Date().toISOString(),
      source: 'SIMULATION',
      cityName: `Bengaluru [${scenario.name}]`,
    } as WeatherReading;

    return this.currentReading;
  }

  public setCustomWeather(overrides: Partial<WeatherReading>): WeatherReading {
    this.activeScenarioId = 'scenario-custom';
    this.currentReading = {
      ...this.currentReading,
      ...overrides,
      timestamp: new Date().toISOString(),
      source: 'SIMULATION',
      cityName: 'Bengaluru [Custom Live Override]',
    } as WeatherReading;

    return this.currentReading;
  }

  public getCurrentReading(): WeatherReading {
    return this.currentReading;
  }

  public getActiveScenarioId(): string | null {
    return this.activeScenarioId;
  }
}

export const weatherService = new WeatherService();
