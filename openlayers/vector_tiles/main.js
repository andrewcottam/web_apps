import { Map, View } from 'ol';
import OSM from 'ol/source/OSM';
import { Fill, Stroke } from 'ol/style';
import Style from 'ol/style/Style';
import { Overlay } from 'ol';
import { useGeographic, transformExtent } from "ol/proj";
import TileLayer from 'ol/layer/WebGLTile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { apply } from 'ol-mapbox-style';

// FlatGeobuf
import { deserialize as fgbDeserialize } from 'flatgeobuf/lib/mjs/geojson';

// Firebase
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, getDoc, doc, collection } from "firebase/firestore";

useGeographic();

// Firebase config
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
// Restrict/hint the Google account chooser to the restor.eco Workspace account
provider.setCustomParameters({ hd: 'restor.eco', login_hint: 'andrew@restor.eco' });
const firestore = getFirestore(firebase_app);

const FGB_PROXY_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8082/fgb_proxy'
    : 'https://europe-west6-restor-gis.cloudfunctions.net/fgb_proxy';

// Helper function to parse URL parameters
function getUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = urlParams.get('lat');
    const lng = urlParams.get('lng') || urlParams.get('lon');
    const zoom = urlParams.get('zoom');

    const result = {};

    if (lat && !isNaN(parseFloat(lat))) {
        result.lat = parseFloat(lat);
    }

    if (lng && !isNaN(parseFloat(lng))) {
        result.lng = parseFloat(lng);
    }

    if (zoom && !isNaN(parseFloat(zoom))) {
        result.zoom = parseFloat(zoom);
    }

    return result;
}

// variables
var visibleStatuses = new Set(['PUBLIC']);
var logged_in = false;
var current_user = null;

const geoJsonFormat = new GeoJSON();

// Sites vector source, loaded directly from the FlatGeobuf file via fgb_proxy
// (requires a logged-in, whitelisted user, same as dist-alert's FGB mode)
const vector_tile_source = new VectorSource({ strategy: bboxStrategy });
vector_tile_source.setLoader(async function (extent, _resolution, projection, success, failure) {
    if (!current_user) {
        vector_tile_source.removeLoadedExtent(extent);
        return;
    }
    try {
        const [minX, minY, maxX, maxY] = transformExtent(extent, projection, 'EPSG:4326');
        const rect = { minX, minY, maxX, maxY };
        const idToken = await current_user.getIdToken();
        const headers = { 'Authorization': `Bearer ${idToken}` };

        const features = [];
        for await (const geoJsonFeature of fgbDeserialize(`${FGB_PROXY_URL}?source=sites_plus_checks`, rect, undefined, false, headers)) {
            const olFeature = geoJsonFormat.readFeature(geoJsonFeature, {
                featureProjection: projection,
                dataProjection: 'EPSG:4326',
            });
            features.push(olFeature);
        }
        vector_tile_source.addFeatures(features);
        success?.(features);
    } catch (e) {
        console.error('FGB load error:', e);
        failure?.();
        vector_tile_source.removeLoadedExtent(extent);
    }
});

// Public/private sites are rendered differently (solid green vs dashed amber),
// matching the legend swatches next to the visibility switches.
const public_style = new Style({ fill: new Fill({ color: 'rgba(99, 148, 69, 0.2)', }), stroke: new Stroke({ color: 'rgba(99, 148, 69, 0.8)', width: 1.5 }) });
const private_style = new Style({ fill: new Fill({ color: 'rgba(179, 140, 80, 0.18)', }), stroke: new Stroke({ color: 'rgba(179, 140, 80, 0.9)', width: 1.5, lineDash: [4, 4] }) });
// Hover highlight keeps each visibility's own color/dash, just heavier, rather than a single shared color.
const public_highlight_style = new Style({ fill: new Fill({ color: 'rgba(99, 148, 69, 0.3)', }), stroke: new Stroke({ color: 'rgba(99, 148, 69, 0.7)', width: 2 }) });
const private_highlight_style = new Style({ fill: new Fill({ color: 'rgba(179, 140, 80, 0.28)', }), stroke: new Stroke({ color: 'rgba(179, 140, 80, 0.8)', width: 2, lineDash: [4, 4] }) });

// Create the sites vector layer
const vector_tile_layer = new VectorLayer({
    source: vector_tile_source,
    minZoom: 8,
    visible: false,
    style: function (feature) {
        const threshold = parseFloat(document.getElementById('slider').value);
        const featureValue = feature.get('surface_area_km2');
        const vis = feature.get('site_visibility');
        if (featureValue > threshold || !visibleStatuses.has(vis)) return null; // Hide features that do not meet the threshold
        return vis === 'PRIVATE' ? private_style : public_style;
    }
});
// Create the map
const urlParams = getUrlParameters();
let initialCenter = [0, 0];
let initialZoom = 0;

if (urlParams.lat !== undefined && urlParams.lng !== undefined) {
    initialCenter = [urlParams.lng, urlParams.lat];
}

if (urlParams.zoom !== undefined) {
    initialZoom = urlParams.zoom;
}

const map = new Map({
    target: 'map',
    // layers: [new TileLayer({ source: new OSM() }), vector_tile_layer],
    view: new View({ center: initialCenter, zoom: initialZoom }),

});

map.on('moveend', () => {
    const view = map.getView();
    const center = view.getCenter();
    const zoom = view.getZoom();
    const params = new URLSearchParams(window.location.search);
    params.set('lng', center[0].toFixed(6));
    params.set('lat', center[1].toFixed(6));
    params.set('zoom', zoom.toFixed(2));
    window.history.replaceState(null, '', `?${params.toString()}`);
});

// Apply the MapTiler style
// const styleJson = `https://api.maptiler.com/maps/backdrop/style.json?key=67VOA297U9cciigsJVvm`;
// const styleJson = 'https://api.maptiler.com/maps/dataviz/style.json?key=67VOA297U9cciigsJVvm'; // dataviz with green forests
const styleJson = 'https://api.maptiler.com/maps/a1d2f17b-d57a-45ba-b7c6-4af845f758fb/style.json?key=67VOA297U9cciigsJVvm'; // forests 0% opacity
apply(map, styleJson).then(() => {
    map.addLayer(vector_tile_layer);
    // Add the layer to the map
    map.addLayer(selection_layer);

});

// Create a selected feature
var selected_feature = {};
// Create a popup
var map_popup = new Overlay({
    element: document.getElementById('popup'),
    offset: [16, 24],
    positioning: 'top-left',
});
map.addOverlay(map_popup);

// Create the vector layer for the highlighted site
const selection_layer = new VectorLayer({
    source: vector_tile_source,
    minZoom: 8,
    visible: false,
    style: function (feature) {
        const props = feature.getProperties();
        if (props['id'] === selected_feature.current) {
            return props['site_visibility'] === 'PRIVATE' ? private_highlight_style : public_highlight_style;
        }
    }
});

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function safe(value) {
    // geopandas/pandas represents missing values as float NaN, not undefined
    if (value === undefined || value === null) return '';
    if (typeof value === 'number' && isNaN(value)) return '';
    return value;
}

function formatEnum(str) {
    if (!str) return '';
    return str.toLowerCase().split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function formatNumber(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function parseListField(value) {
    // Some list-valued columns (goals, support_sought, certificate_types, ...) are
    // stored as Python-repr strings with single quotes, e.g. "['CONSERVING_BIODIVERSITY']".
    // Others (verification_checks) are proper JSON, whose string values may contain
    // apostrophes (e.g. "Pete's patch") — try real JSON first so those aren't corrupted
    // by a blind single-quote-to-double-quote replacement.
    value = safe(value);
    if (value === '') return [];
    if (Array.isArray(value)) return value;
    const trimmed = String(value).trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            try {
                const parsed = JSON.parse(trimmed.replace(/'/g, '"'));
                if (Array.isArray(parsed)) return parsed;
            } catch (e2) {
                // fall through and treat as a plain string
            }
        }
    }
    return [trimmed];
}

// Same status colors as openlayers/verify (CheckDiv/ClassificationCheck: green/orange/red, white text)
const CHECK_STATUS_ORDER = ['Invalid', 'Needs Review', 'Valid'];
const CHECK_STATUS_COLORS = { 'Invalid': '#c0605c', 'Needs Review': '#d39a4e', 'Valid': '#6b9b5e' };

function buildVerificationPillsHtml(checks) {
    if (!checks.length) return '';
    const counts = {};
    checks.forEach((check) => {
        const status = (check && typeof check === 'object' ? check.status : check) || 'Unknown';
        counts[status] = (counts[status] || 0) + 1;
    });
    const orderedStatuses = [...CHECK_STATUS_ORDER, ...Object.keys(counts).filter((s) => !CHECK_STATUS_ORDER.includes(s))];
    return orderedStatuses
        .filter((status) => counts[status])
        .map((status) => {
            const color = CHECK_STATUS_COLORS[status] || 'gray';
            return `<span class="popup-check-pill" style="background:${color}" title="${escapeHtml(status)}">${counts[status]}</span>`;
        })
        .join('');
}

function buildChecksModalBody(checks) {
    if (!checks.length) {
        return '<div class="checks-modal-empty">No verification checks available for this site.</div>';
    }
    const sorted = [...checks].sort((a, b) => {
        const statusA = (a && typeof a === 'object' ? a.status : a) || 'Unknown';
        const statusB = (b && typeof b === 'object' ? b.status : b) || 'Unknown';
        const rankA = CHECK_STATUS_ORDER.indexOf(statusA);
        const rankB = CHECK_STATUS_ORDER.indexOf(statusB);
        return (rankA === -1 ? CHECK_STATUS_ORDER.length : rankA) - (rankB === -1 ? CHECK_STATUS_ORDER.length : rankB);
    });
    return sorted.map((check) => {
        const isObject = check && typeof check === 'object';
        const name = isObject ? (check.name || 'Check') : String(check);
        const status = (isObject ? check.status : check) || 'Unknown';
        const message = isObject ? safe(check.status_message) : '';
        const color = CHECK_STATUS_COLORS[status] || 'gray';
        return `
            <div class="check-row">
                <div class="check-info">
                    <div class="check-name">${escapeHtml(name)}</div>
                    ${message ? `<div class="check-message">${escapeHtml(message)}</div>` : ''}
                </div>
                <span class="check-status-pill" style="background:${color}">${escapeHtml(status)}</span>
            </div>
        `;
    }).join('');
}

function openChecksModal(props) {
    const checks = parseListField(props['verification_checks']).filter(Boolean);
    document.getElementById('checks-modal-title').textContent = props['name'] || 'Untitled site';
    document.getElementById('checks-modal-body').innerHTML = buildChecksModalBody(checks);
    document.getElementById('checks-modal-backdrop').classList.add('open');
}

function closeChecksModal() {
    document.getElementById('checks-modal-backdrop').classList.remove('open');
}

function buildPhotoUrl(siteId, photoId) {
    // Same endpoint restor.eco's own frontend uses; redirects (307) to a public GCS object.
    return `https://restor2-prod-1-api.restor.eco/sites/5/${siteId}/photo/${photoId}`;
}

function countryCodeToFlagEmoji(code) {
    if (!code || code.length !== 2 || !/^[a-zA-Z]{2}$/.test(code)) return '';
    const codePoints = code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

function buildPopupHtml(props) {
    const areaHa = formatNumber(props['surface_area_km2'] * 100);
    const verificationChecks = parseListField(props['verification_checks']).filter(Boolean);
    const fields = [
        ['Country', safe(props['country_code'])],
        ['Area', areaHa ? `${areaHa} ha` : ''],
        ['Stage', formatEnum(props['stage'])],
        ['Intervention start', safe(props['intervention_start_date'])],
        ['Intervention type', formatEnum(props['intervention_type'])],
        ['Pre-intervention use', formatEnum(props['pre_intervention_land_use'])],
        ['Post-intervention cover', formatEnum(props['post_intervention_land_cover'])],
    ].filter(([, value]) => value !== '');

    const visibility = (props['site_visibility'] || '').toUpperCase();
    const badges = [];
    if (props['site_type']) badges.push(`<span class="popup-badge">${escapeHtml(formatEnum(props['site_type']))}</span>`);
    if (visibility) badges.push(`<span class="popup-badge${visibility === 'PRIVATE' ? ' visibility-private' : ''}">${escapeHtml(formatEnum(visibility))}</span>`);

    const flag = countryCodeToFlagEmoji(props['country_code']);
    const checkPills = buildVerificationPillsHtml(verificationChecks);
    const photoIds = parseListField(props['photo_ids']).filter(Boolean);
    const photoUrl = photoIds.length && props['id'] ? buildPhotoUrl(props['id'], photoIds[0]) : '';

    return `
        ${photoUrl ? `<img class="popup-photo" src="${escapeHtml(photoUrl)}" alt="">` : ''}
        <div class="popup-title-row">
            <div class="popup-title">${escapeHtml(props['name'] || 'Untitled site')}</div>
            ${flag ? `<span class="popup-flag" title="${escapeHtml(props['country_code'])}">${flag}</span>` : ''}
        </div>
        <div class="popup-badges">${badges.join('')}</div>
        ${checkPills ? `<div class="popup-check-pills">${checkPills}</div>` : ''}
        <dl class="popup-fields">
            ${fields.map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join('')}
        </dl>
    `;
}

function handleVisibilityToggle(event) {
    if (event.target.checked) {
        visibleStatuses.add(event.target.value);
    } else {
        visibleStatuses.delete(event.target.value);
    }
    vector_tile_layer.setStyle(vector_tile_layer.getStyle());
}

const DEFAULT_LOGIN_ICON = `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
`;

function updateLoginButton() {
    const btn = document.getElementById('login-button');
    if (logged_in && current_user) {
        btn.title = `Logged in as ${current_user.email} - click to log out`;
        btn.innerHTML = current_user.photoURL ? `<img src="${current_user.photoURL}" alt="">` : DEFAULT_LOGIN_ICON;
    } else {
        btn.title = 'Login';
        btn.innerHTML = DEFAULT_LOGIN_ICON;
    }
}

function setLoggedIn(value) {
    logged_in = value;
    vector_tile_layer.setVisible(logged_in);
    selection_layer.setVisible(logged_in);
    updateLoginButton();
    document.getElementById('filter-panel').classList.toggle('visible', logged_in);
    if (logged_in) {
        // Clear previously-failed (unauthenticated) loads so they retry now that a token is available
        vector_tile_source.refresh();
    } else {
        vector_tile_source.clear();
    }
}

function logout() {
    current_user = null;
    setLoggedIn(false);
}

async function login_clicked() {
    if (logged_in) {
        logout();
        return;
    }

    const result = await signInWithPopup(auth, provider);

    const whitelistRef = doc(collection(firestore, "site-verify"), "whitelisted_emails");
    const whitelistSnap = await getDoc(whitelistRef);
    const whitelisted = Object.keys(whitelistSnap.data() || {});

    if ((!whitelisted.includes(result.user.email)) && (!result.user.email?.endsWith('restor.eco'))) {
        alert("Access Denied: Your email is not whitelisted.");
        current_user = null;
        logout();
        return;
    }

    current_user = result.user;
    setLoggedIn(true);
}

// Add the mouse move event
map.on(['pointermove'], function (mapEvent) {
    // Get the features which are under the mouse, restricted to the sites layers
    // (otherwise this also picks up basemap features, e.g. roads/boundaries, that
    // happen to carry an 'id' property, causing bogus "Untitled site" popups)
    const features = map.getFeaturesAtPixel(mapEvent.pixel, {
        hitTolerance: 5,
        layerFilter: (layer) => layer === vector_tile_layer || layer === selection_layer,
    });
    // If there are some features
    if (features.length !== 0) {
        // Get the properties
        const props = features[0].getProperties();
        // Set the selection feature id
        selected_feature.current = props['id'];
        // Invalidate the layer so that it repaints
        selection_layer.changed();
        // Set the position of the site popup
        map_popup.setPosition(mapEvent.coordinate);
        var pu = document.getElementById('popup');
        if (props['id'] !== undefined) {
            pu.style.display = "block";
            pu.innerHTML = buildPopupHtml(props);
        } else {
            pu.style.display = "none";
        }
    } else {
        selected_feature.current = undefined;
        selection_layer.changed();
        document.getElementById('popup').style.display = "none";
    }
});

// Show the full verification checks list when a site is clicked
map.on('click', function (mapEvent) {
    const features = map.getFeaturesAtPixel(mapEvent.pixel, {
        hitTolerance: 5,
        layerFilter: (layer) => layer === vector_tile_layer || layer === selection_layer,
    });
    if (features.length !== 0) {
        const props = features[0].getProperties();
        if (props['id'] !== undefined) {
            openChecksModal(props);
        }
    }
});

document.getElementById('checks-modal-close').addEventListener('click', closeChecksModal);
document.getElementById('checks-modal-backdrop').addEventListener('click', function (event) {
    if (event.target === this) closeChecksModal();
});
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeChecksModal();
});

// Update layer style when slider changes
document.getElementById('slider').addEventListener('input', function () {
    document.getElementById('slider-value').innerText = this.value;
    vector_tile_layer.setStyle(vector_tile_layer.getStyle());
});

// Ensure the script runs after the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    let visibilityCheckboxes = document.querySelectorAll("input[name='options']");
    visibilityCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", handleVisibilityToggle);
    });
    document.getElementById('login-button').addEventListener('click', login_clicked);
});