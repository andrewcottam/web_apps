import { Map, View } from 'ol';
import proj4 from 'proj4';
import OSM from 'ol/source/OSM.js';
import XYZ from 'ol/source/XYZ.js';
import GeoTIFF from 'ol/source/GeoTIFF.js';
import TileLayer from 'ol/layer/Tile.js';
import WebGLTileLayer from 'ol/layer/WebGLTile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { Style, Stroke } from 'ol/style.js';
import { fromEPSGCode, register } from 'ol/proj/proj4.js';
import { transformExtent, transform as transformCoord } from 'ol/proj.js';

register(proj4);

const params = new URLSearchParams(window.location.search);

// COG URL(s) for the VEG-DIST-STATUS disturbance overlay. Comma-separated when a site
// spans more than one MGRS tile — ol/source/GeoTIFF mosaics multiple sources automatically.
const cogUrls = (params.get('cog') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Site bounding box in EPSG:4326 (minLon,minLat,maxLon,maxLat), used to constrain pan/zoom.
const bboxParam = params.get('bbox');
const bbox4326 = bboxParam ? bboxParam.split(',').map(Number) : null;

// Site boundary geometry (GeoJSON, URI-encoded), drawn as an outline over the imagery.
const geomParam = params.get('geom');
let siteGeoJSON = null;
if (geomParam) {
  try {
    siteGeoJSON = JSON.parse(decodeURIComponent(geomParam));
  } catch (err) {
    console.error('Failed to parse geom param:', err);
  }
}

const siteName = params.get('site') || '';
if (siteName) {
  document.getElementById('site-name').textContent = siteName;
  document.title = `${siteName} — DIST-ALERT`;
}

// Overlay color: VEG-DIST-STATUS is a categorical raster (0 = no disturbance, 1-8 = disturbance
// classes, 255 = nodata). We render every disturbed pixel as a single semi-transparent color,
// matching the single-color CDM overlay already used for the report's cumulative image.
//
// The `alpha` URL param is 0-255 (matching `color`, and the report's own RGBA conventions),
// but OL's WebGL style `color` literal expects alpha as a 0-1 float, unlike r/g/b which stay
// 0-255 — passing 0-255 straight through overflows the premultiplied color math and clamps
// to solid white instead of a semi-transparent color.
const overlayColor = (params.get('color') || 'ff3b30').replace('#', '');
const overlayAlpha255 = Number(params.get('alpha') || '160');
const r = parseInt(overlayColor.slice(0, 2), 16);
const g = parseInt(overlayColor.slice(2, 4), 16);
const b = parseInt(overlayColor.slice(4, 6), 16);
const overlayAlpha = overlayAlpha255 / 255;

// Basemaps — satellite is the default, since it gives useful context the other two don't.
const basemaps = {
  osm: new TileLayer({ source: new OSM(), visible: false }),
  satellite: new TileLayer({
    source: new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attributions: 'Tiles © Esri',
      maxZoom: 19,
    }),
    visible: true,
  }),
  grey: new TileLayer({
    source: new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      attributions: 'Tiles © Esri',
      maxZoom: 16,
    }),
    visible: false,
  }),
};

function setBasemap(name) {
  for (const [key, layer] of Object.entries(basemaps)) {
    layer.setVisible(key === name);
  }
}

const layers = [basemaps.osm, basemaps.satellite, basemaps.grey];

let overlayLayer = null;
let geoTiffSource = null;

if (cogUrls.length > 0) {
  // VEG-DIST-STATUS is an 8-bit categorical raster (exact integer class codes 0-8, 255
  // nodata). Without `nodata: NaN`, ol/source/GeoTIFF auto-detects the TIFF's declared
  // nodata value, masks those pixels to 0, and auto-stretches the remaining data's own
  // min/max for display — which corrupts the raw values the style's exact-value
  // comparisons below depend on. `nodata: NaN` disables that and passes raw values through.
  //
  // `interpolate: false` on the SOURCE (not just the layer, below) forces nearest-neighbour
  // resampling during the reprojection from the COG's native UTM grid into the map's
  // EPSG:3857 view itself — without it, that reprojection step blends adjacent class codes
  // together at the raster's edge, tracing a false "disturbed" outline around the site
  // boundary even though no such value exists anywhere in the source data.
  geoTiffSource = new GeoTIFF({
    sources: cogUrls.map((url) => ({ url, nodata: NaN })),
    normalize: false,
    interpolate: false,
  });

  overlayLayer = new WebGLTileLayer({
    source: geoTiffSource,
    visible: true,
    // Nearest-neighbour for the final display sampling too.
    interpolate: false,
    style: {
      color: [
        'case',
        ['==', ['band', 1], 0], [0, 0, 0, 0],
        ['==', ['band', 1], 255], [0, 0, 0, 0],
        [r, g, b, overlayAlpha],
      ],
        },
  });

  layers.push(overlayLayer);
}

function padExtent([minX, minY, maxX, maxY], fraction) {
  const dx = (maxX - minX) * fraction;
  const dy = (maxY - minY) * fraction;
  return [minX - dx, minY - dy, maxX + dx, maxY + dy];
}

async function init() {
  // The COG's native CRS (typically a UTM zone) must be registered with proj4 before
  // OpenLayers can reproject it into the map's EPSG:3857 view — otherwise reprojection
  // silently produces NaNs for any tile request.
  //
  // A failed/unreachable COG (dead link, bucket CORS not yet configured, network hiccup)
  // must not take down the whole page — the basemap should still render without it. When
  // every source fails, ol/source/GeoTIFF's getView() promise can hang rather than reject,
  // so this is raced against a timeout rather than relying on try/catch alone.
  let geoTiffViewConfig = null;
  if (geoTiffSource) {
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timed out loading COG')), 8000)
      );
      geoTiffViewConfig = await Promise.race([geoTiffSource.getView(), timeout]);
      await fromEPSGCode(geoTiffViewConfig.projection.getCode());
    } catch (err) {
      console.error('Disturbance overlay COG failed to load:', err);
      geoTiffViewConfig = null;
      overlayLayer.setVisible(false);
      overlayLayer = null;
      document.getElementById('overlay-toggle').disabled = true;
      document.getElementById('overlay-toggle').checked = false;
    }
  }

  const mapEl = document.getElementById('map');
  const mapSize = [mapEl.clientWidth || window.innerWidth, mapEl.clientHeight || window.innerHeight];

  let initialView;
  let restrictedExtent = null;

  if (bbox4326) {
    const extent3857 = transformExtent(bbox4326, 'EPSG:4326', 'EPSG:3857');
    restrictedExtent = padExtent(extent3857, 0.15);
    initialView = new View();
    initialView.fit(restrictedExtent, { size: mapSize, padding: [20, 20, 20, 20] });
  } else if (geoTiffViewConfig) {
    const extent3857 = transformExtent(geoTiffViewConfig.extent, geoTiffViewConfig.projection, 'EPSG:3857');
    restrictedExtent = padExtent(extent3857, 0.15);
    initialView = new View();
    initialView.fit(restrictedExtent, { size: mapSize, padding: [20, 20, 20, 20] });
  } else {
    initialView = new View({ center: [0, 0], zoom: 2 });
  }

  // Don't let the user zoom out past (much beyond) the site extent, or in past native
  // raster resolution.
  const fittedZoom = initialView.getZoom();
  if (fittedZoom !== undefined) {
    initialView.setMinZoom(Math.max(0, fittedZoom - 1));
    initialView.setMaxZoom(fittedZoom + 8);
  }

  if (siteGeoJSON) {
    const format = new GeoJSON();
    const features = format.readFeatures(
      { type: 'Feature', geometry: siteGeoJSON, properties: {} },
      { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }
    );
    const boundaryLayer = new VectorLayer({
      source: new VectorSource({ features }),
      // Matches the default outline_colour (120,120,120,220) create-rs-preview uses for the
      // site boundary on the report's own preview images.
      style: new Style({ stroke: new Stroke({ color: 'rgba(120,120,120,0.863)', width: 2 }) }),
    });
    layers.push(boundaryLayer);
  }

  const map = new Map({
    target: 'map',
    layers,
    view: initialView,
  });

  if (restrictedExtent) {
    map.getView().set('restrictedExtent', restrictedExtent);
  }

  setupInteractions(map);
}

init();

function setupInteractions(map) {
  // Constrain panning to the site extent once set, without fighting OL's own extent option.
  map.on('moveend', () => {
    const view = map.getView();
    const restricted = view.get('restrictedExtent');
    if (!restricted) return;
    const center = view.getCenter();
    const [minX, minY, maxX, maxY] = restricted;
    const clampedX = Math.min(Math.max(center[0], minX), maxX);
    const clampedY = Math.min(Math.max(center[1], minY), maxY);
    if (clampedX !== center[0] || clampedY !== center[1]) {
      view.setCenter([clampedX, clampedY]);
    }
  });

  // Basemap switcher
  document.getElementById('basemap-group').addEventListener('change', (evt) => {
    setBasemap(evt.target.value);
  });

  // Disturbance overlay toggle
  document.getElementById('overlay-toggle').addEventListener('change', (evt) => {
    if (overlayLayer) {
      overlayLayer.setVisible(evt.target.checked);
    }
  });
  if (!overlayLayer) {
    document.getElementById('overlay-toggle').disabled = true;
  }

  // Click → show the lat/lon of the clicked point (no raster value query needed).
  const coordsEl = document.getElementById('coords');
  let lastCoordText = '';

  map.on('singleclick', (evt) => {
    const [lon, lat] = transformCoord(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
    lastCoordText = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    coordsEl.innerHTML = `${lastCoordText}<span class="hint">lat, lon — click to copy</span>`;
    coordsEl.classList.add('visible');
  });

  coordsEl.addEventListener('click', () => {
    if (!lastCoordText) return;
    navigator.clipboard.writeText(lastCoordText).then(() => {
      const original = coordsEl.innerHTML;
      coordsEl.innerHTML = 'Copied!';
      setTimeout(() => {
        coordsEl.innerHTML = original;
      }, 800);
    });
  });
}
