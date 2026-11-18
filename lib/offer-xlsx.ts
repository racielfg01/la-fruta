import ExcelJS from "exceljs";
import { OFFER_HEADERS, type OfferRowInput } from "./offer-excel";

const SHEET_NAME = "Ofertas";

export const MAX_OFFER_IMPORT_ROWS = 500;

/** Fecha de Excel a texto de `datetime-local` en hora local. */
function cellDate(value: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

/** Genera la plantilla vacía: el usuario rellena las filas con sus ofertas. */
export async function buildOfferWorkbook(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MercaToma";
  const sheet = workbook.addWorksheet(SHEET_NAME);

  sheet.columns = [
    { header: OFFER_HEADERS[0], key: "name", width: 26 },
    { header: OFFER_HEADERS[1], key: "description", width: 40 },
    { header: OFFER_HEADERS[2], key: "type", width: 14 },
    { header: OFFER_HEADERS[3], key: "product", width: 24 },
    { header: OFFER_HEADERS[4], key: "price", width: 14 },
    { header: OFFER_HEADERS[5], key: "endDate", width: 20 },
    { header: OFFER_HEADERS[6], key: "active", width: 10 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8EEF7" },
  };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  return Buffer.from((await workbook.xlsx.writeBuffer()) as ArrayBuffer);
}

interface ReadResult {
  rows: OfferRowInput[];
}

/**
 * Lee el .xlsx subido y devuelve las filas con su número real. Lanza un error
 * legible si faltan columnas, no hay filas o el archivo es inválido.
 */
export async function readOfferWorkbook(
  data: ArrayBuffer | Buffer | Uint8Array
): Promise<ReadResult> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(data as ArrayBuffer);
  } catch {
    throw new Error("No pudimos leer el archivo. Asegúrate de que sea un Excel (.xlsx) válido.");
  }

  const sheet = workbook.getWorksheet(SHEET_NAME) ?? workbook.worksheets[0];
  if (!sheet) throw new Error("El archivo no tiene ninguna hoja con datos.");

  const columns = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, colNumber) => {
    const text = String(cell.value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
    if (text) columns.set(text, colNumber);
  });

  const findColumn = (...names: string[]) => {
    for (const name of names) {
      const found = columns.get(name.toLowerCase());
      if (found) return found;
    }
    return 0;
  };

  const nameCol = findColumn("nombre");
  const descriptionCol = findColumn("descripcion");
  const typeCol = findColumn("tipo");
  const productCol = findColumn("producto");
  const priceCol = findColumn("precio cup", "precio");
  const endDateCol = findColumn("vence", "fecha", "fecha de vencimiento");
  const activeCol = findColumn("activa", "activo");

  const missing: string[] = [];
  if (!nameCol) missing.push("Nombre");
  if (!descriptionCol) missing.push("Descripción");
  if (!typeCol) missing.push("Tipo");
  if (!priceCol) missing.push("Precio CUP");
  if (!endDateCol) missing.push("Vence");
  if (missing.length) {
    throw new Error(`Faltan columnas en el archivo: ${missing.join(", ")}.`);
  }

  const cellText = (row: ExcelJS.Row, col: number): string => {
    if (!col) return "";
    const value = row.getCell(col).value;
    if (value === null || value === undefined) return "";
    if (value instanceof Date) return cellDate(value);
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

  const rows: OfferRowInput[] = [];
  let dataRows = 0;

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const name = cellText(row, nameCol);
    const description = cellText(row, descriptionCol);
    const type = cellText(row, typeCol);
    const product = cellText(row, productCol);
    const price = cellPrice(row, priceCol);
    const endDate = cellText(row, endDateCol);
    const active = cellText(row, activeCol);

    // Las filas totalmente vacías se saltan sin contarlas.
    if (!name && !description && !type && !product && price === "" && !endDate && !active) {
      return;
    }

    dataRows += 1;
    rows.push({ row: rowNumber, name, description, type, product, price, endDate, active });
  });

  if (rows.length === 0) {
    throw new Error("El archivo no tiene filas de ofertas.");
  }
  if (dataRows > MAX_OFFER_IMPORT_ROWS) {
    throw new Error(`El archivo tiene ${dataRows} filas; el máximo es ${MAX_OFFER_IMPORT_ROWS}.`);
  }

  return { rows };
}
