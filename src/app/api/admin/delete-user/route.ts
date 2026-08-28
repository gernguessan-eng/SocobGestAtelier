// Admin-only: removes an employee's access (deletes their Firebase Auth
// account + Firestore profile). Same admin-verification approach as
// create-user. An admin can never delete their own account through this
// route, to avoid accidentally locking everyone out.

import { getAdminAuth, getAdminDb } from "@/firebase-admin";

export const dynamic = "force-dynamic";

const USERS_COLLECTION = "users";

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
  const targetUid = String(body?.uid ?? "");
  if (!targetUid) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }
  if (targetUid === admin.uid) {
    return Response.json({ error: "cannot_delete_self" }, { status: 400 });
  }

  try {
    await getAdminAuth().deleteUser(targetUid);
    await getAdminDb().collection(USERS_COLLECTION).doc(targetUid).delete();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[admin/delete-user] failed:", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
