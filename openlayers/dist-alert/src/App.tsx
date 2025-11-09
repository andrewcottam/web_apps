import React, { useState, useEffect, useRef } from "react";

// OpenLayers
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import Polygon from "ol/geom/Polygon";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Draw } from "ol/interaction";
import { fromLonLat, toLonLat } from "ol/proj";
import { apply } from "ol-mapbox-style";
import { Style, Fill, Stroke } from "ol/style";
import { MapBrowserEvent } from 'ol';
import { ScaleLine, defaults as defaultControls } from 'ol/control';
import GeoTIFF from 'ol/source/GeoTIFF';
import WebGLTileLayer from 'ol/layer/WebGLTile';

// Firebase
import { initializeApp } from "firebase/app";
import type { UserCredential } from "firebase/auth";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, getDoc, doc, collection } from "firebase/firestore";

// MUI
import IconButton from "@mui/material/IconButton";
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAzrhJkckakoJLnRThTDvNRwyE29k7DDGQ",
  authDomain: "restor-poc-apps-b3414.firebaseapp.com",
  projectId: "restor-poc-apps-b3414",
  storageBucket: "restor-poc-apps-b3414.appspot.com",
  messagingSenderId: "1043831538397",
  appId: "1:1043831538397:web:50d6c71e135234ef4b9134"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const firestore = getFirestore(app);

// Helper function to parse URL parameters
const getUrlParameters = (): { lat?: number; lng?: number; zoom?: number } => {
  const urlParams = new URLSearchParams(window.location.search);
  const lat = urlParams.get('lat');
  const lng = urlParams.get('lng') || urlParams.get('lon');
  const zoom = urlParams.get('zoom');

  const result: { lat?: number; lng?: number; zoom?: number } = {};

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
};

// Fetch the latest DIST-ALERT COG URL from CMR API
async function fetchLatestDistAlertCOG(lat: number, lon: number): Promise<string | null> {
  try {
    // CMR granule search endpoint
    const cmrUrl = 'https://cmr.earthdata.nasa.gov/search/granules.json';

    // Create bounding box around the point - larger buffer for better coverage
    const buffer = 1.0; // degrees
    const bbox = `${lon - buffer},${lat - buffer},${lon + buffer},${lat + buffer}`;

    const params = new URLSearchParams({
      short_name: 'OPERA_L3_DIST-ALERT-HLS_V1',
      bounding_box: bbox,
      sort_key: '-start_date', // Sort by most recent first
      page_size: '10' // Get more results to find a good one
    });

    const response = await fetch(`${cmrUrl}?${params}`);
    const data = await response.json();

    if (data.feed?.entry?.length > 0) {
      // Try each entry until we find a valid COG URL
      for (const entry of data.feed.entry) {
        // Find the VEG-DIST-STATUS layer COG URL
        const cogLink = entry.links?.find((link: any) =>
          link.href?.includes('VEG-DIST-STATUS') && link.href?.endsWith('.tif')
        );

        if (cogLink) {
          return cogLink.href;
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

const App: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const drawnFeatureRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasDrawnFeature, setHasDrawnFeature] = useState(false);
  const [user, setUser] = useState<UserCredential["user"]>();
  const [logged_in, setLoggedIn] = useState(false);
  const [data, setData] = useState<Record<string, any> | null>(null);
  const drawSourceRef = useRef<VectorSource | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const isDrawingRef = useRef(false);
  const loggedInRef = useRef(logged_in);

  // Dist-alert parameters
  const [siteName, setSiteName] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [minConfidence, setMinConfidence] = useState("confirmed");
  const [minDisturbancePercentage, setMinDisturbancePercentage] = useState(10.0);
  const [debug, setDebug] = useState(false);

  const userRef = useRef<typeof user>(undefined);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    loggedInRef.current = logged_in;
  }, [logged_in]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const draw = drawInteractionRef.current;

    if (!map || !draw) return;

    if (logged_in) {
      map.addInteraction(draw);
    } else {
      map.removeInteraction(draw);
    }
  }, [logged_in]);

  function logout() {
    setLoggedIn(false);
    setUser(undefined);
    isDrawingRef.current = false;
    if (drawSourceRef.current) {
      drawSourceRef.current.clear();
    }
    setData(null);
    drawnFeatureRef.current = null;
    setHasDrawnFeature(false);
  }

  async function login_clicked() {
    if (logged_in) {
      logout();
    } else {
      const result = await signInWithPopup(auth, provider);

      const whitelistRef = doc(collection(firestore, "site-verify"), "whitelisted_emails");
      const whitelistSnap = await getDoc(whitelistRef);
      const whitelisted = Object.keys(whitelistSnap.data() || {});

      if ((!whitelisted.includes(result.user.email!)) && (!result.user.email?.endsWith('restor.eco'))) {
        alert("Access Denied: Your email is not whitelisted.");
        logout();
        return;
      }

      setUser(result.user);
      setLoggedIn(true);
    }
  }

  const analyzeDisturbance = async () => {
    if (!drawnFeatureRef.current || !userRef.current) return;

    setIsLoading(true);
    try {
      const geometry = drawnFeatureRef.current.getGeometry() as Polygon;
      const geometry4326 = geometry.clone().transform("EPSG:3857", "EPSG:4326");

      // Convert to coordinate array format expected by backend
      const coordinates = geometry4326.getCoordinates()[0]; // Get outer ring coordinates
      const geometryArray = coordinates.map(coord => [coord[0], coord[1]]);

      const idToken = await userRef.current.getIdToken();

      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const endpoint = isLocalhost
        ? "http://127.0.0.1:8080/opera-dist-alert"
        : "https://europe-west6-restor-gis.cloudfunctions.net/dist_alert";

      const requestBody: Record<string, any> = {
        geometry: geometryArray,
        start_date: startDate,
        end_date: endDate,
        min_confidence: minConfidence,
        min_disturbance_percentage: minDisturbancePercentage,
        debug: debug
      };

      // Add site name if provided
      if (siteName) requestBody.site_name = siteName;

      // Use hardcoded default values
      requestBody.site_id = "#123ABC";
      requestBody.report_org = "Restor";

      // Get user info from Firebase authenticated user
      if (userRef.current) {
        if (userRef.current.displayName) {
          requestBody.report_owner_name = userRef.current.displayName;
        }
        if (userRef.current.email) {
          requestBody.report_owner_email = userRef.current.email;
        }
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);

    } catch (error) {
      console.error('Error analyzing disturbance:', error);
      alert('Failed to analyze disturbance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const vectorSource = new VectorSource();
    drawSourceRef.current = vectorSource;
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        fill: new Fill({ color: "rgba(255, 165, 0, 0.3)" }),
        stroke: new Stroke({ color: "#ff9800", width: 2 }),
      }),
    });

    const scaleLineControl = new ScaleLine({
      units: 'metric',
    });

    const urlParams = getUrlParameters();
    let initialCenter = fromLonLat([118.187211, 5.770305]);
    let initialZoom = 16;

    if (urlParams.lat !== undefined && urlParams.lng !== undefined) {
      initialCenter = fromLonLat([urlParams.lng, urlParams.lat]);
    }

    if (urlParams.zoom !== undefined) {
      initialZoom = urlParams.zoom;
    }

    const map = new Map({
      target: mapRef.current,
      view: new View({
        center: initialCenter,
        zoom: initialZoom,
      }),
      controls: defaultControls().extend([scaleLineControl]),
      layers: [],
    });

    const coordsDiv = document.getElementById('coords') as HTMLDivElement;

    const styleJson = "https://api.maptiler.com/maps/hybrid/style.json?key=67VOA297U9cciigsJVvm";

    apply(map, styleJson).then(async () => {
      // Add the DIST-ALERT COG layer
      const cogUrl = await fetchLatestDistAlertCOG(5.770305, 118.187211);

      if (cogUrl) {
        try {
          const cogSource = new GeoTIFF({
            sources: [{ url: cogUrl }],
            normalize: false,
          });

          const cogLayer = new WebGLTileLayer({
            source: cogSource,
            style: {
              color: [
                'case',
                ['==', ['band', 1], 0], // If band value is 0
                ['color', 0, 0, 0, 0],   // Make it transparent
                ['color', 255, 0, 0, 0.7] // Otherwise red with opacity
              ],
            },
          });

          map.addLayer(cogLayer);
        } catch (error) {
          // Silent fail - COG layer is optional
        }
      }

      map.addLayer(vectorLayer);
    });

    mapInstanceRef.current = map;

    drawInteractionRef.current = new Draw({
      source: vectorSource,
      type: "Polygon",
    });

    drawInteractionRef.current.on("drawstart", () => {
      isDrawingRef.current = true;
      if (drawSourceRef.current) {
        drawSourceRef.current.clear();
      }
      setData(null);
      setHasDrawnFeature(false);
    });

    drawInteractionRef.current.on("drawend", async (event) => {
      isDrawingRef.current = false;
      const feature = event.feature;
      drawnFeatureRef.current = feature;
      setHasDrawnFeature(true);
    });

    drawInteractionRef.current.on("drawabort", () => {
      isDrawingRef.current = false;
    });

    map.on('pointermove', (evt: MapBrowserEvent<any>) => {
      const lonLat = toLonLat(evt.coordinate);
      coordsDiv.innerText = `Lon: ${lonLat[0].toFixed(4)}, Lat: ${lonLat[1].toFixed(4)}`;
    });

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  return (
    <div>
      <div
        ref={mapRef}
        style={{ position: "absolute", top: 20, left: 20, bottom: 20, right: 420 }}
      />
      <div id="coords">Move cursor to see coordinates</div>

      <div className="panel">
        <div id="fixed-column">
          <IconButton
            onClick={login_clicked}
            title={logged_in
              ? `Logged in as ${user?.email} - click to Log out`
              : "Login"}
          >
            <Avatar alt="Google Photo" src={user?.photoURL!} />
          </IconButton>
        </div>

        {logged_in && (
          <div className="panel-content">
            <h1>OPERA DIST-ALERT</h1>
            <h2>Vegetation Disturbance Analysis</h2>

            <p style={{ fontSize: "13px", color: "#666", margin: "10px 0" }}>
              Draw a polygon on the map to analyze vegetation disturbance
            </p>

            {isLoading && (
              <div style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <div style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid #f3f3f3",
                  borderTop: "2px solid #3498db",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }}></div>
                <span>Analyzing disturbance...</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <TextField
                label="Site Name"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                size="small"
                fullWidth
              />

              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                select
                label="Minimum Confidence"
                value={minConfidence}
                onChange={(e) => setMinConfidence(e.target.value)}
                size="small"
                fullWidth
              >
                <MenuItem value="initial">Initial</MenuItem>
                <MenuItem value="provisional">Provisional</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
              </TextField>

              <TextField
                label="Min Disturbance Percentage"
                type="number"
                value={minDisturbancePercentage}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setMinDisturbancePercentage(isNaN(value) ? 0 : value);
                }}
                size="small"
                fullWidth
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={debug}
                    onChange={(e) => setDebug(e.target.checked)}
                  />
                }
                label="Debug Mode"
              />

              <Button
                variant="contained"
                color="primary"
                onClick={analyzeDisturbance}
                disabled={!hasDrawnFeature || isLoading || !siteName.trim()}
                fullWidth
              >
                Analyse Disturbance
              </Button>
            </div>

            {data && (
              <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
                <h3>Results</h3>

                {data.response?.disturbance_analysis && (
                  <div style={{ marginBottom: "10px" }}>
                    <h4 style={{
                      color: data.response.disturbance_analysis.disturbance_flagged ? "#d32f2f" : "#388e3c"
                    }}>
                      {data.response.disturbance_analysis.disturbance_flagged
                        ? "⚠️ DISTURBANCE DETECTED"
                        : "✓ No Significant Disturbance"}
                    </h4>

                    <div style={{ fontSize: "12px", marginTop: "8px" }}>
                      <p style={{ margin: "4px 0" }}><strong>Disturbed Area:</strong> {data.response.disturbance_analysis.overall.disturbed_area.toFixed(2)} ha</p>
                      <p style={{ margin: "4px 0" }}><strong>Total Area:</strong> {data.response.disturbance_analysis.overall.total_area.toFixed(2)} ha</p>
                      <p style={{ margin: "4px 0" }}><strong>Disturbance:</strong> {data.response.disturbance_analysis.overall.disturbed_percentage.toFixed(2)}%</p>
                      {data.response.disturbance_analysis.min_disturbance_date && (
                        <p style={{ margin: "4px 0" }}><strong>First Detected:</strong> {data.response.disturbance_analysis.min_disturbance_date}</p>
                      )}
                    </div>
                  </div>
                )}

                {data.response?.report && (
                  <div style={{ marginTop: "10px", padding: "8px", backgroundColor: "#e3f2fd", borderRadius: "4px" }}>
                    <h4>Report Generated</h4>
                    <p style={{ fontSize: "12px", margin: "4px 0" }}>
                      <a href={data.response.report.authenticated_url} target="_blank" rel="noopener noreferrer">
                        View Detailed Report
                      </a>
                    </p>
                  </div>
                )}

                {data.response?.email?.sent && (
                  <div style={{ marginTop: "10px", padding: "8px", backgroundColor: "#e8f5e9", borderRadius: "4px" }}>
                    <h4>Email Sent</h4>
                    <p style={{ fontSize: "12px", margin: "4px 0" }}>
                      Notification sent to: {Array.isArray(data.response.email.to) ? data.response.email.to.join(', ') : data.response.email.to}
                    </p>
                  </div>
                )}

                <details style={{ marginTop: "10px" }}>
                  <summary style={{ cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>View Full Response</summary>
                  <pre style={{
                    fontSize: "10px",
                    overflow: "auto",
                    maxHeight: "300px",
                    backgroundColor: "#fff",
                    padding: "8px",
                    borderRadius: "4px",
                    marginTop: "8px"
                  }}>
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
