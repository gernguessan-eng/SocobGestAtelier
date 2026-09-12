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
  genre: string;
  // Newly matched fields (see socob_GestAtelier ↔ socobfleetgest field mapping).
  ownerName: string;
  bodyType: string;
  color: string;
  commercialType: string;
  registrationDate: string;
  fuel: string;
  seats: number;
  grossWeight: number;
  axles: number;
  displacement: number;
  fiscalPower: number;
  curbWeight: number;
  payload: number;
  mileage: number;
  assignedDriver: string;
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
      const num = (value: unknown) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      };
      return {
        fleetVehicleId: doc.id,
        plate: String(data.numero_immatriculation ?? "").trim(),
        brand: String(data.marque ?? "").trim(),
        model: String(data.type_commercial ?? "").trim(),
        vin: String(data.vin_chassis ?? "").trim(),
        genre: String(data.genre ?? "").trim(),
        ownerName: String(data.nom_proprietaire ?? "").trim(),
        bodyType: String(data.carrosserie ?? "").trim(),
        color: String(data.couleur ?? "").trim(),
        commercialType: String(data.type_commercial ?? "").trim(),
        registrationDate: String(data.date_mise_circulation ?? "").trim(),
        fuel: String(data.energie ?? "").trim(),
        seats: num(data.places_assises),
        grossWeight: num(data.ptac_kg),
        axles: num(data.nombre_essieux),
        displacement: num(data.cylindree_cc),
        fiscalPower: num(data.puissance_fiscale_cv),
        curbWeight: num(data.pv_kg),
        payload: num(data.cu_kg),
        mileage: num(data.kilometrage),
        assignedDriver: String(data.conducteur ?? "").trim(),
      };
    }).filter((vehicle) => vehicle.plate);

    return Response.json({ vehicles, configured: true });
  } catch (error) {
    console.error("[fleet-vehicles] failed to read FleetGest vehicles:", error);
    return Response.json({ vehicles: [], configured: true, error: "read_failed" }, { status: 500 });
  }
}
