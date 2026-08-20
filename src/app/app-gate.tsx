"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { fetchUserProfile, signOutUser, subscribeToAuth, type UserProfile } from "@/lib/auth-service";
import { notifyPresenceConnect, notifyPresenceDisconnect } from "@/lib/rise-presence-service";
import LoginScreen from "./login-screen";
import DashboardShell from "./dashboard-shell";

export default function AppGate() {
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user: User | null) => {
      if (!user) {
        setProfile(null);
        setAuthChecked(true);
        return;
      }
      try {
        const userProfile = await fetchUserProfile(user);
        setProfile(userProfile);
        void notifyPresenceConnect({
          uid: userProfile.uid,
          displayName: userProfile.username,
          email: userProfile.email,
          role: userProfile.role,
        });
      } catch (error) {
        console.error("[auth] failed to load profile:", error);
        setProfile({ uid: user.uid, username: user.displayName ?? "Utilisateur", role: "Utilisateur", email: null });
      } finally {
        setAuthChecked(true);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Best-effort: mark the session as disconnected if the user closes
    // the tab/browser without clicking "Se déconnecter".
    window.addEventListener("beforeunload", notifyPresenceDisconnect);
    return () => window.removeEventListener("beforeunload", notifyPresenceDisconnect);
  }, []);

  async function handleLogout() {
    notifyPresenceDisconnect();
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
