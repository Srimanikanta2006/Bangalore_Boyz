/** Standard success/error envelope shapes for every endpoint. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PageMeta;
}

/** MapLibre/GeoJSON compatible shapes. */
export type GeoGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'LineString'; coordinates: [number, number][] }
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] };

export interface GeoFeature<P> {
  type: 'Feature';
  geometry: GeoGeometry;
  properties: P;
}

export interface GeoFeatureCollection<P> {
  type: 'FeatureCollection';
  dataQuality: 'SYNTHETIC_DEMO' | 'REAL_GEOGRAPHIC' | 'MIXED' | 'MODELED' | 'UNKNOWN';
  features: GeoFeature<P>[];
}

/** Alias retained for compatibility with earlier code. */
export type GeoPointFeature<P> = GeoFeature<P>;
