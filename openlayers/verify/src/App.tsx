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

  const [user, setUser] = useState<UserCredential["user"]>();
  const [logged_in, setLoggedIn] = useState(false);
  const [data, setData] = useState<Record<string, any>>({});
  const [selectedTab, setSelectedTab] = useState("Checks");
  const [includeLandCover, setIncludeLandCover] = useState(true);
  const [includeOSM, setIncludeOSM] = useState(false);
  const [includeWDPA, setIncludeWDPA] = useState(true);
  const [includeSites, setIncludeSites] = useState(true);
  const [checkStatuses, setCheckStatuses] = useState<Record<string, CheckStatus>>({});
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

  useEffect(() => {
    includeLandCoverRef.current = includeLandCover;
    includeOSMRef.current = includeOSM;
    includeWDPARef.current = includeWDPA;
    includeSitesRef.current = includeSites;
  }, [includeLandCover, includeOSM, includeWDPA, includeSites]);
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

    const coordsDiv = document.getElementById('coords') as HTMLDivElement;

    map.on('pointermove', (evt: MapBrowserEvent) => {
      const lonLat = toLonLat(evt.coordinate);
      coordsDiv.innerText = `Lon: ${lonLat[0].toFixed(4)}, Lat: ${lonLat[1].toFixed(4)}`;
    });

    const addGeoJSONToMap = (map: Map, geojsonData: any) => {
      const features = new GeoJSON().readFeatures(geojsonData, {
        featureProjection: "EPSG:3857",
      });

      const vectorSource = new VectorSource({ features });

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: new Style({
          fill: new Fill({ color: "rgba(0, 0, 255, 0.1)" }),
          stroke: new Stroke({ color: "rgba(0, 0, 255, 0.3)", width: 1 }),
        }),
      });

      map.addLayer(vectorLayer);

      // Store reference to OSM layer so we can remove it later
      osmLayerRef.current = vectorLayer;
    };
    const styleJson = "https://api.maptiler.com/maps/a1d2f17b-d57a-45ba-b7c6-4af845f758fb/style.json?key=67VOA297U9cciigsJVvm";

    apply(map, styleJson).then(() => {
      map.addLayer(vectorLayer);

      // Add the WDPA boundaries
      const wdpa_style = new Style({ fill: new Fill({ color: 'rgba(99, 148, 69, 0.2)', }), stroke: new Stroke({ color: [99, 148, 69, 0.3], width: 1 }) });
      // const wdpa_endpoint = 'https://storage.googleapis.com/restor_default/vector_tiles/wdpa/{z}/{x}/{y}.pbf'; // prebuilt MVT protected area boundaries 
      // const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const isLocalhost = false;
      const wdpa_endpoint = isLocalhost
        ? "http://127.0.0.1:5000/tiles/{z}/{x}/{y}.pbf"
        : "https://europe-west6-restor-gis.cloudfunctions.net/mvt_tile_server/tiles/{z}/{x}/{y}.pbf";
      const wdpa_source = new VectorTileSource({ format: new MVT(), url: wdpa_endpoint });
      const wdpa_layer = new VectorTileLayer({ source: wdpa_source, style: wdpa_style, minZoom: 10 });
      map.addLayer(wdpa_layer);
      // Set the useRef to point to the wdpa_layer
      wdpaLayerRef.current = wdpa_layer;
      const sites_style = new Style({ fill: new Fill({ color: 'rgba(99, 148, 69, 0.0)', }), stroke: new Stroke({ color: [255, 0, 0, 0.3], width: 2 }) });
      const sites_endpoint = isLocalhost
        ? "http://127.0.0.1:5000/tiles/{z}/{x}/{y}.pbf"
        : "https://europe-west6-restor-gis.cloudfunctions.net/mvt_tile_server_secure/tiles/{z}/{x}/{y}.pbf";
      const sites_source = new VectorTileSource({ format: new MVT(), url: sites_endpoint });
      const sites_layer = new VectorTileLayer({ source: sites_source, style: sites_style, minZoom: 10 });
      map.addLayer(sites_layer);
      // Set the useRef to point to the sites_layer
      sitesLayerRef.current = sites_layer;
      // Tile boundaries - debug only
      const debug_Layer = new TileLayer({ source: new TileDebug({ projection: 'EPSG:3857', zDirection: 1, tileGrid: createXYZ({ tileSize: 512, maxZoom: 22 }) }) });
      // map.addLayer(debug_Layer);

    });

    mapInstanceRef.current = map;  // Save reference for later

    // Create the draw interaction but don't add it yet
    drawInteractionRef.current = new Draw({
      source: vectorSource,
      type: "Polygon",
    });

    drawInteractionRef.current.on("drawstart", () => {
      // Clear previously drawn features
      if (drawSourceRef.current) {
        drawSourceRef.current.clear();
      }

      setData({});
      if (osmLayerRef.current) {
        map.removeLayer(osmLayerRef.current);
        osmLayerRef.current = null;
      }
      setCheckStatuses({});
    });

    drawInteractionRef.current.on("drawend", async (event) => {
      const feature = event.feature;
      drawnFeatureRef.current = feature;
      const geometry = feature.getGeometry() as Polygon;
      const geometry4326 = geometry.clone().transform("EPSG:3857", "EPSG:4326");
      const wkt = new WKT().writeGeometry(geometry4326);

      if (userRef.current) {
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

        const osm_relations = (result?.osm && result.results.osm.features) ?? [];
        if (osm_relations.length > 0) {
          const overpassQuery = osm_relations.map((rel: { type: string; id: number }) => `${rel.type}(${rel.id});`).join("\n");
          const fullQuery = `[out:json];(${overpassQuery});out geom;`;
          // Uncomment the following to fetch the features from Overpass API if needed
          // fetch("https://overpass-api.de/api/interpreter", {
          //   method: "POST",
          //   body: fullQuery.trim(),
          // })
          //   .then((res) => res.json())
          //   .then((data) => {
          //     const geojson = osmtogeojson(data);
          //     addGeoJSONToMap(map, geojson);
          //   });
        }
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
            <h1>Site Verification Sandbox</h1>
            <h2>Draw a polygon on the map</h2>

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
                    <JsonViewer data={data.landcover} />
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
