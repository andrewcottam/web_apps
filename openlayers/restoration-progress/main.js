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
const EMBEDDING_CHART_TITLE = `AlphaEarth embedding (${EMBEDDING_YEAR})`;
const COMPARISON_CHART_TITLE = `AlphaEarth embedding comparison (${EMBEDDING_YEAR})`;

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

// Colors shared between the two "Compare points" markers and their chart
// series/legend, so a point on the map and its series in the chart are
// identifiable as the same one at a glance.
const COMPARE_COLOR_A = '#2f7bb5';
const COMPARE_COLOR_B = '#c9852f';

// The two points picked by the "Compare points" tool.
const compareSource = new VectorSource();
const compareLayer = new VectorLayer({
    source: compareSource,
    zIndex: OVERLAY_Z_INDEX + 2,
    style: (feature) => new Style({
        image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color: feature.get('label') === 'A' ? COMPARE_COLOR_A : COMPARE_COLOR_B }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
    }),
});

const map = new Map({
    target: 'map',
    layers: [drawLayer, pointLayer, compareLayer],
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

function showResultPanel(title) {
    document.getElementById('result-panel-title').textContent = title;
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

// Opens the currently-rendered #embedding-chart (plus its legend row, if any)
// in a new tab, scaled up to fill most of the viewport — the panel's own
// copy stays fixed-size (it has to fit next to the map), so this is the only
// way to see the 64 bars at a readable size. Built as a standalone HTML
// document via a Blob URL rather than a route of this app's own, since
// there's nothing server-side to hand it — the chart only exists as
// already-rendered DOM in the panel. Returns the Blob URL, or null if
// there's no chart currently rendered to open (chart still loading/errored).
function buildChartFullscreenUrl(title) {
    const chartEl = document.getElementById('embedding-chart');
    if (!chartEl) return null;
    // Cloned rather than read directly — the legend row is also where the
    // "Full screen" link itself lives (see fullscreenLinkRow), and that link
    // has no meaning (or click handler) once copied into the new tab's own,
    // separate document.
    const legendEl = document.querySelector('#embedding-chart-body .embedding-chart-legend')?.cloneNode(true);
    legendEl?.querySelector('.chart-fullscreen-link')?.remove();

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
    html, body { margin: 0; height: 100%; }
    body {
        display: flex; align-items: center; justify-content: center;
        background: #fafafa;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .wrap { width: 92vw; max-width: 1400px; }
    h1 { font-size: 20px; color: #222; margin: 0 0 16px; }
    .embedding-chart-legend { display: flex; align-items: baseline; gap: 20px; font-size: 14px; color: #666; margin-bottom: 12px; }
    .embedding-chart-legend-swatch { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 6px; vertical-align: -1px; }
    .embedding-axis { stroke: #ccc; stroke-width: 1; }
    svg { width: 100%; height: auto; display: block; }
    svg text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; fill: #888; }
</style>
</head>
<body>
    <div class="wrap">
        <h1>${escapeHtml(title)}</h1>
        ${legendEl ? legendEl.outerHTML : ''}
        ${chartEl.outerHTML}
    </div>
</body>
</html>`;

    // Deliberately never revoked — the new tab needs the URL to stay valid
    // for as long as it's open, and there's no reliable "tab closed" signal
    // to revoke on. A leaked blob URL is a few KB, released on page unload.
    return URL.createObjectURL(new Blob([html], { type: 'text/html' }));
}

// Fixed chart geometry for the embedding bar chart — 64 bands, one bar each.
// Sized to fill the result panel's width with a taller aspect ratio than a
// plain width/height guess would give (448x160 read as small and letterboxed
// in earlier versions of this chart) — the panel is 560px wide, so this
// leaves just its padding.
const EMBEDDING_CHART_WIDTH = 524, EMBEDDING_CHART_HEIGHT = 230;
const EMBEDDING_CHART_MARGIN = { top: 6, right: 4, bottom: 14, left: 26 };
const EMBEDDING_CHART_PLOT_WIDTH = EMBEDDING_CHART_WIDTH - EMBEDDING_CHART_MARGIN.left - EMBEDDING_CHART_MARGIN.right;
const EMBEDDING_CHART_PLOT_HEIGHT = EMBEDDING_CHART_HEIGHT - EMBEDDING_CHART_MARGIN.top - EMBEDDING_CHART_MARGIN.bottom;

// AEF embedding values are theoretically bounded by [-1, 1] (see
// alphaearth-embedding's de-quantization), but in practice sit much closer
// to 0 — real values across a chart rarely exceed roughly 0.3. A fixed [-1, 1]
// axis squeezed every bar into a thin band in the middle of the chart, mostly
// whitespace above and below. This scales the y-axis to the actual data
// instead (symmetric around 0, since sign matters as much as magnitude),
// with headroom so the tallest bar doesn't touch the plot's edge.
function embeddingChartYDomain(...embeddings) {
    let maxAbs = 0;
    for (const embedding of embeddings) {
        for (const v of embedding) maxAbs = Math.max(maxAbs, Math.abs(v));
    }
    return Math.min(1, Math.max(0.02, maxAbs * 1.15));
}

function embeddingChartYToPx(v, yMax) {
    return EMBEDDING_CHART_MARGIN.top + EMBEDDING_CHART_PLOT_HEIGHT * (1 - (v + yMax) / (2 * yMax));
}

// A row holding just the "Full screen" link (see buildChartFullscreenUrl),
// shared by both chart types — for the comparison chart it's appended as the
// last child of the legend row (margin-left: auto pushes it to the right
// regardless of what other legend items are present); for the single-point
// chart it's the row's only child.
function fullscreenLinkRow(title, legendItemsHtml = '') {
    return `<div class="embedding-chart-legend">${legendItemsHtml}<a href="#" class="chart-fullscreen-link" data-fullscreen-title="${escapeHtml(title)}">⤢ Full screen</a></div>`;
}

// Renders the 64-dim embedding as a simple bar chart, one bar per band
// (A00-A63), colored by sign — no charting library, mirroring datacube's
// hand-built inline-SVG approach.
function renderEmbeddingChart(embedding, title) {
    const n = embedding.length;
    const barWidth = EMBEDDING_CHART_PLOT_WIDTH / n;
    const yMax = embeddingChartYDomain(embedding);
    const zeroPx = embeddingChartYToPx(0, yMax);

    let bars = '';
    embedding.forEach((v, i) => {
        const x = EMBEDDING_CHART_MARGIN.left + i * barWidth;
        const y = embeddingChartYToPx(v, yMax);
        const top = Math.min(y, zeroPx);
        const height = Math.max(Math.abs(y - zeroPx), 0.5);
        const color = v >= 0 ? '#6b9b5e' : '#c9852f';
        bars += `<rect class="embedding-bar" x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${Math.max(barWidth - 0.3, 0.2).toFixed(1)}" height="${height.toFixed(1)}" fill="${color}"><title>A${String(i).padStart(2, '0')}: ${v.toFixed(4)}</title></rect>`;
    });

    return `
        ${fullscreenLinkRow(title)}
        <svg id="embedding-chart" viewBox="0 0 ${EMBEDDING_CHART_WIDTH} ${EMBEDDING_CHART_HEIGHT}">
            <line class="embedding-axis" x1="${EMBEDDING_CHART_MARGIN.left}" x2="${EMBEDDING_CHART_WIDTH - EMBEDDING_CHART_MARGIN.right}" y1="${zeroPx.toFixed(1)}" y2="${zeroPx.toFixed(1)}"/>
            <text x="${EMBEDDING_CHART_MARGIN.left - 4}" y="${(embeddingChartYToPx(yMax, yMax) + 3).toFixed(1)}" text-anchor="end">${yMax.toFixed(2)}</text>
            <text x="${EMBEDDING_CHART_MARGIN.left - 4}" y="${(zeroPx + 3).toFixed(1)}" text-anchor="end">0</text>
            <text x="${EMBEDDING_CHART_MARGIN.left - 4}" y="${(embeddingChartYToPx(-yMax, yMax) + 3).toFixed(1)}" text-anchor="end">-${yMax.toFixed(2)}</text>
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
        <div class="result-row"><span>Most consistent pixel</span><span>${value.toFixed(4)}</span></div>
        <div class="result-row"><span>Longitude</span><span>${longitude.toFixed(6)}</span></div>
        <div class="result-row"><span>Latitude</span><span>${latitude.toFixed(6)}</span></div>
        <div class="result-row"><span>Land cover year</span><span>${land_cover_year}</span></div>
        <div id="embedding-chart-section">
            <div id="embedding-chart-title">${EMBEDDING_CHART_TITLE}</div>
            <div id="embedding-chart-body">Loading embedding…</div>
        </div>
    `;
}

// Fetches the AEF embedding for one point/year. Throws with a message
// suitable for display on failure (missing coverage, masked pixel, etc).
async function fetchEmbedding(longitude, latitude, year) {
    const response = await fetch(ALPHAEARTH_EMBEDDING_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Passing 'year' (rather than omitting it) matters: with no
        // year/years field at all, this endpoint defaults to fetching every
        // available year (2017-2025), one lookup each — a single year keeps
        // this to one.
        body: JSON.stringify({ longitude, latitude, year }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);

    // Response shape is { longitude, latitude, years: [{ year, embedding, cog_url } | { year, error }] }
    // — one entry per requested year, even when only one was requested.
    // Falls back to a bare top-level 'embedding' field for the older,
    // single-year-only version of this endpoint.
    const yearResult = (result.years && result.years[0]) || (result.embedding ? result : null);
    if (!yearResult || yearResult.error) throw new Error((yearResult && yearResult.error) || 'No embedding returned.');
    return yearResult.embedding;
}

async function loadEmbeddingChart(longitude, latitude) {
    const body = document.getElementById('embedding-chart-body');
    try {
        const embedding = await fetchEmbedding(longitude, latitude, EMBEDDING_YEAR);
        if (body) body.innerHTML = renderEmbeddingChart(embedding, EMBEDDING_CHART_TITLE);
    } catch (e) {
        console.error('alphaearth-embedding request failed:', e);
        if (body) body.textContent = `Failed to load embedding: ${e.message}`;
    }
}

// AEF embeddings are unit-normalized (Euclidean length 1, per alphaearth-
// embedding's readme), so the dot product of two embeddings at the same year
// is directly their cosine similarity — no separate normalization needed.
function cosineSimilarity(a, b) {
    let dot = 0;
    for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
    return dot;
}

// Renders two embeddings' bars side by side per band, colored by which point
// they belong to (rather than by sign, as the single-point chart does) —
// the point of the comparison is how A and B differ at each band, not each
// one's own sign. The legend row (point colors + cosine similarity) is built
// here too, rather than by the caller, so it travels with the chart into
// buildChartFullscreenUrl's copy of the DOM.
function renderComparisonChart(embeddingA, embeddingB, title) {
    const n = embeddingA.length;
    const groupWidth = EMBEDDING_CHART_PLOT_WIDTH / n;
    const barWidth = Math.max(groupWidth / 2 - 0.3, 0.2);
    const yMax = embeddingChartYDomain(embeddingA, embeddingB);
    const zeroPx = embeddingChartYToPx(0, yMax);

    let bars = '';
    for (let i = 0; i < n; i++) {
        const xGroup = EMBEDDING_CHART_MARGIN.left + i * groupWidth;
        [[embeddingA[i], COMPARE_COLOR_A, xGroup], [embeddingB[i], COMPARE_COLOR_B, xGroup + groupWidth / 2]].forEach(([v, color, x]) => {
            const y = embeddingChartYToPx(v, yMax);
            const top = Math.min(y, zeroPx);
            const height = Math.max(Math.abs(y - zeroPx), 0.5);
            bars += `<rect class="embedding-bar" x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${height.toFixed(1)}" fill="${color}"><title>A${String(i).padStart(2, '0')}: ${v.toFixed(4)}</title></rect>`;
        });
    }

    const similarity = cosineSimilarity(embeddingA, embeddingB);
    const legendItemsHtml = `
        <span><span class="embedding-chart-legend-swatch" style="background:${COMPARE_COLOR_A}"></span>Point A</span>
        <span><span class="embedding-chart-legend-swatch" style="background:${COMPARE_COLOR_B}"></span>Point B</span>
        <span>Cosine similarity: ${similarity.toFixed(4)}</span>
    `;

    return `
        ${fullscreenLinkRow(title, legendItemsHtml)}
        <svg id="embedding-chart" viewBox="0 0 ${EMBEDDING_CHART_WIDTH} ${EMBEDDING_CHART_HEIGHT}">
            <line class="embedding-axis" x1="${EMBEDDING_CHART_MARGIN.left}" x2="${EMBEDDING_CHART_WIDTH - EMBEDDING_CHART_MARGIN.right}" y1="${zeroPx.toFixed(1)}" y2="${zeroPx.toFixed(1)}"/>
            <text x="${EMBEDDING_CHART_MARGIN.left - 4}" y="${(embeddingChartYToPx(yMax, yMax) + 3).toFixed(1)}" text-anchor="end">${yMax.toFixed(2)}</text>
            <text x="${EMBEDDING_CHART_MARGIN.left - 4}" y="${(zeroPx + 3).toFixed(1)}" text-anchor="end">0</text>
            <text x="${EMBEDDING_CHART_MARGIN.left - 4}" y="${(embeddingChartYToPx(-yMax, yMax) + 3).toFixed(1)}" text-anchor="end">-${yMax.toFixed(2)}</text>
            <text x="${EMBEDDING_CHART_MARGIN.left}" y="${EMBEDDING_CHART_HEIGHT - 2}">A00</text>
            <text x="${EMBEDDING_CHART_WIDTH - EMBEDDING_CHART_MARGIN.right}" y="${EMBEDDING_CHART_HEIGHT - 2}" text-anchor="end">A${String(n - 1).padStart(2, '0')}</text>
            ${bars}
        </svg>
    `;
}

function renderComparePanel(pointA, pointB) {
    showResultPanel('Compare points');
    document.getElementById('result-panel-body').innerHTML = `
        <div class="result-row"><span style="color:${COMPARE_COLOR_A}">● Point A</span><span>${pointA[0].toFixed(6)}, ${pointA[1].toFixed(6)}</span></div>
        <div class="result-row"><span style="color:${COMPARE_COLOR_B}">● Point B</span><span>${pointB[0].toFixed(6)}, ${pointB[1].toFixed(6)}</span></div>
        <div id="embedding-chart-section">
            <div id="embedding-chart-title">${COMPARISON_CHART_TITLE}</div>
            <div id="embedding-chart-body">Loading embeddings…</div>
        </div>
    `;
}

async function loadComparisonChart(pointA, pointB) {
    const body = document.getElementById('embedding-chart-body');
    try {
        const [embeddingA, embeddingB] = await Promise.all([
            fetchEmbedding(pointA[0], pointA[1], EMBEDDING_YEAR),
            fetchEmbedding(pointB[0], pointB[1], EMBEDDING_YEAR),
        ]);
        if (body) body.innerHTML = renderComparisonChart(embeddingA, embeddingB, COMPARISON_CHART_TITLE);
    } catch (e) {
        console.error('alphaearth-embedding request failed:', e);
        if (body) body.textContent = `Failed to load embeddings: ${e.message}`;
    }
}

async function findReferenceSite(polygonCoords) {
    showResultPanel('Reference site');
    setResultStatus('Finding the most consistent pixel…');
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

// The Clear button clears both tools' state at once, so its enabled state
// reflects whether *either* has anything to clear, rather than being toggled
// by hand at every call site (which is what let it fall out of sync when
// switching tools — disabling it while the other tool's markers/polygon
// were still sitting on the map).
function updateClearButtonEnabled() {
    const hasContent = drawSource.getFeatures().length > 0 || compareSource.getFeatures().length > 0;
    document.getElementById('clear-button').disabled = !hasContent;
}

function setDrawActive(active) {
    document.getElementById('draw-button').classList.toggle('active', active);
    if (active) {
        map.addInteraction(draw);
    } else {
        map.removeInteraction(draw);
    }
}

function startDrawing() {
    cancelComparing();
    drawSource.clear();
    pointSource.clear();
    hideResultPanel();
    updateClearButtonEnabled();
    setDrawActive(true);
}

function clearAll() {
    drawSource.clear();
    pointSource.clear();
    compareSource.clear();
    comparePoints = [];
    hideResultPanel();
    updateClearButtonEnabled();
    setDrawActive(false);
    setCompareActive(false);
}

// ---------------------------------------------------------------------------
// Comparing two points' embeddings
// ---------------------------------------------------------------------------

let compareActive = false;
let comparePoints = [];

function setCompareActive(active) {
    compareActive = active;
    document.getElementById('compare-button').classList.toggle('active', active);
    if (active) {
        map.on('click', handleCompareClick);
    } else {
        map.un('click', handleCompareClick);
    }
}

// Cancels an in-progress (not yet finished) point pick, without disturbing a
// previously *completed* comparison's markers/result — called when another
// tool starts, so its map-click listener doesn't linger alongside Draw's.
function cancelComparing() {
    if (!compareActive) return;
    setCompareActive(false);
    if (comparePoints.length < 2) {
        compareSource.clear();
        comparePoints = [];
        hideResultPanel();
        updateClearButtonEnabled();
    }
}

function handleCompareClick(event) {
    const coordinate = event.coordinate; // [lon, lat] — useGeographic() again
    const label = comparePoints.length === 0 ? 'A' : 'B';
    compareSource.addFeature(new Feature({ geometry: new Point(coordinate), label }));
    comparePoints.push(coordinate);
    updateClearButtonEnabled();

    if (comparePoints.length < 2) {
        setResultStatus('Click a second point on the map to compare it with the first…');
    } else {
        setCompareActive(false);
        renderComparePanel(comparePoints[0], comparePoints[1]);
        loadComparisonChart(comparePoints[0], comparePoints[1]);
    }
}

function startComparing() {
    setDrawActive(false);
    compareSource.clear();
    comparePoints = [];
    updateClearButtonEnabled();
    setCompareActive(true);
    showResultPanel('Compare points');
    setResultStatus('Click a point on the map…');
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
        updateClearButtonEnabled();
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
    document.getElementById('compare-button').addEventListener('click', () => {
        if (compareActive) {
            cancelComparing();
        } else {
            startComparing();
        }
    });
    document.getElementById('clear-button').addEventListener('click', clearAll);
    document.getElementById('result-panel-close').addEventListener('click', hideResultPanel);
    document.getElementById('login-button').addEventListener('click', loginClicked);

    // Delegated (rather than bound per-render) since #result-panel-body's
    // content, including any fullscreen link, is replaced wholesale on every
    // render — a directly-bound listener would be gone along with it.
    //
    // Sets the link's href/target and lets the click proceed as an ordinary
    // link navigation, rather than preventDefault() + window.open() — some
    // browsers treat a script-initiated window.open as a popup and block it
    // even from within a genuine click handler, but never block a real
    // <a target="_blank"> the user clicked.
    document.getElementById('result-panel-body').addEventListener('click', (event) => {
        const link = event.target.closest('.chart-fullscreen-link');
        if (!link) return;
        const url = buildChartFullscreenUrl(link.dataset.fullscreenTitle);
        if (!url) { event.preventDefault(); return; }
        link.href = url;
        link.target = '_blank';
    });
});
