import { getAdminDb } from "@/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Lightweight connectivity check against Firestore via Firebase Admin.
    await getAdminDb().listCollections();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
