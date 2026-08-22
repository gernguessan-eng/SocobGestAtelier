"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  loadOrSeedCollection,
  loadOrSeedDoc,
  persist,
  removeDoc,
  saveDoc,
  saveDocs,
  saveSingletonDoc,
  subscribeToCollection,
  subscribeToDoc,
  uploadFileToStorage,
} from "@/lib/data-service";
import { exportToExcel, pickColumn, readExcelFile } from "@/lib/excel-io";

type IconName =
  | "grid"
  | "clipboard"
  | "calendar"
  | "truck"
  | "users"
  | "box"
  | "clock"
  | "settings"
  | "help"
  | "plus"
  | "bell"
  | "chevronDown"
  | "chevronRight"
  | "chevronLeft"
  | "arrowUp"
  | "arrowDown"
  | "more"
  | "search"
  | "filter"
  | "alert"
  | "check"
  | "pause"
  | "wrench"
  | "trend"
  | "x"
  | "sparkle"
  | "refresh"
  | "printer"
  | "download"
  | "upload"
  | "edit"
  | "save"
  | "trash"
  | "close"
  | "calendarRange";

function Icon({ name, size = 18, strokeWidth = 1.8 }: { name: IconName; size?: number; strokeWidth?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

  switch (name) {
    case "grid":
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    case "clipboard":
      return <svg {...common}><rect x="4" y="4" width="16" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M8 10h8M8 14h5" /></svg>;
    case "calendar":
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></svg>;
    case "calendarRange":
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h2M14 14h2M8 18h2M14 18h2" /></svg>;
    case "truck":
      return <svg {...common}><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /><path d="M14 14h7" /></svg>;
    case "users":
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 20c.5-3.2 2.4-5 6-5s5.5 1.8 6 5M16 5.2a3 3 0 0 1 0 5.6M18 15.2c1.8.8 2.8 2.4 3 4.8" /></svg>;
    case "box":
      return <svg {...common}><path d="m4 8 8-4 8 4v9l-8 4-8-4zM4 8l8 4 8-4M12 12v9M8 6l8 4" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></svg>;
    case "settings":
      return <svg {...common}><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" /><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3.1 1.3v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3.1-1.3l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-1.3-3.1h-.2a1.8 1.8 0 0 1 0-3.6h.2A1.8 1.8 0 0 0 4.6 5l-.1-.1A1.8 1.8 0 0 1 7 2.4l.1.1a1.8 1.8 0 0 0 3.1-1.3V1a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3.1 1.3l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 1.3 3.1h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-1.3 3.2Z" /></svg>;
    case "help":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.5 2.5 0 1 1 4.2 1.8c-1.1.9-1.9 1.4-1.9 3M12 17h.01" /></svg>;
    case "plus":
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "bell":
      return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
    case "chevronDown":
      return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>;
    case "chevronRight":
      return <svg {...common}><path d="m9 6 6 6-6 6" /></svg>;
    case "chevronLeft":
      return <svg {...common}><path d="m15 6-6 6 6 6" /></svg>;
    case "arrowUp":
      return <svg {...common}><path d="M12 19V5M6 11l6-6 6 6" /></svg>;
    case "arrowDown":
      return <svg {...common}><path d="M12 5v14M18 13l-6 6-6-6" /></svg>;
    case "more":
      return <svg {...common}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></svg>;
    case "search":
      return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>;
    case "filter":
      return <svg {...common}><path d="M4 6h16M7 12h10M10 18h4" /></svg>;
    case "alert":
      return <svg {...common}><path d="m12 3 9 17H3L12 3Z" /><path d="M12 9v4M12 16h.01" /></svg>;
    case "check":
      return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
    case "pause":
      return <svg {...common}><path d="M9 5v14M15 5v14" /></svg>;
    case "wrench":
      return <svg {...common}><path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L4 17a2.1 2.1 0 1 0 3 3l5.5-5.5a4 4 0 0 0 5.2-5.2l-2.4 2.4-2.1-.7-.7-2.1 2.2-2.6Z" /></svg>;
    case "trend":
      return <svg {...common}><path d="M4 17 9 12l3 3 7-8" /><path d="M15 7h4v4" /></svg>;
    case "x":
    case "close":
      return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "sparkle":
      return <svg {...common}><path d="m12 3 1.2 5.8L19 11l-5.8 1.2L12 18l-1.2-5.8L5 11l5.8-2.2L12 3ZM19 16l.5 2.5L22 19l-2.5.5L19 22l-.5-2.5L16 19l2.5-.5L19 16Z" /></svg>;
    case "refresh":
      return <svg {...common}><path d="M20 11a8 8 0 0 0-14.6-4L3 10M3 5v5h5M4 13a8 8 0 0 0 14.6 4L21 14m0 5v-5h-5" /></svg>;
    case "printer":
      return <svg {...common}><rect x="4" y="12" width="16" height="8" rx="2" /><path d="M6 12V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" /><path d="M8 16h.01M16 16h.01" /><path d="M6 12h12" /></svg>;
    case "download":
      return <svg {...common}><path d="M12 15V3M6 15l6 6 6-6" /></svg>;
    case "upload":
      return <svg {...common}><path d="M12 3v12M6 9l6-6 6 6" /></svg>;
    case "edit":
      return <svg {...common}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
    case "save":
      return <svg {...common}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></svg>;
    case "trash":
      return <svg {...common}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
  }
}

// Types
type OrderPart = { itemId: string; itemName: string; quantity: number };
type Order = {
  id: string;
  vehicleId: string;
  vehicle: string;
  plate: string;
  issue: string;
  mechanic: string;
  initials: string;
  duration: string;
  startTime: string;
  endTime: string;
  status: "En cours" | "À contrôler" | "En attente" | "Planifié" | "Terminé";
  statusTone: "orange" | "blue" | "red" | "slate" | "green";
  startDate: string;
  endDate: string;
  cost: number;
  parts: OrderPart[];
  legacyParts?: string[];
};

type Mechanic = {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  state: "En intervention" | "Disponible" | "Pause" | "Absent";
  stateTone: "working" | "available" | "pause" | "absent";
  email: string;
  phone: string;
  specialties: string[];
  startDate: string;
};

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
  mileage: number;
  status: "Opérationnel" | "En réparation" | "Immobilisé" | "Hors service";
  statusDate: string;
  lastRevisionKm: number;
  nextRevisionKm: number;
  lastMaintenance: string;
  nextMaintenance: string;
  assignedDriver: string;
  ownerName: string;
  ownerAddress: string;
  commercialType: string;
  typeCode: string;
  bodyType: string;
  color: string;
  fuel: string;
  seats: number;
  fiscalPower: number;
  enginePower: number;
  displacement: number;
  grossWeight: number;
  curbWeight: number;
  payload: number;
  axles: number;
  vin: string;
  registrationDate: string;
  inspectionDate: string;
};

type StockItem = {
  id: string;
  name: string;
  ref: string;
  category: string;
  quantity: number;
  minLevel: number;
  unitPrice: number;
  totalValue: number;
  supplier: string;
  location: string;
  lastEntry: string;
  level: "critique" | "bas" | "normal";
  percent: number;
};

type ExitReason = "Ordre atelier" | "Sortie manuelle" | "Casse / Perte" | "Retour fournisseur" | "Ajustement inventaire";
type StockExit = {
  id: string;
  itemId: string;
  itemName: string;
  date: string;
  quantity: number;
  reason: ExitReason;
  targetVehicle?: string;
  targetOrder?: string;
  notes: string;
};

type PresenceStatus = "Présent" | "Absent" | "En pause";
type PresenceEntry = { mechanicId: string; date: string; status: PresenceStatus; arrival: string; departure: string };
type KpiDetail = "time" | "parts" | "stock" | "immobilized" | null;

const formatFCFA = (amount: number) => `${new Intl.NumberFormat("fr-CI", { maximumFractionDigits: 0 }).format(amount)} FCFA`;
const isInPeriod = (date: string, from: string, to: string) => Boolean(date && date >= from && date <= to);
const minutesBetween = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return 0;
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const result = endHour * 60 + endMinute - startHour * 60 - startMinute;
  return result > 0 ? result : 0;
};
const durationLabel = (minutes: number) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}`;
const toneForOrderStatus = (status: Order["status"]): Order["statusTone"] =>
  status === "En cours" ? "orange" : status === "À contrôler" ? "blue" : status === "En attente" ? "red" : status === "Terminé" ? "green" : "slate";
// A vehicle is "En réparation" as long as it has at least one order that
// has actually started (not just planned) and isn't finished yet.
const vehicleStatusFromOrders = (vehicleId: string, ordersList: Order[]): Vehicle["status"] =>
  ordersList.some((order) => order.vehicleId === vehicleId && order.status !== "Terminé" && order.status !== "Planifié")
    ? "En réparation"
    : "Opérationnel";
const stateToneFor = (status: PresenceStatus): Mechanic["stateTone"] => status === "Présent" ? "working" : status === "En pause" ? "pause" : "absent";
const presenceDocId = (entry: PresenceEntry) => `${entry.mechanicId}_${entry.date}`;

function getCurrentWeekRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday ... 6 = Saturday
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(monday), to: fmt(saturday) };
}

// Firestore collection names.
const ORDERS_COLLECTION = "orders";
const MECHANICS_COLLECTION = "mechanics";
const VEHICLES_COLLECTION = "vehicles";
const STOCK_COLLECTION = "stock";
const STOCK_EXITS_COLLECTION = "stockExits";
const PRESENCE_COLLECTION = "presence";
const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC_ID = "app";

// Initial data
const initialOrders: Order[] = [
  { id: "OR-2048", vehicleId: "V001", vehicle: "Renault Master", plate: "AB-482-CD", issue: "Révision freinage", mechanic: "Alex Morel", initials: "AM", duration: "1h 20", startTime: "08:10", endTime: "09:30", status: "En cours", statusTone: "orange", startDate: "2024-10-24", endDate: "2024-10-24", cost: 295000, parts: [{ itemId: "P002", itemName: "Plaquettes frein AV", quantity: 1 }] },
  { id: "OR-2046", vehicleId: "V002", vehicle: "Peugeot Boxer", plate: "EF-715-GH", issue: "Voyant moteur", mechanic: "Sofia Benali", initials: "SB", duration: "3h 45", startTime: "08:00", endTime: "11:45", status: "À contrôler", statusTone: "blue", startDate: "2024-10-23", endDate: "2024-10-24", cost: 183500, parts: [{ itemId: "P003", itemName: "Huile moteur 5W30", quantity: 4 }] },
  { id: "OR-2044", vehicleId: "V003", vehicle: "Citroën Jumper", plate: "JK-093-LM", issue: "Vidange + filtres", mechanic: "Thomas Roy", initials: "TR", duration: "0h 50", startTime: "10:00", endTime: "10:50", status: "En attente", statusTone: "red", startDate: "2024-10-25", endDate: "2024-10-25", cost: 78700, parts: [{ itemId: "P001", itemName: "Filtre à huile", quantity: 1 }, { itemId: "P003", itemName: "Huile moteur 5W30", quantity: 5 }] },
  { id: "OR-2041", vehicleId: "V004", vehicle: "Ford Transit", plate: "NP-622-QR", issue: "Pneumatiques", mechanic: "Nina Garcia", initials: "NG", duration: "1h 30", startTime: "08:30", endTime: "10:00", status: "Planifié", statusTone: "slate", startDate: "2024-10-25", endDate: "2024-10-25", cost: 446000, parts: [{ itemId: "P004", itemName: "Pneus 215/75R16", quantity: 2 }] },
];

const initialMechanics: Mechanic[] = [
  { id: "M001", name: "Alex Morel", role: "Mécanicien expert", initials: "AM", color: "#e7b783", state: "En intervention", stateTone: "working", email: "a.morel@entreprise.fr", phone: "06 12 34 56 78", specialties: ["Moteur diesel", "Freinage"], startDate: "2020-03-15" },
  { id: "M002", name: "Sofia Benali", role: "Diagnostic électronique", initials: "SB", color: "#a8c2bf", state: "En intervention", stateTone: "working", email: "s.benali@entreprise.fr", phone: "06 23 45 67 89", specialties: ["Électronique", "Injection"], startDate: "2021-06-01" },
  { id: "M003", name: "Thomas Roy", role: "Mécanicien polyvalent", initials: "TR", color: "#c4b5d4", state: "Pause", stateTone: "pause", email: "t.roy@entreprise.fr", phone: "06 34 56 78 90", specialties: ["Mécanique générale", "Climatisation"], startDate: "2019-09-10" },
  { id: "M004", name: "Nina Garcia", role: "Pneumatiques & freinage", initials: "NG", color: "#e7c7a3", state: "Disponible", stateTone: "available", email: "n.garcia@entreprise.fr", phone: "06 45 67 89 01", specialties: ["Pneumatiques", "Freinage", "Suspension"], startDate: "2022-01-20" },
  { id: "M005", name: "Karim Diallo", role: "Carrosserie", initials: "KD", color: "#b8d4c8", state: "Absent", stateTone: "absent", email: "k.diallo@entreprise.fr", phone: "06 56 78 90 12", specialties: ["Carrosserie", "Peinture"], startDate: "2018-11-05" },
];

const initialVehicles: Vehicle[] = [
  { id: "V001", brand: "Renault", model: "Master", plate: "AB-482-CD", year: 2021, mileage: 45000, status: "En réparation", statusDate: "2024-10-24", lastRevisionKm: 40000, nextRevisionKm: 60000, lastMaintenance: "2024-08-15", nextMaintenance: "2024-11-15", assignedDriver: "Jean Dupont", ownerName: "MECANOVA Côte d'Ivoire", ownerAddress: "Abidjan, Zone industrielle de Yopougon", commercialType: "Master L2H2", typeCode: "VF1FDC4A", bodyType: "Fourgon", color: "Blanc", fuel: "Gasoil", seats: 3, fiscalPower: 9, enginePower: 110, displacement: 2299, grossWeight: 3500, curbWeight: 2190, payload: 1310, axles: 2, vin: "VF1FDC4A657832101", registrationDate: "2021-04-12", inspectionDate: "2025-04-11" },
  { id: "V002", brand: "Peugeot", model: "Boxer", plate: "EF-715-GH", year: 2020, mileage: 62000, status: "En réparation", statusDate: "2024-10-23", lastRevisionKm: 55000, nextRevisionKm: 75000, lastMaintenance: "2024-07-20", nextMaintenance: "2024-10-30", assignedDriver: "Marie Lefebvre", ownerName: "MECANOVA Côte d'Ivoire", ownerAddress: "Abidjan, Zone industrielle de Yopougon", commercialType: "Boxer 330 L2H2", typeCode: "YBAMFB", bodyType: "Fourgon", color: "Gris", fuel: "Gasoil", seats: 3, fiscalPower: 8, enginePower: 103, displacement: 2198, grossWeight: 3300, curbWeight: 2110, payload: 1190, axles: 2, vin: "VF3YBAMFB12A48920", registrationDate: "2020-09-08", inspectionDate: "2024-09-07" },
  { id: "V003", brand: "Citroën", model: "Jumper", plate: "JK-093-LM", year: 2022, mileage: 28000, status: "En réparation", statusDate: "2024-10-25", lastRevisionKm: 20000, nextRevisionKm: 40000, lastMaintenance: "2024-09-01", nextMaintenance: "2024-12-01", assignedDriver: "Pierre Martin", ownerName: "MECANOVA Côte d'Ivoire", ownerAddress: "Abidjan, Zone industrielle de Yopougon", commercialType: "Jumper 35 L3H2", typeCode: "YAAMFC", bodyType: "Fourgon", color: "Blanc", fuel: "Gasoil", seats: 3, fiscalPower: 9, enginePower: 120, displacement: 2200, grossWeight: 3500, curbWeight: 2305, payload: 1195, axles: 2, vin: "VF7YAAMFC12B73145", registrationDate: "2022-02-17", inspectionDate: "2026-02-16" },
  { id: "V004", brand: "Ford", model: "Transit", plate: "NP-622-QR", year: 2021, mileage: 51000, status: "Opérationnel", statusDate: "2024-10-18", lastRevisionKm: 45000, nextRevisionKm: 65000, lastMaintenance: "2024-06-10", nextMaintenance: "2024-10-28", assignedDriver: "Sophie Bernard", ownerName: "MECANOVA Côte d'Ivoire", ownerAddress: "Abidjan, Zone industrielle de Yopougon", commercialType: "Transit 350 L3", typeCode: "TTG", bodyType: "Fourgon", color: "Bleu", fuel: "Gasoil", seats: 3, fiscalPower: 8, enginePower: 96, displacement: 1995, grossWeight: 3500, curbWeight: 2250, payload: 1250, axles: 2, vin: "WF0XXXTTGXMB38201", registrationDate: "2021-05-21", inspectionDate: "2025-05-20" },
  { id: "V005", brand: "Mercedes", model: "Sprinter", plate: "ST-384-UV", year: 2023, mileage: 15000, status: "Opérationnel", statusDate: "2024-10-10", lastRevisionKm: 10000, nextRevisionKm: 30000, lastMaintenance: "2024-09-15", nextMaintenance: "2025-03-15", assignedDriver: "Lucas Petit", ownerName: "MECANOVA Côte d'Ivoire", ownerAddress: "Abidjan, Zone industrielle de Yopougon", commercialType: "Sprinter 314 CDI", typeCode: "907", bodyType: "Fourgon", color: "Noir", fuel: "Gasoil", seats: 3, fiscalPower: 9, enginePower: 105, displacement: 2143, grossWeight: 3500, curbWeight: 2260, payload: 1240, axles: 2, vin: "W1V9076331P607981", registrationDate: "2023-01-16", inspectionDate: "2027-01-15" },
];

const initialStock: StockItem[] = [
  { id: "P001", name: "Filtre à huile", ref: "FH-204", category: "Filtration", quantity: 3, minLevel: 5, unitPrice: 10168, totalValue: 30504, supplier: "Mann Filter", location: "Étagère A-12", lastEntry: "2024-09-15", level: "critique", percent: 18 },
  { id: "P002", name: "Plaquettes frein AV", ref: "PF-118", category: "Freinage", quantity: 6, minLevel: 8, unitPrice: 81338, totalValue: 488028, supplier: "Brembo", location: "Étagère B-03", lastEntry: "2024-08-20", level: "bas", percent: 34 },
  { id: "P003", name: "Huile moteur 5W30", ref: "HL-530", category: "Lubrifiants", quantity: 42, minLevel: 60, unitPrice: 7872, totalValue: 330624, supplier: "Total", location: "Zone C-05", lastEntry: "2024-10-10", level: "normal", percent: 56 },
  { id: "P004", name: "Pneus 215/75R16", ref: "PN-21575", category: "Pneumatiques", quantity: 8, minLevel: 4, unitPrice: 95114, totalValue: 760912, supplier: "Michelin", location: "Rack D-01", lastEntry: "2024-09-28", level: "normal", percent: 85 },
  { id: "P005", name: "Batterie 12V 100Ah", ref: "BT-100", category: "Électricité", quantity: 2, minLevel: 3, unitPrice: 123978, totalValue: 247956, supplier: "Varta", location: "Étagère E-08", lastEntry: "2024-08-05", level: "critique", percent: 25 },
];

const initialStockExits: StockExit[] = [
  { id: "S001", itemId: "P001", itemName: "Filtre à huile", date: "2024-10-24", quantity: 2, reason: "Ordre atelier", targetVehicle: "AB-482-CD", targetOrder: "OR-2048", notes: "Sortie atelier pour Renault Master 2021 (AB-482-CD)" },
  { id: "S002", itemId: "P002", itemName: "Plaquettes frein AV", date: "2024-10-23", quantity: 1, reason: "Ordre atelier", targetVehicle: "AB-482-CD", targetOrder: "OR-2048", notes: "Sortie atelier pour Renault Master 2021 (AB-482-CD)" },
  { id: "S003", itemId: "P003", itemName: "Huile moteur 5W30", date: "2024-10-22", quantity: 5, reason: "Ordre atelier", targetVehicle: "EF-715-GH", targetOrder: "OR-2046", notes: "Sortie atelier pour Peugeot Boxer 2020 (EF-715-GH)" },
];

const initialPresenceEntries: PresenceEntry[] = [
  { mechanicId: "M001", date: "2024-10-24", status: "Présent", arrival: "07:45", departure: "17:00" },
  { mechanicId: "M002", date: "2024-10-24", status: "Présent", arrival: "07:50", departure: "17:00" },
  { mechanicId: "M003", date: "2024-10-24", status: "En pause", arrival: "07:40", departure: "17:00" },
  { mechanicId: "M004", date: "2024-10-24", status: "Présent", arrival: "08:00", departure: "17:00" },
  { mechanicId: "M005", date: "2024-10-24", status: "Absent", arrival: "", departure: "" },
];

const chartSeven = [46, 62, 55, 78, 69, 88, 74];
const chartThirty = [34, 43, 38, 58, 46, 61, 53, 72, 64, 78, 68, 86];
const daysSeven = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Aujourd'hui"];
const daysThirty = ["01", "04", "07", "10", "13", "16", "19", "22", "25", "28", "31", "Aujourd'hui"];

const navSections: Array<{ label: string; items: Array<{ label: string; icon: IconName; badge?: "orders" | "stock" }> }> = [
  { label: "PILOTAGE", items: [{ label: "Vue d'ensemble", icon: "grid" }] },
  { label: "EXPLOITATION", items: [{ label: "Ordres de réparation", icon: "clipboard", badge: "orders" }, { label: "Planning atelier", icon: "calendar" }, { label: "Véhicules", icon: "truck" }] },
  { label: "RESSOURCES", items: [{ label: "Mécaniciens", icon: "users" }, { label: "Stocks", icon: "box", badge: "stock" }, { label: "Présences", icon: "clock" }] },
];

function Avatar({ initials, color, small = false, photoURL }: { initials: string; color?: string; small?: boolean; photoURL?: string | null }) {
  if (photoURL) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoURL} alt="" className={`avatar avatar-photo ${small ? "avatar-small" : ""}`} />;
  }
  return <span className={`avatar ${small ? "avatar-small" : ""}`} style={{ background: color ?? "#dce6ef" }}>{initials}</span>;
}

function StatCard({ icon, label, value, detail, trend, direction, accent, onClick }: { icon: IconName; label: string; value: string; detail: string; trend: string; direction: "up" | "down"; accent: string; onClick?: () => void }) {
  return (
    <article className={`stat-card ${onClick ? "clickable" : ""}`} onClick={onClick}>
      <div className="stat-card-top">
        <div className={`stat-icon ${accent}`}><Icon name={icon} size={18} /></div>
        <button className="icon-button muted-button" onClick={(e) => e.stopPropagation()} aria-label={`Options ${label}`}><Icon name="more" size={19} /></button>
      </div>
      <p className="stat-label">{label}</p>
      <div className="stat-value-row"><h2>{value}</h2><span className={`trend ${direction}`}><Icon name={direction === "up" ? "arrowUp" : "arrowDown"} size={12} /> {trend}</span></div>
      <p className="stat-detail">{detail}</p>
    </article>
  );
}

function PeriodSelector({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  return (
    <div className="period-selector">
      <Icon name="calendarRange" size={15} />
      <label>
        <span>Du:</span>
        <input type="date" value={from} onChange={(e) => onChange(e.target.value, to)} />
      </label>
      <label>
        <span>Au:</span>
        <input type="date" value={to} onChange={(e) => onChange(from, e.target.value)} />
      </label>
    </div>
  );
}

function ActionButtons({ onPrint, onExport, onImport }: { onPrint?: () => void; onExport?: () => void; onImport?: () => void }) {
  return (
    <div className="action-buttons">
      {onPrint && <button className="icon-action-btn labeled" onClick={onPrint} title="Imprimer"><Icon name="printer" size={16} /><span>Imprimer</span></button>}
      {onExport && <button className="icon-action-btn labeled" onClick={onExport} title="Exporter en Excel (.xlsx)"><Icon name="download" size={16} /><span>Exporter</span></button>}
      {onImport && <button className="icon-action-btn labeled" onClick={onImport} title="Importer un fichier Excel (.xlsx)"><Icon name="upload" size={16} /><span>Importer</span></button>}
    </div>
  );
}

import { updateUserProfile, type UserProfile } from "@/lib/auth-service";

type DashboardShellProps = {
  currentUser: UserProfile;
  onLogout: () => Promise<void>;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function DashboardShell({ currentUser, onLogout }: DashboardShellProps) {
  const profile = currentUser;
  const currentUserInitials = initialsFromName(profile.username);
  const currentUserFirstName = profile.username.trim().split(/\s+/)[0] || profile.username;
  const [activeNav, setActiveNav] = useState("Vue d'ensemble");
  const [orders, setOrders] = useState<Order[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [stockExits, setStockExits] = useState<StockExit[]>([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [modalDirty, setModalDirty] = useState(false);
  const [showMechanicForm, setShowMechanicForm] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [showStockExitForm, setShowStockExitForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const [loggingOut, setLoggingOut] = useState(false);
  const [notice, setNotice] = useState("");
  const [stockFilter, setStockFilter] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [mechanicSearch, setMechanicSearch] = useState("");
  const [exitSearch, setExitSearch] = useState("");
  const [exitReason, setExitReason] = useState<string>("Tous les motifs");
  const importInputRef = useRef<HTMLInputElement>(null);
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [quickExitItem, setQuickExitItem] = useState<StockItem | null>(null);
  const [quickExitQty, setQuickExitQty] = useState(1);
  
  // Period states for each module.
  // Wide bounds (rather than the Oct-2024 demo window) so real records
  // created today - or any day - are never silently filtered out of view.
  const [dashboardPeriod, setDashboardPeriod] = useState({ from: "2020-01-01", to: "2035-12-31" });
  const [orderPeriod, setOrderPeriod] = useState({ from: "2020-01-01", to: "2035-12-31" });
  const [mechanicPeriod, setMechanicPeriod] = useState({ from: "2020-01-01", to: "2035-12-31" });
  const [vehiclePeriod, setVehiclePeriod] = useState({ from: "2020-01-01", to: "2035-12-31" });
  const [stockPeriod, setStockPeriod] = useState({ from: "2020-01-01", to: "2035-12-31" });
  const [planningPeriod, setPlanningPeriod] = useState(() => getCurrentWeekRange());
  const [presenceDate, setPresenceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [presenceEntries, setPresenceEntries] = useState<PresenceEntry[]>([]);
  const [selectedKpi, setSelectedKpi] = useState<KpiDetail>(null);
  
  // Settings state
  const [settings, setSettings] = useState({
    workshopName: "Atelier Central",
    emailNotifications: true,
    autoAssign: true,
    alertThreshold: 20,
    currency: "FCFA",
    language: "FR",
    alertEmails: [] as string[],
    garageCapacity: 10,
    moduleOrder: {} as Record<string, string[]>
  });
  const [alertEmailDraft, setAlertEmailDraft] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  // Initial load from Firestore (seeds the demo dataset the first time the
  // Firestore project is empty, then reads from it on every subsequent load).
  useEffect(() => {
    let cancelled = false;
    const unsubscribers: Array<() => void> = [];
    (async () => {
      try {
        // One-time bootstrap: seed the demo dataset only if Firestore is
        // still empty (brand-new project). On every subsequent load this
        // just reads back whatever is already there.
        const [loadedOrders, , loadedVehicles] = await Promise.all([
          loadOrSeedCollection<Order>(ORDERS_COLLECTION, initialOrders),
          loadOrSeedCollection<Mechanic>(MECHANICS_COLLECTION, initialMechanics),
          loadOrSeedCollection<Vehicle>(VEHICLES_COLLECTION, initialVehicles),
          loadOrSeedCollection<StockItem>(STOCK_COLLECTION, initialStock),
          loadOrSeedCollection<StockExit>(STOCK_EXITS_COLLECTION, initialStockExits),
          loadOrSeedDoc(SETTINGS_COLLECTION, SETTINGS_DOC_ID, settings),
        ]);
        const seededPresenceEntries = initialPresenceEntries.map((entry) => ({ ...entry, id: presenceDocId(entry) }));
        await loadOrSeedCollection<PresenceEntry & { id: string }>(PRESENCE_COLLECTION, seededPresenceEntries);
        // One-time correction so vehicle statuses already match their
        // orders before live sync takes over.
        const reconciledVehicles = loadedVehicles.map((vehicle) => {
          const nextStatus = vehicleStatusFromOrders(vehicle.id, loadedOrders);
          return nextStatus !== vehicle.status ? { ...vehicle, status: nextStatus, statusDate: new Date().toISOString().slice(0, 10) } : vehicle;
        });
        const changedVehicles = reconciledVehicles.filter((vehicle, idx) => vehicle !== loadedVehicles[idx]);
        if (changedVehicles.length) persist(saveDocs(VEHICLES_COLLECTION, changedVehicles), "vehicle status reconciliation");
        if (cancelled) return;

        // From here on, the app stays live-synced with Firestore: any
        // change made by any user, on any device, updates everyone's
        // screen automatically — no manual refresh needed anywhere.
        unsubscribers.push(subscribeToCollection<Order>(ORDERS_COLLECTION, setOrders));
        unsubscribers.push(subscribeToCollection<Mechanic>(MECHANICS_COLLECTION, setMechanics));
        unsubscribers.push(subscribeToCollection<Vehicle>(VEHICLES_COLLECTION, setVehicles));
        unsubscribers.push(subscribeToCollection<StockItem>(STOCK_COLLECTION, setStock));
        unsubscribers.push(subscribeToCollection<StockExit>(STOCK_EXITS_COLLECTION, setStockExits));
        unsubscribers.push(subscribeToCollection<PresenceEntry & { id: string }>(PRESENCE_COLLECTION, setPresenceEntries));
        unsubscribers.push(subscribeToDoc<typeof settings>(SETTINGS_COLLECTION, SETTINGS_DOC_ID, (value) => {
          if (value) setSettings((current) => ({ ...current, ...value, alertEmails: value.alertEmails ?? [], garageCapacity: value.garageCapacity || current.garageCapacity, moduleOrder: value.moduleOrder ?? {} }));
        }));
      } catch (error) {
        console.error("[firestore] initial load failed:", error);
      } finally {
        if (!cancelled) setDataReady(true);
      }
    })();
    return () => {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const todayLabelCapitalized = todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1);
  const criticalStockAlerts = stock.filter((item) => item.level === "critique");
  const missingCheckIns = mechanics.filter((mechanic) => {
    if (mechanic.state === "Absent") return false;
    const entry = presenceEntries.find((item) => item.mechanicId === mechanic.id && item.date === todayIso);
    return !entry || !entry.arrival;
  });
  const allNotifications = [
    ...criticalStockAlerts.slice(0, 3).map((item) => ({ id: `stock-${item.id}`, tone: "red" as const, icon: "alert" as const, title: "Stock critique", text: `${item.name} : ${item.quantity} unité(s) restante(s).`, target: "Stocks" })),
    ...missingCheckIns.slice(0, 3).map((mechanic) => ({ id: `presence-${mechanic.id}`, tone: "blue" as const, icon: "clock" as const, title: "Pointage manquant", text: `Le pointage de ${mechanic.name} est attendu.`, target: "Présences" })),
  ];
  const notifications = allNotifications.filter((item) => !dismissedNotifications.has(item.id));
  const orderInPeriod = (item: Order, range: { from: string; to: string }) => isInPeriod(item.startDate, range.from, range.to);
  const orderedNavSections = useMemo(() => navSections.map((section) => {
    const customOrder = settings.moduleOrder[section.label];
    if (!customOrder || !customOrder.length) return section;
    const itemsByLabel = new Map(section.items.map((item) => [item.label, item]));
    const ordered = customOrder.map((label) => itemsByLabel.get(label)).filter((item): item is (typeof section.items)[number] => Boolean(item));
    const missing = section.items.filter((item) => !customOrder.includes(item.label));
    return { ...section, items: [...ordered, ...missing] };
  }), [settings.moduleOrder]);

  function moveModule(sectionLabel: string, itemLabel: string, direction: -1 | 1) {
    const section = orderedNavSections.find((s) => s.label === sectionLabel);
    if (!section) return;
    const labels = section.items.map((i) => i.label);
    const idx = labels.indexOf(itemLabel);
    const swapWith = idx + direction;
    if (swapWith < 0 || swapWith >= labels.length) return;
    [labels[idx], labels[swapWith]] = [labels[swapWith], labels[idx]];
    setSettings((current) => ({ ...current, moduleOrder: { ...current.moduleOrder, [sectionLabel]: labels } }));
  }

  function saveModuleOrder() {
    persist(saveSingletonDoc(SETTINGS_COLLECTION, SETTINGS_DOC_ID, settings), "saveModuleOrder");
    setReorderMode(false);
    flash("Disposition du menu enregistrée.");
  }

  const orderList = orders
    .filter((item) => orderInPeriod(item, orderPeriod))
    .filter((item) => {
      const search = orderSearch.trim().toLowerCase();
      if (!search) return true;
      return [item.id, item.vehicle, item.plate, item.issue, item.mechanic, item.status].some((field) => field.toLowerCase().includes(search));
    });
  const dashboardOrders = orders.filter((item) => orderInPeriod(item, dashboardPeriod));
  const planningOrders = orders.filter((item) => orderInPeriod(item, planningPeriod));
  const vehicleList = vehicles
    .filter((item) => isInPeriod(item.statusDate, vehiclePeriod.from, vehiclePeriod.to))
    .filter((item) => {
      const search = vehicleSearch.trim().toLowerCase();
      if (!search) return true;
      return [item.brand, item.model, item.plate, item.assignedDriver, item.status, item.ownerName].some((field) => field.toLowerCase().includes(search));
    });
  const mechanicList = mechanics
    .filter((item) => item.startDate <= mechanicPeriod.to)
    .filter((item) => {
      const search = mechanicSearch.trim().toLowerCase();
      if (!search) return true;
      return [item.name, item.role, item.email, item.phone, item.state, ...item.specialties].some((field) => field.toLowerCase().includes(search));
    });
  const stockMovements = stockExits.filter((item) => isInPeriod(item.date, stockPeriod.from, stockPeriod.to));
  const dashboardExits = stockExits.filter((item) => isInPeriod(item.date, dashboardPeriod.from, dashboardPeriod.to));
  const displayedStock = useMemo(() => {
    const stockInPeriod = stock.filter((item) => isInPeriod(item.lastEntry, stockPeriod.from, stockPeriod.to));
    const visible = stockInPeriod.length ? stockInPeriod : stock;
    return stockFilter ? visible.filter((item) => item.level === "critique" || item.level === "bas") : visible;
  }, [stockFilter, stock, stockPeriod]);
  const totalStockValue = stock.reduce((sum, item) => sum + item.totalValue, 0);
  const dashboardPartsValue = dashboardExits.reduce((sum, exit) => sum + (stock.find((item) => item.id === exit.itemId)?.unitPrice ?? 0) * exit.quantity, 0);
  const averageRepairMinutes = dashboardOrders.length ? Math.round(dashboardOrders.reduce((sum, order) => sum + minutesBetween(order.startTime, order.endTime), 0) / dashboardOrders.length) : 0;
  const immobilizedVehicles = vehicles.filter((item) => (item.status === "Immobilisé" || item.status === "En réparation") && isInPeriod(item.statusDate, dashboardPeriod.from, dashboardPeriod.to));
  // "En travaux" = tout ordre déjà arrivé à l'atelier, à l'exclusion des
  // rendez-vous simplement planifiés (véhicule pas encore sur place).
  const vehiclesInGarage = orders.filter((item) => item.status !== "Planifié" && item.status !== "Terminé" && item.startDate <= todayIso && item.endDate >= todayIso).length;
  const garageOccupationRate = settings.garageCapacity > 0 ? Math.round((vehiclesInGarage / settings.garageCapacity) * 100) : 0;
  const [dashboardStatusFilter, setDashboardStatusFilter] = useState<"Tous" | Order["status"]>("Tous");
  const [capacityChartRange, setCapacityChartRange] = useState<"7" | "30">("7");
  const capacityChartDays = useMemo(() => {
    const count = capacityChartRange === "7" ? 7 : 30;
    const days: string[] = [];
    for (let i = count - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, [capacityChartRange]);
  const capacityChartCounts = capacityChartDays.map((day, idx) =>
    idx === capacityChartDays.length - 1
      ? vehiclesInGarage
      : orders.filter((order) => order.status !== "Planifié" && order.startDate <= day && order.endDate >= day).length
  );
  const capacityChartMax = Math.max(settings.garageCapacity, ...capacityChartCounts, 1);
  const capacityChartLabels = capacityChartDays.map((day, idx) => {
    if (idx === capacityChartDays.length - 1) return "Aujourd'hui";
    const d = new Date(`${day}T12:00:00`);
    return capacityChartRange === "7" ? new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(d).replace(".", "") : String(d.getDate()).padStart(2, "0");
  });
  const presenceForDay = (mechanicId: string, date: string): PresenceEntry => presenceEntries.find((entry) => entry.mechanicId === mechanicId && entry.date === date) ?? { mechanicId, date, status: "Absent", arrival: "", departure: "" };
  const presenceCounts = mechanics.reduce((counts, mechanic) => {
    const status = presenceForDay(mechanic.id, presenceDate).status;
    if (status === "Présent") counts.present += 1;
    if (status === "Absent") counts.absent += 1;
    if (status === "En pause") counts.pause += 1;
    return counts;
  }, { present: 0, absent: 0, pause: 0 });
  const planningDays = useMemo(() => {
    const days: string[] = [];
    const cursor = new Date(`${planningPeriod.from}T12:00:00`);
    const end = new Date(`${planningPeriod.to}T12:00:00`);
    while (cursor <= end && days.length < 14) {
      days.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [planningPeriod]);
  const filteredStock = useMemo(() => {
    const search = stockSearch.trim().toLowerCase();
    const base = stockFilter ? stock.filter((item) => item.level === "critique" || item.level === "bas") : stock;
    return search ? base.filter((item) => `${item.ref} ${item.name} ${item.supplier} ${item.category}`.toLowerCase().includes(search)) : base;
  }, [stock, stockSearch, stockFilter]);
  const filteredExits = useMemo(() => {
    const search = exitSearch.trim().toLowerCase();
    return stockMovements.filter((exit) => {
      if (exitReason !== "Tous les motifs" && exit.reason !== exitReason) return false;
      if (!search) return true;
      return `${exit.itemName} ${stock.find((item) => item.id === exit.itemId)?.ref ?? ""} ${exit.targetVehicle ?? ""} ${exit.targetOrder ?? ""} ${exit.notes ?? ""}`.toLowerCase().includes(search);
    });
  }, [stockMovements, exitReason, exitSearch, stock]);
  const totalExitQuantity = filteredExits.reduce((sum, exit) => sum + exit.quantity, 0);
  const totalExitValue = filteredExits.reduce((sum, exit) => sum + (stock.find((item) => item.id === exit.itemId)?.unitPrice ?? 0) * exit.quantity, 0);

  function commanderStock(itemId: string, quantity = 5) {
    const updated = stock.map((item) => {
      if (item.id !== itemId) return item;
      const newQuantity = item.quantity + quantity;
      const newLevel: StockItem["level"] = newQuantity <= item.minLevel * 0.5 ? "critique" : newQuantity <= item.minLevel ? "bas" : "normal";
      return { ...item, quantity: newQuantity, totalValue: newQuantity * item.unitPrice, level: newLevel, percent: Math.min((newQuantity / (item.minLevel * 2)) * 100, 100), lastEntry: new Date().toISOString().slice(0, 10) };
    });
    const item = stock.find((entry) => entry.id === itemId);
    setStock(updated);
    const updatedItem = updated.find((entry) => entry.id === itemId);
    if (updatedItem) persist(saveDoc(STOCK_COLLECTION, updatedItem), "commanderStock");
    flash(`Réception de ${quantity} × ${item?.name ?? "article"} enregistrée.`);
  }

  function lancerSortieRapide(itemId: string) {
    const item = stock.find((entry) => entry.id === itemId);
    if (!item) return;
    if (item.quantity <= 0) {
      flash(`Stock épuisé pour ${item.name}.`);
      return;
    }
    setQuickExitQty(1);
    setQuickExitItem(item);
  }

  function expandPeriodToDate(date: string) {
    setStockPeriod((prev) => ({
      from: prev.from && prev.from <= date ? prev.from : date,
      to: prev.to && prev.to >= date ? prev.to : date,
    }));
  }

  function submitQuickExit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quickExitItem) return;
    const form = new FormData(event.currentTarget);
    const quantity = Math.max(1, parseInt(String(form.get("quantity"))) || 1);
    if (quantity > quickExitItem.quantity) {
      flash(`Stock insuffisant : ${quickExitItem.quantity} disponible(s).`);
      return;
    }
    const reason = String(form.get("reason")) as ExitReason;
    const notes = String(form.get("notes") ?? "");
    const exit: StockExit = {
      id: `S${String(stockExits.length + 1).padStart(3, "0")}`,
      itemId: quickExitItem.id,
      itemName: quickExitItem.name,
      date: new Date().toISOString().slice(0, 10),
      quantity,
      reason,
      notes,
    };
    const updatedStockAfterExit = stock.map((entry) => {
      if (entry.id !== quickExitItem.id) return entry;
      const newQty = entry.quantity - quantity;
      const newLevel: StockItem["level"] = newQty <= entry.minLevel * 0.5 ? "critique" : newQty <= entry.minLevel ? "bas" : "normal";
      return { ...entry, quantity: newQty, totalValue: newQty * entry.unitPrice, level: newLevel, percent: Math.min((newQty / (entry.minLevel * 2)) * 100, 100) };
    });
    setStockExits([exit, ...stockExits]);
    setStock(updatedStockAfterExit);
    persist(saveDoc(STOCK_EXITS_COLLECTION, exit), "submitQuickExit exit");
    const updatedStockItem = updatedStockAfterExit.find((entry) => entry.id === quickExitItem.id);
    if (updatedStockItem) persist(saveDoc(STOCK_COLLECTION, updatedStockItem), "submitQuickExit stock");
    expandPeriodToDate(exit.date);
    flash(`Sortie de ${quantity} × ${quickExitItem.name} enregistrée (${reason}). Le récapitulatif a été mis à jour.`);
    setQuickExitItem(null);
    setModalDirty(false);
  }

  // Keeps a vehicle's status aligned with its orders: "En réparation" while
  // any non-planned, non-finished order is open for it, "Opérationnel" once
  // none remain. `ordersList` lets callers pass the just-updated order list
  // so the check reflects the change that triggered it, not stale state.
  function syncVehicleStatus(vehicleId: string, ordersList: Order[]) {
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) return;
    const nextStatus = vehicleStatusFromOrders(vehicleId, ordersList);
    if (vehicle.status === nextStatus) return;
    const updatedVehicle: Vehicle = { ...vehicle, status: nextStatus, statusDate: new Date().toISOString().slice(0, 10) };
    setVehicles(vehicles.map((item) => item.id === vehicleId ? updatedVehicle : item));
    persist(saveDoc(VEHICLES_COLLECTION, updatedVehicle), "syncVehicleStatus");
  }

  // Any modal form calls this instead of closing directly. If the person
  // has typed something, it asks for confirmation first so a stray click
  // on the backdrop, the × button, or "Annuler" never silently discards
  // unsaved work.
  function confirmedClose(closeFn: () => void) {
    if (modalDirty && !window.confirm("Fermer sans enregistrer ? Les informations saisies seront perdues.")) {
      return;
    }
    setModalDirty(false);
    closeFn();
  }

  // Whenever a modal opens (or closes), it starts from a clean slate.
  useEffect(() => {
    setModalDirty(false);
  }, [showOrderForm, showMechanicForm, showVehicleForm, showStockForm, showStockExitForm, showSettingsModal, showProfileModal, selectedOrder, selectedMechanic, selectedVehicle, selectedStockItem, quickExitItem]);

  useEffect(() => {
    if (!showNotifications && !showUserMenu) return;
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest(".notification-wrap") && !target.closest(".user-wrap")) {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showNotifications, showUserMenu]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  function handleAddOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const vehicleId = String(form.get("vehicleId"));
    const vehicleRecord = vehicles.find((item) => item.id === vehicleId);
    if (!vehicleRecord) {
      flash("Veuillez sélectionner un véhicule dans la liste.");
      return;
    }
    const issue = String(form.get("issue") || "Diagnostic à réaliser");
    const priority = String(form.get("priority") || "Normale");
    const startDate = String(form.get("startDate"));
    const endDate = String(form.get("endDate"));
    const startTime = String(form.get("startTime"));
    const endTime = String(form.get("endTime"));
    const nextNumber = 2048 + orders.length + 1;
    const urgent = priority === "Urgente";
    const minutes = minutesBetween(startTime, endTime);
    const newOrder: Order = {
      id: `OR-${nextNumber}`,
      vehicleId,
      vehicle: `${vehicleRecord.brand} ${vehicleRecord.model}`,
      plate: vehicleRecord.plate,
      issue,
      mechanic: "À affecter",
      initials: "--",
      duration: minutes ? durationLabel(minutes) : "À estimer",
      startTime,
      endTime,
      status: "En attente",
      statusTone: urgent ? "red" : "slate",
      startDate,
      endDate,
      cost: 0,
      parts: []
    };
    setOrders((current) => [newOrder, ...current]);
    persist(saveDoc(ORDERS_COLLECTION, newOrder), "handleAddOrder");
    syncVehicleStatus(vehicleId, [newOrder, ...orders]);
    setShowOrderForm(false);
    setModalDirty(false);
    flash(`L'ordre OR-${nextNumber} a été créé${urgent ? " en priorité urgente" : ""}. Ajoutez les pièces depuis la fiche pour les prélever du stock.`);
  }

  function handleAddMechanic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const role = String(form.get("role"));
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const newMechanic: Mechanic = {
      id: `M00${mechanics.length + 1}`,
      name,
      role,
      initials,
      color: "#b8d4c8",
      state: "Disponible",
      stateTone: "available",
      email: String(form.get("email")),
      phone: String(form.get("phone")),
      specialties: String(form.get("specialties")).split(',').map(s => s.trim()),
      startDate: new Date().toISOString().split('T')[0]
    };
    setMechanics([...mechanics, newMechanic]);
    persist(saveDoc(MECHANICS_COLLECTION, newMechanic), "handleAddMechanic");
    setShowMechanicForm(false);
    setModalDirty(false);
    flash(`Le mécanicien ${name} a été ajouté.`);
  }

  function handleAddVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const brand = String(form.get("brand"));
    const model = String(form.get("model"));
    const registrationDate = String(form.get("registrationDate")) || new Date().toISOString().split("T")[0];
    const newVehicle: Vehicle = {
      id: `V00${vehicles.length + 1}`,
      brand,
      model,
      plate: String(form.get("plate")),
      year: parseInt(String(form.get("year"))),
      mileage: parseInt(String(form.get("mileage"))),
      status: "Opérationnel",
      statusDate: registrationDate,
      lastRevisionKm: parseInt(String(form.get("lastRevisionKm"))) || 0,
      nextRevisionKm: parseInt(String(form.get("nextRevisionKm"))) || (parseInt(String(form.get("mileage"))) || 0) + 20000,
      lastMaintenance: registrationDate,
      nextMaintenance: "",
      assignedDriver: String(form.get("driver")),
      ownerName: String(form.get("ownerName")) || settings.workshopName,
      ownerAddress: String(form.get("ownerAddress")),
      commercialType: String(form.get("commercialType")) || model,
      typeCode: String(form.get("typeCode")),
      bodyType: String(form.get("bodyType")),
      color: String(form.get("color")),
      fuel: String(form.get("fuel")),
      seats: parseInt(String(form.get("seats"))) || 0,
      fiscalPower: parseInt(String(form.get("fiscalPower"))) || 0,
      enginePower: parseInt(String(form.get("enginePower"))) || 0,
      displacement: parseInt(String(form.get("displacement"))) || 0,
      grossWeight: parseInt(String(form.get("grossWeight"))) || 0,
      curbWeight: parseInt(String(form.get("curbWeight"))) || 0,
      payload: parseInt(String(form.get("payload"))) || 0,
      axles: parseInt(String(form.get("axles"))) || 2,
      vin: String(form.get("vin")),
      registrationDate,
      inspectionDate: String(form.get("inspectionDate"))
    };
    setVehicles([...vehicles, newVehicle]);
    persist(saveDoc(VEHICLES_COLLECTION, newVehicle), "handleAddVehicle");
    setShowVehicleForm(false);
    setModalDirty(false);
    flash(`Le véhicule ${brand} ${model} a été ajouté.`);
  }

  function handleAddStockItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const quantity = parseInt(String(form.get("quantity")));
    const minLevel = parseInt(String(form.get("minLevel")));
    const unitPrice = parseFloat(String(form.get("unitPrice")));
    const level: "critique" | "bas" | "normal" = quantity <= minLevel * 0.5 ? "critique" : quantity <= minLevel ? "bas" : "normal";
    const percent = Math.min((quantity / (minLevel * 2)) * 100, 100);
    
    const newItem: StockItem = {
      id: `P00${stock.length + 1}`,
      name,
      ref: String(form.get("ref")),
      category: String(form.get("category")),
      quantity,
      minLevel,
      unitPrice,
      totalValue: quantity * unitPrice,
      supplier: String(form.get("supplier")),
      location: String(form.get("location")),
      lastEntry: new Date().toISOString().split('T')[0],
      level,
      percent
    };
    setStock([...stock, newItem]);
    persist(saveDoc(STOCK_COLLECTION, newItem), "handleAddStockItem");
    setShowStockForm(false);
    setModalDirty(false);
    flash(`L'article ${name} a été ajouté au stock.`);
  }

  function handleAddStockExit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const itemId = String(form.get("itemId"));
    const item = stock.find(s => s.id === itemId);
    if (!item) return;
    const quantity = parseInt(String(form.get("quantity")));
    if (!quantity || quantity > item.quantity) {
      flash(`La quantité demandée doit être comprise entre 1 et ${item.quantity}.`);
      return;
    }
    const reason = String(form.get("reason")) as StockExit["reason"];
    const targetVehicleId = String(form.get("targetVehicleId"));
    const targetVehicle = vehicles.find((vehicle) => vehicle.id === targetVehicleId);
    
    const newExit: StockExit = {
      id: `S00${stockExits.length + 1}`,
      itemId,
      itemName: item.name,
      date: String(form.get("date")) || stockPeriod.from,
      quantity,
      reason,
      targetVehicle: targetVehicle?.plate,
      targetOrder: String(form.get("targetOrder")) || undefined,
      notes: String(form.get("notes"))
    };
    
    // Update stock quantity
    const updatedStock = stock.map(s => {
      if (s.id === itemId) {
        const newQty = s.quantity - quantity;
        const newLevel: "critique" | "bas" | "normal" = newQty <= s.minLevel * 0.5 ? "critique" : newQty <= s.minLevel ? "bas" : "normal";
        return { ...s, quantity: newQty, totalValue: newQty * s.unitPrice, level: newLevel, percent: Math.min((newQty / (s.minLevel * 2)) * 100, 100) };
      }
      return s;
    });
    
    setStockExits([newExit, ...stockExits]);
    setStock(updatedStock);
    persist(saveDoc(STOCK_EXITS_COLLECTION, newExit), "handleAddStockExit exit");
    const updatedStockItem = updatedStock.find((entry) => entry.id === itemId);
    if (updatedStockItem) persist(saveDoc(STOCK_COLLECTION, updatedStockItem), "handleAddStockExit stock");
    setShowStockExitForm(false);
    setModalDirty(false);
    flash(`Sortie de ${quantity} x ${item.name} enregistrée.`);
  }

  function updatePresence(mechanicId: string, status: PresenceStatus) {
    const previous = presenceForDay(mechanicId, presenceDate);
    const nextEntry: PresenceEntry = {
      ...previous,
      status,
      arrival: status === "Absent" ? "" : previous.arrival || "07:45",
      departure: status === "Absent" ? "" : previous.departure || "17:00"
    };
    setPresenceEntries((current) => {
      const exists = current.some((entry) => entry.mechanicId === mechanicId && entry.date === presenceDate);
      return exists ? current.map((entry) => entry.mechanicId === mechanicId && entry.date === presenceDate ? nextEntry : entry) : [...current, nextEntry];
    });
    persist(saveDoc(PRESENCE_COLLECTION, { ...nextEntry, id: presenceDocId(nextEntry) }), "updatePresence");
  }

  function updatePresenceField(mechanicId: string, field: "arrival" | "departure", value: string) {
    setPresenceEntries((current) => {
      const next = current.map((entry) => entry.mechanicId === mechanicId && entry.date === presenceDate ? { ...entry, [field]: value } : entry);
      const updatedEntry = next.find((entry) => entry.mechanicId === mechanicId && entry.date === presenceDate);
      if (updatedEntry) persist(saveDoc(PRESENCE_COLLECTION, { ...updatedEntry, id: presenceDocId(updatedEntry) }), "updatePresenceField");
      return next;
    });
  }

  function handleUpdateOrder(updated: Order) {
    const previous = orders.find((o) => o.id === updated.id);
    if (previous) {
      const oldMap = new Map<string, number>();
      previous.parts.forEach((p) => oldMap.set(p.itemId, (oldMap.get(p.itemId) ?? 0) + p.quantity));
      const newMap = new Map<string, number>();
      updated.parts.forEach((p) => newMap.set(p.itemId, (newMap.get(p.itemId) ?? 0) + p.quantity));
      const newExits: StockExit[] = [];
      const stockAdjust = new Map<string, number>();
      newMap.forEach((qty, itemId) => {
        const delta = qty - (oldMap.get(itemId) ?? 0);
        if (delta > 0) {
          const item = stock.find((s) => s.id === itemId);
          if (item) {
            newExits.push({ id: `S${String(stockExits.length + newExits.length + 1).padStart(3, "0")}`, itemId, itemName: item.name, date: new Date().toISOString().slice(0, 10), quantity: delta, reason: "Ordre atelier", targetVehicle: updated.plate, targetOrder: updated.id, notes: `Sortie atelier pour ${updated.vehicle} (${updated.plate})` });
            stockAdjust.set(itemId, (stockAdjust.get(itemId) ?? 0) - delta);
          }
        } else if (delta < 0) {
          stockAdjust.set(itemId, (stockAdjust.get(itemId) ?? 0) - delta);
        }
      });
      if (stockAdjust.size) {
        const nextStock = stock.map((item) => {
          const adj = stockAdjust.get(item.id);
          if (adj === undefined) return item;
          const newQty = Math.max(0, item.quantity + adj);
          const newLevel: StockItem["level"] = newQty <= item.minLevel * 0.5 ? "critique" : newQty <= item.minLevel ? "bas" : "normal";
          return { ...item, quantity: newQty, totalValue: newQty * item.unitPrice, level: newLevel, percent: Math.min((newQty / (item.minLevel * 2)) * 100, 100) };
        });
        setStock(nextStock);
        const changedItems = nextStock.filter((item) => stockAdjust.has(item.id));
        persist(saveDocs(STOCK_COLLECTION, changedItems), "handleUpdateOrder stock");
      }
      if (newExits.length) {
        setStockExits((current) => [...newExits, ...current]);
        persist(saveDocs(STOCK_EXITS_COLLECTION, newExits), "handleUpdateOrder exits");
        newExits.forEach((exit) => expandPeriodToDate(exit.date));
      }
    }
    const nextOrders = orders.map(o => o.id === updated.id ? updated : o);
    setOrders(nextOrders);
    persist(saveDoc(ORDERS_COLLECTION, updated), "handleUpdateOrder");
    syncVehicleStatus(updated.vehicleId, nextOrders);
    if (previous && previous.vehicleId !== updated.vehicleId) {
      syncVehicleStatus(previous.vehicleId, nextOrders);
    }
    setSelectedOrder(null);
    setModalDirty(false);
    flash(`L'ordre ${updated.id} a été mis à jour. Stock synchronisé.`);
  }

  function handleUpdateMechanic(updated: Mechanic) {
    setMechanics(mechanics.map(m => m.id === updated.id ? updated : m));
    persist(saveDoc(MECHANICS_COLLECTION, updated), "handleUpdateMechanic");
    setSelectedMechanic(null);
    setModalDirty(false);
    flash(`Le mécanicien ${updated.name} a été mis à jour.`);
  }

  function handleUpdateVehicle(updated: Vehicle) {
    setVehicles(vehicles.map(v => v.id === updated.id ? updated : v));
    persist(saveDoc(VEHICLES_COLLECTION, updated), "handleUpdateVehicle");
    setSelectedVehicle(null);
    setModalDirty(false);
    flash(`Le véhicule ${updated.plate} a été mis à jour.`);
  }

  function handleUpdateStockItem(updated: StockItem) {
    setStock(stock.map(s => s.id === updated.id ? updated : s));
    persist(saveDoc(STOCK_COLLECTION, updated), "handleUpdateStockItem");
    setSelectedStockItem(null);
    setModalDirty(false);
    flash(`L'article ${updated.name} a été mis à jour.`);
  }

  function handleSaveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextSettings = {
      ...settings,
      workshopName: String(form.get("workshopName")),
      emailNotifications: form.get("emailNotifications") === "on",
      autoAssign: form.get("autoAssign") === "on",
      alertThreshold: parseInt(String(form.get("alertThreshold"))),
      currency: String(form.get("currency")),
      language: String(form.get("language")),
      garageCapacity: Math.max(1, parseInt(String(form.get("garageCapacity"))) || settings.garageCapacity)
    };
    setSettings(nextSettings);
    persist(saveSingletonDoc(SETTINGS_COLLECTION, SETTINGS_DOC_ID, nextSettings), "handleSaveSettings");
    setShowSettingsModal(false);
    setModalDirty(false);
    flash("Les paramètres ont été enregistrés avec succès.");
  }

  function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const updates = {
      username: String(form.get("username") || profile.username).trim() || profile.username,
      role: String(form.get("role") || profile.role).trim() || profile.role,
      email: (String(form.get("email") || "").trim() || null),
    };
    persist(updateUserProfile(profile.uid, updates), "handleSaveProfile");
    setShowProfileModal(false);
    setModalDirty(false);
    flash("Votre profil a été mis à jour.");
  }

  async function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      flash("Merci de choisir une image (JPG, PNG…).");
      event.target.value = "";
      return;
    }
    setUploadingPhoto(true);
    try {
      const url = await uploadFileToStorage(`avatars/${profile.uid}`, file);
      await updateUserProfile(profile.uid, { photoURL: url });
      setModalDirty(true);
      flash("Photo de profil mise à jour.");
    } catch (error) {
      console.error("[profile] photo upload failed:", error);
      flash("Le téléversement de la photo a échoué. Réessayez.");
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  }

  function addAlertEmail() {
    const email = alertEmailDraft.trim().toLowerCase();
    if (!email) return;
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValid) {
      flash("Adresse email invalide.");
      return;
    }
    if (settings.alertEmails.includes(email)) {
      setAlertEmailDraft("");
      return;
    }
    const nextSettings = { ...settings, alertEmails: [...settings.alertEmails, email] };
    setSettings(nextSettings);
    persist(saveSingletonDoc(SETTINGS_COLLECTION, SETTINGS_DOC_ID, nextSettings), "addAlertEmail");
    setAlertEmailDraft("");
  }

  function removeAlertEmail(email: string) {
    const nextSettings = { ...settings, alertEmails: settings.alertEmails.filter((item) => item !== email) };
    setSettings(nextSettings);
    persist(saveSingletonDoc(SETTINGS_COLLECTION, SETTINGS_DOC_ID, nextSettings), "removeAlertEmail");
  }

  function handlePrint() {
    flash("Impression en cours...");
    window.print();
  }

  function handleExport() {
    const records: Array<Record<string, unknown>> = activeNav === "Véhicules" ? vehicles.map((item) => ({ ...item }))
      : activeNav === "Mécaniciens" ? mechanics.map((item) => ({ ...item, specialties: item.specialties.join(" | ") }))
      : activeNav === "Stocks" ? stock.map((item) => ({ ...item }))
      : activeNav === "Présences" ? presenceEntries.map((item) => ({ ...item }))
      : orders.map((item) => ({ ...item, parts: item.parts.map((p) => `${p.itemName} x${p.quantity}`).join(" | ") }));
    if (!records.length) {
      flash("Aucune donnée à exporter pour cette période.");
      return;
    }
    exportToExcel(`socob-gestatelier-${activeNav.toLowerCase().replaceAll(" ", "-")}`, records);
    flash("Export Excel téléchargé avec succès.");
  }

  function handleImport() {
    importInputRef.current?.click();
  }

  async function processImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    // Keep the original file in Firebase Storage as an audit trail of imports.
    persist(uploadFileToStorage("imports", file).then(() => undefined), "processImport upload");

    let rows: Array<Record<string, string>>;
    try {
      rows = await readExcelFile(file);
    } catch (error) {
      console.error("[import] failed to read file:", error);
      flash("Impossible de lire ce fichier. Vérifiez qu'il s'agit bien d'un fichier Excel (.xlsx) ou CSV.");
      event.target.value = "";
      return;
    }
    if (!rows.length) {
      flash(`Aucune ligne de données trouvée dans « ${file.name} ».`);
      event.target.value = "";
      return;
    }

    let imported = 0;
    let skipped = 0;

    if (activeNav === "Véhicules") {
      const newVehicles: Vehicle[] = [];
      rows.forEach((row, idx) => {
        const brand = pickColumn(row, "brand", "Marque");
        const model = pickColumn(row, "model", "Modèle");
        const plate = pickColumn(row, "plate", "Immatriculation", "Plaque");
        if (!brand || !model || !plate) { skipped += 1; return; }
        const statusRaw = pickColumn(row, "status", "Statut");
        const status: Vehicle["status"] = ["Opérationnel", "En réparation", "Immobilisé", "Hors service"].includes(statusRaw) ? statusRaw as Vehicle["status"] : "Opérationnel";
        const today = new Date().toISOString().slice(0, 10);
        newVehicles.push({
          id: `V${String(vehicles.length + newVehicles.length + 1).padStart(3, "0")}`,
          brand, model, plate,
          year: parseInt(pickColumn(row, "year", "Année")) || new Date().getFullYear(),
          mileage: parseInt(pickColumn(row, "mileage", "Kilométrage")) || 0,
          status, statusDate: today,
          lastRevisionKm: parseInt(pickColumn(row, "lastRevisionKm", "Dernière révision")) || 0,
          nextRevisionKm: parseInt(pickColumn(row, "nextRevisionKm", "Prochaine révision")) || 0,
          lastMaintenance: pickColumn(row, "lastMaintenance", "Dernier entretien") || today,
          nextMaintenance: pickColumn(row, "nextMaintenance", "Prochain entretien") || today,
          assignedDriver: pickColumn(row, "assignedDriver", "Chauffeur") || "Non assigné",
          ownerName: pickColumn(row, "ownerName", "Propriétaire") || settings.workshopName,
          ownerAddress: pickColumn(row, "ownerAddress", "Adresse propriétaire"),
          commercialType: pickColumn(row, "commercialType", "Type commercial"),
          typeCode: pickColumn(row, "typeCode", "Code type"),
          bodyType: pickColumn(row, "bodyType", "Carrosserie"),
          color: pickColumn(row, "color", "Couleur"),
          fuel: pickColumn(row, "fuel", "Carburant") || "Diesel",
          seats: parseInt(pickColumn(row, "seats", "Places")) || 0,
          fiscalPower: parseInt(pickColumn(row, "fiscalPower", "Puissance fiscale")) || 0,
          enginePower: parseInt(pickColumn(row, "enginePower", "Puissance moteur")) || 0,
          displacement: parseInt(pickColumn(row, "displacement", "Cylindrée")) || 0,
          grossWeight: parseInt(pickColumn(row, "grossWeight", "PTAC")) || 0,
          curbWeight: parseInt(pickColumn(row, "curbWeight", "Poids à vide")) || 0,
          payload: parseInt(pickColumn(row, "payload", "Charge utile")) || 0,
          axles: parseInt(pickColumn(row, "axles", "Essieux")) || 2,
          vin: pickColumn(row, "vin", "VIN", "Numéro de châssis"),
          registrationDate: pickColumn(row, "registrationDate", "Date d'immatriculation") || today,
          inspectionDate: pickColumn(row, "inspectionDate", "Date de visite technique") || today,
        });
        imported += 1;
      });
      if (newVehicles.length) {
        setVehicles([...vehicles, ...newVehicles]);
        persist(saveDocs(VEHICLES_COLLECTION, newVehicles), "import vehicles");
      }
    } else if (activeNav === "Mécaniciens") {
      const newMechanics: Mechanic[] = [];
      rows.forEach((row) => {
        const name = pickColumn(row, "name", "Nom");
        if (!name) { skipped += 1; return; }
        const stateRaw = pickColumn(row, "state", "Statut");
        const state: Mechanic["state"] = ["En intervention", "Disponible", "Pause", "Absent"].includes(stateRaw) ? stateRaw as Mechanic["state"] : "Disponible";
        const specialtiesRaw = pickColumn(row, "specialties", "Spécialités");
        newMechanics.push({
          id: `M${String(mechanics.length + newMechanics.length + 1).padStart(3, "0")}`,
          name,
          role: pickColumn(row, "role", "Rôle") || "Mécanicien",
          initials: name.split(" ").map((n) => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 2) || "??",
          color: "#b8d4c8",
          state,
          stateTone: state === "En intervention" ? "working" : state === "Pause" ? "pause" : state === "Absent" ? "absent" : "available",
          email: pickColumn(row, "email", "Email"),
          phone: pickColumn(row, "phone", "Téléphone"),
          specialties: specialtiesRaw ? specialtiesRaw.split(/[|,]/).map((s) => s.trim()).filter(Boolean) : [],
          startDate: pickColumn(row, "startDate", "Date d'arrivée") || new Date().toISOString().slice(0, 10),
        });
        imported += 1;
      });
      if (newMechanics.length) {
        setMechanics([...mechanics, ...newMechanics]);
        persist(saveDocs(MECHANICS_COLLECTION, newMechanics), "import mechanics");
      }
    } else if (activeNav === "Stocks") {
      const newItems: StockItem[] = [];
      rows.forEach((row) => {
        const name = pickColumn(row, "name", "Désignation");
        if (!name) { skipped += 1; return; }
        const quantity = parseInt(pickColumn(row, "quantity", "Quantité")) || 0;
        const minLevel = parseInt(pickColumn(row, "minLevel", "Seuil mini")) || 1;
        const unitPrice = parseFloat(pickColumn(row, "unitPrice", "Prix unitaire")) || 0;
        const level: StockItem["level"] = quantity <= minLevel * 0.5 ? "critique" : quantity <= minLevel ? "bas" : "normal";
        newItems.push({
          id: `P${String(stock.length + newItems.length + 1).padStart(3, "0")}`,
          name,
          ref: pickColumn(row, "ref", "Référence"),
          category: pickColumn(row, "category", "Catégorie") || "Divers",
          quantity, minLevel, unitPrice,
          totalValue: quantity * unitPrice,
          supplier: pickColumn(row, "supplier", "Fournisseur"),
          location: pickColumn(row, "location", "Emplacement"),
          lastEntry: new Date().toISOString().slice(0, 10),
          level,
          percent: Math.min((quantity / (minLevel * 2)) * 100, 100),
        });
        imported += 1;
      });
      if (newItems.length) {
        setStock([...stock, ...newItems]);
        persist(saveDocs(STOCK_COLLECTION, newItems), "import stock");
      }
    } else if (activeNav === "Présences") {
      const newEntries: PresenceEntry[] = [];
      rows.forEach((row) => {
        const mechanicName = pickColumn(row, "mechanic", "Mécanicien");
        const date = pickColumn(row, "date", "Date");
        const mechanicMatch = mechanics.find((m) => m.name.toLowerCase() === mechanicName.toLowerCase());
        if (!mechanicMatch || !date) { skipped += 1; return; }
        const statusRaw = pickColumn(row, "status", "Statut");
        const status: PresenceStatus = ["Présent", "Absent", "En pause"].includes(statusRaw) ? statusRaw as PresenceStatus : "Présent";
        newEntries.push({
          mechanicId: mechanicMatch.id,
          date,
          status,
          arrival: pickColumn(row, "arrival", "Arrivée"),
          departure: pickColumn(row, "departure", "Départ"),
        });
        imported += 1;
      });
      if (newEntries.length) {
        setPresenceEntries((current) => {
          const next = [...current];
          newEntries.forEach((entry) => {
            const idx = next.findIndex((e) => e.mechanicId === entry.mechanicId && e.date === entry.date);
            if (idx >= 0) next[idx] = entry; else next.push(entry);
          });
          return next;
        });
        persist(saveDocs(PRESENCE_COLLECTION, newEntries.map((entry) => ({ ...entry, id: presenceDocId(entry) }))), "import presence");
      }
    } else {
      // Ordres de réparation
      const newOrders: Order[] = [];
      const stockAdjustments = new Map<string, number>();
      rows.forEach((row) => {
        const plate = pickColumn(row, "plate", "Immatriculation", "Plaque");
        const vehicleMatch = vehicles.find((v) => v.plate.toLowerCase() === plate.toLowerCase());
        const issue = pickColumn(row, "issue", "Intervention");
        if (!vehicleMatch || !issue) { skipped += 1; return; }
        const statusRaw = pickColumn(row, "status", "Statut");
        const status: Order["status"] = ["En cours", "À contrôler", "En attente", "Planifié", "Terminé"].includes(statusRaw) ? statusRaw as Order["status"] : "En attente";
        const startDate = pickColumn(row, "startDate", "Date début") || new Date().toISOString().slice(0, 10);
        const endDate = pickColumn(row, "endDate", "Date fin") || startDate;
        const startTime = pickColumn(row, "startTime", "Heure début");
        const endTime = status === "Terminé" ? pickColumn(row, "endTime", "Heure fin") : "";
        const mechanicName = pickColumn(row, "mechanic", "Mécanicien") || "À affecter";
        const mechanicMatch = mechanics.find((m) => m.name.toLowerCase() === mechanicName.toLowerCase());
        newOrders.push({
          id: `OR-${2048 + orders.length + newOrders.length + 1}`,
          vehicleId: vehicleMatch.id,
          vehicle: `${vehicleMatch.brand} ${vehicleMatch.model}`,
          plate: vehicleMatch.plate,
          issue,
          mechanic: mechanicMatch ? mechanicMatch.name : mechanicName,
          initials: mechanicMatch ? mechanicMatch.initials : "--",
          duration: endTime ? durationLabel(minutesBetween(startTime, endTime)) : "À estimer",
          startTime, endTime, status,
          statusTone: toneForOrderStatus(status),
          startDate, endDate,
          cost: parseFloat(pickColumn(row, "cost", "Coût")) || 0,
          parts: [],
        });
        imported += 1;
      });
      if (newOrders.length) {
        setOrders([...newOrders, ...orders]);
        persist(saveDocs(ORDERS_COLLECTION, newOrders), "import orders");
        // Keep vehicle statuses (En réparation / Opérationnel) consistent with the newly imported orders.
        const combinedOrders = [...newOrders, ...orders];
        new Set(newOrders.map((o) => o.vehicleId)).forEach((vehicleId) => syncVehicleStatus(vehicleId, combinedOrders));
      }
      void stockAdjustments; // no stock impact on straight import; parts are added manually afterwards
    }

    flash(`Import terminé : ${imported} ligne(s) importée(s)${skipped ? `, ${skipped} ignorée(s) (champs requis manquants ou introuvables)` : ""}.`);
    event.target.value = "";
  }

  function handleNav(label: string) {
    setActiveNav(label);
    if (label === "Paramètres") {
      setShowSettingsModal(true);
    }
  }

  // Render different content based on active nav
  function renderContent() {
    switch (activeNav) {
      case "Ordres de réparation":
        return (
          <div className="module-page">
            <div className="module-header">
              <div>
                <p className="eyebrow">GESTION DES INTERVENTIONS</p>
                <h1>Ordres de réparation</h1>
              </div>
              <div className="module-actions">
                <div className="module-search"><Icon name="search" size={15} /><input type="search" placeholder="Rechercher un ordre, un véhicule, un mécanicien…" value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} /></div>
                <PeriodSelector from={orderPeriod.from} to={orderPeriod.to} onChange={(from, to) => setOrderPeriod({ from, to })} />
                <ActionButtons onPrint={handlePrint} onExport={handleExport} onImport={handleImport} />
                <button className="primary-button" onClick={() => setShowOrderForm(true)}><Icon name="plus" size={18} /> Nouvel ordre</button>
              </div>
            </div>
            <div className="panel full-panel">
              <div className="orders-table">
                <div className="table-head">
                  <span>ORDRE / VÉHICULE</span>
                  <span>INTERVENTION</span>
                  <span>MÉCANICIEN</span>
                  <span>PÉRIODE</span>
                  <span>TEMPS</span>
                  <span>STATUT</span>
                  <span />
                </div>
                {orderList.map((order) => (
                  <div className="order-row clickable" key={order.id} onClick={() => setSelectedOrder(order)}>
                    <div className="order-vehicle">
                      <strong>{order.id}</strong>
                      <div><b>{order.vehicle}</b><span>{order.plate}</span></div>
                    </div>
                    <span className="issue-cell">{order.issue}</span>
                    <div className="mechanic-cell"><Avatar initials={order.initials} color={order.initials === "--" ? "#e6e9ee" : undefined} small /><span>{order.mechanic}</span></div>
                    <span className="date-cell">{order.startDate}</span>
                    <span className="duration-cell"><Icon name="clock" size={14} />{order.duration}</span>
                    <span className={`status-pill ${order.statusTone}`}><i />{order.status}</span>
                    <button className="row-more" onClick={(e) => { e.stopPropagation(); }} aria-label={`Options ${order.id}`}><Icon name="more" size={17} /></button>
                  </div>
                ))}
                {orderList.length === 0 && <div className="empty-row">Aucun ordre ne correspond à votre recherche.</div>}
              </div>
            </div>
          </div>
        );
      
      case "Mécaniciens":
        return (
          <div className="module-page">
            <div className="module-header">
              <div>
                <p className="eyebrow">GESTION DES RESSOURCES HUMAINES</p>
                <h1>Mécaniciens</h1>
              </div>
              <div className="module-actions">
                <div className="module-search"><Icon name="search" size={15} /><input type="search" placeholder="Rechercher un mécanicien, un rôle, une spécialité…" value={mechanicSearch} onChange={(event) => setMechanicSearch(event.target.value)} /></div>
                <PeriodSelector from={mechanicPeriod.from} to={mechanicPeriod.to} onChange={(from, to) => setMechanicPeriod({ from, to })} />
                <ActionButtons onPrint={handlePrint} onExport={handleExport} onImport={handleImport} />
                <button className="primary-button" onClick={() => setShowMechanicForm(true)}><Icon name="plus" size={18} /> Nouveau mécanicien</button>
              </div>
            </div>
            <div className="panel full-panel">
              <div className="mechanics-grid">
                {mechanicList.map((mechanic) => (
                  <div className="mechanic-card clickable" key={mechanic.id} onClick={() => setSelectedMechanic(mechanic)}>
                    <div className="mechanic-card-header">
                      <Avatar initials={mechanic.initials} color={mechanic.color} />
                      <span className={`status-badge ${mechanic.stateTone}`}>{mechanic.state}</span>
                    </div>
                    <h3>{mechanic.name}</h3>
                    <p className="mechanic-role">{mechanic.role}</p>
                    <div className="mechanic-specialties">
                      {mechanic.specialties.map(s => <span key={s} className="specialty-tag">{s}</span>)}
                    </div>
                    <div className="mechanic-contact">
                      <span>{mechanic.email}</span>
                      <span>{mechanic.phone}</span>
                    </div>
                  </div>
                ))}
                {mechanicList.length === 0 && <div className="empty-row">Aucun mécanicien ne correspond à votre recherche.</div>}
              </div>
            </div>
          </div>
        );
      
      case "Véhicules":
        return (
          <div className="module-page">
            <div className="module-header">
              <div>
                <p className="eyebrow">GESTION DE LA FLOTTE</p>
                <h1>Véhicules</h1>
              </div>
              <div className="module-actions">
                <div className="module-search"><Icon name="search" size={15} /><input type="search" placeholder="Rechercher une plaque, un modèle, un chauffeur…" value={vehicleSearch} onChange={(event) => setVehicleSearch(event.target.value)} /></div>
                <PeriodSelector from={vehiclePeriod.from} to={vehiclePeriod.to} onChange={(from, to) => setVehiclePeriod({ from, to })} />
                <ActionButtons onPrint={handlePrint} onExport={handleExport} onImport={handleImport} />
                <button className="primary-button" onClick={() => setShowVehicleForm(true)}><Icon name="plus" size={18} /> Nouveau véhicule</button>
              </div>
            </div>
            <div className="panel full-panel">
              <div className="vehicles-table">
                <div className="table-head">
                  <span>VÉHICULE</span>
                  <span>IMMATRICULATION</span>
                  <span>ANNÉE</span>
                  <span>KILOMÉTRAGE</span>
                  <span>STATUT</span>
                  <span>DÉRN. RÉV. (km)</span>
                  <span>PROCH. RÉV. (km)</span>
                  <span>CHAUffeur</span>
                  <span />
                </div>
                {vehicleList.map((vehicle) => (
                  <div className="vehicle-row clickable" key={vehicle.id} onClick={() => setSelectedVehicle(vehicle)}>
                    <div className="vehicle-info">
                      <strong>{vehicle.brand} {vehicle.model}</strong>
                    </div>
                    <span className="plate-cell">{vehicle.plate}</span>
                    <span>{vehicle.year}</span>
                    <span>{vehicle.mileage.toLocaleString()} km</span>
                    <span className={`status-badge vehicle-${vehicle.status.toLowerCase().replace(' ', '-')}`}>{vehicle.status}</span>
                    <span>{vehicle.lastRevisionKm.toLocaleString("fr-CI")} km</span>
                    <span>{vehicle.nextRevisionKm.toLocaleString("fr-CI")} km{vehicle.mileage >= vehicle.nextRevisionKm ? <em className="revision-due"> · échu</em> : null}</span>
                    <span>{vehicle.assignedDriver}</span>
                    <button className="row-more" onClick={(e) => e.stopPropagation()}><Icon name="more" size={17} /></button>
                  </div>
                ))}
                {vehicleList.length === 0 && <div className="empty-row">Aucun véhicule ne correspond à votre recherche.</div>}
              </div>
            </div>
          </div>
        );
      
      case "Stocks":
        return (
          <div className="module-page stock-page">
            <section className="stock-hero">
              <div className="stock-hero-text">
                <h1 className="stock-hero-title">Gestion du Stock &amp; Pièces</h1>
                <p className="stock-hero-sub">Cliquez sur une ligne pour voir les détails · actions rapides d'entrée et de sortie</p>
              </div>
              <div className="stock-hero-actions">
                <ActionButtons onPrint={handlePrint} onExport={handleExport} onImport={handleImport} />
                <button className="primary-button" onClick={() => setShowStockForm(true)}><Icon name="plus" size={18} strokeWidth={2.2} /> Nouvelle pièce</button>
              </div>
            </section>

            <section className="stock-toolbar">
              <div className="stock-search">
                <Icon name="search" size={15} />
                <input type="search" placeholder="Rechercher par SKU, désignation, fournisseur…" value={stockSearch} onChange={(event) => setStockSearch(event.target.value)} />
              </div>
              <div className="stock-total-chip">
                <span>Valeur des pièces en stock</span>
                <strong>{formatFCFA(totalStockValue)}</strong>
              </div>
              <label className="stock-alerts-toggle">
                <input type="checkbox" checked={stockFilter} onChange={(event) => setStockFilter(event.target.checked)} />
                <span>Afficher uniquement les alertes</span>
              </label>
            </section>

            <article className="stock-card">
              <div className="stock-card-table">
                <div className="stock-head">
                  <span className="col-check" /><span className="col-actions" /><span className="col-sku">SKU</span><span className="col-designation">Désignation</span>
                  <span className="col-stock">Stock</span><span className="col-min">Min.</span><span className="col-price">Prix</span><span className="col-supplier">Fournisseur</span>
                  <span className="col-entry">Entrée</span><span className="col-exit">Sortie</span>
                </div>
                {filteredStock.map((item) => (
                  <div className={`stock-line ${item.level}`} key={item.id} onClick={() => setSelectedStockItem(item)}>
                    <span className="col-check"><input type="checkbox" onClick={(event) => event.stopPropagation()} aria-label={`Sélectionner ${item.name}`} /></span>
                    <span className="col-actions" onClick={(event) => event.stopPropagation()}>
                      <button className="line-icon danger" title="Supprimer" onClick={(event) => { event.stopPropagation(); setStock(stock.filter((entry) => entry.id !== item.id)); persist(removeDoc(STOCK_COLLECTION, item.id), "delete stock line"); flash(`${item.name} retiré du stock.`); }}><Icon name="trash" size={14} /></button>
                      <button className="line-icon" title="Modifier" onClick={(event) => { event.stopPropagation(); setSelectedStockItem(item); }}><Icon name="edit" size={14} /></button>
                    </span>
                    <span className="col-sku"><code>{item.ref}</code></span>
                    <span className="col-designation"><strong>{item.name}</strong><em>{item.category}</em></span>
                    <span className="col-stock"><span className={`stock-qty ${item.level}`}>{item.quantity}</span></span>
                    <span className="col-min">{item.minLevel}</span>
                    <span className="col-price"><strong>{formatFCFA(item.unitPrice)}</strong></span>
                    <span className="col-supplier">{item.supplier}</span>
                    <span className="col-entry" onClick={(event) => event.stopPropagation()}>
                      <button className="entry-button" onClick={() => commanderStock(item.id, 5)}>Commander <strong>(+5)</strong></button>
                    </span>
                    <span className="col-exit" onClick={(event) => event.stopPropagation()}>
                      {item.quantity > 0 ? (
                        <button className="exit-button" onClick={() => lancerSortieRapide(item.id)}>Sortie de stock</button>
                      ) : (
                        <span className="exit-rupture">Rupture</span>
                      )}
                    </span>
                  </div>
                ))}
                {filteredStock.length === 0 && <div className="stock-empty">Aucun article ne correspond à votre recherche.</div>}
              </div>
            </article>

            <section className="exit-summary">
              <div className="exit-summary-header">
                <div>
                  <h2 className="section-title">Récapitulatif des Sorties de Stock</h2>
                  <p className="section-sub">Vue d'ensemble des pièces sorties (sorties atelier, manuelles, casses, retours) sur une période choisie.</p>
                </div>
                <ActionButtons onPrint={handlePrint} onExport={handleExport} onImport={handleImport} />
              </div>

              <div className="exit-filters">
                <div className="exit-period">
                  <span>Période :</span>
                  <label><span>du</span><input type="date" value={stockPeriod.from} onChange={(event) => setStockPeriod({ ...stockPeriod, from: event.target.value })} /></label>
                  <span>à</span>
                  <label><span className="sr-only">au</span><input type="date" value={stockPeriod.to} onChange={(event) => setStockPeriod({ ...stockPeriod, to: event.target.value })} /></label>
                </div>
                <div className="exit-search">
                  <Icon name="search" size={14} />
                  <input type="search" placeholder="Filtrer par pièce ou SKU…" value={exitSearch} onChange={(event) => setExitSearch(event.target.value)} />
                </div>
                <select className="exit-reason-select" value={exitReason} onChange={(event) => setExitReason(event.target.value)}>
                  <option>Tous les motifs</option>
                  <option>Ordre atelier</option>
                  <option>Sortie manuelle</option>
                  <option>Casse / Perte</option>
                  <option>Retour fournisseur</option>
                  <option>Ajustement inventaire</option>
                </select>
              </div>

              <div className="exit-kpis">
                <div className="exit-kpi">
                  <span className="exit-kpi-label">Lignes de sortie</span>
                  <strong className="exit-kpi-value">{filteredExits.length}</strong>
                </div>
                <div className="exit-kpi accent">
                  <span className="exit-kpi-label">Quantité totale sortie</span>
                  <strong className="exit-kpi-value">{totalExitQuantity} <em>unité(s)</em></strong>
                </div>
                <div className="exit-kpi">
                  <span className="exit-kpi-label">Valeur totale sortie</span>
                  <strong className="exit-kpi-value">{formatFCFA(totalExitValue)}</strong>
                </div>
              </div>

              <div className="exit-table">
                <div className="exit-head">
                  <span>Date</span><span>SKU</span><span>Désignation</span><span>Quantité</span><span>Valeur</span><span>Motif</span><span>Référence / Note</span>
                </div>
                {filteredExits.map((exit) => {
                  const item = stock.find((entry) => entry.id === exit.itemId);
                  const value = (item?.unitPrice ?? 0) * exit.quantity;
                  return (
                    <div className="exit-line" key={exit.id}>
                      <span>{exit.date}</span>
                      <span><code>{item?.ref ?? "—"}</code></span>
                      <span><strong>{exit.itemName}</strong></span>
                      <span className="exit-qty">{exit.quantity}</span>
                      <span className="exit-value">{formatFCFA(value)}</span>
                      <span><span className={`exit-badge ${exit.reason === "Ordre atelier" ? "atelier" : exit.reason === "Retour fournisseur" ? "retour" : exit.reason === "Sortie manuelle" ? "manuel" : "autre"}`}>{exit.reason}</span></span>
                      <span className="exit-note">{[exit.targetOrder && `${exit.targetOrder}`, exit.targetVehicle && `→ ${exit.targetVehicle}`, exit.notes].filter(Boolean).join(" — ") || "—"}</span>
                    </div>
                  );
                })}
                {filteredExits.length === 0 && <div className="stock-empty">Aucune sortie sur cette période.</div>}
              </div>
            </section>
          </div>
        );
      
      case "Planning atelier":
        return (
          <div className="module-page">
            <div className="module-header">
              <div>
                <p className="eyebrow">PLANIFICATION DES INTERVENTIONS</p>
                <h1>Planning atelier</h1>
              </div>
              <div className="module-actions">
                <PeriodSelector from={planningPeriod.from} to={planningPeriod.to} onChange={(from, to) => setPlanningPeriod({ from, to })} />
                <ActionButtons onPrint={handlePrint} onExport={handleExport} />
                <button className="primary-button" onClick={() => setShowOrderForm(true)}><Icon name="plus" size={18} /> Nouveau</button>
              </div>
            </div>
            <div className="panel full-panel planning-panel">
              <div className="planning-grid">
                {planningDays.map((date) => {
                  const dayOrders = planningOrders.filter((order) => order.startDate === date);
                  const displayDate = new Intl.DateTimeFormat("fr-CI", { weekday: "long", day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`));
                  return (
                    <div className="planning-day" key={date}>
                      <div className="day-header">
                        <strong>{displayDate}</strong>
                        <span>{dayOrders.length} intervention{dayOrders.length > 1 ? "s" : ""}</span>
                      </div>
                      <div className="day-slots">
                        {dayOrders.map((order) => (
                          <div className="planning-slot clickable" key={order.id} onClick={() => setSelectedOrder(order)}>
                            <span className="slot-time">{order.startTime} – {order.endTime}</span>
                            <span className="slot-vehicle">{order.vehicle}</span>
                            <span className="slot-mechanic">{order.mechanic}</span>
                          </div>
                        ))}
                        {dayOrders.length === 0 && <div className="planning-slot empty"><span>Aucune intervention</span></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      
      case "Présences":
        return (
          <div className="module-page">
            <div className="module-header">
              <div>
                <p className="eyebrow">SUIVI DES PRÉSENCES</p>
                <h1>Présences</h1>
              </div>
              <div className="module-actions">
                <PeriodSelector from={mechanicPeriod.from} to={mechanicPeriod.to} onChange={(from, to) => setMechanicPeriod({ from, to })} />
                <ActionButtons onPrint={handlePrint} onExport={handleExport} onImport={handleImport} />
              </div>
            </div>
            <div className="panel full-panel">
              <div className="presence-overview-full">
                <div className="presence-calendar-layout">
                  <div className="attendance-calendar">
                    <div className="calendar-caption"><div><p className="eyebrow">POINTAGE JOURNALIER</p><h3>{new Intl.DateTimeFormat("fr-CI", { month: "long", year: "numeric" }).format(new Date(`${presenceDate}T12:00:00`))}</h3></div><input aria-label="Choisir le mois de pointage" type="month" value={presenceDate.slice(0, 7)} onChange={(event) => setPresenceDate(`${event.target.value}-01`)} /></div>
                    <div className="calendar-weekdays">{["L", "M", "M", "J", "V", "S", "D"].map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}</div>
                    <div className="calendar-days">
                      {Array.from({ length: new Date(Number(presenceDate.slice(0, 4)), Number(presenceDate.slice(5, 7)) - 1, 1).getDay() === 0 ? 6 : new Date(Number(presenceDate.slice(0, 4)), Number(presenceDate.slice(5, 7)) - 1, 1).getDay() - 1 }).map((_, index) => <span className="calendar-empty" key={`empty-${index}`} />)}
                      {Array.from({ length: new Date(Number(presenceDate.slice(0, 4)), Number(presenceDate.slice(5, 7)), 0).getDate() }).map((_, index) => {
                        const day = `${presenceDate.slice(0, 7)}-${String(index + 1).padStart(2, "0")}`;
                        const filled = presenceEntries.some((entry) => entry.date === day);
                        return <button className={`calendar-day ${day === presenceDate ? "selected" : ""} ${filled ? "recorded" : ""}`} key={day} onClick={() => setPresenceDate(day)}>{index + 1}</button>;
                      })}
                    </div>
                  </div>
                  <div className="presence-stats">
                    <div className="presence-stat-card"><strong>{presenceCounts.present}</strong><span>Présents</span></div>
                    <div className="presence-stat-card absent"><strong>{presenceCounts.absent}</strong><span>Absents</span></div>
                    <div className="presence-stat-card pause"><strong>{presenceCounts.pause}</strong><span>En pause</span></div>
                    <p className="attendance-date">Pointage du <strong>{new Intl.DateTimeFormat("fr-CI", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${presenceDate}T12:00:00`))}</strong></p>
                  </div>
                </div>
                <div className="presence-table">
                  <div className="table-head">
                    <span>MÉCANICIEN</span><span>ARRIVÉE</span><span>DÉPART PRÉVU</span><span>STATUT</span><span>HEURES JOUR</span><span>POINTAGE</span>
                  </div>
                  {mechanics.map((mechanic) => {
                    const attendance = presenceForDay(mechanic.id, presenceDate);
                    const hours = attendance.status === "Absent" ? 0 : minutesBetween(attendance.arrival, attendance.departure);
                    return (
                      <div className="presence-row" key={mechanic.id}>
                        <div className="mechanic-cell"><Avatar initials={mechanic.initials} color={mechanic.color} small /><span>{mechanic.name}</span></div>
                        <input className="time-input" type="time" value={attendance.arrival} disabled={attendance.status === "Absent"} onChange={(event) => updatePresenceField(mechanic.id, "arrival", event.target.value)} />
                        <input className="time-input" type="time" value={attendance.departure} disabled={attendance.status === "Absent"} onChange={(event) => updatePresenceField(mechanic.id, "departure", event.target.value)} />
                        <span className={`status-badge ${stateToneFor(attendance.status)}`}>{attendance.status}</span>
                        <span>{durationLabel(hours)}</span>
                        <select className="attendance-select" value={attendance.status} onChange={(event) => updatePresence(mechanic.id, event.target.value as PresenceStatus)}><option>Présent</option><option>En pause</option><option>Absent</option></select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        // Vue d'ensemble (dashboard original)
        return (
          <>
            <section className="welcome-row">
              <div>
                <p className="eyebrow">TABLEAU DE BORD <span className="live-dot" /> DONNÉES FILTRÉES PAR PÉRIODE</p>
                <h1>Bonjour {currentUserFirstName} <span>👋</span></h1>
                <p className="welcome-copy">Chaque indicateur reprend exclusivement les informations contenues dans la période choisie.</p>
              </div>
              <div className="module-actions">
                <PeriodSelector from={dashboardPeriod.from} to={dashboardPeriod.to} onChange={(from, to) => setDashboardPeriod({ from, to })} />
                <button className="icon-action-btn" title="Imprimer le tableau de bord" onClick={handlePrint}><Icon name="printer" size={18} /></button>
                <button className="primary-button" onClick={() => setShowOrderForm(true)}><Icon name="plus" size={18} strokeWidth={2.2} /> Nouvel ordre de réparation</button>
              </div>
            </section>

            <section className="stat-grid" aria-label="Indicateurs clés">
              <StatCard icon="clock" label="Temps moyen / réparation" value={durationLabel(averageRepairMinutes)} detail={`${dashboardOrders.length} ordre(s) sur la période`} trend="calculé" direction="down" accent="orange" onClick={() => setSelectedKpi("time")} />
              <StatCard icon="wrench" label="Pièces utilisées" value={formatFCFA(dashboardPartsValue)} detail={`${dashboardExits.length} sortie(s) sur la période`} trend="détail" direction="up" accent="blue" onClick={() => setSelectedKpi("parts")} />
              <StatCard icon="box" label="Valeur du stock" value={formatFCFA(totalStockValue)} detail={`${stock.length} article(s) valorisés`} trend="inventaire" direction="up" accent="green" onClick={() => setSelectedKpi("stock")} />
              <StatCard icon="truck" label="Véhicules immobilisés" value={String(immobilizedVehicles.length).padStart(2, "0")} detail={`sur la période du ${dashboardPeriod.from} au ${dashboardPeriod.to}`} trend="détail" direction="down" accent="purple" onClick={() => setSelectedKpi("immobilized")} />
            </section>

            <section className="dashboard-grid-top">
              <article className="panel workload-panel">
                <div className="panel-heading">
                  <div><p className="eyebrow">CAPACITÉ OPÉRATIONNELLE</p><h2>Charge de l'atelier</h2></div>
                  <button className="text-button" onClick={() => setShowSettingsModal(true)}>Régler la capacité</button>
                </div>
                <div className="workload-summary">
                  <div><strong>{vehiclesInGarage}</strong><span>véhicule(s) en travaux</span></div>
                  <div><strong className="orange-text">{garageOccupationRate}%</strong><span>taux d'occupation</span></div>
                  <div className="workload-legend">
                    <span><i className="legend-dot orange-dot" />En travaux</span>
                    <span><i className="legend-dot blue-dot" />Places libres</span>
                  </div>
                </div>
                <div className="capacity-gauge" role="img" aria-label={`${vehiclesInGarage} véhicules sur une capacité de ${settings.garageCapacity}`}>
                  <div className="capacity-gauge-track">
                    <span className={`capacity-gauge-fill ${garageOccupationRate >= 100 ? "full" : garageOccupationRate >= 80 ? "high" : ""}`} style={{ width: `${Math.min(garageOccupationRate, 100)}%` }} />
                  </div>
                  <span className="capacity-gauge-caption">{vehiclesInGarage} / {settings.garageCapacity} places occupées</span>
                </div>
                <div className="panel-heading" style={{ marginTop: 18 }}>
                  <p className="eyebrow">HISTORIQUE</p>
                  <div className="period-switch">
                    <button className={capacityChartRange === "7" ? "selected" : ""} onClick={() => setCapacityChartRange("7")}>7 jours</button>
                    <button className={capacityChartRange === "30" ? "selected" : ""} onClick={() => setCapacityChartRange("30")}>30 jours</button>
                  </div>
                </div>
                <div className="bar-chart" aria-label={`Charge des ${capacityChartRange === "7" ? "7 derniers jours" : "30 derniers jours"}`}>
                  {capacityChartCounts.map((count, index) => (
                    <div className="chart-column" key={capacityChartDays[index]}>
                      <div className="bar-stack">
                        <span className="capacity-bar" style={{ height: `${Math.min((settings.garageCapacity / capacityChartMax) * 100, 100)}%` }} />
                        <span className={`work-bar ${index === capacityChartCounts.length - 1 ? "today" : ""}`} style={{ height: `${(count / capacityChartMax) * 100}%` }} />
                      </div>
                      <span className={index === capacityChartCounts.length - 1 ? "today-label" : ""}>{capacityChartLabels[index]}</span>
                    </div>
                  ))}
                </div>
                <div className="chart-note">
                  <span className="chart-note-icon"><Icon name="trend" size={15} /></span>
                  {garageOccupationRate >= 100 ? (
                    <p><strong>Atelier complet.</strong> Toutes les places sont occupées ({vehiclesInGarage}/{settings.garageCapacity}).</p>
                  ) : (
                    <p><strong>{settings.garageCapacity - vehiclesInGarage} place(s) disponible(s).</strong> L'atelier est à {garageOccupationRate}% de sa capacité ({vehiclesInGarage}/{settings.garageCapacity}).</p>
                  )}
                  <button onClick={() => handleNav("Planning atelier")}>Voir le planning <Icon name="chevronRight" size={14} /></button>
                </div>
              </article>

              <article className="panel presence-panel">
                <div className="panel-heading">
                  <div><p className="eyebrow">ÉQUIPE DU JOUR</p><h2>Présence aujourd'hui</h2></div>
                  <button className="icon-button" onClick={() => handleNav("Présences")} aria-label="Voir les présences"><Icon name="more" size={19} /></button>
                </div>
                <div className="presence-overview">
                  <div className="presence-ring" style={{ background: `conic-gradient(#69b18f 0 ${(presenceCounts.present / mechanics.length) * 100}%, #f2b584 ${(presenceCounts.present / mechanics.length) * 100}% ${((presenceCounts.present + presenceCounts.pause) / mechanics.length) * 100}%, #e8edf0 ${((presenceCounts.present + presenceCounts.pause) / mechanics.length) * 100}% 100%)` }}><div><strong>{presenceCounts.present}</strong><span>/ {mechanics.length}</span></div></div>
                  <div className="presence-numbers">
                    <div><span className="presence-indicator present" /><strong>{presenceCounts.present}</strong><span>Présents</span></div>
                    <div><span className="presence-indicator absent" /><strong>{presenceCounts.absent}</strong><span>Absents</span></div>
                    <div><span className="presence-indicator pause" /><strong>{presenceCounts.pause}</strong><span>En pause</span></div>
                  </div>
                </div>
                <div className="team-list">
                  {mechanics.slice(0, 4).map((mechanic) => {
                    const todayPresence = presenceForDay(mechanic.id, presenceDate);
                    return (
                      <div className="team-row clickable" key={mechanic.name} onClick={() => setSelectedMechanic(mechanic)}>
                        <Avatar initials={mechanic.initials} color={mechanic.color} />
                        <div className="team-person"><strong>{mechanic.name}</strong><span>{mechanic.role}</span></div>
                        <span className={`team-state ${stateToneFor(todayPresence.status)}`}><i />{todayPresence.status}</span>
                      </div>
                    );
                  })}
                </div>
                <button className="text-button full-button" onClick={() => handleNav("Mécaniciens")}>Voir toute l'équipe <Icon name="chevronRight" size={15} /></button>
              </article>
            </section>

            <section className="dashboard-grid-bottom">
              <article className="panel orders-panel">
                <div className="panel-heading">
                  <div><p className="eyebrow">SUIVI EN TEMPS RÉEL</p><h2>Ordres de réparation <span className="heading-count">{dashboardOrders.length}</span></h2></div>
                  <div className="panel-actions">
                    <label className="dashboard-filter-select">
                      <Icon name="filter" size={15} />
                      <select value={dashboardStatusFilter} onChange={(event) => setDashboardStatusFilter(event.target.value as typeof dashboardStatusFilter)}>
                        <option value="Tous">Tous les statuts</option>
                        <option>En cours</option><option>À contrôler</option><option>En attente</option><option>Planifié</option><option>Terminé</option>
                      </select>
                    </label>
                    <span className="live-sync-indicator" title="Synchronisé en temps réel avec les autres appareils"><i />Temps réel</span>
                  </div>
                </div>
                <div className="orders-table">
                  <div className="table-head">
                    <span>ORDRE / VÉHICULE</span>
                    <span>INTERVENTION</span>
                    <span>MÉCANICIEN</span>
                    <span>TEMPS</span>
                    <span>STATUT</span>
                    <span />
                  </div>
                  {dashboardOrders.filter((order) => dashboardStatusFilter === "Tous" || order.status === dashboardStatusFilter).slice(0, 4).map((order) => (
                    <div className="order-row clickable" key={order.id} onClick={() => setSelectedOrder(order)}>
                      <div className="order-vehicle"><strong>{order.id}</strong><div><b>{order.vehicle}</b><span>{order.plate}</span></div></div>
                      <span className="issue-cell">{order.issue}</span>
                      <div className="mechanic-cell"><Avatar initials={order.initials} color={order.initials === "--" ? "#e6e9ee" : undefined} small /><span>{order.mechanic}</span></div>
                      <span className="duration-cell"><Icon name="clock" size={14} />{order.duration}</span>
                      <span className={`status-pill ${order.statusTone}`}><i />{order.status}</span>
                      <button className="row-more" onClick={(e) => e.stopPropagation()} aria-label={`Options ${order.id}`}><Icon name="more" size={17} /></button>
                    </div>
                  ))}
                  {dashboardOrders.filter((order) => dashboardStatusFilter === "Tous" || order.status === dashboardStatusFilter).length === 0 && (
                    <div className="empty-row">Aucun ordre avec ce statut sur la période.</div>
                  )}
                </div>
                <button className="text-button table-footer-button" onClick={() => handleNav("Ordres de réparation")}>Voir les {dashboardOrders.length} ordres de réparation <Icon name="chevronRight" size={15} /></button>
              </article>

              <article className="panel stock-panel">
                <div className="panel-heading">
                  <div><p className="eyebrow">APPROVISIONNEMENT</p><h2>Stock critique <span className="alert-count clickable" onClick={() => setStockFilter(true)} role="button" tabIndex={0}>{stock.filter((item) => item.level === "critique" || item.level === "bas").length}</span></h2></div>
                  <button className={`stock-toggle ${stockFilter ? "on" : ""}`} onClick={() => setStockFilter(!stockFilter)}><Icon name="filter" size={14} /> {stockFilter ? "Tous" : "Critiques"}</button>
                </div>
                <div className="stock-list">
                  {displayedStock.map((item) => (
                    <div className="stock-item clickable" key={item.id} onClick={() => setSelectedStockItem(item)}>
                      <div className="stock-item-top">
                        <div className="part-icon"><Icon name="box" size={16} /></div>
                        <div className="part-details"><strong>{item.name}</strong><span>{item.ref} · {item.supplier}</span></div>
                      </div>
                      <div className="stock-progress-row">
                        <span className={`stock-level ${item.level}`}>{item.quantity} unités</span>
                        <div className="stock-progress"><span className={item.level} style={{ width: `${item.percent}%` }} /></div>
                        <strong>{formatFCFA(item.totalValue)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="stock-footer">
                  <div><Icon name="alert" size={15} /><span>Réassort recommandé avant le <b>28 oct.</b></span></div>
                  <button className="text-button" onClick={() => handleNav("Stocks")}>Gérer le stock <Icon name="chevronRight" size={15} /></button>
                </div>
              </article>
            </section>
          </>
        );
    }
  }

  if (!dataReady) {
    return (
      <div className="app-shell app-shell-loading">
        <div className="brand"><div className="brand-mark"><img src="/socob-logo.png" alt="Logo SOCOB" /></div><div><strong>socob_GestAtelier</strong><span>ATELIER INTERNE</span></div></div>
        <p className="loading-label">Chargement des données…</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><img src="/socob-logo.png" alt="Logo SOCOB" /></div><div><strong>socob_GestAtelier</strong><span>ATELIER INTERNE</span></div></div>
        <div className="sidebar-label-row">
          <div className="sidebar-label">ESPACE DE TRAVAIL</div>
          {!reorderMode ? (
            <button className="reorder-toggle" onClick={() => setReorderMode(true)} title="Réorganiser les onglets"><Icon name="edit" size={13} /> Réorganiser</button>
          ) : (
            <button className="reorder-toggle validate" onClick={saveModuleOrder} title="Valider la nouvelle disposition"><Icon name="check" size={13} /> Valider</button>
          )}
        </div>
        <nav className="main-nav" aria-label="Navigation principale">
          {orderedNavSections.map((section) => {
            const reorderable = reorderMode && section.items.length > 1;
            return (
              <div className="nav-section" key={section.label}>
                <p className="nav-section-label">{section.label}</p>
                {section.items.map((item, idx) => (
                  reorderable ? (
                    <div className="nav-item nav-item-reorder" key={item.label}>
                      <Icon name={item.icon} size={18} /><span>{item.label}</span>
                      <div className="nav-reorder-arrows">
                        <button type="button" disabled={idx === 0} onClick={() => moveModule(section.label, item.label, -1)} aria-label={`Monter ${item.label}`}><Icon name="arrowUp" size={14} /></button>
                        <button type="button" disabled={idx === section.items.length - 1} onClick={() => moveModule(section.label, item.label, 1)} aria-label={`Descendre ${item.label}`}><Icon name="arrowDown" size={14} /></button>
                      </div>
                    </div>
                  ) : (
                    <button className={`nav-item ${activeNav === item.label ? "active" : ""}`} onClick={() => handleNav(item.label)} key={item.label}>
                      <Icon name={item.icon} size={18} /><span>{item.label}</span>{item.badge === "orders" && <em>{orders.length}</em>}{item.badge === "stock" && <em className="warning-count">{stock.filter((s) => s.level === "critique" || s.level === "bas").length}</em>}
                    </button>
                  )
                ))}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <button className={`nav-item ${activeNav === "Paramètres" ? "active" : ""}`} onClick={() => handleNav("Paramètres")}><Icon name="settings" size={18} /><span>Paramètres</span></button>
          <div className="sidebar-profile clickable" onClick={() => setShowProfileModal(true)}><Avatar initials={currentUserInitials} color="#e8b18c" photoURL={profile.photoURL} /><div><strong>{profile.username}</strong><span>{profile.role}</span></div><Icon name="more" size={18} /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Atelier</span><Icon name="chevronRight" size={14} /><strong>{activeNav}</strong>
          </div>
          <div className="topbar-actions">
            <div className="date-chip"><Icon name="calendar" size={16} /><span>{todayLabelCapitalized}</span></div>
            <div className="notification-wrap">
              <button className="top-icon-button" onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }} aria-label="Notifications"><Icon name="bell" size={19} />{notifications.length > 0 && <span className="notification-dot" />}</button>
              {showNotifications && (
                <div className="popover notification-popover">
                  <div className="popover-title"><strong>Notifications</strong><span>{notifications.length} nouvelle{notifications.length > 1 ? "s" : ""}</span></div>
                  {notifications.length === 0 && <div className="notification-item"><div><p>Aucune notification pour le moment.</p></div></div>}
                  {notifications.map((item) => (
                    <div
                      className="notification-item notification-item-clickable"
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => { setShowNotifications(false); handleNav(item.target); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { setShowNotifications(false); handleNav(item.target); } }}
                    >
                      <span className={`notification-icon ${item.tone}`}><Icon name={item.icon} size={15} /></span>
                      <div><strong>{item.title}</strong><p>{item.text}</p></div>
                      <button type="button" className="notification-dismiss" title="Marquer comme lu" onClick={(e) => { e.stopPropagation(); setDismissedNotifications((current) => new Set(current).add(item.id)); }}><Icon name="x" size={13} /></button>
                    </div>
                  ))}
                  <button className="popover-link" onClick={() => { setShowNotifications(false); setDismissedNotifications((current) => { const next = new Set(current); allNotifications.forEach((item) => next.add(item.id)); return next; }); flash("Toutes les notifications ont été marquées comme lues."); }}>Tout marquer comme lu</button>
                </div>
              )}
            </div>
            <div className="user-wrap">
              <button className="user-button" onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}><Avatar initials={currentUserInitials} color="#e8b18c" photoURL={profile.photoURL} small /><span>{profile.username}</span><Icon name="chevronDown" size={15} /></button>
              {showUserMenu && (
                <div className="popover user-popover">
                  <button onClick={() => { setShowUserMenu(false); setShowProfileModal(true); }}>Mon profil</button>
                  <button onClick={() => { setShowUserMenu(false); setShowSettingsModal(true); }}>Paramètres</button>
                  <button disabled={loggingOut} onClick={async () => {
                    setShowUserMenu(false);
                    setLoggingOut(true);
                    try {
                      await onLogout();
                    } catch (error) {
                      console.error("[logout] failed:", error);
                      flash("La déconnexion a échoué. Vérifiez votre connexion et réessayez.");
                      setLoggingOut(false);
                    }
                  }}>{loggingOut ? "Déconnexion…" : "Se déconnecter"}</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={`page-content ${(showNotifications || showUserMenu) ? "page-content-pushed" : ""}`}>
          {renderContent()}
        </div>
      </main>

      <input ref={importInputRef} className="visually-hidden" type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={processImport} />

      {/* Toast */}
      {notice && (
        <div className="toast">
          <span><Icon name="check" size={16} /></span>{notice}
        </div>
      )}

      {/* Modals */}
      {showOrderForm && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) confirmedClose(() => setShowOrderForm(false)); }}>
          <div className="modal">
            <div className="modal-header">
              <div><p className="eyebrow">NOUVELLE INTERVENTION</p><h2>Créer un ordre de réparation</h2></div>
              <button className="icon-button" onClick={() => confirmedClose(() => setShowOrderForm(false))} aria-label="Fermer"><Icon name="x" size={19} /></button>
            </div>
            <form onSubmit={handleAddOrder} onChange={() => setModalDirty(true)}>
              <label>Véhicule<select name="vehicleId" required defaultValue=""><option value="" disabled>Sélectionnez un véhicule</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} — {vehicle.brand} {vehicle.model}</option>)}</select></label>
              <label>Motif de l'intervention<input name="issue" placeholder="Ex. Révision, panne, contrôle..." required /></label>
              <div className="detail-grid compact-grid"><label>Date de début<input name="startDate" type="date" defaultValue={planningPeriod.from} required /></label><label>Date de fin<input name="endDate" type="date" defaultValue={planningPeriod.from} required /></label></div>
              <div className="detail-grid compact-grid"><label>Heure de début<input name="startTime" type="time" defaultValue="" /></label><label>Heure de fin<input name="endTime" type="time" defaultValue="" /></label></div>
              <label>Priorité<select name="priority" defaultValue="Normale"><option>Normale</option><option>Urgente</option><option>À planifier</option></select></label>
              <div className="form-hint"><Icon name="clock" size={15} />La durée est calculée automatiquement à partir des heures de début et de fin.</div>
              <div className="modal-actions">
                <button type="button" className="outline-button" onClick={() => confirmedClose(() => setShowOrderForm(false))}>Annuler</button>
                <button type="submit" className="primary-button">Créer l'ordre <Icon name="arrowUp" size={15} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMechanicForm && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) confirmedClose(() => setShowMechanicForm(false)); }}>
          <div className="modal">
            <div className="modal-header">
              <div><p className="eyebrow">NOUVEAU PERSONNEL</p><h2>Ajouter un mécanicien</h2></div>
              <button className="icon-button" onClick={() => confirmedClose(() => setShowMechanicForm(false))}><Icon name="x" size={19} /></button>
            </div>
            <form onSubmit={handleAddMechanic} onChange={() => setModalDirty(true)}>
              <label>Nom complet<input name="name" placeholder="Ex. Jean Dupont" required /></label>
              <label>Fonction<input name="role" placeholder="Ex. Mécanicien expert" required /></label>
              <label>Email<input name="email" type="email" placeholder="jean.dupont@entreprise.fr" required /></label>
              <label>Téléphone<input name="phone" placeholder="06 12 34 56 78" required /></label>
              <label>Spécialités (séparées par des virgules)<input name="specialties" placeholder="Ex. Moteur, Freinage, Électronique" required /></label>
              <div className="modal-actions">
                <button type="button" className="outline-button" onClick={() => confirmedClose(() => setShowMechanicForm(false))}>Annuler</button>
                <button type="submit" className="primary-button">Ajouter <Icon name="plus" size={15} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVehicleForm && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) confirmedClose(() => setShowVehicleForm(false)); }}>
          <div className="modal">
            <div className="modal-header">
              <div><p className="eyebrow">NOUVEAU VÉHICULE</p><h2>Ajouter un véhicule</h2></div>
              <button className="icon-button" onClick={() => confirmedClose(() => setShowVehicleForm(false))}><Icon name="x" size={19} /></button>
            </div>
            <form onSubmit={handleAddVehicle} onChange={() => setModalDirty(true)}>
              <div className="detail-grid">
                <label>Marque<input name="brand" placeholder="Ex. Mazda" required /></label><label>Modèle<input name="model" placeholder="Ex. BT-50" required /></label>
                <label>Immatriculation<input name="plate" placeholder="3769-LH-01" required /></label><label>Date de première mise en circulation<input name="registrationDate" type="date" required /></label>
                <label>Année<input name="year" type="number" placeholder="2022" required /></label><label>Kilométrage<input name="mileage" type="number" placeholder="45000" required /></label>
                <label>Propriétaire / titulaire<input name="ownerName" placeholder="Raison sociale ou nom" required /></label><label>Adresse du propriétaire<input name="ownerAddress" placeholder="Adresse complète" required /></label>
                <label>Type commercial<input name="commercialType" placeholder="Ex. BT 50 4x4 BVA" required /></label><label>Type / code national<input name="typeCode" placeholder="Ex. TF540" required /></label>
                <label>Carrosserie<input name="bodyType" placeholder="Ex. Pick-up" required /></label><label>Couleur<input name="color" placeholder="Ex. Noir" required /></label>
                <label>Énergie<select name="fuel" defaultValue="Gasoil"><option>Gasoil</option><option>Essence</option><option>Hybride</option><option>Électrique</option></select></label><label>Nombre de places<input name="seats" type="number" placeholder="5" required /></label>
                <label>Puissance fiscale (CV)<input name="fiscalPower" type="number" placeholder="12" required /></label><label>Puissance moteur (kW)<input name="enginePower" type="number" placeholder="140" required /></label>
                <label>Cylindrée (cm³)<input name="displacement" type="number" placeholder="3195" required /></label><label>Nombre d'essieux<input name="axles" type="number" defaultValue="2" required /></label>
                <label>PTAC (kg)<input name="grossWeight" type="number" placeholder="3150" required /></label><label>Poids à vide (kg)<input name="curbWeight" type="number" placeholder="1995" required /></label>
                <label>Charge utile (kg)<input name="payload" type="number" placeholder="1155" required /></label><label>Visite technique valable jusqu'au<input name="inspectionDate" type="date" required /></label>
                <label className="wide-field">Numéro d'identification / VIN<input name="vin" placeholder="Numéro de série constructeur" required /></label>
                <label className="wide-field">Chauffeur assigné<input name="driver" placeholder="Nom du chauffeur" required /></label>
              </div>
              <div className="modal-actions">
                <button type="button" className="outline-button" onClick={() => confirmedClose(() => setShowVehicleForm(false))}>Annuler</button>
                <button type="submit" className="primary-button">Ajouter <Icon name="plus" size={15} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockForm && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) confirmedClose(() => setShowStockForm(false)); }}>
          <div className="modal">
            <div className="modal-header">
              <div><p className="eyebrow">NOUVEL ARTICLE</p><h2>Ajouter au stock</h2></div>
              <button className="icon-button" onClick={() => confirmedClose(() => setShowStockForm(false))}><Icon name="x" size={19} /></button>
            </div>
            <form onSubmit={handleAddStockItem} onChange={() => setModalDirty(true)}>
              <label>Désignation<input name="name" placeholder="Ex. Filtre à air" required /></label>
              <label>Référence<input name="ref" placeholder="Ex. FA-123" required /></label>
              <label>Catégorie<input name="category" placeholder="Ex. Filtration" required /></label>
              <label>Quantité<input name="quantity" type="number" placeholder="10" required /></label>
              <label>Seuil minimum<input name="minLevel" type="number" placeholder="5" required /></label>
              <label>Prix unitaire (FCFA)<input name="unitPrice" type="number" step="1" placeholder="10000" required /></label>
              <label>Fournisseur<input name="supplier" placeholder="Ex. Mann Filter" required /></label>
              <label>Emplacement<input name="location" placeholder="Ex. Étagère A-12" required /></label>
              <div className="modal-actions">
                <button type="button" className="outline-button" onClick={() => confirmedClose(() => setShowStockForm(false))}>Annuler</button>
                <button type="submit" className="primary-button">Ajouter <Icon name="plus" size={15} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockExitForm && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) confirmedClose(() => setShowStockExitForm(false)); }}>
          <div className="modal">
            <div className="modal-header">
              <div><p className="eyebrow">MOUVEMENT DE STOCK</p><h2>Enregistrer une sortie</h2></div>
              <button className="icon-button" onClick={() => confirmedClose(() => setShowStockExitForm(false))}><Icon name="x" size={19} /></button>
            </div>
            <form onSubmit={handleAddStockExit} onChange={() => setModalDirty(true)}>
              <label>Article en stock<select name="itemId" required>{stock.filter((item) => item.quantity > 0).map((item) => <option key={item.id} value={item.id}>{item.ref} — {item.name} ({item.quantity} disponible(s))</option>)}</select></label>
              <label>Date de sortie<input name="date" type="date" defaultValue={stockPeriod.from} required /></label>
              <label>Quantité sortie<input name="quantity" type="number" min="1" placeholder="1" required /></label>
              <label>Motif<select name="reason" required><option value="Ordre atelier">Ordre atelier</option><option value="Sortie manuelle">Sortie manuelle</option><option value="Casse / Perte">Casse / Perte</option><option value="Retour fournisseur">Retour fournisseur</option><option value="Ajustement inventaire">Ajustement inventaire</option></select></label>
              <label>Véhicule concerné<select name="targetVehicleId" defaultValue=""><option value="">Aucun véhicule</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} — {vehicle.brand} {vehicle.model}</option>)}</select></label>
              <label>Ordre de réparation (optionnel)<select name="targetOrder" defaultValue=""><option value="">Aucun ordre lié</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.id} — {order.plate}</option>)}</select></label>
              <label>Notes<textarea name="notes" rows={2} placeholder="Observations..." /></label>
              <div className="modal-actions">
                <button type="button" className="outline-button" onClick={() => confirmedClose(() => setShowStockExitForm(false))}>Annuler</button>
                <button type="submit" className="primary-button">Enregistrer <Icon name="save" size={15} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) confirmedClose(() => setShowSettingsModal(false)); }}>
          <div className="modal settings-modal">
            <div className="modal-header">
              <div><p className="eyebrow">CONFIGURATION</p><h2>Paramètres de l'atelier</h2></div>
              <button className="icon-button" onClick={() => confirmedClose(() => setShowSettingsModal(false))}><Icon name="x" size={19} /></button>
            </div>
            <form onSubmit={handleSaveSettings} onChange={() => setModalDirty(true)}>
              <div className="settings-section">
                <h3>Informations générales</h3>
                <label>Nom de l'atelier<input name="workshopName" defaultValue={settings.workshopName} required /></label>
                <div className="settings-row">
                  <label>Devise<select name="currency" defaultValue={settings.currency}><option>FCFA</option></select></label>
                  <label>Langue<select name="language" defaultValue={settings.language}><option>FR</option><option>EN</option><option>ES</option></select></label>
                </div>
                <label>Capacité du garage (nombre de véhicules)<input name="garageCapacity" type="number" min="1" defaultValue={settings.garageCapacity} required /></label>
              </div>
              <div className="settings-section">
                <h3>Notifications et alertes</h3>
                <label className="checkbox-label">
                  <input type="checkbox" name="emailNotifications" defaultChecked={settings.emailNotifications} />
                  <span>Activer les notifications par email</span>
                </label>
                <div className="alert-emails">
                  <span className="alert-emails-label">Adresses destinataires des alertes</span>
                  {(settings.alertEmails ?? []).length > 0 && (
                    <ul className="alert-emails-list">
                      {(settings.alertEmails ?? []).map((email) => (
                        <li key={email}>
                          <span>{email}</span>
                          <button type="button" onClick={() => removeAlertEmail(email)} aria-label={`Retirer ${email}`}><Icon name="x" size={13} /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="alert-emails-add">
                    <input
                      type="email"
                      placeholder="nom@exemple.com"
                      value={alertEmailDraft}
                      onChange={(event) => setAlertEmailDraft(event.target.value)}
                      onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addAlertEmail(); } }}
                    />
                    <button type="button" className="outline-button" onClick={addAlertEmail}>Ajouter adresse email</button>
                  </div>
                </div>
                <label className="checkbox-label">
                  <input type="checkbox" name="autoAssign" defaultChecked={settings.autoAssign} />
                  <span>Affectation automatique des mécaniciens</span>
                </label>
                <label>Seuil d'alerte stock (% du minimum)<input name="alertThreshold" type="number" defaultValue={settings.alertThreshold} min="10" max="100" /></label>
              </div>
              <div className="modal-actions">
                <button type="button" className="outline-button" onClick={() => confirmedClose(() => setShowSettingsModal(false))}>Annuler</button>
                <button type="submit" className="primary-button">Enregistrer <Icon name="save" size={15} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) confirmedClose(() => setShowProfileModal(false)); }}>
          <div className="modal profile-modal">
            <div className="modal-header">
              <div><p className="eyebrow">COMPTE</p><h2>Mon profil</h2></div>
              <button className="icon-button" onClick={() => confirmedClose(() => setShowProfileModal(false))}><Icon name="x" size={19} /></button>
            </div>
            <form onSubmit={handleSaveProfile} onChange={() => setModalDirty(true)}>
              <div className="profile-photo-row">
                <Avatar initials={currentUserInitials} color="#e8b18c" photoURL={profile.photoURL} />
                <div>
                  <label className="outline-button profile-photo-upload">
                    {uploadingPhoto ? "Téléversement…" : "Changer la photo"}
                    <input type="file" accept="image/*" className="visually-hidden" disabled={uploadingPhoto} onChange={handleProfilePhotoChange} />
                  </label>
                  <span className="profile-photo-hint">JPG ou PNG, quelques Mo maximum.</span>
                </div>
              </div>
              <div className="settings-section">
                <label>Nom affiché<input name="username" defaultValue={profile.username} required /></label>
                <label>Fonction<input name="role" defaultValue={profile.role} required /></label>
                <label>Email (optionnel)<input name="email" type="email" defaultValue={profile.email ?? ""} placeholder="vous@exemple.com" /></label>
              </div>
              <div className="modal-actions">
                <button type="button" className="outline-button" onClick={() => confirmedClose(() => setShowProfileModal(false))}>Annuler</button>
                <button type="submit" className="primary-button">Enregistrer <Icon name="save" size={15} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modals */}
      {selectedOrder && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) confirmedClose(() => setSelectedOrder(null)); }}>
          <div className="modal detail-modal">
            <div className="modal-header">
              <div><p className="eyebrow">FICHE DÉTAILLÉE</p><h2>{selectedOrder.id}</h2></div>
              <div className="modal-actions">
                <ActionButtons onPrint={handlePrint} onExport={handleExport} />
                <button className="icon-button" onClick={() => confirmedClose(() => setSelectedOrder(null))}><Icon name="x" size={19} /></button>
              </div>
            </div>
            <form onChange={() => setModalDirty(true)} onSubmit={(e) => { 
              e.preventDefault(); 
              const form = new FormData(e.currentTarget);
              const vehicleId = String(form.get("vehicleId"));
              const vehicle = vehicles.find((item) => item.id === vehicleId);
              const startTime = String(form.get("startTime") || "");
              const status = String(form.get("status")) as Order["status"];
              const endTime = status === "Terminé" ? String(form.get("endTime") || "") : "";
              const partsCost = selectedOrder.parts.reduce((sum, part) => {
                const stockItem = stock.find((s) => s.id === part.itemId);
                return sum + (stockItem?.unitPrice ?? 0) * part.quantity;
              }, 0);
              handleUpdateOrder({ 
                ...selectedOrder,
                vehicleId,
                vehicle: vehicle ? `${vehicle.brand} ${vehicle.model}` : selectedOrder.vehicle,
                plate: vehicle?.plate ?? selectedOrder.plate,
                issue: String(form.get("issue")), 
                mechanic: String(form.get("mechanic")),
                startDate: String(form.get("startDate")),
                endDate: String(form.get("endDate")),
                startTime,
                endTime,
                duration: endTime ? durationLabel(minutesBetween(startTime, endTime)) : "À estimer",
                status,
                statusTone: toneForOrderStatus(status),
                cost: partsCost
              }); 
            }}>
              <div className="detail-grid">
                <label>Véhicule<select name="vehicleId" defaultValue={selectedOrder.vehicleId}>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} — {vehicle.brand} {vehicle.model}</option>)}</select></label>
                <label>Mécanicien
                  <select name="mechanic" defaultValue={selectedOrder.mechanic}>
                    <option value="À affecter">À affecter</option>
                    {mechanics
                      .filter((item) => item.state === "Disponible" || item.name === selectedOrder.mechanic)
                      .map((item) => (
                        <option key={item.id} value={item.name}>{item.name}{item.state !== "Disponible" ? ` (${item.state})` : ""}</option>
                      ))}
                  </select>
                </label>
                <label>Intervention<input name="issue" defaultValue={selectedOrder.issue} required /></label>
                <label>Coût (FCFA)<input type="text" readOnly disabled value={formatFCFA(selectedOrder.parts.reduce((sum, part) => { const stockItem = stock.find((s) => s.id === part.itemId); return sum + (stockItem?.unitPrice ?? 0) * part.quantity; }, 0))} title="Calculé automatiquement à partir des pièces prélevées ci-dessous" /></label>
                <label>Période du<input name="startDate" type="date" defaultValue={selectedOrder.startDate} required /></label>
                <label>Période au<input name="endDate" type="date" defaultValue={selectedOrder.endDate} required /></label>
                <label>Heure de début<input name="startTime" type="time" defaultValue={selectedOrder.startTime} /></label>
                <label>Statut
                  <select name="status" value={selectedOrder.status} onChange={(event) => setSelectedOrder({ ...selectedOrder, status: event.target.value as Order["status"] })}>
                    <option>En cours</option><option>À contrôler</option><option>En attente</option><option>Planifié</option><option>Terminé</option>
                  </select>
                </label>
                {selectedOrder.status === "Terminé" && (
                  <label>Heure de fin<input name="endTime" type="time" defaultValue={selectedOrder.endTime} /></label>
                )}
              </div>
              <div className="work-duration-preview"><Icon name="clock" size={16} /> Durée calculée à l'enregistrement : <strong>{selectedOrder.duration}</strong></div>
              <div className="detail-section">
                <h4>Pièces à prélever du stock <em className="section-hint">défalquées à l'enregistrement</em></h4>
                <div className="parts-editor">
                  {selectedOrder.parts.map((part, idx) => {
                    const item = stock.find((s) => s.id === part.itemId);
                    return (
                      <div className="parts-row" key={`${part.itemId}-${idx}`}>
                        <span className="parts-name"><code>{item?.ref ?? "—"}</code><strong>{part.itemName}</strong><em>Stock : {item?.quantity ?? 0}</em></span>
                        <span className="parts-qty">× <strong>{part.quantity}</strong></span>
                        <span className="parts-value">{formatFCFA((item?.unitPrice ?? 0) * part.quantity)}</span>
                        <button type="button" className="parts-remove" title="Retirer" onClick={() => setSelectedOrder({ ...selectedOrder, parts: selectedOrder.parts.filter((_, i) => i !== idx) })}><Icon name="trash" size={14} /></button>
                      </div>
                    );
                  })}
                  {selectedOrder.parts.length === 0 && <div className="parts-empty">Aucune pièce ajoutée.</div>}
                </div>
                <div className="parts-add">
                  <select name="addPartId" defaultValue="">
                    <option value="" disabled>Ajouter une pièce…</option>
                    {stock.filter((item) => item.quantity > 0).map((item) => {
                      const already = selectedOrder?.parts.find((p) => p.itemId === item.id);
                      const remaining = item.quantity - (already?.quantity ?? 0);
                      return <option key={item.id} value={item.id} disabled={remaining <= 0}>{item.ref} — {item.name} ({remaining} dispo.)</option>;
                    })}
                    {stock.filter((item) => item.quantity === 0).length > 0 && <optgroup label="Rupture de stock">{stock.filter((item) => item.quantity === 0).map((item) => <option key={item.id} value={item.id} disabled>{item.ref} — {item.name} · ÉPUISE</option>)}</optgroup>}
                  </select>
                  <input name="addPartQty" type="number" min="1" defaultValue="1" />
                  <button type="button" className="outline-button" onClick={(e) => {
                    const form = (e.currentTarget.closest("form") as HTMLFormElement | null);
                    if (!form || !selectedOrder) return;
                    const itemId = String(new FormData(form).get("addPartId"));
                    const qty = Math.max(1, parseInt(String(new FormData(form).get("addPartQty"))) || 1);
                    const item = stock.find((s) => s.id === itemId);
                    if (!item) { flash("Sélectionnez une pièce."); return; }
                    if (item.quantity <= 0) { flash(`${item.name} est en rupture de stock.`); return; }
                    setSelectedOrder((prev) => {
                      if (!prev) return prev;
                      const existingIndex = prev.parts.findIndex((p) => p.itemId === itemId);
                      if (existingIndex >= 0) {
                        const newParts = [...prev.parts];
                        newParts[existingIndex] = { ...newParts[existingIndex], quantity: newParts[existingIndex].quantity + qty };
                        return { ...prev, parts: newParts };
                      }
                      return { ...prev, parts: [...prev.parts, { itemId, itemName: item.name, quantity: qty }] };
                    });
                  }}><Icon name="plus" size={14} /> Ajouter</button>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="danger-button" onClick={() => { const remainingOrders = orders.filter(o => o.id !== selectedOrder.id); setOrders(remainingOrders); persist(removeDoc(ORDERS_COLLECTION, selectedOrder.id), "delete order"); syncVehicleStatus(selectedOrder.vehicleId, remainingOrders); setSelectedOrder(null); flash(`L'ordre ${selectedOrder.id} a été supprimé.`); }}><Icon name="trash" size={15} /> Supprimer</button>
                <button type="submit" className="primary-button">Enregistrer les modifications <Icon name="save" size={15} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedMechanic && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) confirmedClose(() => setSelectedMechanic(null)); }}>
          <div className="modal detail-modal">
            <div className="modal-header">
              <div><p className="eyebrow">FICHE DÉTAILLÉE</p><h2>{selectedMechanic.name}</h2></div>
              <div className="modal-actions">
                <ActionButtons onPrint={handlePrint} onExport={handleExport} />
                <button className="icon-button" onClick={() => confirmedClose(() => setSelectedMechanic(null))}><Icon name="x" size={19} /></button>
              </div>
            </div>
            <form onChange={() => setModalDirty(true)} onSubmit={(e) => { 
              e.preventDefault(); 
              const form = new FormData(e.currentTarget); 
              handleUpdateMechanic({ 
                ...selectedMechanic, 
                name: String(form.get("name")), 
                role: String(form.get("role")), 
                email: String(form.get("email")), 
                phone: String(form.get("phone")) 
              }); 
            }}>
              <div className="detail-grid">
                <label>Nom<input name="name" defaultValue={selectedMechanic.name} required /></label>
                <label>Fonction<input name="role" defaultValue={selectedMechanic.role} required /></label>
                <label>Email<input name="email" type="email" defaultValue={selectedMechanic.email} required /></label>
                <label>Téléphone<input name="phone" defaultValue={selectedMechanic.phone} required /></label>
                <label>Date d'entrée<input type="date" defaultValue={selectedMechanic.startDate} disabled /></label>
                <label>Statut<select defaultValue={selectedMechanic.state}><option>En intervention</option><option>Disponible</option><option>Pause</option><option>Absent</option></select></label>
              </div>
              <div className="detail-section">
                <h4>Spécialités</h4>
                <div className="specialties-edit">
                  {selectedMechanic.specialties.map((spec, idx) => <span key={idx} className="specialty-tag">{spec}</span>)}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="danger-button" onClick={() => { setMechanics(mechanics.filter(m => m.id !== selectedMechanic.id)); persist(removeDoc(MECHANICS_COLLECTION, selectedMechanic.id), "delete mechanic"); setSelectedMechanic(null); flash(`${selectedMechanic.name} a été retiré.`); }}><Icon name="trash" size={15} /> Supprimer</button>
                <button type="submit" className="primary-button">Enregistrer <Icon name="save" size={15} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedVehicle && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) confirmedClose(() => setSelectedVehicle(null)); }}>
          <div className="modal detail-modal">
            <div className="modal-header">
              <div><p className="eyebrow">FICHE DÉTAILLÉE</p><h2>{selectedVehicle.brand} {selectedVehicle.model}</h2></div>
              <div className="modal-actions">
                <ActionButtons onPrint={handlePrint} onExport={handleExport} />
                <button className="icon-button" onClick={() => confirmedClose(() => setSelectedVehicle(null))}><Icon name="x" size={19} /></button>
              </div>
            </div>
            <form onChange={() => setModalDirty(true)} onSubmit={(e) => { 
              e.preventDefault(); 
              const form = new FormData(e.currentTarget);
              const number = (name: string) => parseInt(String(form.get(name))) || 0;
              handleUpdateVehicle({ 
                ...selectedVehicle,
                brand: String(form.get("brand")), model: String(form.get("model")), plate: String(form.get("plate")),
                year: number("year"), mileage: number("mileage"), assignedDriver: String(form.get("driver")),
                status: String(form.get("status")) as Vehicle["status"], statusDate: String(form.get("statusDate")),
                ownerName: String(form.get("ownerName")), ownerAddress: String(form.get("ownerAddress")),
                commercialType: String(form.get("commercialType")), typeCode: String(form.get("typeCode")), bodyType: String(form.get("bodyType")),
                color: String(form.get("color")), fuel: String(form.get("fuel")), seats: number("seats"), fiscalPower: number("fiscalPower"),
                enginePower: number("enginePower"), displacement: number("displacement"), grossWeight: number("grossWeight"), curbWeight: number("curbWeight"),
                payload: number("payload"), axles: number("axles"), vin: String(form.get("vin")), registrationDate: String(form.get("registrationDate")),
                inspectionDate: String(form.get("inspectionDate")), lastRevisionKm: parseInt(String(form.get("lastRevisionKm"))) || 0, nextRevisionKm: parseInt(String(form.get("nextRevisionKm"))) || 0, lastMaintenance: String(form.get("lastMaintenance")), nextMaintenance: String(form.get("nextMaintenance"))
              }); 
            }}>
              <div className="detail-section card-section"><h4>Immatriculation & titulaire</h4><div className="detail-grid">
                <label>Immatriculation<input name="plate" defaultValue={selectedVehicle.plate} required /></label><label>Date de mise en circulation<input name="registrationDate" type="date" defaultValue={selectedVehicle.registrationDate} required /></label>
                <label>Propriétaire / titulaire<input name="ownerName" defaultValue={selectedVehicle.ownerName} required /></label><label>Adresse du titulaire<input name="ownerAddress" defaultValue={selectedVehicle.ownerAddress} required /></label>
                <label>Marque<input name="brand" defaultValue={selectedVehicle.brand} required /></label><label>Modèle<input name="model" defaultValue={selectedVehicle.model} required /></label>
                <label>Type commercial<input name="commercialType" defaultValue={selectedVehicle.commercialType} required /></label><label>Type / code<input name="typeCode" defaultValue={selectedVehicle.typeCode} required /></label>
                <label className="wide-field">Numéro VIN / série constructeur<input name="vin" defaultValue={selectedVehicle.vin} required /></label>
              </div></div>
              <div className="detail-section card-section"><h4>Caractéristiques techniques</h4><div className="detail-grid">
                <label>Carrosserie<input name="bodyType" defaultValue={selectedVehicle.bodyType} required /></label><label>Couleur<input name="color" defaultValue={selectedVehicle.color} required /></label>
                <label>Énergie<select name="fuel" defaultValue={selectedVehicle.fuel}><option>Gasoil</option><option>Essence</option><option>Hybride</option><option>Électrique</option></select></label><label>Nombre de places<input name="seats" type="number" defaultValue={selectedVehicle.seats} required /></label>
                <label>Puissance fiscale (CV)<input name="fiscalPower" type="number" defaultValue={selectedVehicle.fiscalPower} required /></label><label>Puissance moteur (kW)<input name="enginePower" type="number" defaultValue={selectedVehicle.enginePower} required /></label>
                <label>Cylindrée (cm³)<input name="displacement" type="number" defaultValue={selectedVehicle.displacement} required /></label><label>Nombre d'essieux<input name="axles" type="number" defaultValue={selectedVehicle.axles} required /></label>
                <label>PTAC (kg)<input name="grossWeight" type="number" defaultValue={selectedVehicle.grossWeight} required /></label><label>Poids à vide (kg)<input name="curbWeight" type="number" defaultValue={selectedVehicle.curbWeight} required /></label>
                <label>Charge utile (kg)<input name="payload" type="number" defaultValue={selectedVehicle.payload} required /></label><label>Année<input name="year" type="number" defaultValue={selectedVehicle.year} required /></label>
              </div></div>
              <div className="detail-section card-section"><h4>Exploitation & contrôles</h4><div className="detail-grid">
                <label>Kilométrage<input name="mileage" type="number" defaultValue={selectedVehicle.mileage} required /></label><label>Chauffeur<input name="driver" defaultValue={selectedVehicle.assignedDriver} required /></label>
                <label>Statut<select name="status" defaultValue={selectedVehicle.status}><option>Opérationnel</option><option>En réparation</option><option>Immobilisé</option><option>Hors service</option></select></label><label>Date de statut<input name="statusDate" type="date" defaultValue={selectedVehicle.statusDate} required /></label>
                <label>Dernière révision (km)<input name="lastRevisionKm" type="number" min="0" step="500" defaultValue={selectedVehicle.lastRevisionKm} required /></label><label>Prochaine révision (km)<input name="nextRevisionKm" type="number" min="0" step="500" defaultValue={selectedVehicle.nextRevisionKm} required /></label>
                <label>Intervalle (km) <input type="number" defaultValue={selectedVehicle.nextRevisionKm - selectedVehicle.lastRevisionKm} onChange={(event) => { const gap = parseInt(event.target.value) || 0; const last = (document.querySelector('[name="lastRevisionKm"]') as HTMLInputElement | null)?.value; if (last) { const km = parseInt(last) + gap; const next = document.querySelector('[name="nextRevisionKm"]') as HTMLInputElement | null; if (next) next.value = String(km); } }} />
                  <em className="field-hint">Écart en km entre deux révisions (ex. 20 000)</em></label>
                <label className="wide-field">Visite technique valable jusqu'au<input name="inspectionDate" type="date" defaultValue={selectedVehicle.inspectionDate} required /></label>
              </div></div>
              <div className="modal-actions">
                <button type="button" className="danger-button" onClick={() => { setVehicles(vehicles.filter(v => v.id !== selectedVehicle.id)); persist(removeDoc(VEHICLES_COLLECTION, selectedVehicle.id), "delete vehicle"); setSelectedVehicle(null); flash(`Le véhicule ${selectedVehicle.plate} a été supprimé.`); }}><Icon name="trash" size={15} /> Supprimer</button>
                <button type="submit" className="primary-button">Enregistrer <Icon name="save" size={15} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedStockItem && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) confirmedClose(() => setSelectedStockItem(null)); }}>
          <div className="modal detail-modal">
            <div className="modal-header">
              <div><p className="eyebrow">FICHE DÉTAILLÉE</p><h2>{selectedStockItem.name}</h2></div>
              <div className="modal-actions">
                <ActionButtons onPrint={handlePrint} onExport={handleExport} />
                <button className="icon-button" onClick={() => confirmedClose(() => setSelectedStockItem(null))}><Icon name="x" size={19} /></button>
              </div>
            </div>
            <form onChange={() => setModalDirty(true)} onSubmit={(e) => { 
              e.preventDefault(); 
              const form = new FormData(e.currentTarget); 
              const qty = parseInt(String(form.get("quantity"))); 
              const minLvl = parseInt(String(form.get("minLevel"))); 
              const unitPrice = parseFloat(String(form.get("unitPrice")));
              const newLevel: "critique" | "bas" | "normal" = qty <= minLvl * 0.5 ? "critique" : qty <= minLvl ? "bas" : "normal"; 
              handleUpdateStockItem({ 
                ...selectedStockItem, name: String(form.get("name")), ref: String(form.get("ref")), quantity: qty, minLevel: minLvl, unitPrice,
                supplier: String(form.get("supplier")), location: String(form.get("location")), level: newLevel,
                percent: Math.min((qty / (minLvl * 2)) * 100, 100), totalValue: qty * unitPrice 
              }); 
            }}>
              <div className="detail-grid">
                <label>Désignation<input name="name" defaultValue={selectedStockItem.name} required /></label><label>Référence<input name="ref" defaultValue={selectedStockItem.ref} required /></label>
                <label>Catégorie<input defaultValue={selectedStockItem.category} disabled /></label><label>Quantité<input name="quantity" type="number" defaultValue={selectedStockItem.quantity} required /></label>
                <label>Seuil minimum<input name="minLevel" type="number" defaultValue={selectedStockItem.minLevel} required /></label><label>Prix unitaire (FCFA)<input name="unitPrice" type="number" step="1" defaultValue={selectedStockItem.unitPrice} required /></label>
                <label>Fournisseur<input name="supplier" defaultValue={selectedStockItem.supplier} required /></label><label>Emplacement<input name="location" defaultValue={selectedStockItem.location} required /></label>
              </div>
              <div className="stock-detail-value"><span>Valeur totale: <strong>{formatFCFA(selectedStockItem.totalValue)}</strong></span><span className={`level-badge ${selectedStockItem.level}`}>{selectedStockItem.level === "critique" ? "Stock critique" : selectedStockItem.level === "bas" ? "Stock bas" : "Stock normal"}</span></div>
              <div className="modal-actions"><button type="button" className="danger-button" onClick={() => { setStock(stock.filter(s => s.id !== selectedStockItem.id)); persist(removeDoc(STOCK_COLLECTION, selectedStockItem.id), "delete stock item"); setSelectedStockItem(null); flash(`${selectedStockItem.name} a été retiré du stock.`); }}><Icon name="trash" size={15} /> Supprimer</button><button type="submit" className="primary-button">Enregistrer <Icon name="save" size={15} /></button></div>
            </form>
          </div>
        </div>
      )}

      {quickExitItem && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) confirmedClose(() => setQuickExitItem(null)); }}>
          <div className="quick-exit-modal">
            <header className="quick-exit-head">
              <h2>Sortie de stock : {quickExitItem.name}</h2>
              <button className="quick-exit-close" onClick={() => confirmedClose(() => setQuickExitItem(null))} aria-label="Fermer"><Icon name="x" size={18} /></button>
            </header>
            <div className="quick-exit-banner">
              <div>
                <span>Stock disponible</span>
                <strong>{quickExitItem.quantity} unité(s)</strong>
              </div>
              <div className="quick-exit-sku">
                <span>SKU</span>
                <code>{quickExitItem.ref}</code>
              </div>
            </div>
            <form onSubmit={submitQuickExit} onChange={() => setModalDirty(true)}>
              <div className="quick-exit-grid">
                <label>
                  <span>Quantité à sortir</span>
                  <input name="quantity" type="number" min="1" max={quickExitItem.quantity} value={quickExitQty} onChange={(event) => setQuickExitQty(Math.max(1, Math.min(quickExitItem.quantity, parseInt(event.target.value) || 1)))} required />
                </label>
                <label>
                  <span>Motif</span>
                  <select name="reason" defaultValue="Sortie manuelle" required>
                    <option>Sortie manuelle</option>
                    <option>Casse / Perte</option>
                    <option>Retour fournisseur</option>
                    <option>Ajustement inventaire</option>
                    <option>Ordre atelier</option>
                  </select>
                </label>
              </div>
              <div className="quick-exit-total">
                <span>Valeur de la sortie</span>
                <strong>{formatFCFA(quickExitQty * quickExitItem.unitPrice)}</strong>
                <em>{quickExitQty} × {formatFCFA(quickExitItem.unitPrice)}</em>
              </div>
              <label className="quick-exit-note">
                <span>Note (optionnel)</span>
                <input name="notes" type="text" placeholder={`Ex: Pièce cassée lors du montage`} />
              </label>
              <p className="quick-exit-hint">Cette sortie sera ajoutée au récapitulatif des sorties et déduite du stock disponible.</p>
              <div className="quick-exit-actions">
                <button type="button" className="ghost-button" onClick={() => confirmedClose(() => setQuickExitItem(null))}>Annuler</button>
                <button type="submit" className="primary-button">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedKpi && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedKpi(null); }}>
          <div className="modal detail-modal kpi-modal">
            <div className="modal-header"><div><p className="eyebrow">JUSTIFICATION DE L'INDICATEUR</p><h2>{selectedKpi === "time" ? "Temps moyen par réparation" : selectedKpi === "parts" ? "Valeur des pièces utilisées" : selectedKpi === "stock" ? "Valeur de l'inventaire" : "Véhicules immobilisés"}</h2></div><button className="icon-button" onClick={() => setSelectedKpi(null)}><Icon name="x" size={19} /></button></div>
            <p className="kpi-period-note">Période analysée : du <strong>{dashboardPeriod.from}</strong> au <strong>{dashboardPeriod.to}</strong>.</p>
            {selectedKpi === "time" && <div className="kpi-breakdown"><div className="kpi-total"><strong>{durationLabel(averageRepairMinutes)}</strong><span>Moyenne de {dashboardOrders.length} ordre(s) avec heures renseignées</span></div>{dashboardOrders.map((order) => <div className="kpi-row" key={order.id}><span><b>{order.id}</b> · {order.vehicle}</span><span>{order.startTime} – {order.endTime}</span><strong>{durationLabel(minutesBetween(order.startTime, order.endTime))}</strong></div>)}</div>}
            {selectedKpi === "parts" && <div className="kpi-breakdown"><div className="kpi-total"><strong>{formatFCFA(dashboardPartsValue)}</strong><span>Valeur des sorties de pièces de la période</span></div>{dashboardExits.map((exit) => { const item = stock.find((stockItem) => stockItem.id === exit.itemId); const value = (item?.unitPrice ?? 0) * exit.quantity; return <div className="kpi-row" key={exit.id}><span><b>{exit.itemName}</b> · {exit.targetVehicle ?? "Sans véhicule"}</span><span>{exit.quantity} × {formatFCFA(item?.unitPrice ?? 0)}</span><strong>{formatFCFA(value)}</strong></div>; })}</div>}
            {selectedKpi === "stock" && <div className="kpi-breakdown"><div className="kpi-total"><strong>{formatFCFA(totalStockValue)}</strong><span>Quantité disponible × prix unitaire, inventaire actuel</span></div>{stock.map((item) => <div className="kpi-row" key={item.id}><span><b>{item.ref}</b> · {item.name}</span><span>{item.quantity} × {formatFCFA(item.unitPrice)}</span><strong>{formatFCFA(item.totalValue)}</strong></div>)}</div>}
            {selectedKpi === "immobilized" && <div className="kpi-breakdown"><div className="kpi-total"><strong>{immobilizedVehicles.length}</strong><span>Véhicule(s) en réparation ou immobilisé(s) sur la période</span></div>{immobilizedVehicles.map((vehicle) => <div className="kpi-row" key={vehicle.id}><span><b>{vehicle.plate}</b> · {vehicle.brand} {vehicle.model}</span><span>{vehicle.statusDate}</span><strong>{vehicle.status}</strong></div>)}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
