// Secondary Firebase Admin app: reads vehicle identity data (plaque,
// marque, modèle, n° de châssis) from the SEPARATE "socobfleetgest"
// (Parc Auto) Firebase project, so socob_GestAtelier can offer those
// same vehicles when creating/editing a vehicle here, instead of
// re-typing them from scratch.
//
// FleetGest remains the single source of truth for vehicle identity —
// this is read-only. Nothing here ever writes back to FleetGest's
// project, so its own production data is never at risk.
//
// Required environment variables (server-only):
//
//   FLEETGEST_FIREBASE_PROJECT_ID
//   FLEETGEST_FIREBASE_CLIENT_EMAIL
//   FLEETGEST_FIREBASE_PRIVATE_KEY
//
// Get these from a Firebase service account key generated on
// socobfleetgest's OWN Firebase project (Console Firebase → Project
// settings → Service accounts → Generate new private key). Confirm the
// exact project ID first (it may be a dedicated "fleetgest-socob"
// project, or a shared "fleetgest-prod" used by multiple clients —
// treat the latter with extra care).
//
// If these variables are absent, every function below returns null /
// an empty list instead of throwing — the vehicle picker in
// socob_GestAtelier simply falls back to plain manual entry.

import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { type Firestore, getFirestore } from "firebase-admin/firestore";

const FLEETGEST_APP_NAME = "fleetgest-admin";
let cachedApp: App | null | undefined;

function createFleetGestAdminApp(): App | null {
  const projectId = process.env.FLEETGEST_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FLEETGEST_FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FLEETGEST_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  const existing = getApps().find((app) => app.name === FLEETGEST_APP_NAME);
  if (existing) return existing;

  return initializeApp(
    { credential: cert({ projectId, clientEmail, privateKey }) },
    FLEETGEST_APP_NAME
  );
}

/** Returns the FleetGest admin app, or null if not configured. */
export function getFleetGestAdminApp(): App | null {
  if (cachedApp === undefined) {
    cachedApp = createFleetGestAdminApp();
  }
  return cachedApp;
}

/** Returns the FleetGest Firestore instance, or null if not configured. */
export function getFleetGestAdminDb(): Firestore | null {
  const app = getFleetGestAdminApp();
  return app ? getFirestore(app) : null;
}
