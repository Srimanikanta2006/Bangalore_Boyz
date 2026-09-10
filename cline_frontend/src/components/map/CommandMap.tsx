import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Asset, CascadeEvent, GeoFeatureCollection, RiskScore } from '../../types/domain';
import {
  buildAssetPoints,
  buildCascadeLines,
  buildDrainSegments,
  buildRoadSegments,
  DEPENDENCY_LINES,
  HAZARD_ZONE,
} from '../../data/geoData';
import { VIJAYAWADA_CENTER } from '../../data/constants';

function toGeoJSON(data: GeoFeatureCollection): FeatureCollection {
  return data as unknown as FeatureCollection;
}

const EMPTY_COLLECTION: FeatureCollection = { type: 'FeatureCollection', features: [] };

/*
 * Local-first dark style: the background plus every scenario layer is
 * authored locally as GeoJSON, so the command center map still renders if
 * the OSM raster tiles or the glyph server are unreachable. Tile/glyph
 * network failures are deliberately non-fatal.
 */
const DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#0a0f1a' } },
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm',
      paint: {
        'raster-opacity': 0.35,
        'raster-brightness-min': 0.05,
        'raster-brightness-max': 0.35,
        'raster-saturation': -0.8,
      },
    },
  ],
};

/** Runtime-generated directional arrow for cascade edges (no sprite assets). */
function createArrowImageData(color: string): ImageData {
  const size = 28;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(23, 14);
  ctx.lineTo(6, 5);
  ctx.lineTo(6, 23);
  ctx.closePath();
  ctx.fill();
  return ctx.getImageData(0, 0, size, size);
}

interface CommandMapProps {
  assets: Asset[];
  riskMap: Record<string, RiskScore>;
  selectedAssetId: string | null;
  cascade: CascadeEvent | null;
  simulationEscalated: boolean;
  onSelectAsset: (id: string) => void;
}

export function CommandMap({
  assets,
  riskMap,
  selectedAssetId,
  cascade,
  simulationEscalated,
  onSelectAsset,
}: CommandMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapError, setMapError] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const onSelectRef = useRef(onSelectAsset);
  onSelectRef.current = onSelectAsset;

  const cascadeAssetIds = new Set(cascade?.path ?? []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container,
        style: DARK_STYLE,
        center: [VIJAYAWADA_CENTER.lng, VIJAYAWADA_CENTER.lat],
        zoom: VIJAYAWADA_CENTER.zoom,
        attributionControl: { compact: true },
      });
    } catch {
      setMapError(true);
      return;
    }

    mapRef.current = map;
    let styleLoaded = false;

    // Watchdog: if the style itself never loads (e.g. WebGL unavailable),
    // degrade to the asset-list fallback instead of a blank canvas.
    const watchdog = window.setTimeout(() => {
      if (!styleLoaded) setMapError(true);
    }, 8000);

    map.on('load', () => {
      styleLoaded = true;
      window.clearTimeout(watchdog);

      try {
        if (!map.hasImage('cascade-arrow')) {
          map.addImage('cascade-arrow', createArrowImageData('#ef4444'));
        }
      } catch {
        // Arrows are optional decoration; cascade lines still render.
      }

      map.addSource('hazard-zone', { type: 'geojson', data: toGeoJSON(HAZARD_ZONE) });
      map.addLayer({
        id: 'hazard-zone-fill',
        type: 'fill',
        source: 'hazard-zone',
        paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.07 },
      });
      map.addLayer({
        id: 'hazard-zone-outline',
        type: 'line',
        source: 'hazard-zone',
        paint: {
          'line-color': '#f59e0b',
          'line-opacity': 0.35,
          'line-width': 1,
          'line-dasharray': [4, 4],
        },
      });

      map.addSource('dep-edges', { type: 'geojson', data: toGeoJSON(DEPENDENCY_LINES) });
      map.addLayer({
        id: 'dep-edges-line',
        type: 'line',
        source: 'dep-edges',
        paint: {
          'line-color': '#2e4160',
          'line-width': 1,
          'line-opacity': 0.5,
          'line-dasharray': [2, 3],
        },
      });

      map.addSource('roads', { type: 'geojson', data: EMPTY_COLLECTION });
      map.addLayer({
        id: 'roads-line',
        type: 'line',
        source: 'roads',
        paint: {
          'line-color': ['get', 'riskColorHex'],
          'line-width': [
            'case',
            ['>=', ['get', 'riskScore'], 75],
            4.5,
            ['>=', ['get', 'riskScore'], 35],
            3.5,
            3,
          ],
          'line-opacity': 0.7,
        },
      });
      map.addLayer({
        id: 'alt-route-line',
        type: 'line',
        source: 'roads',
        filter: ['==', ['get', 'alternative'], true],
        paint: {
          'line-color': '#22d3ee',
          'line-width': 2.5,
          'line-opacity': 0.6,
          'line-dasharray': [2, 2],
        },
      });

      map.addSource('drains', { type: 'geojson', data: EMPTY_COLLECTION });
      map.addLayer({
        id: 'drains-line',
        type: 'line',
        source: 'drains',
        paint: {
          'line-color': ['get', 'riskColorHex'],
          'line-width': [
            'case',
            ['>=', ['get', 'riskScore'], 75],
            3.5,
            ['>=', ['get', 'riskScore'], 35],
            3,
            2,
          ],
          'line-opacity': 0.55,
          'line-dasharray': [3, 2],
        },
      });

      map.addSource('cascade', { type: 'geojson', data: EMPTY_COLLECTION });
      map.addLayer({
        id: 'cascade-line-glow',
        type: 'line',
        source: 'cascade',
        paint: {
          'line-color': '#ef4444',
          'line-width': 8,
          'line-opacity': 0.22,
          'line-blur': 2,
        },
      });
      map.addLayer({
        id: 'cascade-line',
        type: 'line',
        source: 'cascade',
        paint: { 'line-color': '#ef4444', 'line-width': 3, 'line-opacity': 0.9 },
      });
      map.addLayer({
        id: 'cascade-arrows',
        type: 'symbol',
        source: 'cascade',
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 80,
          'icon-image': 'cascade-arrow',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 12, 0.4, 15, 0.7],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
        paint: { 'icon-opacity': 0.95 },
      });

      map.addSource('assets', { type: 'geojson', data: EMPTY_COLLECTION });
      map.addLayer({
        id: 'asset-glow',
        type: 'circle',
        source: 'assets',
        paint: {
          'circle-radius': 16,
          'circle-color': ['get', 'riskColorHex'],
          'circle-opacity': [
            'case',
            ['>=', ['get', 'riskScore'], 75],
            0.3,
            ['>=', ['get', 'riskScore'], 35],
            0.16,
            0.05,
          ],
          'circle-blur': 0.9,
        },
      });
      map.addLayer({
        id: 'assets-circle',
        type: 'circle',
        source: 'assets',
        paint: {
          'circle-radius': ['case', ['==', ['get', 'type'], 'hospital'], 9, 7],
          'circle-color': ['get', 'riskColorHex'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0a0f1a',
          'circle-opacity': 0.95,
        },
      });
      map.addLayer({
        id: 'assets-label',
        type: 'symbol',
        source: 'assets',
        layout: {
          'text-field': ['get', 'shortCode'],
          'text-size': 10,
          'text-offset': [0, 1.6],
          'text-anchor': 'top',
          'text-font': ['Noto Sans Regular', 'Open Sans Regular', 'Arial Unicode MS Regular'],
        },
        paint: {
          'text-color': '#e2e8f0',
          'text-halo-color': '#0a0f1a',
          'text-halo-width': 1,
        },
      });
      map.addLayer({
        id: 'selection-ring',
        type: 'circle',
        source: 'assets',
        filter: ['==', ['get', 'id'], ''],
        paint: {
          'circle-radius': 14,
          'circle-color': 'transparent',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#22d3ee',
          'circle-stroke-opacity': 1,
        },
      });

      map.on('click', 'assets-circle', (e) => {
        const feature = e.features?.[0];
        const id = feature?.properties?.id;
        if (typeof id === 'string') onSelectRef.current(id);
      });
      map.on('mouseenter', 'assets-circle', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'assets-circle', () => {
        map.getCanvas().style.cursor = '';
      });

      setMapReady(true);
    });

    return () => {
      window.clearTimeout(watchdog);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Assets, roads and drains — all risk styling is data-driven from feature props.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || mapError) return;
    (map.getSource('assets') as maplibregl.GeoJSONSource | undefined)?.setData(
      toGeoJSON(buildAssetPoints(riskMap)),
    );
    (map.getSource('roads') as maplibregl.GeoJSONSource | undefined)?.setData(
      toGeoJSON(buildRoadSegments(riskMap)),
    );
    (map.getSource('drains') as maplibregl.GeoJSONSource | undefined)?.setData(
      toGeoJSON(buildDrainSegments(riskMap)),
    );
  }, [mapReady, mapError, riskMap]);

  // Selection ring for the currently selected asset.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || mapError) return;
    map.setFilter(
      'selection-ring',
      selectedAssetId ? ['==', ['get', 'id'], selectedAssetId] : ['==', ['get', 'id'], ''],
    );
  }, [mapReady, mapError, selectedAssetId]);

  // Cascade lines + fit-to-cascade when the incident is active.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || mapError) return;

    const cascadeSource = map.getSource('cascade') as maplibregl.GeoJSONSource | undefined;
    if (cascade && simulationEscalated) {
      cascadeSource?.setData(toGeoJSON(buildCascadeLines(cascade.path)));

      const coords = cascade.path
        .map((id) => assets.find((a) => a.id === id))
        .filter((a): a is Asset => Boolean(a))
        .map((a) => [a.lng, a.lat] as [number, number]);

      if (coords.length >= 2) {
        const bounds = coords.reduce(
          (b, c) => b.extend(c),
          new maplibregl.LngLatBounds(coords[0], coords[0]),
        );
        map.fitBounds(bounds, { padding: 100, maxZoom: 15.5, duration: 800 });
      }
    } else {
      cascadeSource?.setData(EMPTY_COLLECTION);
    }
  }, [mapReady, mapError, cascade, simulationEscalated, assets]);

  // Hazard zone tint: amber while on watch, red once escalated.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || mapError) return;
    const zoneColor = simulationEscalated ? '#ef4444' : '#f59e0b';
    map.setPaintProperty('hazard-zone-fill', 'fill-color', zoneColor);
    map.setPaintProperty('hazard-zone-fill', 'fill-opacity', simulationEscalated ? 0.14 : 0.07);
    map.setPaintProperty('hazard-zone-outline', 'line-color', zoneColor);
  }, [mapReady, mapError, simulationEscalated]);

  // The map container always stays mounted; the fallback overlays it so a
  // failed basemap can never break the rest of the command center.
  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label="Infrastructure map"
      />
      {mapError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-cs-bg/95 p-4">
          <div className="w-full max-w-md rounded-lg border border-cs-border bg-cs-panel p-6">
            <p className="mb-1 text-sm font-medium text-cs-text">Map unavailable</p>
            <p className="mb-4 text-xs text-cs-textDim">
              The basemap could not be loaded. Command center data remains available — select an
              asset below or use the incident panel.
            </p>
            <div className="space-y-2">
              {assets.map((a) => {
                const risk = riskMap[a.id];
                const inCascade = cascadeAssetIds.has(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onSelectAsset(a.id)}
                    className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left text-sm transition-colors hover:bg-cs-panelAlt ${
                      selectedAssetId === a.id ? 'border-cs-primary' : 'border-cs-border'
                    } ${inCascade ? 'ring-1 ring-cs-critical/50' : ''}`}
                  >
                    <span className="text-cs-text">{a.name}</span>
                    <span className="font-mono text-xs text-cs-textDim">{risk?.score ?? '—'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
