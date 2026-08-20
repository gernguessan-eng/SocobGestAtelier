// Generic Firestore data-access helpers.
//
// The dashboard UI keeps all of its data in React state for instant,
// synchronous rendering (exactly as before), but every create / update /
// delete operation is now mirrored to Firestore through the helpers below,
// and the initial state is loaded from Firestore (seeding it with the
// demo dataset the very first time the app runs against an empty
// project). This keeps the UI, menus, screens and behavior identical
// while replacing the persistence layer entirely.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  setDoc,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/firebase";

type WithId = { id: string };

/** Load a collection from Firestore, seeding it with `seed` the first time it is empty. */
export async function loadOrSeedCollection<T extends WithId>(collectionName: string, seed: T[]): Promise<T[]> {
  const snapshot = await getDocs(collection(db, collectionName));
  if (!snapshot.empty) {
    return snapshot.docs.map((docSnap) => docSnap.data() as T);
  }
  if (seed.length) {
    await saveDocs(collectionName, seed);
  }
  return seed;
}

/**
 * Live-subscribes to a collection: `callback` fires immediately with the
 * current contents, then again every time ANY user's changes are written
 * to Firestore (create/update/delete) — including from other devices or
 * browser tabs. Returns an unsubscribe function to call on unmount.
 */
export function subscribeToCollection<T extends WithId>(collectionName: string, callback: (items: T[]) => void): () => void {
  return onSnapshot(
    collection(db, collectionName),
    (snapshot) => callback(snapshot.docs.map((docSnap) => docSnap.data() as T)),
    (error) => console.error(`[firestore] live sync for "${collectionName}" failed:`, error)
  );
}

/** Live-subscribes to a single "singleton" document (e.g. app settings). */
export function subscribeToDoc<T>(collectionName: string, id: string, callback: (value: T | null) => void): () => void {
  return onSnapshot(
    doc(db, collectionName, id),
    (snap) => callback(snap.exists() ? (snap.data() as T) : null),
    (error) => console.error(`[firestore] live sync for "${collectionName}/${id}" failed:`, error)
  );
}

/** Load a single "singleton" document (e.g. app settings), seeding it if missing. */
export async function loadOrSeedDoc<T>(collectionName: string, id: string, seed: T): Promise<T> {
  const ref = doc(db, collectionName, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as T;
  }
  await setDoc(ref, seed as Record<string, unknown>);
  return seed;
}

/** Create or overwrite a single document, keyed by `item.id`. */
export async function saveDoc<T extends WithId>(collectionName: string, item: T): Promise<void> {
  await setDoc(doc(db, collectionName, item.id), item as Record<string, unknown>);
}

/** Create or overwrite several documents in one batched write. */
export async function saveDocs<T extends WithId>(collectionName: string, items: T[]): Promise<void> {
  if (!items.length) return;
  const batch = writeBatch(db);
  items.forEach((item) => batch.set(doc(db, collectionName, item.id), item as Record<string, unknown>));
  await batch.commit();
}

/** Persist a singleton document (e.g. app settings) under a fixed id. */
export async function saveSingletonDoc<T>(collectionName: string, id: string, value: T): Promise<void> {
  await setDoc(doc(db, collectionName, id), value as Record<string, unknown>);
}

/** Delete a single document by id. */
export async function removeDoc(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

/**
 * Upload a file (image or document) to Firebase Storage and return its
 * public download URL. Files are namespaced by `folder` (e.g. "imports",
 * "orders", "vehicles") to keep the bucket organized.
 */
export async function uploadFileToStorage(folder: string, file: File): Promise<string> {
  const path = `${folder}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

/** Swallow-and-log wrapper so background Firestore syncs never crash the UI. */
export function persist(operation: Promise<unknown>, context: string): void {
  operation.catch((error) => {
    console.error(`[firestore] ${context} failed:`, error);
  });
}
