// Syncs socob_GestAtelier login/logout events into the RISE Presence
// tracking dashboard (separate "riseappli-prod" Firebase project), by
// writing to its `presence` and `users` collections using the exact
// schema documented in that project (see conversation / rise-presence
// dashboard source: src/config/presenceSchema.js).
//
// This route degrades gracefully: if the riseappli-prod admin
// credentials are not configured, it responds { skipped: true } instead
// of failing, so it never blocks login/logout of the main app.

import { FieldValue } from "firebase-admin/firestore";
import { getRiseAdminDb } from "@/firebase-admin-rise";

const PRESENCE_COLLECTION = "presence";
const USERS_COLLECTION = "users";
const APPLICATION_NAME = "socob_GestAtelier";
const DEFAULT_ENTREPRISE_ID = "rise-sasu";

export const dynamic = "force-dynamic";

type ConnectBody = {
  action: "connect";
  uid: string;
  displayName: string;
  email: string | null;
  role: string;
};

type DisconnectBody = {
  action: "disconnect";
  presenceDocId: string;
};

type RequestBody = ConnectBody | DisconnectBody;

async function readBody(request: Request): Promise<RequestBody | null> {
  try {
    // navigator.sendBeacon (used on tab-close) sends a text/plain body,
    // while normal fetch calls send application/json — handle both.
    const text = await request.text();
    return JSON.parse(text) as RequestBody;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const db = getRiseAdminDb();
  if (!db) {
    return Response.json({ skipped: true, reason: "riseappli-prod admin credentials not configured" });
  }

  const body = await readBody(request);
  if (!body || !body.action) {
    return Response.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  try {
    if (body.action === "connect") {
      const { uid, displayName, email, role } = body;

      // Upsert the user profile, preserving an existing entrepriseId
      // assignment if the RISE Presence "Entreprises" screen already set one.
      const userRef = db.collection(USERS_COLLECTION).doc(uid);
      const userSnap = await userRef.get();
      await userRef.set(
        {
          uid,
          displayName,
          email,
          role,
          updatedAt: FieldValue.serverTimestamp(),
          ...(userSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp(), entrepriseId: DEFAULT_ENTREPRISE_ID }),
        },
        { merge: true }
      );

      const presenceRef = await db.collection(PRESENCE_COLLECTION).add({
        uid,
        displayName,
        email,
        role,
        statut: "Connecté",
        application: APPLICATION_NAME,
        connexion: FieldValue.serverTimestamp(),
        deconnexion: null,
      });

      return Response.json({ ok: true, presenceDocId: presenceRef.id });
    }

    if (body.action === "disconnect") {
      const { presenceDocId } = body;
      if (!presenceDocId) {
        return Response.json({ ok: false, error: "missing presenceDocId" }, { status: 400 });
      }
      await db.collection(PRESENCE_COLLECTION).doc(presenceDocId).set(
        { statut: "Déconnecté", deconnexion: FieldValue.serverTimestamp() },
        { merge: true }
      );
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[rise-presence-sync] failed:", error);
    return Response.json({ ok: false, error: "internal error" }, { status: 500 });
  }
}
