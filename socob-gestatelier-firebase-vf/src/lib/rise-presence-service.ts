// Client-side helper that reports connect/disconnect events to
// /api/presence, which mirrors them into the RISE Presence dashboard
// (separate "riseappli-prod" Firebase project). Best-effort: any failure
// here is logged but never blocks login/logout of the main app.

const STORAGE_KEY = "risePresenceDocId";

export type PresenceUser = {
  uid: string;
  displayName: string;
  email: string | null;
  role: string;
};

export async function notifyPresenceConnect(user: PresenceUser): Promise<void> {
  try {
    const response = await fetch("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "connect", ...user }),
    });
    const data = await response.json();
    if (data?.presenceDocId) {
      sessionStorage.setItem(STORAGE_KEY, data.presenceDocId);
    }
  } catch (error) {
    console.error("[rise-presence] connect notification failed:", error);
  }
}

export function notifyPresenceDisconnect(): void {
  const presenceDocId = sessionStorage.getItem(STORAGE_KEY);
  if (!presenceDocId) return;
  sessionStorage.removeItem(STORAGE_KEY);

  const payload = JSON.stringify({ action: "disconnect", presenceDocId });
  try {
    // sendBeacon works even when the page is closing (unlike fetch),
    // which covers both the explicit logout button and the user simply
    // closing the tab.
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/presence", new Blob([payload], { type: "text/plain" }));
    } else {
      fetch("/api/presence", { method: "POST", body: payload, keepalive: true });
    }
  } catch (error) {
    console.error("[rise-presence] disconnect notification failed:", error);
  }
}
