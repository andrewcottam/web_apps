import React, { useState, useEffect, useRef } from "react";

// Firebase
import { initializeApp } from "firebase/app";
import type { UserCredential } from "firebase/auth";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, getDoc, doc, collection } from "firebase/firestore";

// MUI
import IconButton from "@mui/material/IconButton";
import Avatar from '@mui/material/Avatar';

// Other
import DateForm from './DateForm';

import './App.css'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzrhJkckakoJLnRThTDvNRwyE29k7DDGQ",
  authDomain: "restor-poc-apps-b3414.firebaseapp.com",
  projectId: "restor-poc-apps-b3414",
  storageBucket: "restor-poc-apps-b3414.appspot.com",
  messagingSenderId: "1043831538397",
  appId: "1:1043831538397:web:0a0ab0be4aa00aa74b9134"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const firestore = getFirestore(app);

function App() {

  const [logged_in, setLoggedIn] = useState(false);
  const [user, setUser] = useState<UserCredential["user"]>();
  const userRef = useRef<typeof user>(undefined);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

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

  function logout() {
    setLoggedIn(false);
    setUser(undefined);
  }

  const handleSubmit = async (startDate: string, endDate: string): Promise<string | null> => {
    // Convert to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if either date is invalid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert("Invalid date format.");
      return null;
    }

    // Calculate the difference in milliseconds and convert to days
    const diffInMs = end.getTime() - start.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    // Show error if more than 14 days
    if (diffInDays > 14) {
      alert("Error: The date range cannot exceed 2 weeks.");
      return null;
    }

    if (userRef.current) {
      const idToken = await userRef.current.getIdToken();
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const endpoint = isLocalhost
        ? "http://localhost:8080"
        : "https://europe-west4-restor-gis.cloudfunctions.net/sites_verification_report";
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ startDate, endDate }),
        });
        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        return data.url;
      } catch (error) {
        console.error('Submission failed:', error);
        return null;
      }
    }

    return null;
  };

  return (
    <>
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
            <h1>Site Verification Reports</h1>
            <div style={{
              padding: '2rem', display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <DateForm onSubmit={handleSubmit} />
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default App
