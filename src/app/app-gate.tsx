"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { fetchUserProfile, signOutUser, subscribeToAuth, type UserProfile } from "@/lib/auth-service";
import { subscribeToDoc } from "@/lib/data-service";
import { notifyPresenceConnect, notifyPresenceDisconnect } from "@/lib/rise-presence-service";
import LoginScreen from "./login-screen";
import DashboardShell from "./dashboard-shell";

const USERS_COLLECTION = "users";

export default function AppGate() {
  const [authChecked, setAuthChecked] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user: User | null) => {
      if (!user) {
        setUid(null);
        setProfile(null);
        setAuthChecked(true);
        return;
      }
      try {
        const userProfile = await fetchUserProfile(user);
        setUid(user.uid);
        setProfile(userProfile);
        void notifyPresenceConnect({
          uid: userProfile.uid,
          displayName: userProfile.username,
          email: userProfile.email,
          role: userProfile.role,
        });
      } catch (error) {
        console.error("[auth] failed to load profile:", error);
        setUid(user.uid);
        setProfile({ uid: user.uid, username: user.displayName ?? "Utilisateur", role: "Utilisateur", email: null, photoURL: null });
      } finally {
        setAuthChecked(true);
      }
    });
    return unsubscribe;
  }, []);

  // Keeps the profile live: editing it from "Mon profil" (name, role,
  // email, photo) reflects instantly everywhere it's shown, without
  // needing to log out/in again.
  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeToDoc<Omit<UserProfile, "uid">>(USERS_COLLECTION, uid, (data) => {
      if (data) {
        setProfile({
          uid,
          username: data.username ?? "Utilisateur",
          role: data.role ?? "Utilisateur",
          email: data.email ?? null,
          photoURL: data.photoURL ?? null,
        });
      }
    });
    return unsubscribe;
  }, [uid]);

  useEffect(() => {
    // Best-effort: mark the session as disconnected if the user closes
    // the tab/browser without clicking "Se déconnecter".
    window.addEventListener("beforeunload", notifyPresenceDisconnect);
    return () => window.removeEventListener("beforeunload", notifyPresenceDisconnect);
  }, []);

  async function handleLogout() {
    try {
      notifyPresenceDisconnect();
    } catch (error) {
      // A presence-sync hiccup (e.g. sessionStorage unavailable) must never
      // prevent the person from actually signing out.
      console.error("[presence] disconnect notification failed:", error);
    }
    await signOutUser();
  }

  if (!authChecked) {
    return (
      <div className="app-shell app-shell-loading">
        <div className="brand"><div className="brand-mark"><img src="/socob-logo.png" alt="Logo SOCOB" /></div><div><strong>socob_GestAtelier</strong><span>ATELIER INTERNE</span></div></div>
        <p className="loading-label">Vérification de la session…</p>
      </div>
    );
  }

  if (!profile) {
    return <LoginScreen />;
  }

  return <DashboardShell currentUser={profile} onLogout={handleLogout} />;
}
