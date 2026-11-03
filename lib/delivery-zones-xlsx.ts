import ExcelJS from "exceljs";
import type { ZoneRowInput, ZoneTemplateRow } from "./delivery-zones-excel";

const SHEET_NAME = "Zonas";
const HEADERS = ["Provincia", "Municipio", "Zona", "Precio CUP"] as const;

export const MAX_IMPORT_ROWS = 2000;

/**
 * Genera el .xlsx de la plantilla con las zonas actuales.
 * La primera fila son los encabezados y la columna de precio va como número.
 */
export async function buildZonesWorkbook(rows: ZoneTemplateRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MercaToma";
  const sheet = workbook.addWorksheet(SHEET_NAME);

  sheet.columns = [
    { header: HEADERS[0], key: "province", width: 26 },
    { header: HEADERS[1], key: "municipality", width: 26 },
    { header: HEADERS[2], key: "zone", width: 32 },
    { header: HEADERS[3], key: "price", width: 16 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8EEF7" },
  };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  for (const row of rows) {
    sheet.addRow({ province: row.province, municipality: row.municipality, zone: row.zone, price: row.price });
  }

  sheet.getColumn("price").numFmt = "#,##0.00";

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

interface ReadResult {
  rows: ZoneRowInput[];
}

/**
 * Lee el .xlsx subido y devuelve las filas con su número real.
 * Lanza un error legible si faltan columnas o el archivo es inválido.
 */
export async function readZonesWorkbook(data: ArrayBuffer | Buffer | Uint8Array): Promise<ReadResult> {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(data as ArrayBuffer);
  } catch {
    throw new Error("No pudimos leer el archivo. Asegúrate de que sea un Excel (.xlsx) válido.");
  }

  const sheet = workbook.getWorksheet(SHEET_NAME) ?? workbook.worksheets[0];
  if (!sheet) throw new Error("El archivo no tiene ninguna hoja con datos.");

  const headerRow = sheet.getRow(1);
  const columns = new Map<string, number>();
  headerRow.eachCell((cell, colNumber) => {
    const text = String(cell.value ?? "").trim().toLowerCase();
    if (text) columns.set(text, colNumber);
  });

  const findColumn = (...names: string[]) => {
    for (const name of names) {
      const found = columns.get(name.toLowerCase());
      if (found) return found;
    }
    return 0;
  };

  const provinceCol = findColumn("Provincia");
  const municipalityCol = findColumn("Municipio");
  const zoneCol = findColumn("Zona", "Nombre de la zona");
  const priceCol = findColumn("Precio CUP", "Precio");

  const missing: string[] = [];
  if (!provinceCol) missing.push("Provincia");
  if (!municipalityCol) missing.push("Municipio");
  if (!zoneCol) missing.push("Zona");
  if (!priceCol) missing.push("Precio CUP");
  if (missing.length) {
    throw new Error(`Faltan columnas en el archivo: ${missing.join(", ")}.`);
  }

  const cellText = (row: ExcelJS.Row, col: number): string => {
    const value = row.getCell(col).value;
    if (value === null || value === undefined) return "";
    if (typeof value === "object" && "text" in (value as object)) {
      return String((value as { text: string }).text ?? "").trim();
    }
    if (typeof value === "object" && "result" in (value as object)) {
      return String((value as { result: unknown }).result ?? "").trim();
    }
    return String(value).trim();
  };

  const cellPrice = (row: ExcelJS.Row, col: number): string | number => {
    const value = row.getCell(col).value;
    if (typeof value === "number") return value;
    if (value === null || value === undefined) return "";
    if (typeof value === "object" && "result" in (value as object)) {
      const result = (value as { result: unknown }).result;
      return typeof result === "number" ? result : String(result ?? "");
    }
    return String(value);
  };

  const rows: ZoneRowInput[] = [];
  let dataRows = 0;

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const province = cellText(row, provinceCol);
    const municipality = cellText(row, municipalityCol);
    const zone = cellText(row, zoneCol);
    const price = cellPrice(row, priceCol);

    // Las filas totalmente vacías se saltan sin contarlas.
    if (!province && !municipality && !zone && (price === "" || price === null)) return;

    dataRows += 1;
    rows.push({ row: rowNumber, province, municipality, zone, price });
  });

  if (rows.length === 0) {
    throw new Error("El archivo no tiene filas de zonas.");
  }
  if (dataRows > MAX_IMPORT_ROWS) {
    throw new Error(`El archivo tiene ${dataRows} filas; el máximo es ${MAX_IMPORT_ROWS}.`);
  }

  return { rows };
}
