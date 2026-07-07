import { useState, useEffect, useRef } from "react";

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
import OrganisationForm from './OrganisationForm';
import SiteIdsForm from './SiteIdsForm';

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

  // shared UI state
  const [busy, setBusy] = useState<null | "date" | "org" | "siteIds">(null);
  const [orgUrl, setOrgUrl] = useState<string | null>(null);
  const [dateUrl, setDateUrl] = useState<string | null>(null);
  const [siteIdsUrl, setSiteIdsUrl] = useState<string | null>(null);
  const [invalidChecksCount, setInvalidChecksCount] = useState<number>(0);
  const [includeMangroves, setIncludeMangroves] = useState<boolean>(false);

  const getOptionalMetrics = () =>
    includeMangroves
      ? ["landcover", "sites", "wdpa", "profile_completeness", "mangroves"]
      : ["landcover", "sites", "wdpa", "profile_completeness"];

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  async function login_clicked() {
    if (logged_in) {
      logout();
    } else {
      const result = await signInWithPopup(auth, provider);

      const whitelistRef = doc(collection(firestore, "site-verification-reports"), "whitelisted_emails");
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

  async function submitToEndpoint(payload: Record<string, any>, idToken: string): Promise<string | null> {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const endpoint = isLocalhost
      ? "http://localhost:8080"
      : "https://europe-west6-restor-gis.cloudfunctions.net/site-verification-reports";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Submission failed:", error);
      return null;
    }
  }

  const handleSiteIdsSubmit = async (siteIds: string[]): Promise<string | null> => {
    if (!userRef.current) return null;
    try {
      setBusy("siteIds");
      setOrgUrl(null);
      setDateUrl(null);
      setSiteIdsUrl(null);

      const idToken = await userRef.current.getIdToken();
      const payload = {
        siteIds,
        config: {
          overall_status_thresholds: [0, invalidChecksCount],
          optional_metrics: getOptionalMetrics()
        }
      };
      const url = await submitToEndpoint(payload, idToken);
      setSiteIdsUrl(url);
      return url;
    } finally {
      setBusy(null);
    }
  };

  const handleOrgSubmit = async (organizationName: string): Promise<string | null> => {
    if (!userRef.current) return null;
    try {
      setBusy("org");
      // clear old links
      setOrgUrl(null);
      setDateUrl(null);
      setSiteIdsUrl(null);

      const idToken = await userRef.current.getIdToken();
      const payload = {
        organizationName,
        config: {
          overall_status_thresholds: [0, invalidChecksCount],
          optional_metrics: getOptionalMetrics()
        }
      };
      const url = await submitToEndpoint(payload, idToken);
      setOrgUrl(url);
      return url;
    } finally {
      setBusy(null);
    }
  };

  const handleDateSubmit = async (startDate: string, endDate: string): Promise<string | null> => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert("Invalid date format.");
      return null;
    }

    const diffInDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffInDays > 14) {
      alert("Error: The date range cannot exceed 2 weeks.");
      return null;
    }

    if (!userRef.current) return null;
    try {
      setBusy("date");
      // clear old links
      setOrgUrl(null);
      setDateUrl(null);
      setSiteIdsUrl(null);

      const idToken = await userRef.current.getIdToken();
      const payload = {
        startDate,
        endDate,
        config: {
          overall_status_thresholds: [0, invalidChecksCount],
          optional_metrics: getOptionalMetrics()
        }
      };
      const url = await submitToEndpoint(payload, idToken);
      setDateUrl(url);
      return url;
    } finally {
      setBusy(null);
    }
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
            <div
              style={{
                padding: '2rem',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'flex-start',
                gap: '2rem',
                flexWrap: 'wrap',
              }}
            >
              {/* Date Panel */}
              <div
                style={{
                  flex: '1 1 0',
                  minWidth: '300px',
                  border: '1px solid #ccc',
                  padding: '1rem',
                  borderRadius: '8px',
                }}
              >
                <h2>Select Dates</h2>
                <DateForm onSubmit={handleDateSubmit} disabled={busy === "org" || busy === "siteIds"} />
                {dateUrl && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <a href={dateUrl} target="_blank" rel="noreferrer">Open generated sheet</a>
                  </div>
                )}
              </div>

              {/* Organisation Panel */}
              <div
                style={{
                  flex: '1 1 0',
                  minWidth: '300px',
                  border: '1px solid #ccc',
                  padding: '1rem',
                  borderRadius: '8px',
                }}
              >
                <h2>Organisation name</h2>
                <OrganisationForm onSubmit={handleOrgSubmit} disabled={busy === "date" || busy === "siteIds"} url={orgUrl} />
              </div>

              {/* Site IDs Panel */}
              <div
                style={{
                  flex: '1 1 0',
                  minWidth: '300px',
                  border: '1px solid #ccc',
                  padding: '1rem',
                  borderRadius: '8px',
                }}
              >
                <h2>Site_ids</h2>
                <SiteIdsForm onSubmit={handleSiteIdsSubmit} disabled={busy === "date" || busy === "org"} url={siteIdsUrl} />
              </div>
            </div>

            {/* Invalid Checks Count Configuration */}
            <div
              style={{
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Invalid checks count:</span>
                <input
                  type="number"
                  min="0"
                  value={invalidChecksCount}
                  onChange={(e) => setInvalidChecksCount(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '80px', padding: '0.25rem' }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={includeMangroves}
                  onChange={(e) => setIncludeMangroves(e.target.checked)}
                />
                <span>Include Mangrove checks</span>
              </label>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default App
