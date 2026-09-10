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
export interface GeoPointFeature<P> {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: P;
}

export interface GeoFeatureCollection<P> {
  type: 'FeatureCollection';
  dataQuality: 'SYNTHETIC_DEMO';
  features: GeoPointFeature<P>[];
}
