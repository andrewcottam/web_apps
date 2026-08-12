import { Map, View } from 'ol';
import { useGeographic } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
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

// Fixed zarr store this app samples — a per-site Sentinel-2 NDVI timeseries datacube.
const ZARR_STORE_URL = 'https://storage.googleapis.com/restor-datacube/sentinel2_ndvi/site-123_timeseries.zarr';

const DEFAULT_LAT = 46.95416;
const DEFAULT_LON = 7.45139;
const DEFAULT_ZOOM = 13;

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

// Layer the drawn polygon is rendered on.
const drawSource = new VectorSource();
const drawLayer = new VectorLayer({
    source: drawSource,
    style: new Style({
        fill: new Fill({ color: 'rgba(107, 155, 94, 0.2)' }),
        stroke: new Stroke({ color: 'rgba(61, 107, 44, 0.9)', width: 2 }),
    }),
});

const map = new Map({
    target: 'map',
    layers: [drawLayer],
    view: new View({ center: [urlParams.lon, urlParams.lat], zoom: urlParams.zoom }),
});

// Basemap — same MapTiler "forests" style used by openlayers/vector_tiles, for a
// consistent look across the sibling apps in this repo.
const styleJson = 'https://api.maptiler.com/maps/a1d2f17b-d57a-45ba-b7c6-4af845f758fb/style.json?key=67VOA297U9cciigsJVvm';
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
        observations.push({ date: dates[t], ndvi: sum / count });
    }

    return observations.sort((a, b) => a.date - b.date);
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
    document.getElementById('ndvi-panel-body').innerHTML =
        `<div id="ndvi-status"${isError ? ' class="error"' : ''}>${escapeHtml(message)}</div>`;
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Renders a plain bar chart — one bar per observation date, NDVI on the y-axis —
// as inline SVG, no charting library dependency, consistent with this repo's other
// openlayers apps, which build their own popups/UI by hand. The x-axis has two
// rows: each bar's date, and the calendar year spanning each contiguous run of
// same-year bars underneath (so a single-year site like this one still gets a
// bar per observation instead of being collapsed into one yearly mean).
function renderNdviChart(observations) {
    const width = 420, height = 220;
    const margin = { top: 14, right: 12, bottom: 38, left: 34 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const values = observations.map((d) => d.ndvi);
    let yMin = Math.min(0, ...values);
    let yMax = Math.max(...values);
    if (yMax - yMin < 0.05) yMax = yMin + 0.05; // avoid a degenerate/zero-height axis
    const yPad = (yMax - yMin) * 0.1;
    yMin -= yPad;
    yMax += yPad;

    const yToPx = (v) => margin.top + plotHeight * (1 - (v - yMin) / (yMax - yMin));
    const zeroPx = yToPx(0);

    const bandWidth = plotWidth / observations.length;
    const barWidth = Math.min(40, bandWidth * 0.55);

    const gridlineCount = 4;
    let gridlines = '';
    let yLabels = '';
    for (let i = 0; i <= gridlineCount; i++) {
        const v = yMin + ((yMax - yMin) * i) / gridlineCount;
        const py = yToPx(v);
        gridlines += `<line class="ndvi-gridline" x1="${margin.left}" x2="${width - margin.right}" y1="${py.toFixed(1)}" y2="${py.toFixed(1)}"/>`;
        yLabels += `<text x="${margin.left - 6}" y="${(py + 3).toFixed(1)}" text-anchor="end">${v.toFixed(2)}</text>`;
    }

    const dateLabelY = height - margin.bottom + 14;
    const yearLabelY = height - margin.bottom + 28;

    let bars = '', dateLabels = '';
    observations.forEach((d, i) => {
        const cx = margin.left + bandWidth * (i + 0.5);
        const barTop = Math.min(yToPx(d.ndvi), zeroPx);
        const barHeight = Math.abs(yToPx(d.ndvi) - zeroPx);
        bars += `<rect class="ndvi-bar" x="${(cx - barWidth / 2).toFixed(1)}" y="${barTop.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" rx="2"/>`;
        bars += `<text class="ndvi-value-label" x="${cx.toFixed(1)}" y="${(yToPx(d.ndvi) - 5).toFixed(1)}" text-anchor="middle">${d.ndvi.toFixed(2)}</text>`;
        const dateLabel = d.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });
        dateLabels += `<text x="${cx.toFixed(1)}" y="${dateLabelY.toFixed(1)}" text-anchor="middle">${dateLabel}</text>`;
    });

    // Groups contiguous same-year runs of observations and centers one year label
    // under each run, rather than repeating the year under every single bar.
    let yearLabels = '';
    let runStart = 0;
    for (let i = 1; i <= observations.length; i++) {
        const runEnded = i === observations.length || observations[i].date.getUTCFullYear() !== observations[runStart].date.getUTCFullYear();
        if (!runEnded) continue;
        const runCenter = margin.left + bandWidth * ((runStart + i) / 2);
        yearLabels += `<text x="${runCenter.toFixed(1)}" y="${yearLabelY.toFixed(1)}" text-anchor="middle" font-weight="600">${observations[runStart].date.getUTCFullYear()}</text>`;
        runStart = i;
    }

    const svg = `
        <svg id="ndvi-chart" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            ${gridlines}
            ${yLabels}
            <line class="ndvi-axis" x1="${margin.left}" x2="${margin.left}" y1="${margin.top}" y2="${height - margin.bottom}"/>
            <line class="ndvi-axis" x1="${margin.left}" x2="${width - margin.right}" y1="${zeroPx.toFixed(1)}" y2="${zeroPx.toFixed(1)}"/>
            ${bars}
            ${dateLabels}
            ${yearLabels}
        </svg>
    `;
    document.getElementById('ndvi-panel-body').innerHTML = svg;
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

        renderNdviChart(observations);
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
    document.getElementById('clear-button').disabled = true;
    setDrawActive(true);
}

function clearDrawing() {
    drawSource.clear();
    hideNdviPanel();
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
    document.getElementById('ndvi-panel-close').addEventListener('click', hideNdviPanel);
    document.getElementById('login-button').addEventListener('click', loginClicked);
});
