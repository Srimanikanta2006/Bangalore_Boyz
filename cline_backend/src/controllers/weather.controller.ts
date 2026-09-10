import type { Request, Response } from 'express';
import { getCurrentWeather, listWeatherHistory } from '../services/weather.service';
import { wrap } from '../utils/wrap';
import type { WeatherQuery } from '../validators/weather.schema';

export const current = wrap(async (req: Request, res: Response) => {
  const query = req.query as unknown as WeatherQuery;
  const data = await getCurrentWeather({
    latitude: query.latitude,
    longitude: query.longitude,
    forecastHours: query.forecastHours,
  });
  res.json({ success: true, data });
});

export const history = wrap(async (req: Request, res: Response) => {
  const data = await listWeatherHistory(req.query as { zoneId?: string; page?: number; limit?: number });
  res.json({ success: true, data });
});
