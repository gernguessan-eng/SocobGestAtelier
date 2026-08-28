// Reads vehicle identity (plaque, marque, modèle, n° de châssis) from
// socobfleetgest's Firestore collection "parc_auto_vehicles" (a SEPARATE
// Firebase project — see src/firebase-admin-fleetgest.ts), so
// socob_GestAtelier can offer these vehicles when creating/editing a
// vehicle instead of re-typing them.
//
// Read-only: this route never writes to FleetGest's project.
// Degrades gracefully: if FleetGest admin credentials aren't configured
// yet, responds { vehicles: [], configured: false } instead of erroring,
// so the rest of socob_GestAtelier keeps working normally.

import { getFleetGestAdminDb } from "@/firebase-admin-fleetgest";

export const dynamic = "force-dynamic";

const FLEETGEST_VEHICLES_COLLECTION = "parc_auto_vehicles";

export type FleetVehicleIdentity = {
  fleetVehicleId: string;
  plate: string;
  brand: string;
  model: string;
  vin: string;
};

export async function GET() {
  const db = getFleetGestAdminDb();
  if (!db) {
    return Response.json({ vehicles: [], configured: false });
  }

  try {
    const snapshot = await db.collection(FLEETGEST_VEHICLES_COLLECTION).get();
    const vehicles: FleetVehicleIdentity[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        fleetVehicleId: doc.id,
        plate: String(data.numero_immatriculation ?? "").trim(),
        brand: String(data.marque ?? "").trim(),
        model: String(data.type_commercial ?? "").trim(),
        vin: String(data.vin_chassis ?? "").trim(),
      };
    }).filter((vehicle) => vehicle.plate);

    return Response.json({ vehicles, configured: true });
  } catch (error) {
    console.error("[fleet-vehicles] failed to read FleetGest vehicles:", error);
    return Response.json({ vehicles: [], configured: true, error: "read_failed" }, { status: 500 });
  }
}
