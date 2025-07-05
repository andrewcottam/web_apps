import React, { useState, useEffect, useRef } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import Polygon from "ol/geom/Polygon";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Draw } from "ol/interaction";
import { fromLonLat } from "ol/proj";
import { apply } from "ol-mapbox-style";
import { Style, Fill, Stroke } from "ol/style";

// Firebase modules
import { initializeApp } from "firebase/app";
import type { UserCredential } from "firebase/auth";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, getDoc, doc, collection } from "firebase/firestore";

// material-ui
import IconButton from "@mui/material/IconButton";
import Avatar from '@mui/material/Avatar';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAzrhJkckakoJLnRThTDvNRwyE29k7DDGQ",
  authDomain: "restor-poc-apps-b3414.firebaseapp.com",
  projectId: "restor-poc-apps-b3414",
  storageBucket: "restor-poc-apps-b3414.appspot.com",
  messagingSenderId: "1043831538397",
  appId: "1:1043831538397:web:50d6c71e135234ef4b9134"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const firestore = getFirestore(app);

const App: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<UserCredential["user"]>();
  const [logged_in, setLoggedIn] = useState(false);
  const [data,setData] = useState<string>("");

  // ref to always hold the latest user
  const userRef = useRef<typeof user>(undefined);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  function logout() {
    setLoggedIn(false);
    setUser(undefined);
  }

  async function login_clicked() {
    if (logged_in) {
      logout();
    } else {
      const result = await signInWithPopup(auth, provider);

      // check whitelist
      const whitelistRef = doc(collection(firestore, "site-verify"), "whitelisted_emails");
      const whitelistSnap = await getDoc(whitelistRef);
      const whitelisted_email_addresses = Object.keys(whitelistSnap.data() || []);

      if (!whitelisted_email_addresses.includes(result.user.email!)) {
        alert("Access Denied: Your email is not whitelisted. Contact Restor admin.");
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
        fill: new Fill({
          color: "rgba(255, 0, 0, 0.3)",
        }),
        stroke: new Stroke({
          color: "#ff0000",
          width: 2,
        }),
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

    const styleJson =
      "https://api.maptiler.com/maps/a1d2f17b-d57a-45ba-b7c6-4af845f758fb/style.json?key=67VOA297U9cciigsJVvm";

    apply(map, styleJson).then(() => {
      map.addLayer(vectorLayer);

      const draw = new Draw({
        source: vectorSource,
        type: "Polygon",
      });
      map.addInteraction(draw);

      draw.on("drawend", async (event) => {
        const polygon = event.feature.getGeometry() as Polygon;
        const coords = polygon.getCoordinates();

        if (userRef.current) {
          const idToken = await userRef.current.getIdToken();
          const response = await fetch("https://europe-west6-restor-poc-apps-b3414.cloudfunctions.net/verify_site", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ someData: "hello cloud function", geometry: [coords], }),
          });
          const data = await response.json();
          setData(data);
        } else {
          console.warn("No user logged in, cannot get data");
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
            title={
              logged_in
                ? `Logged in as ${user?.email} - click to Log out`
                : "Login"
            }
          >
            <Avatar alt="Google Photo" src={user?.photoURL!} />
          </IconButton>
        </div>
        <div style={{ display: logged_in ? "block" : "none" }}>
          <h1>Site Verification Sandbox</h1>
          <h2>Draw a polygon on the map</h2>
          <div>{JSON.stringify(data)}</div>
        </div>
      </div>
    </div>
  );
};

export default App;
