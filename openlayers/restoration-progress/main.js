import { Map, View } from 'ol';
import { useGeographic } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Draw from 'ol/interaction/Draw';
import { Fill, Stroke, Style, Circle as CircleStyle } from 'ol/style';
import { apply } from 'ol-mapbox-style';

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

// alphaearth-embedding (see restor-servers' cloud_functions/alphaearth-embedding)
// serves two endpoints: POST /min-pixel finds the reference site's most stable,
// natural-land-cover pixel within a drawn polygon, and POST / (base URL) looks
// up the 64-dim AlphaEarth Foundations embedding for a single point/year.
// /min-pixel's stability COG is hardcoded server-side to a single Sabah pilot
// export, so a drawn polygon only gets a useful result inside that COG's extent
// (~5.19-5.93N, 117.74-118.48E) — default the view there rather than a generic
// world view.
const ALPHAEARTH_EMBEDDING_BASE_URL = 'https://europe-west6-restor-gis.cloudfunctions.net/alphaearth-embedding';
const MIN_PIXEL_URL = `${ALPHAEARTH_EMBEDDING_BASE_URL}/min-pixel`;
const EMBEDDING_YEAR = 2025;

const DEFAULT_LAT = 5.65;
const DEFAULT_LON = 118.30;
const DEFAULT_ZOOM = 12;

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
// see openlayers/datacube's main.js for why this is needed with ol-mapbox-style.
const OVERLAY_Z_INDEX = 10;

// The drawn reference-site polygon.
const drawSource = new VectorSource();
const drawLayer = new VectorLayer({
    source: drawSource,
    zIndex: OVERLAY_Z_INDEX + 1,
    style: new Style({
        fill: new Fill({ color: 'rgba(255, 0, 0, 0.3)' }),
        stroke: new Stroke({ color: '#ff0000', width: 2 }),
    }),
});

// The most-stable pixel location returned by /min-pixel.
const pointSource = new VectorSource();
const pointLayer = new VectorLayer({
    source: pointSource,
    zIndex: OVERLAY_Z_INDEX + 2,
    style: new Style({
        image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color: '#2f7bb5' }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
    }),
});

const map = new Map({
    target: 'map',
    layers: [drawLayer, pointLayer],
    view: new View({ center: [urlParams.lon, urlParams.lat], zoom: urlParams.zoom }),
});

// Basemap — MapTiler's satellite imagery style, same API key already used by the
// other openlayers apps in this repo.
const styleJson = 'https://api.maptiler.com/maps/satellite/style.json?key=67VOA297U9cciigsJVvm';
apply(map, styleJson);

// Keep the URL's lat/lon/zoom in sync with the current view, mirroring datacube.
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
// Result panel
// ---------------------------------------------------------------------------

function showResultPanel() {
    document.getElementById('result-panel').classList.add('visible');
}

function hideResultPanel() {
    document.getElementById('result-panel').classList.remove('visible');
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setResultStatus(message, isError) {
    const spinner = isError ? '' : '<span class="result-spinner"></span>';
    document.getElementById('result-panel-body').innerHTML =
        `<div id="result-status"${isError ? ' class="error"' : ''}>${spinner}${escapeHtml(message)}</div>`;
}

// Fixed chart geometry for the embedding bar chart — 64 bands, one bar each.
const EMBEDDING_CHART_WIDTH = 448, EMBEDDING_CHART_HEIGHT = 160;
const EMBEDDING_CHART_MARGIN = { top: 6, right: 4, bottom: 14, left: 26 };
const EMBEDDING_CHART_PLOT_WIDTH = EMBEDDING_CHART_WIDTH - EMBEDDING_CHART_MARGIN.left - EMBEDDING_CHART_MARGIN.right;
const EMBEDDING_CHART_PLOT_HEIGHT = EMBEDDING_CHART_HEIGHT - EMBEDDING_CHART_MARGIN.top - EMBEDDING_CHART_MARGIN.bottom;

// AEF embedding values are always within [-1, 1] (see alphaearth-embedding's
// de-quantization) — a fixed domain, unlike NDVI's data-dependent one, so
// every reference site's chart is directly comparable to another's.
function embeddingChartYToPx(v) {
    return EMBEDDING_CHART_MARGIN.top + EMBEDDING_CHART_PLOT_HEIGHT * (1 - (v + 1) / 2);
}

// Renders the 64-dim embedding as a simple bar chart, one bar per band
// (A00-A63), colored by sign — no charting library, mirroring datacube's
// hand-built inline-SVG approach.
function renderEmbeddingChart(embedding) {
    const n = embedding.length;
    const barWidth = EMBEDDING_CHART_PLOT_WIDTH / n;
    const zeroPx = embeddingChartYToPx(0);

    let bars = '';
    embedding.forEach((v, i) => {
        const x = EMBEDDING_CHART_MARGIN.left + i * barWidth;
        const y = embeddingChartYToPx(v);
        const top = Math.min(y, zeroPx);
        const height = Math.max(Math.abs(y - zeroPx), 0.5);
        const color = v >= 0 ? '#6b9b5e' : '#c9852f';
        bars += `<rect class="embedding-bar" x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${Math.max(barWidth - 0.3, 0.2).toFixed(1)}" height="${height.toFixed(1)}" fill="${color}"><title>A${String(i).padStart(2, '0')}: ${v.toFixed(4)}</title></rect>`;
    });

    return `
        <svg id="embedding-chart" viewBox="0 0 ${EMBEDDING_CHART_WIDTH} ${EMBEDDING_CHART_HEIGHT}">
            <line class="embedding-axis" x1="${EMBEDDING_CHART_MARGIN.left}" x2="${EMBEDDING_CHART_WIDTH - EMBEDDING_CHART_MARGIN.right}" y1="${zeroPx.toFixed(1)}" y2="${zeroPx.toFixed(1)}"/>
            <text x="${EMBEDDING_CHART_MARGIN.left - 4}" y="${(embeddingChartYToPx(1) + 3).toFixed(1)}" text-anchor="end">1</text>
            <text x="${EMBEDDING_CHART_MARGIN.left - 4}" y="${(zeroPx + 3).toFixed(1)}" text-anchor="end">0</text>
            <text x="${EMBEDDING_CHART_MARGIN.left - 4}" y="${(embeddingChartYToPx(-1) + 3).toFixed(1)}" text-anchor="end">-1</text>
            <text x="${EMBEDDING_CHART_MARGIN.left}" y="${EMBEDDING_CHART_HEIGHT - 2}">A00</text>
            <text x="${EMBEDDING_CHART_WIDTH - EMBEDDING_CHART_MARGIN.right}" y="${EMBEDDING_CHART_HEIGHT - 2}" text-anchor="end">A${String(n - 1).padStart(2, '0')}</text>
            ${bars}
        </svg>
    `;
}

// Renders the resolved reference-site point, then fetches and charts its
// AlphaEarth Foundations embedding for EMBEDDING_YEAR.
function renderMinPixelResult({ value, longitude, latitude, land_cover_year }) {
    document.getElementById('result-panel-body').innerHTML = `
        <div class="result-row"><span>Most stable pixel</span><span>${value.toFixed(4)}</span></div>
        <div class="result-row"><span>Longitude</span><span>${longitude.toFixed(6)}</span></div>
        <div class="result-row"><span>Latitude</span><span>${latitude.toFixed(6)}</span></div>
        <div class="result-row"><span>Land cover year</span><span>${land_cover_year}</span></div>
        <div id="embedding-chart-section">
            <div id="embedding-chart-title">AlphaEarth embedding (${EMBEDDING_YEAR})</div>
            <div id="embedding-chart-body">Loading embedding…</div>
        </div>
    `;
}

async function loadEmbeddingChart(longitude, latitude) {
    const body = document.getElementById('embedding-chart-body');
    try {
        const response = await fetch(ALPHAEARTH_EMBEDDING_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ longitude, latitude, year: EMBEDDING_YEAR }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
        if (body) body.innerHTML = renderEmbeddingChart(result.embedding);
    } catch (e) {
        console.error('alphaearth-embedding request failed:', e);
        if (body) body.textContent = `Failed to load embedding: ${e.message}`;
    }
}

async function findReferenceSite(polygonCoords) {
    showResultPanel();
    setResultStatus('Finding the most stable pixel…');
    try {
        const response = await fetch(MIN_PIXEL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ geometry: [polygonCoords] }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);

        pointSource.clear();
        pointSource.addFeature(new Feature({ geometry: new Point([result.longitude, result.latitude]) }));
        renderMinPixelResult(result);
        loadEmbeddingChart(result.longitude, result.latitude);
    } catch (e) {
        console.error('min-pixel request failed:', e);
        setResultStatus(`Failed to find reference site: ${e.message}`, true);
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
    pointSource.clear();
    hideResultPanel();
    document.getElementById('clear-button').disabled = true;
    setDrawActive(true);
}

function clearDrawing() {
    drawSource.clear();
    pointSource.clear();
    hideResultPanel();
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
        // useGeographic() makes getCoordinates() return [lon, lat] pairs directly —
        // outer ring only (index 0), matching embedding_stability_min's polygon format.
        findReferenceSite(event.feature.getGeometry().getCoordinates()[0]);
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
    document.getElementById('result-panel-close').addEventListener('click', hideResultPanel);
    document.getElementById('login-button').addEventListener('click', loginClicked);
});
