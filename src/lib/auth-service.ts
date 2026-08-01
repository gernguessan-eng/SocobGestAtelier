// Authentication service.
//
// The UI collects a simple "Identifiant" (username) + password, like an
// internal tool, rather than an email address. Firebase Authentication
// itself is email/password based, so we deterministically derive a
// synthetic email from the username (e.g. "germain" ->
// "germain@socob-gestatelier.local") and use Firebase Auth under the
// hood. The human-friendly profile (username, fonction/role, optional
// real email) is stored in Firestore under `users/{uid}`.

import {
  type User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase";

export type UserProfile = {
  uid: string;
  username: string;
  role: string;
  email: string | null;
};

const AUTH_DOMAIN = "socob-gestatelier.local";
const USERS_COLLECTION = "users";

function usernameToEmail(username: string): string {
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "-");
  return `${normalized}@${AUTH_DOMAIN}`;
}

export async function signUp(username: string, password: string, role: string, email?: string): Promise<UserProfile> {
  const pseudoEmail = usernameToEmail(username);
  const credential = await createUserWithEmailAndPassword(auth, pseudoEmail, password);
  await updateProfile(credential.user, { displayName: username.trim() });
  const profile: UserProfile = {
    uid: credential.user.uid,
    username: username.trim(),
    role: role.trim() || "Utilisateur",
    email: email?.trim() || null,
  };
  await setDoc(doc(db, USERS_COLLECTION, credential.user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
  });
  return profile;
}

export async function signIn(username: string, password: string): Promise<void> {
  const pseudoEmail = usernameToEmail(username);
  await signInWithEmailAndPassword(auth, pseudoEmail, password);
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function fetchUserProfile(user: User): Promise<UserProfile> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, user.uid));
  if (snap.exists()) {
    const data = snap.data();
    return {
      uid: user.uid,
      username: data.username ?? user.displayName ?? "Utilisateur",
      role: data.role ?? "Utilisateur",
      email: data.email ?? null,
    };
  }
  return {
    uid: user.uid,
    username: user.displayName ?? "Utilisateur",
    role: "Utilisateur",
    email: null,
  };
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
