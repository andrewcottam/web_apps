import React, { useState, useEffect, useRef } from "react";

// OpenLayers
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import Polygon from "ol/geom/Polygon";
import MultiPolygon from "ol/geom/MultiPolygon";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Draw } from "ol/interaction";
import { fromLonLat, toLonLat, transformExtent } from "ol/proj";
import { apply } from "ol-mapbox-style";
import { Style, Fill, Stroke } from "ol/style";
import { MapBrowserEvent } from 'ol';
import { ScaleLine, defaults as defaultControls } from 'ol/control';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import GeoJSON from 'ol/format/GeoJSON';
import type { FeatureLike } from "ol/Feature";
import RenderFeature, { toGeometry } from 'ol/render/Feature';

// FlatGeobuf
import { deserialize as fgbDeserialize } from 'flatgeobuf/lib/mjs/geojson';

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
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';

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


const useFgb = new URLSearchParams(window.location.search).get('tiles') === 'fgb';

const FGB_PROXY_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8082/fgb_proxy'
  : 'https://europe-west6-restor-gis.cloudfunctions.net/fgb_proxy';

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
  const sitesLayerRef = useRef<VectorTileLayer | VectorLayer | null>(null);
  const fgbSourceRef = useRef<VectorSource | null>(null);
  const [selectedSiteFeature, setSelectedSiteFeature] = useState<any>(null);
  const selectedSiteFeatureRef = useRef<any>(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  // Dist-alert parameters
  const [siteName, setSiteName] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [debug, setDebug] = useState(false);
  const [light, setLight] = useState(false);
  const [useMpc, setUseMpc] = useState(true);

  const userRef = useRef<typeof user>(undefined);
  const siteNameRef = useRef(siteName);
  const startDateRef = useRef(startDate);
  const endDateRef = useRef(endDate);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    loggedInRef.current = logged_in;
    // Control sites layer visibility based on login state
    if (sitesLayerRef.current) {
      sitesLayerRef.current.setVisible(logged_in);
    }
  }, [logged_in]);

  useEffect(() => {
    siteNameRef.current = siteName;
  }, [siteName]);

  useEffect(() => {
    startDateRef.current = startDate;
  }, [startDate]);

  useEffect(() => {
    endDateRef.current = endDate;
  }, [endDate]);

  useEffect(() => {
    selectedSiteFeatureRef.current = selectedSiteFeature;
    // Trigger re-render of sites layer when selection changes
    if (sitesLayerRef.current) {
      sitesLayerRef.current.changed();
    }
  }, [selectedSiteFeature]);

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

  // Track Ctrl key state for cursor changes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.ctrlKey) {
        setIsCtrlPressed(true);
      }
      if (e.key === 'Escape' && isDrawingRef.current && drawInteractionRef.current) {
        drawInteractionRef.current.abortDrawing();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || !e.ctrlKey) {
        setIsCtrlPressed(false);
      }
    };

    // Handle window blur to reset Ctrl state
    const handleBlur = () => {
      setIsCtrlPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

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

  const handleSiteClick = async (feature: FeatureLike) => {
    // Extract site name from feature properties
    const name = feature.get('name') || feature.get('site_name') || feature.get('title') || '';
    if (name) {
      setSiteName(name);
    }

    // Extract geometry from vector tile feature
    let geometry;

    if (feature instanceof RenderFeature) {
      // toGeometry correctly returns Polygon or MultiPolygon based on inflateEnds
      geometry = toGeometry(feature);
    } else {
      const f = feature as any;
      if (f.getGeometry && typeof f.getGeometry === 'function') {
        geometry = f.getGeometry();
      } else {
        return;
      }
    }

    if (!geometry) {
      return;
    }

    // Create a feature with the geometry and store it
    const Feature = (await import('ol/Feature')).default;
    const newFeature = new Feature({ geometry });
    drawnFeatureRef.current = newFeature;
    setHasDrawnFeature(true);

  };

  const analyzeDisturbance = async () => {
    if (!drawnFeatureRef.current || !userRef.current) return;

    setIsLoading(true);
    setData(null); // Clear previous results
    try {
      const geometry = drawnFeatureRef.current.getGeometry();
      const geometry4326 = geometry!.clone().transform("EPSG:3857", "EPSG:4326") as Polygon | MultiPolygon;

      // Convert to coordinate array format expected by backend
      let geometryArray: number[][] | number[][][];
      if (geometry4326 instanceof MultiPolygon) {
        // MultiPolygon: send each polygon's outer ring as an array of coordinate arrays
        geometryArray = geometry4326.getPolygons().map(poly =>
          poly.getCoordinates()[0].map((coord: number[]) => [coord[0], coord[1]])
        );
      } else {
        // Single polygon: send outer ring coordinates
        const coordinates = (geometry4326 as Polygon).getCoordinates()[0];
        geometryArray = coordinates.map((coord: number[]) => [coord[0], coord[1]]);
      }

      const idToken = await userRef.current.getIdToken();

      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const endpoint = isLocalhost
        ? "http://127.0.0.1:8081/dist-alert"
        : "https://europe-west6-restor-gis.cloudfunctions.net/dist-alert";

      const requestBody: Record<string, any> = {
        geometry: geometryArray,
        start_date: startDateRef.current,
        end_date: endDateRef.current,
        debug: debug,
        create_report: true,
        send_email: true
      };

      // Add light mode if enabled
      if (light) requestBody['dist_alert_light'] = true;

      // Add landsat source
      requestBody['landsat_source'] = useMpc ? 'mpc' : 'nasa';

      // Add site name if provided
      if (siteName) requestBody.site_name = siteName;

      // Use the selected Restor site's id if one is selected, otherwise fall back to a default
      requestBody.site_id = selectedSiteFeatureRef.current
        ? selectedSiteFeatureRef.current.get('id')
        : "#123ABC";
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
        let errorMessage = `API call failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // If we can't parse the error as JSON, use the status text
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setData(result);

    } catch (error) {
      console.error('Error analyzing disturbance:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to analyze disturbance:\n\n${errorMessage}`);
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

    map.on('moveend', () => {
      const view = map.getView();
      const center = toLonLat(view.getCenter()!);
      const zoom = view.getZoom()!;
      const params = new URLSearchParams(window.location.search);
      params.set('lng', center[0].toFixed(6));
      params.set('lat', center[1].toFixed(6));
      params.set('zoom', zoom.toFixed(2));
      window.history.replaceState(null, '', `?${params.toString()}`);
    });

    const coordsDiv = document.getElementById('coords') as HTMLDivElement;

    const styleJson = "https://api.maptiler.com/maps/hybrid/style.json?key=67VOA297U9cciigsJVvm";

    apply(map, styleJson).then(() => {
      const styleCache: Record<string, Style> = Object.create(null);
      function styleForVisibility(feature: FeatureLike): Style | undefined {
        const siteType = feature.get('site_type');
        if (siteType !== 'RESTORATION' && siteType !== 'CONSERVATION') return undefined;
        if (!useFgb) {
          const area = Number(feature.get('surface_area_km2'));
          if (Number.isFinite(area) && area > 1000) return undefined;
        }
        const key = String(feature.get('site_visibility') ?? 'unknown').toLowerCase();
        if (styleCache[key]) return styleCache[key];

        const styles = {
          public: {
            stroke: new Stroke({ color: 'rgba(244,97,97,0.9)', width: 2 }),
            fill: new Fill({ color: 'rgba(97,97,97,0.05)' }),
          },
          private: {
            stroke: new Stroke({ color: 'rgba(244,97,97,0.9)', width: 2, lineDash: [2, 6] }),
            fill: new Fill({ color: 'rgba(97,97,97,0.05)' }),
          },
          unknown: {
            stroke: new Stroke({ color: 'rgba(244,67,54,0.6)', width: 2 }),
            fill: new Fill({ color: 'rgba(244,67,54,0.05)' }),
          },
        } as const;

        const def = styles[key as keyof typeof styles] ?? styles.unknown;
        const style = new Style({ stroke: def.stroke, fill: def.fill });
        styleCache[key] = style;
        return style;
      }

      function siteStyle(feature: FeatureLike): Style | undefined {
        const selectedFeature = selectedSiteFeatureRef.current;
        const isSelected = selectedFeature && feature.get('id') === selectedFeature.get('id');
        if (isSelected) {
          return new Style({
            stroke: new Stroke({ color: 'rgba(255, 215, 0, 1)', width: 4 }),
            fill: new Fill({ color: 'rgba(255, 215, 0, 0.3)' }),
          });
        }
        return styleForVisibility(feature);
      }

      let sites_layer: VectorTileLayer | VectorLayer;

      if (useFgb) {
        const fgbSource = new VectorSource({ strategy: bboxStrategy });
        fgbSourceRef.current = fgbSource;

        const geoJsonFormat = new GeoJSON();
        fgbSource.setLoader(async function (extent, _resolution, projection, success, failure): Promise<any> {
          if (!userRef.current) {
            fgbSource.removeLoadedExtent(extent);
            return;
          }
          try {
            const [minX, minY, maxX, maxY] = transformExtent(extent, projection, 'EPSG:4326');
            const rect = { minX, minY, maxX, maxY };
            const idToken = await userRef.current.getIdToken();
            const headers = { 'Authorization': `Bearer ${idToken}` };
            console.log('[fgb] loading extent, token length:', idToken.length);

            const features: any[] = [];
            for await (const geoJsonFeature of fgbDeserialize(`${FGB_PROXY_URL}?source=sites`, rect, undefined, false, headers)) {
              const olFeature = geoJsonFormat.readFeature(geoJsonFeature as any, {
                featureProjection: projection,
                dataProjection: 'EPSG:4326',
              });
              features.push(olFeature);
            }
            fgbSource.addFeatures(features);
            success?.(features);
          } catch (e) {
            console.error('FGB load error:', e);
            failure?.();
            fgbSource.removeLoadedExtent(extent);
          }
        });

        sites_layer = new VectorLayer({
          source: fgbSource,
          minZoom: 10,
          visible: false,
          style: siteStyle,
        });
      } else {
        const sites_endpoint = "https://europe-west6-restor-gis.cloudfunctions.net/mvt_tile_server_secure/tiles/{z}/{x}/{y}.pbf?source=sites";
        const sites_source = new VectorTileSource({ format: new MVT(), url: sites_endpoint });

        sites_layer = new VectorTileLayer({
          source: sites_source,
          minZoom: 10,
          visible: false,
          style: siteStyle,
        });
      }

      map.addLayer(sites_layer);
      sitesLayerRef.current = sites_layer;

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

    // Handle Ctrl+click on sites layer to use site geometry
    map.on('click', (evt: MapBrowserEvent) => {
      // Only handle site selection if Ctrl key is pressed and user is logged in
      if (!evt.originalEvent.ctrlKey || !loggedInRef.current) {
        return;
      }

      let clickedFeature: FeatureLike | null = null;
      map.forEachFeatureAtPixel(evt.pixel, function (feature: FeatureLike, layer) {
        // Only look for features in the sites layer
        if (layer === sitesLayerRef.current) {
          clickedFeature = feature;
          return true; // Stop iteration
        }
      });

      if (clickedFeature) {
        setSelectedSiteFeature(clickedFeature);
        // Clear drawn polygons when selecting a site
        if (drawSourceRef.current) {
          drawSourceRef.current.clear();
        }
        drawnFeatureRef.current = null;
        setHasDrawnFeature(false);

        // Extract geometry from vector tile feature
        handleSiteClick(clickedFeature);

        // Prevent the click from propagating
        evt.stopPropagation();
      } else {
        // Clear selection if clicking elsewhere with Ctrl
        setSelectedSiteFeature(null);
      }
    });

    map.on('pointermove', (evt: MapBrowserEvent<any>) => {
      const lonLat = toLonLat(evt.coordinate);
      coordsDiv.innerText = `Lon: ${lonLat[0].toFixed(4)}, Lat: ${lonLat[1].toFixed(4)}`;
      const popup = document.getElementById('popup') as HTMLDivElement;

      // Only show popup if user is logged in and not drawing
      if (isDrawingRef.current || !loggedInRef.current) {
        popup.style.display = 'none';
        return;
      }

      let found = false;
      map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
        // Check if this is a site feature
        if (layer === sitesLayerRef.current) {
          const props = feature.getProperties() || {};
          const name = props.name || props.site_name || props.title;
          if (name) {
            const color = 'rgb(244,97,97)';
            popup.innerHTML = `<span style="color:${color}">${name}</span>`;
            popup.style.left = `${evt.pixel[0] + 30}px`;
            popup.style.top = `${evt.pixel[1] + 30}px`;
            popup.style.display = 'block';
            found = true;
            return true; // Stop iteration
          }
        }
      });

      if (!found) {
        popup.style.display = 'none';
      }
    });

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  // Determine cursor style based on Ctrl key state and conditions
  const shouldShowSelectionCursor = isCtrlPressed && logged_in;

  // Helper function to determine disturbance severity
  const getDisturbanceSeverity = (percentage: number) => {
    if (percentage === 0) {
      return {
        message: "✓ No Disturbance Detected",
        color: "#388e3c", // Green
        emoji: "✓"
      };
    } else if (percentage > 0 && percentage <= 10) {
      return {
        message: "⚠️ Low Severity Disturbance",
        color: "#f9a825", // Yellow
        emoji: "⚠️"
      };
    } else if (percentage > 10 && percentage <= 20) {
      return {
        message: "🟠 Medium Severity Disturbance",
        color: "#ff6f00", // Orange
        emoji: "🟠"
      };
    } else {
      return {
        message: "🔴 High Severity Disturbance",
        color: "#d32f2f", // Red
        emoji: "🔴"
      };
    }
  };

  return (
    <div>
      <div
        ref={mapRef}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          bottom: 20,
          right: 420,
          cursor: shouldShowSelectionCursor ? 'crosshair' : 'default'
        }}
      />
      <div id="coords">Move cursor to see coordinates</div>

      <div
        id="popup"
        style={{
          position: "absolute",
          backgroundColor: "#fffd",
          padding: "4px 8px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          display: "none",
          pointerEvents: "none",
          zIndex: 1000
        }}
      ></div>

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

              <FormControlLabel
                control={
                  <Checkbox
                    checked={light}
                    onChange={(e) => setLight(e.target.checked)}
                  />
                }
                label="Light"
              />

              {user?.email === 'a.cottam@gmail.com' && (
                <>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={useMpc}
                        onChange={(e) => setUseMpc(e.target.checked)}
                      />
                    }
                    label="Use MPC"
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={debug}
                        onChange={(e) => setDebug(e.target.checked)}
                      />
                    }
                    label={
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        Debug Mode
                        <Tooltip title="Enabling Debug Mode logs debug statements in the Cloud Function">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.54)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'default', flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="16" x2="12" y2="12"/>
                            <line x1="12" y1="8" x2="12.01" y2="8"/>
                          </svg>
                        </Tooltip>
                      </span>
                    }
                  />
                </>
              )}

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

                {data.response?.disturbance_analysis && (() => {
                  const percentage = data.response.disturbance_analysis.overall.disturbed_percentage;
                  const noGranules = data.response?.metadata?.no_granules_found === true;
                  const severity = noGranules
                    ? { message: "⚠ No Data Available", color: "#757575" }
                    : getDisturbanceSeverity(percentage);

                  return (
                    <div style={{ marginBottom: "10px" }}>
                      <h4 style={{ color: severity.color }}>
                        {severity.message}
                      </h4>
                      {noGranules && (
                        <p style={{ fontSize: "12px", color: "#757575", margin: "4px 0" }}>
                          No satellite scenes are available for this monitoring period, or DIST-ALERT granules have not yet been produced.
                        </p>
                      )}

                      <div style={{ fontSize: "12px", marginTop: "8px" }}>
                        <p style={{ margin: "4px 0" }}><strong>Disturbed Area:</strong> {data.response.disturbance_analysis.overall.disturbed_area.toFixed(2)} ha</p>
                        <p style={{ margin: "4px 0" }}><strong>Total Area:</strong> {data.response.disturbance_analysis.overall.total_area.toFixed(2)} ha</p>
                        <p style={{ margin: "4px 0" }}><strong>Disturbance:</strong> {data.response.disturbance_analysis.overall.disturbed_percentage.toFixed(2)}%</p>
                        {data.response.disturbance_analysis.min_disturbance_date && (
                          <p style={{ margin: "4px 0" }}><strong>First Detected:</strong> {data.response.disturbance_analysis.min_disturbance_date}</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {data.response?.report && !data.response?.metadata?.no_granules_found && (
                  <div style={{ marginTop: "10px", padding: "8px", backgroundColor: "#e3f2fd", borderRadius: "4px" }}>
                    <h4>Report Generated</h4>
                    <p style={{ fontSize: "12px", margin: "4px 0" }}>
                      <a href={data.response.report.public_url} target="_blank" rel="noopener noreferrer">
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
        <div style={{ padding: '4px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '9px', color: '#ccc', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
          {__GIT_SHA__}
        </div>
      </div>
    </div>
  );
};

export default App;
