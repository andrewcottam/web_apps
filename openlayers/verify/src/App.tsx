import React, { useState, useEffect, useRef } from "react";

// OpenLayers
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import Polygon from "ol/geom/Polygon";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
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
import ClassificationCheck from './components/ClassificationCheck';
import BooleanCheck from "./components/BooleanCheck";
import ThresholdCheck from "./components/ThresholdCheck";

// Types
import { CheckStatus } from "./types/Enums";

const thresholds = {
  validMax: 500,
  needsReviewMax: 1200
};

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

  const [user, setUser] = useState<UserCredential["user"]>();
  const [logged_in, setLoggedIn] = useState(false);
  const [data, setData] = useState<Record<string, any>>({});
  const [selectedTab, setSelectedTab] = useState("Properties");
  const [checkStatuses, setCheckStatuses] = useState<Record<string, CheckStatus>>({});

  const userRef = useRef<typeof user>(undefined);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const handleCheckResult = (key: string, status: CheckStatus) => {
    // console.log(key, status);
    setCheckStatuses(prev => ({ ...prev, [key]: status }));
  };

  const overallStatus: CheckStatus = Object.values(checkStatuses).includes(CheckStatus.Invalid)
    ? CheckStatus.Invalid
    : Object.values(checkStatuses).includes(CheckStatus.NeedsReview)
      ? CheckStatus.NeedsReview
      : CheckStatus.Valid;

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

    const styleJson = "https://api.maptiler.com/maps/a1d2f17b-d57a-45ba-b7c6-4af845f758fb/style.json?key=67VOA297U9cciigsJVvm";

    apply(map, styleJson).then(() => {
      map.addLayer(vectorLayer);

      const draw = new Draw({
        source: vectorSource,
        type: "Polygon",
      });
      map.addInteraction(draw);

      draw.on("drawend", async (event) => {
        const polygon = event.feature.getGeometry() as Polygon;
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
            body: JSON.stringify({ geometry: [[coords4326]] }),
          });

          const result = await response.json();
          setCheckStatuses({}); // Clear previous results
          setData(result.results); // <- confirm this matches your function response shape
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
                  {["Properties", "Land Cover Classes", "Checks"].map((tab) => (
                    <button
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

                  {/* Always render the checks, but conditionally show them */}
                  <div style={{ display: selectedTab === "Checks" ? "block" : "none" }} key={JSON.stringify(data)}>
                    <ClassificationCheck
                      data={data.geometric}
                      use_prop={"average_segment_length"}
                      thresholds={thresholds}
                      prop_name="Shape"
                      onCheckResult={handleCheckResult}
                    />
                    <BooleanCheck
                      data={data.geometric}
                      use_prop={"first_polygon_is_valid"}
                      prop_name="Valid geometry"
                      onCheckResult={handleCheckResult}
                    />
                    <ThresholdCheck
                      data={data.landcover}
                      use_prop={"built_area"}
                      prop_name="Urban"
                      threshold={2}
                      above={false}
                      onCheckResult={handleCheckResult}
                    />
                    <ThresholdCheck
                      data={data.landcover}
                      use_prop={"water"}
                      prop_name="Water"
                      threshold={2}
                      above={false}
                      onCheckResult={handleCheckResult}
                    />
                  </div>
                </div>

                {/* Overall status display */}
                {Object.keys(checkStatuses).length > 0 && (
                  <div style={{
                    marginTop: "1rem",
                    fontWeight: "bold",
                    color: overallStatus === CheckStatus.Valid
                      ? "green"
                      : overallStatus === CheckStatus.NeedsReview
                        ? "orange"
                        : "red"
                  }}>
                    Overall Status: {overallStatus}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
