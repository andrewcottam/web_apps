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
// Firestore
import { getFirestore, getDoc, doc, collection} from "firebase/firestore";

// material-ui
import IconButton from "@mui/material/IconButton";
import Avatar from '@mui/material/Avatar';

// Your web app's Firebase configuration
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

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialise the Google single-sign-on provider
const provider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
const firestore = getFirestore(app);

const App: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  // useState
  const [user, setUser] = useState<UserCredential["user"]>()
  const [logged_in, setLoggedIn] = useState<boolean>(false);

  function logout() {
    setLoggedIn(false);
    setUser(undefined);
  }

  async function login_clicked() {
    if (logged_in) {
      logout();
    } else {
      const result = await signInWithPopup(auth, provider);
      // Check if email is whitelisted
      const whitelistRef = doc(collection(firestore, "site-verify"), "whitelisted_emails");
      const whitelistSnap = await getDoc(whitelistRef);
      // Get the whitelisted email addresses
      const whitelisted_email_addresses = Object.keys(whitelistSnap.data() || [])
      // Throw an error if the user is not whitelisted
      if (!whitelisted_email_addresses.includes(result.user.email!)) {
        // Sign the user out if not whitelisted
        alert("Access Denied: Your email is not whitelisted. Contact Restor admin.")
        logout();
        return;
      }
      // Logged in successfully
      setUser(result.user);
      setLoggedIn(true);
    }
  }


  useEffect(() => {
    if (!mapRef.current) return;

    // Create vector source and layer
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

    // Create map *without* layers
    const map = new Map({
      target: mapRef.current,
      view: new View({
        center: fromLonLat([118.293, 5.5296]),
        zoom: 13,
      }),
      layers: [], // no layers yet
    });

    // Apply the Mapbox style
    const styleJson =
      "https://api.maptiler.com/maps/a1d2f17b-d57a-45ba-b7c6-4af845f758fb/style.json?key=67VOA297U9cciigsJVvm";
    apply(map, styleJson).then(() => {
      // after style loads, add the vector drawing layer
      map.addLayer(vectorLayer);

      // Add draw interaction
      const draw = new Draw({
        source: vectorSource,
        type: "Polygon",
      });
      map.addInteraction(draw);

      draw.on("drawend", (event) => {
        const polygon = event.feature.getGeometry() as Polygon;
        console.log("Polygon coordinates:", polygon.getCoordinates());
      });
    });

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  return (
    <div>
      <div ref={mapRef} style={{ position: "absolute", top: 20, left: 20, bottom: 20, right: 500 }} />
      <div className="panel">
        <div id="fixed-column">
          <IconButton onClick={login_clicked} title={logged_in ? `Logged in as ${user?.email} - click to Log out` : 'Login'}>
            <Avatar alt="Google Photo" src={user?.photoURL!} />
          </IconButton>
        </div>
        <h1>Site Verification Sandbox</h1>
        <h2>Draw a polygon on the map</h2>
      </div>
    </div>
  );
};

export default App;
