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
  photoURL: string | null;
};

const AUTH_DOMAIN = "socob-gestatelier.local";
const USERS_COLLECTION = "users";

function usernameToEmail(username: string): string {
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "-");
  return `${normalized}@${AUTH_DOMAIN}`;
}

// Roles that a self-service signup can never claim for itself. Admin
// access must always be granted afterwards by an existing admin, via the
// "Gestion des utilisateurs" panel — never chosen at signup time.
const RESTRICTED_SELF_SIGNUP_ROLES = ["admin", "administrateur"];

export async function signUp(username: string, password: string, role: string, email?: string): Promise<UserProfile> {
  const pseudoEmail = usernameToEmail(username);
  const credential = await createUserWithEmailAndPassword(auth, pseudoEmail, password);
  await updateProfile(credential.user, { displayName: username.trim() });
  const requestedRole = role.trim();
  const safeRole = RESTRICTED_SELF_SIGNUP_ROLES.includes(requestedRole.toLowerCase()) ? "Employé" : (requestedRole || "Employé");
  const profile: UserProfile = {
    uid: credential.user.uid,
    username: username.trim(),
    role: safeRole,
    email: email?.trim() || null,
    photoURL: null,
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
      photoURL: data.photoURL ?? null,
    };
  }
  return {
    uid: user.uid,
    username: user.displayName ?? "Utilisateur",
    role: "Utilisateur",
    email: null,
    photoURL: null,
  };
}

/** Updates the signed-in person's own profile fields (name, role, email, photo). */
export async function updateUserProfile(uid: string, updates: Partial<Pick<UserProfile, "username" | "role" | "email" | "photoURL">>): Promise<void> {
  await setDoc(doc(db, USERS_COLLECTION, uid), updates, { merge: true });
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/** Admin-only: creates an employee account without disturbing the admin's own session. */
export async function createEmployeeAccount(params: { username: string; password: string; role: string; email?: string }): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("not_authenticated");
  const idToken = await currentUser.getIdToken();
  const response = await fetch("/api/admin/create-user", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "create_failed");
  }
}

/** Admin-only: removes an employee's access. */
export async function deleteEmployeeAccount(uid: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("not_authenticated");
  const idToken = await currentUser.getIdToken();
  const response = await fetch("/api/admin/delete-user", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ uid }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "delete_failed");
  }
}
