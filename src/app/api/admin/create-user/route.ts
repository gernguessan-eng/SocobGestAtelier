// Admin-only: creates a new employee account (Firebase Auth user +
// Firestore profile) without disturbing the admin's own signed-in
// session — something the client SDK cannot do on its own, since
// createUserWithEmailAndPassword() immediately signs in as the new user.
//
// Security: the caller must send a valid Firebase Auth ID token for an
// account whose Firestore profile has role "Admin". Anyone else gets a
// 403, including a valid-but-non-admin session.

import { getAdminAuth, getAdminDb } from "@/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const AUTH_DOMAIN = "socob-gestatelier.local";
const USERS_COLLECTION = "users";

function usernameToEmail(username: string): string {
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "-");
  return `${normalized}@${AUTH_DOMAIN}`;
}

async function requireAdmin(request: Request): Promise<{ uid: string } | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const idToken = authHeader.replace(/^Bearer\s+/i, "");
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const profileSnap = await getAdminDb().collection(USERS_COLLECTION).doc(decoded.uid).get();
    const role = String(profileSnap.data()?.role ?? "").toLowerCase();
    if (role !== "admin") return null;
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const username = String(body?.username ?? "").trim();
  const password = String(body?.password ?? "");
  const role = String(body?.role ?? "").trim() || "Utilisateur";
  const email = body?.email ? String(body.email).trim() : null;

  if (!username || password.length < 6) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }

  const pseudoEmail = usernameToEmail(username);

  try {
    const userRecord = await getAdminAuth().createUser({
      email: pseudoEmail,
      password,
      displayName: username,
    });
    await getAdminDb().collection(USERS_COLLECTION).doc(userRecord.uid).set({
      uid: userRecord.uid,
      username,
      role,
      email,
      photoURL: null,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: admin.uid,
    });
    return Response.json({ ok: true, uid: userRecord.uid });
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code ?? "";
    if (code === "auth/email-already-exists") {
      return Response.json({ error: "username_taken" }, { status: 409 });
    }
    console.error("[admin/create-user] failed:", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
