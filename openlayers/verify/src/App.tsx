import React, { useState, useEffect, useRef } from "react";
import osmtogeojson from "osmtogeojson";

// OpenLayers
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import Polygon from "ol/geom/Polygon";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Draw } from "ol/interaction";
import { fromLonLat } from "ol/proj";
import { apply } from "ol-mapbox-style";
import { Style, Circle as CircleStyle, Fill, Stroke } from "ol/style";
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';
import WKT from 'ol/format/WKT';
import TileLayer from 'ol/layer/Tile';
import TileDebug from 'ol/source/TileDebug';
import { toLonLat } from 'ol/proj';
import { MapBrowserEvent } from 'ol';
import { createXYZ } from 'ol/tilegrid';
import { ScaleLine, defaults as defaultControls } from 'ol/control';

// Firebase
import { initializeApp } from "firebase/app";
import type { UserCredential } from "firebase/auth";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, getDoc, doc, collection } from "firebase/firestore";

// MUI
import IconButton from "@mui/material/IconButton";
import Avatar from '@mui/material/Avatar';

// Components
import JsonViewer from "./components/JsonViewer";

// Types
import { CheckStatus } from "./types/Enums";
import CheckDiv from "./components/CheckDiv";
import type { Check } from "./types/Check";
import type { FeatureLike } from "ol/Feature";

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

const App: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const drawnFeatureRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [user, setUser] = useState<UserCredential["user"]>();
  const [logged_in, setLoggedIn] = useState(false);
  const [data, setData] = useState<Record<string, any>>({});
  const [selectedTab, setSelectedTab] = useState("Checks");
  const [includeLandCover, setIncludeLandCover] = useState(true);
  const [includeOSM, setIncludeOSM] = useState(false);
  const [includeWDPA, setIncludeWDPA] = useState(true);
  const [includeSites, setIncludeSites] = useState(true);
  const [checkStatuses, setCheckStatuses] = useState<Record<string, CheckStatus>>({});
  const [selectedSiteFeature, setSelectedSiteFeature] = useState<any>(null);
  const selectedSiteFeatureRef = useRef<any>(null);
  const drawSourceRef = useRef<VectorSource | null>(null);
  const osmLayerRef = useRef<VectorLayer | null>(null);
  const wdpaLayerRef = useRef<VectorTileLayer | null>(null);
  const sitesLayerRef = useRef<VectorTileLayer | null>(null);
  const includeLandCoverRef = useRef(includeLandCover);
  const includeOSMRef = useRef(includeOSM);
  const includeWDPARef = useRef(includeWDPA);
  const includeSitesRef = useRef(includeSites);
  const drawInteractionRef = useRef<Draw | null>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const isDrawingRef = useRef(false);
  const loggedInRef = useRef(logged_in);

  // Update the ref when selectedSiteFeature changes
  useEffect(() => {
    selectedSiteFeatureRef.current = selectedSiteFeature;
  }, [selectedSiteFeature]);
  useEffect(() => {
    includeLandCoverRef.current = includeLandCover;
    includeOSMRef.current = includeOSM;
    includeWDPARef.current = includeWDPA;
    includeSitesRef.current = includeSites;
  }, [includeLandCover, includeOSM, includeWDPA, includeSites]);
  useEffect(() => {
    loggedInRef.current = logged_in;
  }, [logged_in]);
  useEffect(() => {
    // If the selected tab is now hidden due to checkbox changes, revert to "Checks"
    if (
      (selectedTab === "Land Cover" && !includeLandCover) ||
      (selectedTab === "OSM" && !includeOSM) ||
      (selectedTab === "WDPA" && !includeWDPA) ||
      (selectedTab === "Sites" && !includeSites)
    ) {
      setSelectedTab("Checks");
    }
  }, [includeLandCover, includeOSM, includeWDPA, includeSites]);

  const userRef = useRef<typeof user>(undefined);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (wdpaLayerRef.current) {
      wdpaLayerRef.current.setVisible(includeWDPA);
    }
  }, [includeWDPA]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove layers if they already exist
    if (wdpaLayerRef.current) {
      map.removeLayer(wdpaLayerRef.current);
      wdpaLayerRef.current = null;
    }
    if (sitesLayerRef.current) {
      map.removeLayer(sitesLayerRef.current);
      sitesLayerRef.current = null;
    }

    if (!logged_in) return;

    var isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    isLocalhost = false;
    // ----- WDPA LAYER -----
    const wdpa_endpoint = isLocalhost
      ? "http://127.0.0.1:8080/tiles/{z}/{x}/{y}.pbf?source=wdpa"
      : "https://europe-west6-restor-gis.cloudfunctions.net/mvt_tile_server_secure/tiles/{z}/{x}/{y}.pbf?source=wdpa";

    // Updated style function to filter out IUCN_CAT "V"
    const wdpa_style_function = (feature: FeatureLike) => {
      // Check if IUCN_CAT is "V" and hide the feature if it is
      const iucnCat = feature.get('IUCN_CAT');
      if (iucnCat === 'V') {
        return undefined; // This hides the feature
      }

      // Return the normal style for all other features
      return new Style({
        fill: new Fill({ color: 'rgba(99, 148, 69, 0.2)' }),
        stroke: new Stroke({ color: [99, 148, 69, 0.3], width: 1 }),
      });
    };
    const wdpa_source = new VectorTileSource({ format: new MVT(), url: wdpa_endpoint });
    const wdpa_layer = new VectorTileLayer({
      source: wdpa_source,
      style: wdpa_style_function,  // Use the function instead of the static style
      minZoom: 10
    });
    map.addLayer(wdpa_layer);
    wdpaLayerRef.current = wdpa_layer;

    // ----- SITES LAYER -----
    const sites_endpoint = isLocalhost
      ? "http://127.0.0.1:8080/tiles/{z}/{x}/{y}.pbf?source=sites"
      : "https://europe-west6-restor-gis.cloudfunctions.net/mvt_tile_server_secure/tiles/{z}/{x}/{y}.pbf?source=sites";

    const sites_source = new VectorTileSource({ format: new MVT(), url: sites_endpoint });

    const styleCache: Record<string, Style> = Object.create(null);
    function styleForVisibility(feature: FeatureLike): Style | undefined {
      const area = Number(feature.get('surface_area_km2'));
      if (Number.isFinite(area) && area > 1000) return undefined;

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

    const sites_layer = new VectorTileLayer({
      source: sites_source,  // ← This was missing!
      minZoom: 10,          // ← This was missing!
      style: (feature) => {
        const baseStyle = styleForVisibility(feature);

        // Check if this feature is selected
        const selectedFeature = selectedSiteFeatureRef.current;
        const isSelected = selectedFeature &&
          feature.get('id') === selectedFeature.get('id');

        if (isSelected) {
          // Create highlighted style
          return new Style({
            stroke: new Stroke({
              color: 'rgba(255, 215, 0, 1)', // Gold color for selection
              width: 4
            }),
            fill: new Fill({
              color: 'rgba(255, 215, 0, 0.3)' // Semi-transparent gold fill
            }),
          });
        }

        return baseStyle;
      },
    });


    map.addLayer(sites_layer);
    sitesLayerRef.current = sites_layer;

  }, [logged_in]);

  useEffect(() => {
    if (sitesLayerRef.current) {
      sitesLayerRef.current.setVisible(includeSites);
    }
  }, [includeSites]);

  useEffect(() => {
    if (osmLayerRef.current) {
      osmLayerRef.current.setVisible(includeOSM);
    }
  }, [includeOSM]);

  const overallStatus: CheckStatus = Object.values(checkStatuses).includes(CheckStatus.Invalid)
    ? CheckStatus.Invalid
    : Object.values(checkStatuses).includes(CheckStatus.NeedsReview)
      ? CheckStatus.NeedsReview
      : CheckStatus.Valid;

  useEffect(() => {
    if (!drawnFeatureRef.current) return;

    const getColor = () => {
      switch (overallStatus) {
        case CheckStatus.Valid:
          return "rgba(0, 255, 0, 0.4)"; // Green
        case CheckStatus.NeedsReview:
          return "rgba(255, 165, 0, 0.4)"; // Orange
        case CheckStatus.Invalid:
          return "rgba(255, 0, 0, 0.4)"; // Red
        default:
          return "rgba(255, 255, 255, 0.4)"; // Default white
      }
    };

    drawnFeatureRef.current.setStyle(
      new Style({
        fill: new Fill({ color: getColor() }),
        stroke: new Stroke({ color: "#888", width: 2 }),
      })
    );
  }, [overallStatus]);

  // Add this helper function to force layer re-render when selection changes
  const refreshSitesLayer = () => {
    if (sitesLayerRef.current) {
      sitesLayerRef.current.getSource()?.refresh();
    }
  };
  useEffect(() => {
    refreshSitesLayer();
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

  function logout() {
    setLoggedIn(false);
    setUser(undefined);
    setIsDrawing(false);
    isDrawingRef.current = false;
    // Clear drawn features
    if (drawSourceRef.current) {
      drawSourceRef.current.clear();
    }

    // Also clear OSM overlays if they exist
    if (osmLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(osmLayerRef.current);
      osmLayerRef.current = null;
    }

    setData({});
    setCheckStatuses({});
    drawnFeatureRef.current = null;
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

  // Replace your verifySiteFeature function with this updated version:
  const verifySiteFeature = async (feature: FeatureLike) => {
    if (!userRef.current) return;
    // Set loading to true at the start
    setIsLoading(true);

    try {
      // For vector tile features (RenderFeature), reconstruct geometry from flatCoordinates_
      let geometry;

      const renderFeature = feature as any;

      if (renderFeature.flatCoordinates_ && renderFeature.ends_) {
        // RenderFeature has flatCoordinates_ and ends_ properties
        const flatCoords = renderFeature.flatCoordinates_;
        const ends = renderFeature.ends_;
        const stride = renderFeature.stride_ || 2; // Usually 2 for [x, y]

        // Convert flat coordinates to coordinate rings
        const rings = [];
        let start = 0;

        for (let i = 0; i < ends.length; i++) {
          const end = ends[i];
          const ring = [];

          for (let j = start; j < end; j += stride) {
            ring.push([flatCoords[j], flatCoords[j + 1]]);
          }

          rings.push(ring);
          start = end;
        }

        // Create polygon geometry
        geometry = new Polygon(rings);

      } else if (renderFeature.getGeometry && typeof renderFeature.getGeometry === 'function') {
        // Try regular geometry access
        geometry = renderFeature.getGeometry();
      } else {
        console.error('Cannot access geometry from this feature type');
        console.log('Available properties:', Object.keys(renderFeature));
        return;
      }

      if (!geometry) {
        console.error('Feature has no geometry');
        return;
      }

      // Transform geometry to WGS84 and convert to WKT
      const geometry4326 = geometry.clone().transform("EPSG:3857", "EPSG:4326");
      const wkt = new WKT().writeGeometry(geometry4326);

      // Get auth token
      const idToken = await userRef.current.getIdToken();

      // Determine endpoint
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const endpoint = isLocalhost
        ? "http://localhost:8080"
        : "https://europe-west6-restor-gis.cloudfunctions.net/verify_site";

      // Build config based on current checkbox states
      const configList = [];
      if (includeLandCoverRef.current) {
        configList.push("landcover");
      }
      if (includeOSMRef.current) {
        configList.push("osm");
      }
      if (includeWDPARef.current) {
        configList.push("wdpa");
      }
      if (includeSitesRef.current) {
        configList.push("sites");
      }
      // Add this line:
      configList.push("profile_completeness");
      // Get feature properties
      const properties = renderFeature.properties_ || {};

      // Make API call with both geometry and properties
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          site_data: {
            geometry: wkt,
            ...properties  // Spread all properties into site_data
          },
          config: {
            optional_metrics: configList,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update UI with verification results
      setCheckStatuses({});
      setData(result.results);

      // Handle OSM overlay if enabled
      if (includeOSMRef.current) {
        const best_feature = (result.results.osm && result.results.osm.features && result.results.osm.best_feature);
        if (best_feature) {
          const overpassQuery = `${best_feature.type}(${best_feature.id});`;
          const fullQuery = `[out:json];(${overpassQuery});out geom;`;

          fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: fullQuery.trim(),
          })
            .then((res) => res.json())
            .then((data) => {
              const geojson = osmtogeojson(data);
              if (mapInstanceRef.current) {
                addGeoJSONToMap(mapInstanceRef.current, geojson);
              }
            })
            .catch((error) => {
              console.error('Error fetching OSM data:', error);
            });
        }
      }

    } catch (error) {
      console.error('Error verifying site feature:', error);
      alert('Failed to verify site. Please try again.');
    } finally {
      // Always set loading to false when done
      setIsLoading(false);
    }
  };

  // You'll also need to move the addGeoJSONToMap function outside of the main useEffect 
  // so it can be accessed by verifySiteFeature. Add this at the component level:
  const addGeoJSONToMap = (map: Map, geojsonData: any) => {
    // Remove existing OSM layer if it exists
    if (osmLayerRef.current) {
      map.removeLayer(osmLayerRef.current);
      osmLayerRef.current = null;
    }

    const features = new GeoJSON().readFeatures(geojsonData, {
      featureProjection: "EPSG:3857",
    });

    const vectorSource = new VectorSource({ features });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({ color: 'rgba(0,0,200,0.9)', width: 1, lineDash: [2, 6] }),
        fill: new Fill({ color: 'rgba(97,97,97,0)' }),
      }),
    });

    map.addLayer(vectorLayer);

    // Store reference to OSM layer so we can remove it later
    osmLayerRef.current = vectorLayer;
  };
  useEffect(() => {
    if (!mapRef.current) return;

    const vectorSource = new VectorSource();
    drawSourceRef.current = vectorSource;
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        fill: new Fill({ color: "rgba(255, 0, 0, 0.3)" }),
        stroke: new Stroke({ color: "#ff0000", width: 2 }),
      }),
    });

    const scaleLineControl = new ScaleLine({
      units: 'metric', // 'imperial' for feet/miles, 'nautical' also supported
    });

    const map = new Map({
      target: mapRef.current,
      view: new View({
        center: fromLonLat([118.293, 5.5296]),
        zoom: 13,
      }),
      controls: defaultControls().extend([scaleLineControl]),
      layers: [],
    });

    // Replace your existing click handler in the main useEffect with this enhanced version
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
      // Clear data when deselecting
      setData({});

      if (clickedFeature) {
        setSelectedSiteFeature(clickedFeature);
        // Clear drawn polygons when selecting a site
        if (drawSourceRef.current) {
          drawSourceRef.current.clear();
        }
        drawnFeatureRef.current = null;
        // Call verification API with the selected feature
        verifySiteFeature(clickedFeature);

        // Prevent the click from propagating to avoid any other interactions
        evt.stopPropagation();
      } else {
        // Clear selection if clicking elsewhere with Ctrl
        setSelectedSiteFeature(null);
        setCheckStatuses({});
      }
    });
    const coordsDiv = document.getElementById('coords') as HTMLDivElement;

    const styleJson = "https://api.maptiler.com/maps/a1d2f17b-d57a-45ba-b7c6-4af845f758fb/style.json?key=67VOA297U9cciigsJVvm";

    apply(map, styleJson).then(() => {
      map.addLayer(vectorLayer);

      // Tile boundaries - debug only
      const debug_Layer = new TileLayer({ source: new TileDebug({ projection: 'EPSG:3857', zDirection: 1, tileGrid: createXYZ({ tileSize: 512, maxZoom: 22 }) }) });
      // map.addLayer(debug_Layer);

    });

    mapInstanceRef.current = map;  // Save reference for later

    // In your main useEffect where you create the map, modify the draw interaction setup:
    // Create the draw interaction but don't add it yet
    drawInteractionRef.current = new Draw({
      source: vectorSource,
      type: "Polygon",
    });

    drawInteractionRef.current.on("drawstart", () => {
      setIsDrawing(true);
      isDrawingRef.current = true;
      // Clear previously drawn features
      if (drawSourceRef.current) {
        drawSourceRef.current.clear();
      }
      setSelectedSiteFeature(null);
      setData({});
      if (osmLayerRef.current) {
        map.removeLayer(osmLayerRef.current);
        osmLayerRef.current = null;
      }
      setCheckStatuses({});
    });

    drawInteractionRef.current.on("drawend", async (event) => {
      setIsDrawing(false);
      isDrawingRef.current = false;
      const feature = event.feature;
      drawnFeatureRef.current = feature;
      const geometry = feature.getGeometry() as Polygon;
      const geometry4326 = geometry.clone().transform("EPSG:3857", "EPSG:4326");
      const wkt = new WKT().writeGeometry(geometry4326);

      if (userRef.current) {
        setIsLoading(true);
        try {
          const idToken = await userRef.current.getIdToken();
          const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
          const endpoint = isLocalhost
            ? "http://localhost:8080"
            : "https://europe-west6-restor-gis.cloudfunctions.net/verify_site";

          const configList = [];
          if (includeLandCoverRef.current) {
            configList.push("landcover");
          }
          if (includeOSMRef.current) {
            configList.push("osm");
          }
          if (includeWDPARef.current) {
            configList.push("wdpa");
          }
          if (includeSitesRef.current) {
            configList.push("sites");
          }
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              site_data: { geometry: wkt },
              config: {
                optional_metrics: configList,
              },
            }),
          });

          const result = await response.json();
          setCheckStatuses({});
          setData(result.results);

          if (includeOSMRef.current) {
            const best_feature = (result.results.osm && result.results.osm.features && result.results.osm.best_feature);
            if (best_feature) {
              const overpassQuery = `${best_feature.type}(${best_feature.id});`;
              const fullQuery = `[out:json];(${overpassQuery});out geom;`;
              fetch("https://overpass-api.de/api/interpreter", {
                method: "POST",
                body: fullQuery.trim(),
              })
                .then((res) => res.json())
                .then((data) => {
                  const geojson = osmtogeojson(data);
                  addGeoJSONToMap(mapInstanceRef.current!, geojson);
                });
            }
          }
        } catch (error) {
          console.error('Error verifying drawn polygon:', error);
          alert('Failed to verify site. Please try again.');
        } finally {
          // Always set loading to false when done
          setIsLoading(false);
        }
      } // end of if (userRef.current) {
    });

    // Also handle draw cancellation
    drawInteractionRef.current.on("drawabort", () => {
      setIsDrawing(false);
      isDrawingRef.current = false;
    });

    // Modified pointermove handler
    map.on('pointermove', (evt: MapBrowserEvent) => {
      const lonLat = toLonLat(evt.coordinate);
      coordsDiv.innerText = `Lon: ${lonLat[0].toFixed(4)}, Lat: ${lonLat[1].toFixed(4)}`;
      const popup = document.getElementById('popup') as HTMLDivElement;

      // Use loggedInRef.current instead of logged_in
      if (isDrawingRef.current || !loggedInRef.current || (!includeWDPARef.current && !includeSitesRef.current)) {
        popup.style.display = 'none';
        return;
      }
      let found = false;
      map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
        const props = feature.getProperties() || {};
        const isWdpa = layer === wdpaLayerRef.current && props.NAME;
        const isSite = layer === sitesLayerRef.current && props.name;
        if (isWdpa || isSite) {
          const name = isWdpa ? props.NAME : props.name;
          const color = isWdpa ? 'rgb(99, 148, 69)' : 'rgb(244,97,97)';
          const html = isWdpa && props.WDPAID
            ? `<a href="https://www.protectedplanet.net/${props.WDPAID}" target="_blank" style="color:${color};text-decoration:none;">${name}</a>`
            : `<span style="color:${color}">${name}</span>`;
          popup.innerHTML = html;
          popup.style.left = `${evt.pixel[0] + 30}px`;
          popup.style.top = `${evt.pixel[1] + 30}px`;
          popup.style.display = 'block';
          found = true;
          return true; // Stop iteration
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

  return (
    <div>
      <div
        ref={mapRef}
        style={{ position: "absolute", top: 20, left: 20, bottom: 20, right: 500 }}
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
          <>
            <h1>Site Verification Playground</h1>
            <h2>Draw a polygon on the map</h2>
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
                <span>Verifying site...</span>
              </div>
            )}

            {Object.keys(data).length > 0 && (
              <>
                {/* Tabs */}
                {/* Tabs */}
                <div style={{ display: "flex", borderBottom: "1px solid #ccc", marginTop: "25px" }}>
                  <button
                    key="Checks"
                    onClick={() => setSelectedTab("Checks")}
                    style={{
                      border: "1px solid #ccc",
                      borderBottom: selectedTab === "Checks" ? "none" : "0px solid #ccc",
                      backgroundColor: selectedTab === "Checks" ? "#ffffff" : "#f1f1f1",
                      cursor: "pointer",
                      outline: "none",
                      marginRight: "0.25rem",
                    }}
                  >
                    Checks
                  </button>

                  <button
                    key="Geometric"
                    onClick={() => setSelectedTab("Geometric")}
                    style={{
                      border: "1px solid #ccc",
                      borderBottom: selectedTab === "Geometric" ? "none" : "0px solid #ccc",
                      backgroundColor: selectedTab === "Geometric" ? "#ffffff" : "#f1f1f1",
                      cursor: "pointer",
                      outline: "none",
                      marginRight: "0.25rem",
                    }}
                  >
                    Geometric
                  </button>

                  {includeSites && (
                    <button
                      key="Sites"
                      onClick={() => setSelectedTab("Sites")}
                      style={{
                        border: "1px solid #ccc",
                        borderBottom: selectedTab === "Sites" ? "none" : "0px solid #ccc",
                        backgroundColor: selectedTab === "Sites" ? "#ffffff" : "#f1f1f1",
                        cursor: "pointer",
                        outline: "none",
                        marginRight: "0.25rem",
                      }}
                    >
                      Sites
                    </button>
                  )}
                  {includeLandCover && (
                    <button
                      key="Land Cover"
                      onClick={() => setSelectedTab("Land Cover")}
                      style={{
                        border: "1px solid #ccc",
                        borderBottom: selectedTab === "Land Cover" ? "none" : "0px solid #ccc",
                        backgroundColor: selectedTab === "Land Cover" ? "#ffffff" : "#f1f1f1",
                        cursor: "pointer",
                        outline: "none",
                        marginRight: "0.25rem",
                      }}
                    >
                      Land Cover
                    </button>
                  )}

                  {includeOSM && (
                    <button
                      key="OSM"
                      onClick={() => setSelectedTab("OSM")}
                      style={{
                        border: "1px solid #ccc",
                        borderBottom: selectedTab === "OSM" ? "none" : "0px solid #ccc",
                        backgroundColor: selectedTab === "OSM" ? "#ffffff" : "#f1f1f1",
                        cursor: "pointer",
                        outline: "none",
                        marginRight: "0.25rem",
                      }}
                    >
                      OSM
                    </button>
                  )}

                  {includeWDPA && (
                    <button
                      key="WDPA"
                      onClick={() => setSelectedTab("WDPA")}
                      style={{
                        border: "1px solid #ccc",
                        borderBottom: selectedTab === "WDPA" ? "none" : "0px solid #ccc",
                        backgroundColor: selectedTab === "WDPA" ? "#ffffff" : "#f1f1f1",
                        cursor: "pointer",
                        outline: "none",
                        marginRight: "0.25rem",
                      }}
                    >
                      WDPA
                    </button>
                  )}
                </div>

                {/* Content Box */}
                <div
                  className="content_box"
                >
                  {selectedTab === "Geometric" && data.geometric && (
                    <JsonViewer data={{ Area: data.geometric.area_str, 'Average Segment Length': data.geometric.average_segment_length_str, Compactness: data.geometric.compactness, 'Is valid': data.geometric.is_valid, Perimeter: data.geometric.perimeter_str, Vertices: data.geometric.points }} />
                  )}

                  {selectedTab === "Land Cover" && data.landcover && (
                    <JsonViewer
                      data={Object.fromEntries(
                        Object.entries(data.landcover).map(([key, value]) => [
                          key,
                          typeof value === "number" ? `${(value * 100).toFixed(0)}%` : value
                        ])
                      )}
                    />
                  )}
                  {selectedTab === "OSM" && data.osm && data.osm.features && (
                    <div>
                      <div>
                        {data.osm.features.map((rel: { type: string; id: number }) => (
                          <div key={rel.id} className="osm">
                            <a
                              href={`https://www.openstreetmap.org/${rel.type}/${rel.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {rel.type} ID: {rel.id}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedTab === "WDPA" && data.wdpa && data.wdpa.items && (
                    <div>
                      {data.wdpa.items.map((feature: any) => {
                        const wdpaid = feature?.wdpaid;
                        return (
                          wdpaid && (
                            <div key={wdpaid} className="wdpa">
                              <a
                                href={`https://www.protectedplanet.net/${wdpaid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {feature.name}
                              </a>
                            </div>
                          )
                        );
                      })}
                    </div>
                  )}
                  {selectedTab === "Sites" && data.sites && data.sites.items && (
                    <div>
                      {data.sites.items.map((feature: any) => {
                        const siteId = feature?.id;
                        return (
                          siteId && (
                            <div key={siteId} className="site">
                              {feature.site_visibility == 'PUBLIC' ? (
                                <span><a href={`https://restor.eco/sites/${siteId}`} target="_blank" rel="noopener noreferrer" >{feature.name}</a></span>
                              ) : (
                                <span className="private">{feature.name}</span>
                              )}
                            </div>
                          )
                        );
                      })}
                    </div>
                  )}
                  {/* Always render the checks, but conditionally show them */}
                  <div style={{ display: selectedTab === "Checks" ? "block" : "none" }} key={JSON.stringify(data)}>
                    {data.checks.items.map((check: Check) => (
                      <CheckDiv key={check.name}
                        check={check}
                      />
                    ))}
                  </div>
                </div>

              </>
            )}
          </>
        )}
      </div>
      {/* Overall status display */}
      {data.checks && data.checks.overall_status && (
        <div className="overall">
          <div style={{ color: data.checks.overall_status === CheckStatus.Valid ? "green" : data.checks.overall_status === CheckStatus.NeedsReview ? "orange" : "red" }}>
            Overall Status: {data.checks.overall_status}
          </div>
          <div className="message" style={{ display: data.checks.overall_status === "Valid" ? "none" : "block" }}>
            {data.checks.max_status_message}
          </div>
          {/*     <div className="checks">
                      {data.checks && data.checks.summary && Object.keys(data.checks.summary).map((key: string) => (
                        <div key={key}>{key}: {data.checks.summary[key]}</div>
                      ))}
                    </div>*/}
        </div>
      )}
      {/* Checkbox controls */}
      <div style={{ display: logged_in ? "block" : "none" }} className="checkboxes">
        <div><label><input type="checkbox" checked={includeSites} onChange={e => setIncludeSites(e.target.checked)} /> Include Sites</label></div>
        <div><label><input type="checkbox" checked={includeLandCover} onChange={e => setIncludeLandCover(e.target.checked)} /> Include Land Cover</label></div>
        <div><label><input type="checkbox" checked={includeWDPA} onChange={e => setIncludeWDPA(e.target.checked)} /> Include WDPA</label></div>
        <div><label><input type="checkbox" checked={includeOSM} onChange={e => setIncludeOSM(e.target.checked)} /> Include OSM</label></div>
      </div>
    </div>
  );
};

export default App;
