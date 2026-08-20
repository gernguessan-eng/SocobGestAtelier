// Centralized Firebase Admin configuration, used by server-only code
// (Next.js Route Handlers / Server Actions) that needs privileged access
// to Firestore, Auth or Storage without going through Firestore security
// rules.
//
// Required environment variables (server-side only, never prefixed with
// NEXT_PUBLIC_):
//
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY
//
// These come from a Firebase service account key (Firebase Console ->
// Project settings -> Service accounts -> Generate new private key).
// When pasting FIREBASE_PRIVATE_KEY into Vercel, keep the literal \n
// sequences - they are converted to real newlines below.
//
// Initialization is lazy (only happens the first time one of the getters
// below is called) so that `next build` can analyze/trace this module
// without requiring valid Firebase credentials to be present at build
// time.

import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { type Firestore, getFirestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getStorage, type Storage } from "firebase-admin/storage";

let cachedApp: App | null = null;

function createAdminApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket,
    });
  }

  // Fallback: rely on Application Default Credentials if no explicit
  // service account is provided (useful for some hosting environments).
  return initializeApp({ projectId, storageBucket });
}

export function getAdminApp(): App {
  if (!cachedApp) {
    cachedApp = createAdminApp();
  }
  return cachedApp;
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}
