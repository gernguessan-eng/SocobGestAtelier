// Admin-only: bulk-imports vehicle identity (plate, brand, chassis/VIN,
// genre → mapped to "Carrosserie") from socobfleetgest into
// socob_GestAtelier's own "vehicles" collection.
//
// Idempotent: a FleetGest vehicle already imported before (matched by its
// FleetGest document id, stored as `fleetVehicleId`) is skipped, so
// re-running this later only adds genuinely new FleetGest vehicles —
// nothing is ever duplicated.
//
// Security: same pattern as /api/admin/create-user — caller must send a
// valid Firebase Auth ID token for an account whose Firestore profile has
// role "Admin".
//
// Read-only towards FleetGest (never writes back to its project); writes
// only to socob-gestatelier-prod's own "vehicles" collection.

import { getAdminAuth, getAdminDb } from "@/firebase-admin";
import { getFleetGestAdminDb } from "@/firebase-admin-fleetgest";

export const dynamic = "force-dynamic";

const USERS_COLLECTION = "users";
const VEHICLES_COLLECTION = "vehicles";
const FLEETGEST_VEHICLES_COLLECTION = "parc_auto_vehicles";
const BATCH_SIZE = 400; // Firestore batched writes cap at 500 operations.

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

  const fleetDb = getFleetGestAdminDb();
  if (!fleetDb) {
    return Response.json({ error: "fleetgest_not_configured" }, { status: 503 });
  }

  const gestAtelierDb = getAdminDb();

  try {
    // 1. Read every FleetGest vehicle (identity fields only).
    const fleetSnapshot = await fleetDb.collection(FLEETGEST_VEHICLES_COLLECTION).get();

    // 2. Read which FleetGest vehicles have already been imported before,
    //    so we never create a duplicate on a second run. The vehicles
    //    collection is small enough that a full read is simpler and safer
    //    here than trying to query on `fleetVehicleId`.
    const allExistingSnapshot = await gestAtelierDb.collection(VEHICLES_COLLECTION).get();
    const alreadyImportedFleetIds = new Set(
      allExistingSnapshot.docs.map((doc) => doc.data().fleetVehicleId).filter(Boolean)
    );

    // 3. Figure out the next sequential "V###" id to continue from.
    let maxNumber = 0;
    allExistingSnapshot.docs.forEach((doc) => {
      const match = /^V(\d+)$/.exec(doc.id);
      if (match) maxNumber = Math.max(maxNumber, parseInt(match[1], 10));
    });

    const today = new Date().toISOString().slice(0, 10);
    const toCreate: Array<{ id: string; data: Record<string, unknown> }> = [];

    fleetSnapshot.docs.forEach((doc) => {
      if (alreadyImportedFleetIds.has(doc.id)) return; // already imported, skip
      const data = doc.data();
      const plate = String(data.numero_immatriculation ?? "").trim();
      const brand = String(data.marque ?? "").trim();
      const vin = String(data.vin_chassis ?? "").trim();
      const genre = String(data.genre ?? "").trim();
      if (!plate) return; // nothing usable to import

      maxNumber += 1;
      const id = `V${String(maxNumber).padStart(3, "0")}`;
      toCreate.push({
        id,
        data: {
          id,
          fleetVehicleId: doc.id,
          brand,
          model: "",
          plate,
          vin,
          bodyType: genre,
          year: 0,
          mileage: 0,
          status: "Opérationnel",
          statusDate: today,
          lastRevisionKm: 0,
          nextRevisionKm: 0,
          lastMaintenance: "",
          nextMaintenance: "",
          assignedDriver: "Non assigné",
          ownerName: "",
          ownerAddress: "",
          commercialType: "",
          typeCode: "",
          color: "",
          fuel: "",
          seats: 0,
          fiscalPower: 0,
          enginePower: 0,
          displacement: 0,
          grossWeight: 0,
          curbWeight: 0,
          payload: 0,
          axles: 2,
          registrationDate: today,
          inspectionDate: today,
        },
      });
    });

    // 4. Write in batches (Firestore caps a single batch at 500 ops).
    for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
      const chunk = toCreate.slice(i, i + BATCH_SIZE);
      const batch = gestAtelierDb.batch();
      chunk.forEach((item) => {
        batch.set(gestAtelierDb.collection(VEHICLES_COLLECTION).doc(item.id), item.data);
      });
      await batch.commit();
    }

    return Response.json({
      ok: true,
      totalInFleetGest: fleetSnapshot.size,
      imported: toCreate.length,
      skippedAlreadyImported: alreadyImportedFleetIds.size,
    });
  } catch (error) {
    console.error("[admin/import-fleet-vehicles] failed:", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
