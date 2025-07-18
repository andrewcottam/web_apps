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
import { transform } from 'ol/proj';
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
  const [includeOSM, setIncludeOSM] = useState(true);
  const [includeWDPA, setIncludeWDPA] = useState(true);
  const [checkStatuses, setCheckStatuses] = useState<Record<string, CheckStatus>>({});
  const osmLayerRef = useRef<VectorLayer | null>(null);
  const includeLandCoverRef = useRef(includeLandCover);
  const includeOSMRef = useRef(includeOSM);
  const includeWDPARef = useRef(includeWDPA);
  useEffect(() => {
    includeLandCoverRef.current = includeLandCover;
    includeOSMRef.current = includeOSM;
    includeWDPARef.current = includeWDPA;
  }, [includeLandCover, includeOSM, includeWDPA]);
  useEffect(() => {
    // If the selected tab is now hidden due to checkbox changes, revert to "Checks"
    if (
      (selectedTab === "Land Cover" && !includeLandCover) ||
      (selectedTab === "OSM" && !includeOSM) ||
      (selectedTab === "WDPA" && !includeWDPA)
    ) {
      setSelectedTab("Checks");
    }
  }, [includeLandCover, includeOSM, includeWDPA]);

  const userRef = useRef<typeof user>(undefined);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

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

  function logout() {
    setLoggedIn(false);
    setUser(undefined);
  }

  async function login_clicked() {
    if (logged_in) {
      logout();
    } else {
      const result = await signInWithPopup(auth, provider);

      const whitelistRef = doc(collection(firestore, "site-verify"), "whitelisted_emails");
      const whitelistSnap = await getDoc(whitelistRef);
      const whitelisted = Object.keys(whitelistSnap.data() || {});

      if (!whitelisted.includes(result.user.email!)) {
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
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        fill: new Fill({ color: "rgba(255, 0, 0, 0.3)" }),
        stroke: new Stroke({ color: "#ff0000", width: 2 }),
      }),
    });

    const map = new Map({
      target: mapRef.current,
      view: new View({
        center: fromLonLat([118.293, 5.5296]),
        zoom: 13,
      }),
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
          stroke: new Stroke({ color: "#0000ff", width: 2 }),
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
      // const vector_tiles_endpoint = 'https://storage.googleapis.com/restor_default/vector_tiles/wdpa/{z}/{x}/{y}.pbf'; // prebuilt MVT protected area boundaries 
      // const vector_tiles_endpoint = 'http://127.0.0.1:5000/tiles/{z}/{x}/{y}.pbf'; // protected area boundaries // local mvt_server
      const vector_tiles_endpoint = 'https://mvt-server-468041596913.europe-west6.run.app/tiles/{z}/{x}/{y}.pbf'; // protected area boundaries // Cloud Run mvt_server
      const vector_tile_source = new VectorTileSource({ format: new MVT(), url: vector_tiles_endpoint, maxZoom: 20 });
      const mvt_layer_style = new Style({ fill: new Fill({ color: 'rgba(99, 148, 69, 0.2)', }), stroke: new Stroke({ color: [99, 148, 69, 0.3], width: 1 }) });
      // const mvt_layer_style = new Style({image: new CircleStyle({radius: 10, fill: new Fill({ color: 'Red' }),stroke: new Stroke({ color: 'Red', width: 2 })})});
      const vector_tile_layer = new VectorTileLayer({ source: vector_tile_source, style: mvt_layer_style });
      map.addLayer(vector_tile_layer)

      // Tile boundaries - debug only
      // Debug tile boundaries
      const debug_Layer = new TileLayer({ source: new TileDebug({ projection: 'EPSG:3857' }) });
      // map.addLayer(debug_Layer);

      const draw = new Draw({
        source: vectorSource,
        type: "Polygon",
      });
      map.addInteraction(draw);
      draw.on("drawstart", () => {
        // reset the data
        setData({});
        // Remove OSM layer when a new polygon starts
        if (osmLayerRef.current) {
          map.removeLayer(osmLayerRef.current);
          osmLayerRef.current = null;
        }

        // Also clear previous check statuses if needed
        setCheckStatuses({});
      });

      draw.on("drawend", async (event) => {
        const feature = event.feature;
        drawnFeatureRef.current = feature;  // Store reference for later styling
        // Transform geometry to EPSG:4326
        const geometry = feature.getGeometry() as Polygon;
        const geometry4326 = geometry.clone().transform('EPSG:3857', 'EPSG:4326');
        // Convert to WKT
        const wkt = new WKT().writeGeometry(geometry4326);
        if (userRef.current) {
          const idToken = await userRef.current.getIdToken();
          const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
          const endpoint = isLocalhost
            ? "http://localhost:8080"
            : "https://europe-west6-restor-gis.cloudfunctions.net/verify_site";

          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              site_data: { geometry: wkt },
              config: {
                include_landcover: includeLandCoverRef.current ? 'ESRI' : 'None',
                include_osm: includeOSMRef.current,
                include_wdpa: includeWDPARef.current
              }
            }),
          });

          const result = await response.json();
          setCheckStatuses({}); // Clear previous results
          setData(result.results);
          // See if we have a OSM relation
          const osm_relations = result.results.osm.features ?? [];

          if (osm_relations.length > 0) {
            const overpassQuery = osm_relations
              .map((rel: { type: string; id: number }) => `${rel.type}(${rel.id});`)
              .join("\n");

            const fullQuery = `
    [out:json];
    (
      ${overpassQuery}
    );
    out geom;
  `;
            fetch("https://overpass-api.de/api/interpreter", {
              method: "POST",
              body: fullQuery.trim(),
            })
              .then((res) => res.json())
              .then((data) => {
                const geojson = osmtogeojson(data);
                addGeoJSONToMap(map, geojson);
              });
          }
        }
      });
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
                    <JsonViewer data={data.geometric} />
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
        <div><label><input type="checkbox" checked={includeLandCover} onChange={e => setIncludeLandCover(e.target.checked)} /> Include Land Cover</label></div>
        <div><label><input type="checkbox" checked={includeOSM} onChange={e => setIncludeOSM(e.target.checked)} /> Include OSM</label></div>
        <div><label><input type="checkbox" checked={includeWDPA} onChange={e => setIncludeWDPA(e.target.checked)} /> Include WDPA</label></div>
      </div>
    </div>
  );
};

export default App;
