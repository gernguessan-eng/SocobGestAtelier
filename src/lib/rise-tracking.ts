// Integration with the "RISE · Presence" connection-tracking dashboard
// (https://suiviconnexclts.netlify.app).
//
// That dashboard reads a `presence` collection in a *different* Firebase
// project (riseappli-prod) than the one used by this app
// (ateliergest-prod). Its Firestore rules only require `request.auth !=
// null` (any authenticated user, from any provider) — so we sign in
// anonymously to that project purely to satisfy the rule, then write a
// session document describing who is using socob_GestAtelier.
//
// Expected schema (see rise-presence-dashboard project, presenceSchema.js):
//   presence/{sessionId} = {
//     uid, displayName, email, role,
//     statut: "Connecté" | "Déconnecté",
//     connexion: Timestamp, deconnexion: Timestamp | null,
//     application: "socob_GestAtelier",
//   }
//
// Requirement on the RISE Presence project: the "Anonymous" sign-in
// provider must be enabled (Firebase Console → riseappli-prod →
// Authentication → Sign-in method → Anonymous).

import { type FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { addDoc, collection, doc, getFirestore, serverTimestamp, updateDoc } from "firebase/firestore";
import type { UserProfile } from "./auth-service";

const RISE_APP_NAME = "rise-presence-tracking";

// Not secrets (see riseappli-prod's own firebaseConfig.js comments) —
// these merely identify the project client-side; real protection is via
// Firestore rules. Overridable via env vars if the project ever changes.
const riseFirebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_RISE_FIREBASE_API_KEY || "AIzaSyAdjUYlswy-rfk0cwVs2Qly5-iViNrhKqk",
  authDomain: process.env.NEXT_PUBLIC_RISE_FIREBASE_AUTH_DOMAIN || "riseappli-prod.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_RISE_FIREBASE_PROJECT_ID || "riseappli-prod",
  storageBucket: process.env.NEXT_PUBLIC_RISE_FIREBASE_STORAGE_BUCKET || "riseappli-prod.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_RISE_FIREBASE_MESSAGING_SENDER_ID || "404378933325",
  appId: process.env.NEXT_PUBLIC_RISE_FIREBASE_APP_ID || "1:404378933325:web:881815792a58b529346404",
};

const APPLICATION_NAME = "socob_GestAtelier";
const PRESENCE_COLLECTION = "presence";

function getRiseApp() {
  const existing = getApps().find((app) => app.name === RISE_APP_NAME);
  return existing ?? initializeApp(riseFirebaseConfig, RISE_APP_NAME);
}

let activeSessionId: string | null = null;

/**
 * Call once the socob_GestAtelier user is authenticated. Opens a
 * "Connecté" session document in the RISE Presence dashboard. Failures
 * are logged but never block the app — presence tracking is best-effort
 * and must not prevent people from using socob_GestAtelier.
 */
export async function startRiseSession(profile: UserProfile): Promise<void> {
  try {
    const riseApp = getRiseApp();
    const riseAuth = getAuth(riseApp);
    if (!riseAuth.currentUser) {
      await signInAnonymously(riseAuth);
    }
    const riseDb = getFirestore(riseApp);
    const docRef = await addDoc(collection(riseDb, PRESENCE_COLLECTION), {
      uid: profile.uid,
      displayName: profile.username,
      email: profile.email ?? "",
      role: profile.role,
      statut: "Connecté",
      connexion: serverTimestamp(),
      deconnexion: null,
      application: APPLICATION_NAME,
    });
    activeSessionId = docRef.id;
  } catch (error) {
    console.error("[rise-presence] failed to start session:", error);
  }
}

/**
 * Call on logout (or before the tab closes, best-effort) to mark the
 * session as ended.
 */
export async function endRiseSession(): Promise<void> {
  if (!activeSessionId) return;
  const sessionId = activeSessionId;
  activeSessionId = null;
  try {
    const riseApp = getRiseApp();
    const riseDb = getFirestore(riseApp);
    await updateDoc(doc(riseDb, PRESENCE_COLLECTION, sessionId), {
      statut: "Déconnecté",
      deconnexion: serverTimestamp(),
    });
  } catch (error) {
    console.error("[rise-presence] failed to end session:", error);
  }
}
