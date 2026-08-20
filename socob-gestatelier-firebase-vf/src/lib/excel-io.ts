// Shared Excel (.xlsx) export / import helpers, used by every module of
// the app (Ordres de réparation, Mécaniciens, Véhicules, Stocks,
// Présences) so that "Exporter" always produces a real Excel file, and
// "Importer" always reads a real Excel file back in.

import * as XLSX from "xlsx";

/** Downloads `records` as a one-sheet .xlsx file named `filename` (without extension). */
export function exportToExcel(filename: string, records: Array<Record<string, unknown>>, sheetName = "Feuille1"): void {
  const worksheet = XLSX.utils.json_to_sheet(records);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/** Reads the first sheet of an uploaded .xlsx/.xls/.csv file into an array of plain row objects, keyed by column header. */
export async function readExcelFile(file: File): Promise<Array<Record<string, string>>> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const worksheet = workbook.Sheets[firstSheetName];
  // raw: false -> cell values come back as display strings (matches what a
  // person actually typed/sees in Excel, e.g. dates), which is what the
  // per-module row mappers in dashboard-shell.tsx expect.
  return XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { raw: false, defval: "" });
}

/** Case/accent-insensitive lookup of a column value from an imported row, trying each candidate header name in turn. */
export function pickColumn(row: Record<string, string>, ...candidates: string[]): string {
  const normalize = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedRow = new Map(Object.keys(row).map((key) => [normalize(key), row[key]]));
  for (const candidate of candidates) {
    const value = normalizedRow.get(normalize(candidate));
    if (value !== undefined && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}
