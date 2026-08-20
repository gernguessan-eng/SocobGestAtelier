// Secondary Firebase Admin app: writes presence/session events into the
// separate "riseappli-prod" Firebase project, so this app shows up in the
// RISE Presence tracking dashboard (https://suiviconnexclts.netlify.app/).
//
// This is a DIFFERENT Firebase project from the one used by the rest of
// socob_GestAtelier (which lives in "ateliergest-prod"). Writes go through
// the Admin SDK, which bypasses that project's Firestore security rules
// entirely (no need for our users to be authenticated inside
// riseappli-prod).
//
// Required environment variables (server-only):
//
//   RISEAPPLI_FIREBASE_PROJECT_ID     (riseappli-prod)
//   RISEAPPLI_FIREBASE_CLIENT_EMAIL
//   RISEAPPLI_FIREBASE_PRIVATE_KEY
//
// Get these from a Firebase service account key generated on the
// riseappli-prod project (Console Firebase → Project settings → Service
// accounts → Generate new private key), NOT from ateliergest-prod.
//
// If these variables are absent, presence sync is silently skipped (it
// is a "nice to have" cross-app integration, not core functionality --
// it must never block login/logout for socob_GestAtelier itself).

import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { type Firestore, getFirestore } from "firebase-admin/firestore";

const RISE_APP_NAME = "riseappli-prod-admin";
let cachedApp: App | null | undefined;

function createRiseAdminApp(): App | null {
  const projectId = process.env.RISEAPPLI_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.RISEAPPLI_FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.RISEAPPLI_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  const existing = getApps().find((app) => app.name === RISE_APP_NAME);
  if (existing) return existing;

  return initializeApp(
    { credential: cert({ projectId, clientEmail, privateKey }) },
    RISE_APP_NAME
  );
}

/** Returns the riseappli-prod admin app, or null if not configured. */
export function getRiseAdminApp(): App | null {
  if (cachedApp === undefined) {
    cachedApp = createRiseAdminApp();
  }
  return cachedApp;
}

/** Returns the riseappli-prod Firestore instance, or null if not configured. */
export function getRiseAdminDb(): Firestore | null {
  const app = getRiseAdminApp();
  return app ? getFirestore(app) : null;
}
