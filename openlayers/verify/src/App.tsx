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
import { Style, Fill, Stroke } from "ol/style";

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
  const [selectedTab, setSelectedTab] = useState("Properties");
  const [checkStatuses, setCheckStatuses] = useState<Record<string, CheckStatus>>({});
  const osmLayerRef = useRef<VectorLayer | null>(null);

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

        const polygon = feature.getGeometry() as Polygon;
        const coords3857 = polygon.getCoordinates();
        const coords4326 = coords3857[0].map(([x, y]) =>
          transform([x, y], 'EPSG:3857', 'EPSG:4326')
        );

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
            body: JSON.stringify({ geometry: [[coords4326]], include_landcover: 'ESRI', include_checks: true, include_osm: true }),
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
                <div style={{ display: "flex", borderBottom: "1px solid #ccc", backgroundColor: "#f1f1f1" }}>
                  {["Properties", "Land Cover Classes", "Checks", "OSM"].map((tab) => (<button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    style={{
                      padding: "0.75rem 1.5rem",
                      border: "1px solid #ccc",
                      borderBottom: selectedTab === tab ? "none" : "1px solid #ccc",
                      borderTopLeftRadius: "0.5rem",
                      borderTopRightRadius: "0.5rem",
                      backgroundColor: selectedTab === tab ? "#ffffff" : "#f1f1f1",
                      fontWeight: selectedTab === tab ? "bold" : "normal",
                      cursor: "pointer",
                      outline: "none",
                      marginRight: "0.25rem",
                    }}
                  >
                    {tab}
                  </button>
                  ))}
                </div>

                {/* Content Box */}
                <div
                  style={{
                    border: "1px solid #ccc",
                    borderTop: "none",
                    padding: "1rem",
                    backgroundColor: "#fff",
                    borderBottomLeftRadius: "5px",
                    borderBottomRightRadius: "5px",
                  }}
                >
                  {selectedTab === "Properties" && data.geometric && (
                    <JsonViewer data={data.geometric} />
                  )}

                  {selectedTab === "Land Cover Classes" && data.landcover && (
                    <JsonViewer data={data.landcover} />
                  )}

                  {selectedTab === "OSM" && data.osm && data.osm.features && (
                    <div>
                      <h3>OpenStreetMap Relations</h3>
                      <ul>
                        {data.osm.features.map((rel: { type: string; id: number }) => (
                          <li key={rel.id}>
                            <a
                              href={`https://www.openstreetmap.org/${rel.type}/${rel.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {rel.type} ID: {rel.id}
                            </a>
                          </li>
                        ))}
                      </ul>
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

                {/* Overall status display */}
                {data.checks && data.checks.overall_status && (
                  <div style={{
                    marginTop: "1rem",
                    fontWeight: "bold",
                    color: data.checks.overall_status === CheckStatus.Valid
                      ? "green"
                      : data.checks.overall_status === CheckStatus.NeedsReview
                        ? "orange"
                        : "red"
                  }}>
                    Overall Status: {data.checks.overall_status}
                  </div>
                )}
                <div>
                  {data.checks && data.checks.summary && Object.keys(data.checks.summary).map((key: string) => (
                    <div key={key}>{key}: {data.checks.summary[key]}</div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
