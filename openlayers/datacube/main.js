import { Map, View } from 'ol';
import { useGeographic, transform } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import ImageLayer from 'ol/layer/Image';
import ImageStatic from 'ol/source/ImageStatic';
import Draw from 'ol/interaction/Draw';
import { Fill, Stroke, Style } from 'ol/style';
import { apply } from 'ol-mapbox-style';
import proj4 from 'proj4';
import { register as registerProj4 } from 'ol/proj/proj4';

// Zarr
import * as zarr from 'zarrita';

// Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

useGeographic();

// Firebase config (same restor-poc-apps project used by the other openlayers apps
// in this repo — public client config, not a secret).
const firebaseConfig = {
    apiKey: "AIzaSyAzrhJkckakoJLnRThTDvNRwyE29k7DDGQ",
    authDomain: "restor-poc-apps-b3414.firebaseapp.com",
    projectId: "restor-poc-apps-b3414",
    storageBucket: "restor-poc-apps-b3414.appspot.com",
    messagingSenderId: "1043831538397",
    appId: "1:1043831538397:web:50d6c71e135234ef4b9134"
};

const firebase_app = initializeApp(firebaseConfig);
const auth = getAuth(firebase_app);
const provider = new GoogleAuthProvider();

// Fixed zarr stores this app samples — two independently-generated per-site
// datacubes: a derived NDVI timeseries, and a true-color RGB composite (see
// loadRgbData). Switchable in the UI via the legend's NDVI/Visible toggle.
const ZARR_STORE_URL = 'https://storage.googleapis.com/restor-datacube/sentinel2_ndvi/site-123_timeseries.zarr';
const RGB_STORE_URL = 'https://storage.googleapis.com/restor-datacube/sentinel2_rgb/site-123_timeseries.zarr';

const DEFAULT_LAT = 50.256360;
const DEFAULT_LON = -3.794742;
const DEFAULT_ZOOM = 14.26;

function getUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = parseFloat(urlParams.get('lat'));
    const lon = parseFloat(urlParams.get('lon') ?? urlParams.get('lng'));
    const zoom = parseFloat(urlParams.get('zoom'));
    return {
        lat: isNaN(lat) ? DEFAULT_LAT : lat,
        lon: isNaN(lon) ? DEFAULT_LON : lon,
        zoom: isNaN(zoom) ? DEFAULT_ZOOM : zoom,
    };
}

const urlParams = getUrlParameters();

// Both overlay layers get an explicit zIndex above the basemap's (default 0) —
// ol-mapbox-style's apply() manages its own basemap layers' insertion order in the
// map's layer collection in a way that isn't a reliable "always below layers added
// before it" guarantee (confirmed empirically: with no zIndex set, the basemap
// ended up painted on top of both layers below, hiding them entirely). zIndex
// bypasses collection order and pins the paint order directly.
const OVERLAY_Z_INDEX = 10;

// Layer the drawn polygon is rendered on.
const drawSource = new VectorSource();
const drawLayer = new VectorLayer({
    source: drawSource,
    zIndex: OVERLAY_Z_INDEX + 1,
    // Same drawn-polygon colors as openlayers/verify's draw-source layer
    // (App.tsx) — red fill and red outline.
    style: new Style({
        fill: new Fill({ color: 'rgba(255, 0, 0, 0.3)' }),
        stroke: new Stroke({ color: '#ff0000', width: 2 }),
    }),
});

// NDVI raster overlay for whichever date is clicked in the chart — no source yet,
// swapped in by renderNdviRaster(). zIndex kept below drawLayer's so the drawn
// polygon's outline stays visible on top of the raster.
const ndviRasterLayer = new ImageLayer({ opacity: 0.85, zIndex: OVERLAY_Z_INDEX });

const map = new Map({
    target: 'map',
    layers: [ndviRasterLayer, drawLayer],
    view: new View({ center: [urlParams.lon, urlParams.lat], zoom: urlParams.zoom }),
});

// Basemap — MapTiler's satellite imagery style, same API key already used by the
// other openlayers apps in this repo.
const styleJson = 'https://api.maptiler.com/maps/satellite/style.json?key=67VOA297U9cciigsJVvm';
apply(map, styleJson);

// Keep the URL's lat/lon/zoom in sync with the current view, mirroring vector_tiles.
let urlSyncTimeout = null;
function scheduleUrlSync() {
    if (urlSyncTimeout) clearTimeout(urlSyncTimeout);
    urlSyncTimeout = setTimeout(() => {
        urlSyncTimeout = null;
        const view = map.getView();
        const center = view.getCenter();
        const params = new URLSearchParams();
        params.set('lon', center[0].toFixed(6));
        params.set('lat', center[1].toFixed(6));
        params.set('zoom', view.getZoom().toFixed(2));
        window.history.replaceState(null, '', `?${params.toString()}`);
    }, 400);
}
map.on('moveend', scheduleUrlSync);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

let current_user = null;

const DEFAULT_LOGIN_ICON = `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
`;

function updateLoginButton() {
    const btn = document.getElementById('login-button');
    if (current_user) {
        btn.innerHTML = current_user.photoURL ? `<img src="${current_user.photoURL}" alt="">` : DEFAULT_LOGIN_ICON;
        btn.title = `Signed in as ${current_user.email || current_user.displayName || ''} — click to sign out`;
    } else {
        btn.innerHTML = DEFAULT_LOGIN_ICON;
        btn.title = 'Sign in with Google';
    }
}

async function loginClicked() {
    if (current_user) {
        await signOut(auth);
        current_user = null;
        updateLoginButton();
        return;
    }
    try {
        const result = await signInWithPopup(auth, provider);
        current_user = result.user;
    } catch (e) {
        console.error('Sign-in failed:', e);
    }
    updateLoginButton();
}

// ---------------------------------------------------------------------------
// Zarr NDVI loading
// ---------------------------------------------------------------------------

// The whole per-site datacube is small (a handful of timesteps over a few hundred
// pixels), so it's fetched and cached in full on first use rather than windowed to
// the drawn polygon's bounding box.
let ndviDataPromise = null;

function loadNdviData() {
    if (!ndviDataPromise) {
        ndviDataPromise = (async () => {
            const rawStore = new zarr.FetchStore(ZARR_STORE_URL);
            const store = await zarr.withMaybeConsolidatedMetadata(rawStore);
            const root = await zarr.open(store, { kind: 'group' });

            const ndviNode = await zarr.open(root.resolve('ndvi'), { kind: 'array' });
            const xNode = await zarr.open(root.resolve('x'), { kind: 'array' });
            const yNode = await zarr.open(root.resolve('y'), { kind: 'array' });
            const timeNode = await zarr.open(root.resolve('time'), { kind: 'array' });

            const [ndvi, x, y, time] = await Promise.all([
                zarr.get(ndviNode), zarr.get(xNode), zarr.get(yNode), zarr.get(timeNode),
            ]);

            const dims = ndviNode.attrs['_ARRAY_DIMENSIONS'] || ['time', 'y', 'x'];
            if (dims.join(',') !== 'time,y,x') {
                throw new Error(`Unsupported ndvi array dimension order: ${dims.join(',')}`);
            }

            const crs = ndviNode.attrs['crs'];
            if (!crs) throw new Error('ndvi array has no "crs" attribute');

            const dates = decodeTimeCoordinate(time, timeNode.attrs);

            return { ndvi, x, y, dates, crs };
        })();
    }
    return ndviDataPromise;
}

// A second, independently-generated datacube for the same site — a true-color
// RGB composite rather than a derived index. Loaded lazily (only once the user
// actually switches to "Visible" mode — see chartConfig.layerMode) rather than
// eagerly alongside the NDVI cube, since most sessions won't need it. Its own
// time axis is a different length (103 dates vs. NDVI's, at last count, 138)
// and doesn't line up 1:1 with the NDVI series' dates — a separate acquisition/
// cloud-masking run — so selecting an NDVI observation looks up the *nearest*
// RGB date rather than assuming a matching index (see findNearestDateIndex).
let rgbDataPromise = null;

function loadRgbData() {
    if (!rgbDataPromise) {
        rgbDataPromise = (async () => {
            const rawStore = new zarr.FetchStore(RGB_STORE_URL);
            const store = await zarr.withMaybeConsolidatedMetadata(rawStore);
            const root = await zarr.open(store, { kind: 'group' });

            const rgbNode = await zarr.open(root.resolve('rgb'), { kind: 'array' });
            const xNode = await zarr.open(root.resolve('x'), { kind: 'array' });
            const yNode = await zarr.open(root.resolve('y'), { kind: 'array' });
            const timeNode = await zarr.open(root.resolve('time'), { kind: 'array' });

            const [rgb, x, y, time] = await Promise.all([
                zarr.get(rgbNode), zarr.get(xNode), zarr.get(yNode), zarr.get(timeNode),
            ]);

            const dims = rgbNode.attrs['_ARRAY_DIMENSIONS'] || ['time', 'band', 'y', 'x'];
            if (dims.join(',') !== 'time,band,y,x') {
                throw new Error(`Unsupported rgb array dimension order: ${dims.join(',')}`);
            }

            const crs = rgbNode.attrs['crs'];
            if (!crs) throw new Error('rgb array has no "crs" attribute');

            const dates = decodeTimeCoordinate(time, timeNode.attrs);

            return { rgb, x, y, dates, crs };
        })();
    }
    return rgbDataPromise;
}

// Index of whichever entry in `dates` is closest in time to `targetDate` —
// used to map an NDVI observation's date onto the RGB cube's own, differently-
// dated time axis (see loadRgbData's comment).
function findNearestDateIndex(dates, targetDate) {
    let bestIndex = 0, bestDiffMs = Infinity;
    dates.forEach((d, i) => {
        const diffMs = Math.abs(d.getTime() - targetDate.getTime());
        if (diffMs < bestDiffMs) {
            bestDiffMs = diffMs;
            bestIndex = i;
        }
    });
    return bestIndex;
}

// Decodes a CF-style ("<n> <unit> since <origin>") integer time coordinate into
// JS Dates. zarrita reads int64 data as a BigInt64Array, hence the Number() cast.
function decodeTimeCoordinate(time, attrs) {
    const units = attrs['units'];
    const match = units && units.match(/^(days|hours|minutes|seconds)\s+since\s+(.+)$/i);
    if (!match) throw new Error(`Unsupported time units: ${units}`);
    const secondsPerUnit = { days: 86400, hours: 3600, minutes: 60, seconds: 1 }[match[1].toLowerCase()];
    const origin = new Date(match[2].trim().replace(' ', 'T') + 'Z').getTime();
    if (isNaN(origin)) throw new Error(`Unsupported time origin: ${match[2]}`);

    const values = time.data;
    const dates = new Array(values.length);
    for (let i = 0; i < values.length; i++) {
        dates[i] = new Date(origin + Number(values[i]) * secondsPerUnit * 1000);
    }
    return dates;
}

// Registers a UTM zone (the projection family these per-site datacubes are stored
// in) with proj4/OpenLayers from its EPSG code alone — e.g. "EPSG:32632" -> zone 32N.
// EPSG:4326 is passed through untransformed. Anything else is unsupported.
function ensureProjectionRegistered(epsgCode) {
    if (epsgCode === 'EPSG:4326') return true;
    const match = epsgCode.match(/^EPSG:(\d+)$/);
    const code = match && parseInt(match[1], 10);
    let def = null;
    if (code >= 32601 && code <= 32660) {
        def = `+proj=utm +zone=${code - 32600} +datum=WGS84 +units=m +no_defs +type=crs`;
    } else if (code >= 32701 && code <= 32760) {
        def = `+proj=utm +zone=${code - 32700} +south +datum=WGS84 +units=m +no_defs +type=crs`;
    }
    if (!def) return false;
    proj4.defs(epsgCode, def);
    registerProj4(proj4);
    return true;
}

// Averages ndvi (shape [time, y, x], row-major) over every grid-cell center that
// falls inside `polygon` (an ol/geom/Polygon already in the array's own CRS), for
// each timestep — skipping NaN (cloud-masked) pixels. Returns one point per
// timestep (not aggregated by year) so sites whose observations cluster within a
// single year — like this one, all 5 dates fall within Feb-Mar 2024 — still show
// every underlying data point rather than collapsing them into a single bar;
// renderNdviChart groups the x-axis by year visually instead.
function computeObservations(ndviData, polygon) {
    const { ndvi, x, y, dates } = ndviData;
    const [nt, ny, nx] = ndvi.shape;
    const data = ndvi.data;

    const insideIdx = [];
    for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
            if (polygon.intersectsCoordinate([x.data[i], y.data[j]])) {
                insideIdx.push(j * nx + i);
            }
        }
    }
    if (insideIdx.length === 0) return [];

    const observations = [];
    for (let t = 0; t < nt; t++) {
        const base = t * ny * nx;
        let sum = 0, count = 0;
        for (const idx of insideIdx) {
            const v = data[base + idx];
            if (!isNaN(v)) {
                sum += v;
                count++;
            }
        }
        if (count === 0) continue; // every pixel cloud-masked at this timestep
        // tIndex (the original position along the ndvi array's time axis) is kept
        // alongside the aggregated mean so a later raster click can slice the full
        // grid for this exact timestep — see renderNdviRaster. coverage (the
        // fraction of the polygon's pixels that actually had data at this
        // timestep, as opposed to cloud-masked) drives the chart's optional
        // low-coverage interpolation — see chartConfig.interpolateLowCoverage.
        observations.push({ date: dates[t], ndvi: sum / count, tIndex: t, coverage: count / insideIdx.length });
    }

    return observations.sort((a, b) => a.date - b.date);
}

// ---------------------------------------------------------------------------
// NDVI raster overlay
// ---------------------------------------------------------------------------

// ColorBrewer "RdYlGn" diverging ramp — the standard convention for NDVI display
// (red/brown for bare soil or water, yellow for sparse vegetation, green for dense
// vegetation). Stops are evenly spaced across NDVI_DOMAIN below.
const NDVI_PALETTE = [
    [165, 0, 38], [215, 48, 39], [244, 109, 67], [253, 174, 97], [254, 224, 139],
    [255, 255, 191], [217, 239, 139], [166, 217, 106], [102, 189, 99], [26, 152, 80], [0, 104, 55],
];
// A typical display stretch for vegetated sites, not the full theoretical -1..1
// range — most cloud-free vegetated NDVI observations fall inside this band, so it
// gives better visual contrast than stretching all the way to -1.
const NDVI_DOMAIN = [-0.2, 1.0];

function ndviToColor(value) {
    const t = Math.min(1, Math.max(0, (value - NDVI_DOMAIN[0]) / (NDVI_DOMAIN[1] - NDVI_DOMAIN[0])));
    const scaled = t * (NDVI_PALETTE.length - 1);
    const i0 = Math.floor(scaled);
    const i1 = Math.min(i0 + 1, NDVI_PALETTE.length - 1);
    const f = scaled - i0;
    const c0 = NDVI_PALETTE[i0], c1 = NDVI_PALETTE[i1];
    return [
        Math.round(c0[0] + (c1[0] - c0[0]) * f),
        Math.round(c0[1] + (c1[1] - c0[1]) * f),
        Math.round(c0[2] + (c1[2] - c0[2]) * f),
    ];
}

function showNdviLegend() {
    document.getElementById('ndvi-legend').classList.add('visible');
}

function hideNdviLegend() {
    document.getElementById('ndvi-legend').classList.remove('visible');
    document.getElementById('ndvi-legend-date').textContent = '';
    document.getElementById('ndvi-layer-loading').classList.remove('visible');
    ndviRasterLayer.setSource(null);
}

// Shared by renderNdviRaster/renderRgbRaster: rasterizes a (y,x) grid into a
// canvas via a per-pixel `getPixelColor(j, i)` callback (returning an [r,g,b]
// array, or a falsy value for a transparent/no-data pixel), reprojects its
// extent from `crs` into EPSG:3857, and sets it as ndviRasterLayer's source.
//
// Canvas row 0 must be the northernmost row for the image to appear upright;
// sort each axis' indices into ascending/descending order rather than assuming
// the coordinate arrays are already stored that way.
//
// Reprojecting just the two extent corners into EPSG:3857 ourselves — via the
// same `transform` already proven correct by the polygon aggregation — rather
// than handing ImageStatic the source `crs` (e.g. EPSG:32630) and letting OL's
// generic reproj/Image machinery warp it on the fly. A site this small (~2km) is
// effectively rigid under any of these transforms, so this corner-only
// approximation is visually exact; it's the *destination* projection that
// matters here, not the source, and EPSG:3857 is deliberate, not 4326:
//
// useGeographic() only sets ol/proj's *user* projection (so view.getCenter()/
// Draw output read as lon/lat) — a vector-tile basemap's View still renders
// internally in EPSG:3857 (Web Mercator), confirmed empirically via
// CanvasImageLayerRenderer's prepareFrame: frameState.extent came back in Web
// Mercator meters like [828483, 5932320, ...], not degrees. Reprojecting to
// EPSG:3857 up front and passing `projection: 'EPSG:3857'` (matching the frame's
// real projection exactly) makes OL's own equivalence check treat this as
// "already in the target projection" and skip its ReprojImage warp path — which,
// for reasons not fully tracked down, renders a blank canvas here even for the
// otherwise well-supported EPSG:4326<->3857 pair (confirmed by directly reading
// back 0 opaque pixels from ReprojImage's own internal canvas). Feeding
// ImageStatic coordinates that are already in the frame's exact projection
// sidesteps that path entirely and uses the simple, direct draw instead.
function renderRasterLayer(x, y, crs, getPixelColor) {
    const nx = x.data.length, ny = y.data.length;
    const yOrder = [...y.data.keys()].sort((a, b) => y.data[b] - y.data[a]); // descending (north first)
    const xOrder = [...x.data.keys()].sort((a, b) => x.data[a] - x.data[b]); // ascending (west first)

    const canvas = document.createElement('canvas');
    canvas.width = nx;
    canvas.height = ny;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(nx, ny);
    for (let row = 0; row < ny; row++) {
        const j = yOrder[row];
        for (let col = 0; col < nx; col++) {
            const i = xOrder[col];
            const px = (row * nx + col) * 4;
            const color = getPixelColor(j, i);
            if (!color) {
                imageData.data[px + 3] = 0; // transparent — cloud-masked/no data
            } else {
                imageData.data[px] = color[0];
                imageData.data[px + 1] = color[1];
                imageData.data[px + 2] = color[2];
                imageData.data[px + 3] = 255;
            }
        }
    }
    ctx.putImageData(imageData, 0, 0);

    // x/y are pixel-center coordinates — expand by a half pixel on every side so
    // the image extent covers the full grid, not just the centers.
    const dx = nx > 1 ? Math.abs(x.data[1] - x.data[0]) : 0;
    const dy = ny > 1 ? Math.abs(y.data[1] - y.data[0]) : 0;
    const minX = Math.min(...x.data) - dx / 2;
    const maxX = Math.max(...x.data) + dx / 2;
    const minY = Math.min(...y.data) - dy / 2;
    const maxY = Math.max(...y.data) + dy / 2;

    const [xMin3857, yMin3857] = transform([minX, minY], crs, 'EPSG:3857');
    const [xMax3857, yMax3857] = transform([maxX, maxY], crs, 'EPSG:3857');

    ndviRasterLayer.setSource(new ImageStatic({
        url: canvas.toDataURL(),
        imageExtent: [xMin3857, yMin3857, xMax3857, yMax3857],
        projection: 'EPSG:3857',
    }));
    showNdviLegend();
}

// Rasterizes the ndvi grid at `tIndex` (the full site grid, not just the drawn
// polygon — a click is "show me this date's data", not a re-aggregation),
// colored with ndviToColor.
function renderNdviRaster(ndviData, tIndex) {
    const { ndvi, x, y, crs } = ndviData;
    const [, ny, nx] = ndvi.shape;
    const data = ndvi.data;
    const base = tIndex * ny * nx;
    renderRasterLayer(x, y, crs, (j, i) => {
        const v = data[base + j * nx + i];
        return isNaN(v) ? null : ndviToColor(v);
    });
}

// Rasterizes the rgb grid (shape [time, band, y, x], band order red/green/blue —
// see readme) at `tIndex` — true-color, no colormap needed, just the raw
// 0-255 bytes. There's no explicit zarr fill_value for this uint8 array, so
// pure black (0,0,0) is treated as the cloud-masked/no-data marker — the same
// convention the generating pipeline uses for the NDVI array's NaN fill,
// carried over here since uint8 has no NaN of its own.
function renderRgbRaster(rgbData, tIndex) {
    const { rgb, x, y, crs } = rgbData;
    const [, nb, ny, nx] = rgb.shape;
    const data = rgb.data;
    const bandStride = ny * nx;
    const base = tIndex * nb * bandStride;
    renderRasterLayer(x, y, crs, (j, i) => {
        const pixelIdx = j * nx + i;
        const r = data[base + pixelIdx];
        const g = data[base + bandStride + pixelIdx];
        const b = data[base + 2 * bandStride + pixelIdx];
        return (r === 0 && g === 0 && b === 0) ? null : [r, g, b];
    });
}

// ---------------------------------------------------------------------------
// NDVI panel / chart
// ---------------------------------------------------------------------------

function showNdviPanel() {
    document.getElementById('ndvi-panel').classList.add('visible');
}

function hideNdviPanel() {
    document.getElementById('ndvi-panel').classList.remove('visible');
}

function setNdviStatus(message, isError) {
    const spinner = isError ? '' : '<span class="ndvi-spinner"></span>';
    document.getElementById('ndvi-panel-body').innerHTML =
        `<div id="ndvi-status"${isError ? ' class="error"' : ''}>${spinner}${escapeHtml(message)}</div>`;
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Aggregation results from the most recent renderNdviChart call — read by the
// delegated marker-click/legend-toggle listeners (bound once, in the
// DOMContentLoaded handler below) rather than each render attaching its own
// listeners, which would otherwise stack duplicate handlers on #ndvi-panel-body
// across multiple draws.
let currentAnalysis = null;

// Color per year (all markers are plain circles), cycled if a site ever spans
// more years than this.
const YEAR_COLORS = ['#6b9b5e', '#4a7fb5', '#c9852f', '#8a4ab5', '#c94f63', '#2fa89c'];

function yearColor(index) {
    return YEAR_COLORS[index % YEAR_COLORS.length];
}

// Non-leap-year cumulative day-of-year at the start of each month — used only for
// x-axis month gridline placement, so a leap year's one-day shift is an acceptable
// approximation rather than something worth the extra complexity to correct for.
const MONTH_START_DAY = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dayOfYear(date) {
    const start = Date.UTC(date.getUTCFullYear(), 0, 1);
    return Math.floor((date.getTime() - start) / 86400000) + 1;
}

// Years currently shown in the chart — reset to "all visible" each time a new
// chart is rendered, then toggled by the legend's per-year/"Toggle all" checkboxes.
// Visibility is applied via the year-hidden CSS class rather than re-rendering the
// SVG, so toggling is a cheap DOM class flip, not a redraw.
let visibleYears = new Set();

// Calendar months (0-11) currently shown, independent of visibleYears. A hidden
// month's observations are left out of buildSeriesMarkup's output entirely
// (redrawChartVisuals regenerates the chart whenever this changes), rather
// than being display:none'd, so the polyline actually skips the gap instead of
// visually passing through a hidden point. Reset to "all visible" per chart
// render, then toggled by clicking a month label or the month row's "All".
let visibleMonths = new Set();

// Fixed chart geometry — module-level (not local to renderNdviChart) so
// buildSeriesMarkup can recompute line/marker positions identically when a month
// toggle needs to regenerate just the series without a full chart re-render.
const CHART_WIDTH = 462, CHART_HEIGHT = 275; // 10% larger than the original 420x250
const CHART_MARGIN = { top: 14, right: 12, bottom: 34, left: 34 };
const CHART_PLOT_WIDTH = CHART_WIDTH - CHART_MARGIN.left - CHART_MARGIN.right;
const CHART_PLOT_HEIGHT = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom;
const CHART_MARKER_R = 2.4;

function chartXToPx(day) {
    return CHART_MARGIN.left + CHART_PLOT_WIDTH * ((day - 1) / 365);
}

// User-adjustable chart display options — a gear button on the panel opens a
// small settings popover wired to these (bound once in DOMContentLoaded).
// Changing any of them calls redrawChartVisuals rather than a full
// renderNdviChart, so year/month toggle state and the current selection survive.
let chartConfig = {
    fixedYAxis: false, // when true, use yAxisMin/yAxisMax instead of the auto-computed domain
    yAxisMin: 0,
    yAxisMax: 1,
    colorMode: 'year', // 'year' = flat per-year palette (default); 'ndvi' = colored by NDVI value
    valueMode: 'absolute', // 'absolute' = each point's own NDVI (default); 'cumulative' = running yearly total
    layerMode: 'ndvi', // 'ndvi' = NDVI colormap raster (default); 'rgb' = true-color composite, see loadRgbData
    interpolateLowCoverage: false, // see buildYearPlotPoints
};

// A point's polygon coverage (the fraction of the drawn polygon's pixels that
// actually had data — see computeObservations) below which it's considered
// unreliable enough to interpolate rather than plot as-is, when
// chartConfig.interpolateLowCoverage is on.
const LOW_COVERAGE_THRESHOLD = 0.5;

function isLowCoverage(d) {
    return chartConfig.interpolateLowCoverage && d.coverage < LOW_COVERAGE_THRESHOLD;
}

// Builds one year's chronologically-sorted, currently-visible-months-only
// `points` (see buildSeriesMarkup) into plottable entries: `{ d, i, value,
// isInterpolated, dottedBefore, dottedAfter }`.
//
// When chartConfig.interpolateLowCoverage is off (the default), this is a
// no-op wrapper — `value` is always the observation's own raw NDVI, nothing is
// ever interpolated, and no segment is ever dashed, i.e. identical to the
// chart's pre-existing behavior.
//
// When it's on, a point whose polygon coverage is below LOW_COVERAGE_THRESHOLD
// isn't plotted at its own (unreliable) value — instead `value` is linearly
// interpolated, by day-of-year, from its immediate chart-neighbors' own *raw*
// NDVI (not their own possibly-interpolated value, so uncertainty doesn't
// compound across a run of several low-coverage points in a row). A boundary
// point (first/last in the year's visible sequence) has no neighbor on one
// side and can't be interpolated, so it just keeps its raw value.
// `dottedBefore`/`dottedAfter` flag the adjacent segment for a dashed line
// when *both* of the points it connects are low-coverage — signaling that the
// whole stretch, not just one point, is running on thin data — see
// buildSeriesMarkup for how that's rendered.
function buildYearPlotPoints(points) {
    const plotted = points.map((p, k) => {
        let value = p.d.ndvi;
        let isInterpolated = false;
        if (isLowCoverage(p.d)) {
            const prev = points[k - 1], next = points[k + 1];
            if (prev && next) {
                const prevDay = dayOfYear(prev.d.date), nextDay = dayOfYear(next.d.date), day = dayOfYear(p.d.date);
                const t = (day - prevDay) / (nextDay - prevDay);
                value = prev.d.ndvi + t * (next.d.ndvi - prev.d.ndvi);
                isInterpolated = true;
            }
        }
        return { d: p.d, i: p.i, value, isInterpolated };
    });
    plotted.forEach((p, k) => {
        p.dottedBefore = k > 0 && isLowCoverage(points[k - 1].d) && isLowCoverage(points[k].d);
        p.dottedAfter = k < points.length - 1 && isLowCoverage(points[k].d) && isLowCoverage(points[k + 1].d);
    });
    return plotted;
}

// Turns one year's plotted entries (see buildYearPlotPoints) into the values
// actually positioned on the y-axis — each entry's own `value` in 'absolute'
// mode, or a running trapezoidal integral (area under the NDVI-vs-day-of-year
// curve) in 'cumulative' mode. Integrating rather than summing points matters
// because observation dates are irregular and their count varies year to
// year: a plain running sum of point values grows with the *number* of
// observations, so a year with denser sampling racks up a bigger total even
// with an identical underlying curve — it ends up measuring sampling density,
// not vegetation. Trapezoidal area between consecutive points instead
// converges to the same total regardless of how finely that curve happens to
// be sampled, so the result is comparable across years. Uses the
// *interpolated* values where applicable, so a smoothed-over low-coverage
// point doesn't throw off the integral the way its own noisy raw value
// might. The integral only ever includes months currently in visibleMonths
// (points already reflects that filter), so toggling a month off doesn't
// just remove its own point but also correctly lowers every later point's
// cumulative total.
function plotValuesFromEffective(plotted) {
    if (chartConfig.valueMode !== 'cumulative') {
        return plotted.map((p) => p.value);
    }
    let running = 0;
    let prevDay = null, prevValue = null;
    return plotted.map((p) => {
        const day = dayOfYear(p.d.date);
        if (prevDay !== null) running += 0.5 * (prevValue + p.value) * (day - prevDay);
        prevDay = day;
        prevValue = p.value;
        return running;
    });
}

// The y-axis' auto-computed domain depends on every observation regardless of
// which months are toggled on (in 'absolute' mode — see
// plotValuesFromEffective for why 'cumulative' mode's running totals *do*
// depend on it), so the axis doesn't jump around as points are added/removed
// from the plotted line — only computed from `observations`. Interpolated
// values are never more extreme than the real neighbors they're derived from,
// so 'absolute' mode's domain doesn't need to special-case them. Capped at 1
// in 'absolute' mode since that's NDVI's theoretical ceiling (a cumulative
// total has no such ceiling, so that cap is skipped there). Bypassed entirely
// when chartConfig.fixedYAxis is on, in favor of the user's own min/max.
function computeYDomain(observations, years) {
    if (chartConfig.fixedYAxis) {
        return { yMin: chartConfig.yAxisMin, yMax: chartConfig.yAxisMax };
    }
    let values;
    if (chartConfig.valueMode === 'cumulative') {
        values = years.flatMap((year) => {
            const points = observations
                .map((d, i) => ({ d, i }))
                .filter(({ d }) => d.date.getUTCFullYear() === year && visibleMonths.has(d.date.getUTCMonth()))
                .sort((a, b) => a.d.date - b.d.date);
            return plotValuesFromEffective(buildYearPlotPoints(points));
        });
    } else {
        values = observations.map((d) => d.ndvi);
    }
    if (values.length === 0) values = [0]; // every year/month toggled off — fall back to a bare 0..0.05 axis rather than NaN
    let yMin = Math.min(0, ...values);
    let yMax = Math.max(...values);
    if (yMax - yMin < 0.05) yMax = yMin + 0.05; // avoid a degenerate/zero-height axis
    const yPad = (yMax - yMin) * 0.1;
    yMax += yPad;
    if (chartConfig.valueMode !== 'cumulative') yMax = Math.min(1, yMax);
    if (yMin < 0) yMin -= yPad; // only pad below 0 when the data actually goes negative
    return { yMin, yMax };
}

function chartYToPx(v, yMin, yMax) {
    return CHART_MARGIN.top + CHART_PLOT_HEIGHT * (1 - (v - yMin) / (yMax - yMin));
}

// Converts a sequence of {x,y} chart-pixel points (sorted by ascending x,
// which every caller already guarantees since points are date-sorted) into
// cubic-Bezier segments that pass through every point via a monotone cubic
// Hermite spline (Fritsch-Carlson), so series lines render as a gentle curve
// rather than sharp polyline joins. A plain (Catmull-Rom-style) spline was
// tried first, but its control points are derived from neighboring points
// without regard for the curve's own slope, so near a sharp peak/trough it
// routinely overshoots past the data's actual range — a bump or dip between
// two points that isn't in the data. Fritsch-Carlson instead picks each
// point's tangent from the secant slopes on either side and then clamps it
// (per Fritsch & Carlson 1980 / the same algorithm behind d3's
// curveMonotoneX) so the curve never overshoots a local min/max.
function monotoneCubicSegments(pts) {
    const n = pts.length;
    const segs = [];
    if (n < 2) return segs;
    // Secant slope of each x-consecutive pair; dx is never 0 since points are
    // distinct dates within the same year.
    const d = [];
    for (let k = 0; k < n - 1; k++) d.push((pts[k + 1].y - pts[k].y) / (pts[k + 1].x - pts[k].x));
    const m = new Array(n);
    m[0] = d[0];
    m[n - 1] = d[n - 2];
    for (let k = 1; k < n - 1; k++) {
        m[k] = (d[k - 1] === 0 || d[k] === 0 || (d[k - 1] < 0) !== (d[k] < 0)) ? 0 : (d[k - 1] + d[k]) / 2;
    }
    for (let k = 0; k < n - 1; k++) {
        if (d[k] === 0) {
            m[k] = 0;
            m[k + 1] = 0;
            continue;
        }
        const a = m[k] / d[k], b = m[k + 1] / d[k];
        const s = a * a + b * b;
        if (s > 9) {
            const t = 3 / Math.sqrt(s);
            m[k] = t * a * d[k];
            m[k + 1] = t * b * d[k];
        }
    }
    for (let k = 0; k < n - 1; k++) {
        const p1 = pts[k], p2 = pts[k + 1];
        const dx = p2.x - p1.x;
        segs.push({
            x1: p1.x, y1: p1.y,
            cp1x: p1.x + dx / 3, cp1y: p1.y + m[k] * dx / 3,
            cp2x: p2.x - dx / 3, cp2y: p2.y - m[k + 1] * dx / 3,
            x2: p2.x, y2: p2.y,
        });
    }
    return segs;
}

function segmentToPathD(seg) {
    return `M${seg.x1.toFixed(1)},${seg.y1.toFixed(1)} C${seg.cp1x.toFixed(1)},${seg.cp1y.toFixed(1)} ${seg.cp2x.toFixed(1)},${seg.cp2y.toFixed(1)} ${seg.x2.toFixed(1)},${seg.y2.toFixed(1)}`;
}

// rgb(...) string for one of ndviToColor's [r,g,b] arrays — used when
// chartConfig.colorMode is 'ndvi' to color chart markers/segments the same way
// the raster overlay is colored.
function ndviToRgbString(value) {
    const [r, g, b] = ndviToColor(value);
    return `rgb(${r},${g},${b})`;
}

// Builds the y-axis' gridlines, value labels, and (only if the current domain
// actually spans 0) its zero line. Separated from renderNdviChart so
// redrawChartVisuals can regenerate just this (via #ndvi-yaxis-group) when the
// y-axis config changes, without touching the series or disturbing anything else
// on the chart.
function buildYAxisMarkup(yMin, yMax) {
    const gridlineCount = 4;
    let markup = '';
    for (let i = 0; i <= gridlineCount; i++) {
        const v = yMin + ((yMax - yMin) * i) / gridlineCount;
        const py = chartYToPx(v, yMin, yMax);
        markup += `<line class="ndvi-gridline" x1="${CHART_MARGIN.left}" x2="${CHART_WIDTH - CHART_MARGIN.right}" y1="${py.toFixed(1)}" y2="${py.toFixed(1)}"/>`;
        markup += `<text x="${CHART_MARGIN.left - 6}" y="${(py + 3).toFixed(1)}" text-anchor="end">${v.toFixed(2)}</text>`;
    }
    if (yMin <= 0 && yMax >= 0) {
        const zeroPx = chartYToPx(0, yMin, yMax);
        markup += `<line class="ndvi-axis" x1="${CHART_MARGIN.left}" x2="${CHART_WIDTH - CHART_MARGIN.right}" y1="${zeroPx.toFixed(1)}" y2="${zeroPx.toFixed(1)}"/>`;
    }
    return markup;
}

// Builds just the per-year lines+markers SVG markup — every month currently in
// visibleMonths contributes a point to both its year's polyline and its own
// marker; a hidden month's observations are left out of the polyline's points
// list entirely (not merely display:none'd), so the line actually skips over
// the gap rather than passing through a hidden point. In colorMode 'ndvi', each
// segment between two consecutive (visible) points is drawn as its own <line>
// colored by the average of its two endpoints' NDVI values, since a single
// <polyline> can't vary color along its length — markers follow the same rule,
// each colored by its own value rather than a flat per-year color. Called both
// for the initial chart render and to regenerate just the series (via #ndvi-
// series-group's innerHTML) whenever a month or display-config toggle changes.
function buildSeriesMarkup(observations, years) {
    const { yMin, yMax } = computeYDomain(observations, years);
    let series = '';
    years.forEach((year, yearIndex) => {
        const flatColor = yearColor(yearIndex);
        const yearHiddenClass = visibleYears.has(year) ? '' : ' year-hidden';
        const points = observations
            .map((d, i) => ({ d, i }))
            .filter(({ d }) => d.date.getUTCFullYear() === year && visibleMonths.has(d.date.getUTCMonth()))
            .sort((a, b) => a.d.date - b.d.date);
        // Each point's plotted position (see buildYearPlotPoints: its own NDVI,
        // or an interpolated stand-in when low-coverage interpolation is on)
        // and, from that, the y-value actually plotted — in 'cumulative' mode a
        // running total of those, otherwise unchanged. Colors always reflect a
        // point's own *raw* NDVI regardless of mode (see below) — only the
        // *position* changes here, not what "NDVI value" means for
        // color-by-value.
        const plotted = buildYearPlotPoints(points);
        const plotValues = plotValuesFromEffective(plotted);

        // Segments need individual elements (rather than one shared path)
        // whenever they can vary per-segment: colorMode 'ndvi' (color) or
        // interpolateLowCoverage (dashing across low-coverage stretches —
        // see buildYearPlotPoints' dottedBefore/dottedAfter). Falls back to a
        // single path otherwise, since that's simpler markup for what's
        // still the common case. Either way each segment is drawn as a
        // monotone cubic curve (see monotoneCubicSegments) rather than a
        // straight line, so the series reads as a gentle curve.
        const pxPoints = points.map(({ d }, k) => ({ x: chartXToPx(dayOfYear(d.date)), y: chartYToPx(plotValues[k], yMin, yMax) }));
        const curveSegments = monotoneCubicSegments(pxPoints);
        if (chartConfig.colorMode === 'ndvi' || chartConfig.interpolateLowCoverage) {
            for (let k = 0; k < points.length - 1; k++) {
                const a = points[k].d, b = points[k + 1].d;
                const segColor = chartConfig.colorMode === 'ndvi' ? ndviToRgbString((a.ndvi + b.ndvi) / 2) : flatColor;
                const dashAttr = plotted[k].dottedAfter ? ' stroke-dasharray="3,3"' : '';
                series += `<path class="ndvi-series-line${yearHiddenClass}" data-year="${year}" d="${segmentToPathD(curveSegments[k])}" fill="none" stroke="${segColor}" stroke-width="1.5"${dashAttr}/>`;
            }
        } else {
            const d = pxPoints.length ? `M${pxPoints[0].x.toFixed(1)},${pxPoints[0].y.toFixed(1)} ${curveSegments.map((seg) => `C${seg.cp1x.toFixed(1)},${seg.cp1y.toFixed(1)} ${seg.cp2x.toFixed(1)},${seg.cp2y.toFixed(1)} ${seg.x2.toFixed(1)},${seg.y2.toFixed(1)}`).join(' ')}` : '';
            series += `<path class="ndvi-series-line${yearHiddenClass}" data-year="${year}" d="${d}" fill="none" stroke="${flatColor}" stroke-width="1.5"/>`;
        }

        plotted.forEach(({ d, i, isInterpolated }, k) => {
            const cx = chartXToPx(dayOfYear(d.date));
            const cy = chartYToPx(plotValues[k], yMin, yMax);
            const month = d.date.getUTCMonth();
            // data-cx/data-cy is how the click handler recovers a clicked marker's
            // position for the selection ring.
            const posAttrs = `data-cx="${cx.toFixed(1)}" data-cy="${cy.toFixed(1)}" data-month="${month}"`;
            const markerColor = chartConfig.colorMode === 'ndvi' ? ndviToRgbString(d.ndvi) : flatColor;
            // A larger transparent hit-circle sits behind each marker so the small
            // dot is still easy to click, not just its own tiny radius.
            series += `<circle class="ndvi-marker-hit${yearHiddenClass}" data-index="${i}" data-year="${year}" ${posAttrs} cx="${cx}" cy="${cy}" r="6.5" fill="transparent"/>`;
            // Interpolated (low-polygon-coverage) points render hollow — an
            // outlined ring in the marker's usual color rather than a solid
            // dot — so they read as "estimated", not "measured".
            const markerAttrs = isInterpolated
                ? `fill="white" stroke="${markerColor}" stroke-width="1.5"`
                : `fill="${markerColor}" stroke="white" stroke-width="1"`;
            const interpolatedClass = isInterpolated ? ' ndvi-marker-interpolated' : '';
            series += `<circle class="ndvi-marker${interpolatedClass}${yearHiddenClass}" data-index="${i}" data-year="${year}" ${posAttrs} cx="${cx}" cy="${cy}" r="${CHART_MARKER_R}" ${markerAttrs}/>`;
        });
    });
    return series;
}

// Repositions the selection ring onto whatever the current selection's marker's
// (possibly just-recomputed) position is — needed after any redraw that can move
// points, i.e. whenever the y-axis domain changes, not just after a month toggle
// (which never moves a still-visible point).
function repositionSelectionRing() {
    if (selectedIndex === null) return;
    const marker = document.querySelector(`#ndvi-chart .ndvi-marker[data-index="${selectedIndex}"]`);
    const ring = document.getElementById('ndvi-selection-ring');
    if (marker && ring) {
        ring.setAttribute('cx', marker.dataset.cx);
        ring.setAttribute('cy', marker.dataset.cy);
    }
}

// Regenerates both the y-axis and the series from currentAnalysis — cheaper and
// simpler than a full renderNdviChart call, and preserves everything else (month
// labels, legend, year/month toggle state, current selection). The y-axis has
// to be included even for a plain month toggle, not just a display-config
// change, because 'cumulative' mode's running totals (see
// plotValuesFromEffective) depend on which months are currently visible — an
// axis that only redrew the series would drift out of sync with the line.
function redrawChartVisuals() {
    if (!currentAnalysis) return;
    const { observations } = currentAnalysis;
    const years = [...new Set(observations.map((d) => d.date.getUTCFullYear()))].sort();
    const { yMin, yMax } = computeYDomain(observations, years);
    document.getElementById('ndvi-yaxis-group').innerHTML = buildYAxisMarkup(yMin, yMax);
    document.getElementById('ndvi-series-group').innerHTML = buildSeriesMarkup(observations, years);
    repositionSelectionRing();
}

// Renders a multi-year seasonal chart — one colored/shaped line+markers series per
// calendar year, x-axis = day-of-year (so different years' observations line up by
// season for direct comparison), y-axis = NDVI — as inline SVG, no charting library
// dependency, consistent with this repo's other openlayers apps, which build their
// own popups/UI by hand. A legend below the chart lists each year with its own
// color/shape swatch and a checkbox to show/hide that year individually, plus a
// "Toggle all" checkbox. Clicking a marker loads that date's full-grid NDVI raster
// onto the map — see the delegated click listener bound once in the
// DOMContentLoaded handler below, which reads back the `observations`/`ndviData`
// this render stashed on currentAnalysis.
function renderNdviChart(observations, ndviData) {
    currentAnalysis = { observations, ndviData };
    selectedIndex = null; // fresh chart, nothing selected yet — see selectObservation
    hoveredYearIndex = null;

    const years = [...new Set(observations.map((d) => d.date.getUTCFullYear()))].sort();
    visibleYears = new Set(years);
    visibleMonths = new Set(MONTH_ABBR.map((_, i) => i));

    const width = CHART_WIDTH, height = CHART_HEIGHT, margin = CHART_MARGIN;
    const { yMin, yMax } = computeYDomain(observations, years);
    const xToPx = chartXToPx;

    const monthLabelY = height - margin.bottom + 14;
    let monthGridlines = '', monthLabels = '';
    MONTH_START_DAY.forEach((startDay, i) => {
        const px = xToPx(startDay + 1);
        monthGridlines += `<line class="ndvi-gridline" x1="${px.toFixed(1)}" x2="${px.toFixed(1)}" y1="${margin.top}" y2="${height - margin.bottom}"/>`;
        const nextPx = i + 1 < MONTH_START_DAY.length ? xToPx(MONTH_START_DAY[i + 1] + 1) : width - margin.right;
        monthLabels += `<text class="ndvi-month-label" data-month="${i}" x="${((px + nextPx) / 2).toFixed(1)}" y="${monthLabelY.toFixed(1)}" text-anchor="middle">${MONTH_ABBR[i]}</text>`;
    });
    // "All" toggle for months, sitting in the otherwise-empty left margin at the
    // same row as the month labels (the y-axis's own value labels are positioned
    // at different y's, one per gridline, so there's no collision).
    monthLabels += `<text class="ndvi-month-all-toggle" data-month-all="1" x="6" y="${monthLabelY.toFixed(1)}" text-anchor="start">All</text>`;

    const svg = `
        <svg id="ndvi-chart" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            ${monthGridlines}
            <g id="ndvi-yaxis-group">${buildYAxisMarkup(yMin, yMax)}</g>
            <line class="ndvi-axis" x1="${margin.left}" x2="${margin.left}" y1="${margin.top}" y2="${height - margin.bottom}"/>
            <g id="ndvi-series-group">${buildSeriesMarkup(observations, years)}</g>
            ${monthLabels}
            <circle id="ndvi-selection-ring" r="4.6" fill="none" stroke="#222" stroke-width="2" style="display:none"/>
        </svg>
    `;

    // Displayed latest-year-first (colors still tied to each year's original
    // ascending index, so they stay consistent with the chart regardless of this
    // display order).
    const legendRows = years
        .map((year, yearIndex) => ({ year, color: yearColor(yearIndex) }))
        .reverse()
        .map(({ year, color }) => `
            <label class="ndvi-year-toggle" data-year="${year}">
                <input type="checkbox" class="ndvi-year-checkbox" data-year="${year}" checked>
                <span class="ndvi-year-swatch" style="background:${color}"></span>
                <span>${year}</span>
            </label>
        `).join('');

    const legend = `
        <div class="ndvi-legend-list">
            <label class="ndvi-year-toggle ndvi-year-toggle-all">
                <input type="checkbox" id="ndvi-year-toggle-all-checkbox" checked>
                <span>All</span>
            </label>
            ${legendRows}
        </div>
    `;

    document.getElementById('ndvi-panel-body').innerHTML = `
        <div class="ndvi-chart-hint">Click a marker to load that date's NDVI on the map</div>
        <div class="ndvi-chart-row">
            <div class="ndvi-chart-svg-wrap">${svg}</div>
            ${legend}
        </div>
    `;
}

// Shows/hides one calendar year's line+markers (and the selection ring, if it's
// currently pointing at a marker from that year) by toggling year-hidden on every
// SVG element tagged with that year — cheap DOM class flips rather than a redraw,
// since the SVG itself doesn't change, only what's visible.
function setYearVisible(year, visible) {
    if (visible) visibleYears.add(year); else visibleYears.delete(year);
    document.querySelectorAll(`#ndvi-chart [data-year="${year}"]`).forEach((el) => {
        el.classList.toggle('year-hidden', !visible);
    });
    reconcileSelectionVisibility();
}

// Shows/hides one calendar month's observations, across every year, by
// regenerating the series (see buildSeriesMarkup/redrawChartVisuals) rather
// than a simple CSS class flip — the point actually needs to drop out of its
// year's polyline, not just stop being drawn on top of it.
function setMonthVisible(month, visible) {
    if (visible) visibleMonths.add(month); else visibleMonths.delete(month);
    document.querySelector(`.ndvi-month-label[data-month="${month}"]`)?.classList.toggle('month-off', !visible);
    redrawChartVisuals();
    reconcileSelectionVisibility();
}

function setAllMonthsVisible(visible) {
    for (let month = 0; month < 12; month++) {
        if (visible) visibleMonths.add(month); else visibleMonths.delete(month);
        document.querySelector(`.ndvi-month-label[data-month="${month}"]`)?.classList.toggle('month-off', !visible);
    }
    redrawChartVisuals(); // one redraw for all twelve, not twelve redundant ones
    reconcileSelectionVisibility();
}

// If the currently selected observation just got hidden by a year/month toggle,
// moves the selection to the nearest still-visible one (checking forward, then
// backward) — or clears it entirely if nothing is visible at all — rather than
// leaving the raster/ring pointing at a point that's no longer plotted. Also
// clears a keyboard year-hover (see hoveredYearIndex) whose year just got
// hidden, for the same reason — otherwise it'd keep "highlighting" a line
// that's no longer drawn.
function reconcileSelectionVisibility() {
    if (hoveredYearIndex !== null && !visibleYears.has(currentYears()[hoveredYearIndex])) {
        hoveredYearIndex = null;
    }
    if (selectedIndex === null || !currentAnalysis) {
        applyRestingHighlight();
        return;
    }
    const { observations } = currentAnalysis;
    if (isObservationVisible(observations[selectedIndex])) return;
    for (let i = selectedIndex + 1; i < observations.length; i++) {
        if (isObservationVisible(observations[i])) return selectObservation(i);
    }
    for (let i = selectedIndex - 1; i >= 0; i--) {
        if (isObservationVisible(observations[i])) return selectObservation(i);
    }
    selectedIndex = null;
    document.getElementById('ndvi-selection-ring').style.display = 'none';
    hideNdviLegend();
    applyRestingHighlight();
}

// Highlights `year`'s line+markers and dims every other year's on the chart, so
// hovering one point makes its whole seasonal trajectory easy to trace against
// the others. The selection ring is excluded so it stays a consistent marker of
// "currently on the map" regardless of whatever's being hovered. Also
// highlights `year`'s row in the legend list and grays out every other row —
// the legend itself doubling as the "which year is this?" indicator instead of
// a floating tooltip. A row already toggled off (unchecked) keeps its own
// fully-grayed appearance via CSS regardless of this dimming, so there are
// three distinguishable states: hovered, visible-but-not-hovered, and hidden.
function setYearHovered(year) {
    document.querySelectorAll('#ndvi-chart [data-year]').forEach((el) => {
        if (el.id === 'ndvi-selection-ring') return;
        const isThisYear = Number(el.dataset.year) === year;
        el.classList.toggle('ndvi-series-hovered', isThisYear);
        el.classList.toggle('ndvi-series-dimmed', !isThisYear);
    });
    document.querySelectorAll('.ndvi-year-toggle').forEach((el) => {
        const isThisYear = Number(el.dataset.year) === year;
        el.classList.toggle('year-hover-active', isThisYear);
        el.classList.toggle('year-hover-dimmed', !isThisYear);
    });
}

function clearYearHover() {
    document.querySelectorAll('#ndvi-chart [data-year]').forEach((el) => {
        el.classList.remove('ndvi-series-hovered', 'ndvi-series-dimmed');
    });
    document.querySelectorAll('.ndvi-year-toggle').forEach((el) => {
        el.classList.remove('year-hover-active', 'year-hover-dimmed');
    });
}

// Re-applies the highlight for whichever observation is currently selected (or
// clears it if none) — the "resting" state that a mouse hover temporarily
// overrides and mouseout reverts back to, and what left/right arrow-key
// navigation drives directly since there's no mouse position to hover from.
// Takes priority over a keyboard year-hover (see applyRestingHighlight) since
// it pins an actual raster on the map, not just a highlighted line.
function applySelectionHighlight() {
    if (selectedIndex === null || !currentAnalysis) {
        clearYearHover();
        return;
    }
    const marker = document.querySelector(`#ndvi-chart .ndvi-marker[data-index="${selectedIndex}"]`);
    if (!marker) return;
    setYearHovered(Number(marker.dataset.year));
}

// The actual "resting" state a mouse hover temporarily overrides and
// mouseout reverts back to: an observation selection (applySelectionHighlight)
// if there is one, otherwise a keyboard year-hover (up/down arrow keys) if
// there is one, otherwise nothing. Also what up/down arrow-key navigation
// calls directly, mirroring how left/right calls applySelectionHighlight.
function applyRestingHighlight() {
    if (selectedIndex !== null) {
        applySelectionHighlight();
        return;
    }
    if (hoveredYearIndex !== null) {
        const year = currentYears()[hoveredYearIndex];
        if (year !== undefined) {
            setYearHovered(year);
            return;
        }
    }
    clearYearHover();
}

// The chronological index (into currentAnalysis.observations, which is already
// sorted by date) of whichever marker's raster is currently shown on the map —
// null when nothing is selected. Left/right arrow-key navigation (bound once in
// DOMContentLoaded) steps this index and re-runs selectObservation.
let selectedIndex = null;

// Whether `obs` is currently plotted at all — i.e. neither its year nor its
// month is toggled off. Arrow-key navigation (below) uses this to skip past
// hidden observations rather than landing the selection/raster on one that
// isn't even visible in the chart.
function isObservationVisible(obs) {
    return visibleYears.has(obs.date.getUTCFullYear()) && visibleMonths.has(obs.date.getUTCMonth());
}

// Index into currentYears() of whichever year's line is highlighted via
// up/down arrow-key navigation — null when nothing is keyboard-hovered.
// Mirrors selectedIndex, but for a whole year's line rather than a single
// observation's raster; the two are independent (see applyRestingHighlight
// for how they combine when reverting from a mouse hover).
let hoveredYearIndex = null;

// The chart's years, chronologically ascending — same computation
// renderNdviChart/redrawChartVisuals already do inline, exposed here so
// up/down arrow-key navigation can step through the same list.
function currentYears() {
    if (!currentAnalysis) return [];
    return [...new Set(currentAnalysis.observations.map((d) => d.date.getUTCFullYear()))].sort();
}

// Positions the selection ring on observation `index`'s marker, loads its raster
// onto the map, and records it as the current selection — shared by marker clicks
// and arrow-key navigation so both stay in sync with the same piece of state.
// `index` is clamped to the valid range rather than ignored when out of bounds, so
// holding an arrow key at either end of the series just stops at the first/last
// observation instead of doing nothing.
async function selectObservation(index) {
    if (!currentAnalysis) return;
    const { observations, ndviData } = currentAnalysis;
    const clamped = Math.max(0, Math.min(index, observations.length - 1));
    selectedIndex = clamped;

    const marker = document.querySelector(`#ndvi-chart .ndvi-marker[data-index="${clamped}"]`);
    const ring = document.getElementById('ndvi-selection-ring');
    if (marker && ring) {
        const year = marker.dataset.year;
        ring.setAttribute('cx', marker.dataset.cx);
        ring.setAttribute('cy', marker.dataset.cy);
        ring.setAttribute('data-year', year);
        ring.style.display = '';
        ring.classList.toggle('year-hidden', !visibleYears.has(Number(year)));
        marker.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    applySelectionHighlight();

    await renderSelectedRaster(observations[clamped], ndviData);
}

// Renders whichever raster layer chartConfig.layerMode currently selects, for
// `observation`, and updates the legend's date label to match whatever was
// actually rendered. In 'rgb' mode that's the *nearest* date in the RGB cube's
// own time axis (see loadRgbData), not necessarily `observation.date` itself —
// the label calls this out ("nearest") whenever the two diverge, so it's clear
// the image isn't from the exact date the chart point represents.
async function renderSelectedRaster(observation, ndviData) {
    const dateLabel = document.getElementById('ndvi-legend-date');
    const loadingEl = document.getElementById('ndvi-layer-loading');
    let renderedDate = observation.date;
    try {
        if (chartConfig.layerMode === 'rgb') {
            // The NDVI cube is always already loaded by this point (analyzePolygon
            // awaits it before a chart can even exist), so this loading state is
            // only ever visible for the RGB cube's first fetch — see loadRgbData.
            document.getElementById('ndvi-layer-loading-text').textContent = 'Loading visible imagery…';
            loadingEl.classList.add('visible');
            const rgbData = await loadRgbData();
            if (!ensureProjectionRegistered(rgbData.crs)) {
                dateLabel.textContent = `Unsupported CRS for the RGB datacube: ${rgbData.crs}`;
                return;
            }
            const rgbIndex = findNearestDateIndex(rgbData.dates, observation.date);
            renderedDate = rgbData.dates[rgbIndex];
            renderRgbRaster(rgbData, rgbIndex);
        } else {
            renderNdviRaster(ndviData, observation.tIndex);
        }
    } catch (e) {
        console.error('Failed to render raster layer:', e);
        dateLabel.textContent = `Failed to load ${chartConfig.layerMode === 'rgb' ? 'RGB' : 'NDVI'} raster: ${e.message}`;
        return;
    } finally {
        loadingEl.classList.remove('visible');
    }

    const isNearestRgb = chartConfig.layerMode === 'rgb' && renderedDate.getTime() !== observation.date.getTime();
    dateLabel.textContent =
        renderedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) +
        (isNearestRgb ? ' (nearest RGB image)' : '');
}

// Runs the whole "polygon drawn" pipeline: load (or reuse) the cached zarr data,
// reproject the polygon into the array's CRS, compute per-timestep NDVI means, and
// render the result — surfacing any failure along the way as panel status text
// rather than letting it throw silently in an event handler.
async function analyzePolygon(polygonFeature) {
    showNdviPanel();
    setNdviStatus('Loading NDVI data…');
    try {
        const ndviData = await loadNdviData();

        if (!ensureProjectionRegistered(ndviData.crs)) {
            setNdviStatus(`Unsupported CRS for this datacube: ${ndviData.crs}`, true);
            return;
        }

        const polygon = polygonFeature.getGeometry().clone();
        if (ndviData.crs !== 'EPSG:4326') {
            polygon.transform('EPSG:4326', ndviData.crs);
        }

        const observations = computeObservations(ndviData, polygon);
        if (observations.length === 0) {
            setNdviStatus("The drawn polygon doesn't overlap this site's data grid.", true);
            return;
        }

        renderNdviChart(observations, ndviData);
    } catch (e) {
        console.error('NDVI analysis failed:', e);
        setNdviStatus(`Failed to load/aggregate NDVI data: ${e.message}`, true);
    }
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

let draw = null;

function setDrawActive(active) {
    document.getElementById('draw-button').classList.toggle('active', active);
    if (active) {
        map.addInteraction(draw);
    } else {
        map.removeInteraction(draw);
    }
}

function startDrawing() {
    drawSource.clear();
    hideNdviPanel();
    hideNdviLegend();
    currentAnalysis = null;
    selectedIndex = null;
    hoveredYearIndex = null;
    document.getElementById('clear-button').disabled = true;
    setDrawActive(true);
}

function clearDrawing() {
    drawSource.clear();
    hideNdviPanel();
    hideNdviLegend();
    currentAnalysis = null;
    selectedIndex = null;
    hoveredYearIndex = null;
    document.getElementById('clear-button').disabled = true;
    setDrawActive(false);
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

// __COMMIT_SHA__ is a build-time string constant (see vite.config.js's `define`) —
// not a real identifier, so no import/declaration exists for it in this file.
document.getElementById('build-version').textContent = typeof __COMMIT_SHA__ !== 'undefined' ? __COMMIT_SHA__ : 'dev';

document.addEventListener('DOMContentLoaded', () => {
    draw = new Draw({ source: drawSource, type: 'Polygon' });
    draw.on('drawend', (event) => {
        setDrawActive(false);
        document.getElementById('clear-button').disabled = false;
        analyzePolygon(event.feature);
    });

    document.getElementById('draw-button').addEventListener('click', () => {
        const isActive = document.getElementById('draw-button').classList.contains('active');
        if (isActive) {
            setDrawActive(false);
        } else {
            startDrawing();
        }
    });
    document.getElementById('clear-button').addEventListener('click', clearDrawing);
    document.getElementById('ndvi-panel-close').addEventListener('click', () => {
        hideNdviPanel();
        hideNdviLegend();
    });
    document.getElementById('login-button').addEventListener('click', loginClicked);

    // Chart settings popover: fixed Y-axis range + line color mode. Initializes
    // the number inputs from chartConfig's defaults so they show something
    // sensible even before the user has ever touched them.
    document.getElementById('ndvi-settings-ymin').value = chartConfig.yAxisMin;
    document.getElementById('ndvi-settings-ymax').value = chartConfig.yAxisMax;
    document.getElementById('ndvi-settings-button').addEventListener('click', () => {
        document.getElementById('ndvi-settings-panel').hidden = !document.getElementById('ndvi-settings-panel').hidden;
    });
    document.getElementById('ndvi-settings-fixed-yaxis').addEventListener('change', (event) => {
        chartConfig.fixedYAxis = event.target.checked;
        document.getElementById('ndvi-settings-yaxis-inputs').hidden = !chartConfig.fixedYAxis;
        redrawChartVisuals();
    });
    document.getElementById('ndvi-settings-ymin').addEventListener('change', (event) => {
        chartConfig.yAxisMin = parseFloat(event.target.value);
        if (chartConfig.fixedYAxis) redrawChartVisuals();
    });
    document.getElementById('ndvi-settings-ymax').addEventListener('change', (event) => {
        chartConfig.yAxisMax = parseFloat(event.target.value);
        if (chartConfig.fixedYAxis) redrawChartVisuals();
    });
    document.querySelectorAll('input[name="ndvi-color-mode"]').forEach((radio) => {
        radio.addEventListener('change', (event) => {
            if (!event.target.checked) return;
            chartConfig.colorMode = event.target.value;
            redrawChartVisuals();
        });
    });
    document.querySelectorAll('input[name="ndvi-value-mode"]').forEach((radio) => {
        radio.addEventListener('change', (event) => {
            if (!event.target.checked) return;
            chartConfig.valueMode = event.target.value;
            redrawChartVisuals();
        });
    });
    document.getElementById('ndvi-settings-interpolate').addEventListener('change', (event) => {
        chartConfig.interpolateLowCoverage = event.target.checked;
        redrawChartVisuals();
    });

    // NDVI/Visible raster layer toggle, in the legend widget rather than the
    // settings popover — unlike the other display options, this is a frequent,
    // immediate switch (like changing a basemap), not a set-and-forget
    // preference. The NDVI-only colorbar (title/gradient/labels) only makes
    // sense in 'ndvi' mode, so it's hidden in 'rgb' mode.
    document.querySelectorAll('.ndvi-layer-toggle-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const layer = btn.dataset.layer;
            if (layer === chartConfig.layerMode) return;
            chartConfig.layerMode = layer;
            document.querySelectorAll('.ndvi-layer-toggle-btn').forEach((b) => b.classList.toggle('active', b.dataset.layer === layer));
            ['ndvi-legend-title', 'ndvi-legend-bar', 'ndvi-legend-labels'].forEach((id) => {
                document.getElementById(id).style.display = layer === 'ndvi' ? '' : 'none';
            });
            if (selectedIndex !== null && currentAnalysis) {
                renderSelectedRaster(currentAnalysis.observations[selectedIndex], currentAnalysis.ndviData);
            }
        });
    });

    // Delegated click handler for the chart's markers and month labels (bound
    // once here, rather than per renderNdviChart call, so redrawing doesn't stack
    // duplicate listeners — see currentAnalysis's comment).
    document.getElementById('ndvi-panel-body').addEventListener('click', (event) => {
        if (event.target.dataset.monthAll !== undefined) {
            // Mirrors the year "All" checkbox's semantics: if every month is
            // currently visible, hide them all; otherwise show them all.
            setAllMonthsVisible(visibleMonths.size < 12);
            return;
        }
        if (event.target.classList.contains('ndvi-month-label')) {
            const month = Number(event.target.dataset.month);
            setMonthVisible(month, !visibleMonths.has(month));
            return;
        }
        const index = event.target.dataset.index;
        if (index === undefined || !currentAnalysis) return;
        selectObservation(Number(index));
    });

    // Delegated change handler for the legend's per-year and "Toggle all"
    // checkboxes — same bind-once rationale as the click handler above.
    document.getElementById('ndvi-panel-body').addEventListener('change', (event) => {
        if (event.target.id === 'ndvi-year-toggle-all-checkbox') {
            const checked = event.target.checked;
            document.querySelectorAll('.ndvi-year-checkbox').forEach((cb) => {
                cb.checked = checked;
                setYearVisible(Number(cb.dataset.year), checked);
            });
            return;
        }
        if (event.target.classList.contains('ndvi-year-checkbox')) {
            setYearVisible(Number(event.target.dataset.year), event.target.checked);
            const allChecked = [...document.querySelectorAll('.ndvi-year-checkbox')].every((cb) => cb.checked);
            document.getElementById('ndvi-year-toggle-all-checkbox').checked = allChecked;
        }
    });

    // Left/right arrow keys step the current raster selection through the
    // chronological observation list — only once a marker has actually been
    // clicked (selectedIndex set), so arrow keys don't do anything unexpected
    // before then. Up/down arrow keys instead step a keyboard "year hover"
    // through the chart's years (see hoveredYearIndex/currentYears),
    // highlighting that year's line without touching the map/raster
    // selection — a keyboard equivalent of hovering a legend row, usable
    // even before anything's been clicked. Both skip past toggled-off
    // entries rather than landing on one that isn't visible. Left/right
    // clamp at the ends (there's nothing sensible to land on beyond the
    // observation list); up/down instead wrap through "nothing hovered" at
    // the ends, so continuing past the last/first year clears the highlight
    // back to the default all-years look rather than getting stuck there.
    // Not scoped to the panel having focus: with no text inputs in this app,
    // there's nothing else on the page arrow keys would otherwise do.
    document.addEventListener('keydown', (event) => {
        if (!currentAnalysis) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            if (selectedIndex === null) return;
            event.preventDefault();
            const { observations } = currentAnalysis;
            const step = event.key === 'ArrowRight' ? 1 : -1;
            let next = selectedIndex + step;
            while (next >= 0 && next < observations.length && !isObservationVisible(observations[next])) {
                next += step;
            }
            // Ran off the end without finding a visible observation in that
            // direction — stay put rather than selecting one that's hidden.
            if (next < 0 || next >= observations.length) return;
            selectObservation(next);
            return;
        }
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            const years = currentYears();
            if (years.length === 0) return;
            event.preventDefault();
            const step = event.key === 'ArrowUp' ? 1 : -1;
            // Nothing hovered yet — anchor at the end the step is heading
            // away from, so the very first press lands on the first year in
            // that direction rather than skipping straight to the second.
            let next = hoveredYearIndex === null ? (step === 1 ? 0 : years.length - 1) : hoveredYearIndex + step;
            while (next >= 0 && next < years.length && !visibleYears.has(years[next])) {
                next += step;
            }
            // Ran past the last/first year — clear the hover rather than
            // sticking at the end, so one more press in the same direction
            // starts back over from that end.
            hoveredYearIndex = (next < 0 || next >= years.length) ? null : next;
            applyRestingHighlight();
        }
    });

    // Delegated hover handlers — cover both the chart's own markers/lines and the
    // legend's year rows (hovering a legend row highlights that series exactly
    // like hovering one of its points), same bind-once rationale as the click/
    // change handlers above. Uses closest('[data-year]') rather than reading
    // event.target directly, since a legend row's year text sits in a nested
    // <span> without its own data-year. mouseout only reverts the highlight once
    // the pointer has actually left that year's territory — not just moved
    // between two data-year elements for the SAME year (e.g. the stacked hit-
    // circle and visible dot for one point, or from a chart marker to its
    // legend row) — by comparing years, not elements.
    document.getElementById('ndvi-panel-body').addEventListener('mouseover', (event) => {
        const yearEl = event.target.closest('[data-year]');
        if (!yearEl) return;
        const year = Number(yearEl.dataset.year);
        if (!visibleYears.has(year)) return; // nothing to highlight if it's toggled off
        setYearHovered(year);
    });
    document.getElementById('ndvi-panel-body').addEventListener('mouseout', (event) => {
        const leavingYearEl = event.target.closest('[data-year]');
        if (!leavingYearEl) return;
        const enteringYearEl = event.relatedTarget?.closest?.('[data-year]');
        if (enteringYearEl && Number(enteringYearEl.dataset.year) === Number(leavingYearEl.dataset.year)) return;
        // Revert to whatever's actually selected/hovered (arrow-key/click),
        // rather than clearing outright — hover is a temporary look, not a
        // reset.
        applyRestingHighlight();
    });
});
