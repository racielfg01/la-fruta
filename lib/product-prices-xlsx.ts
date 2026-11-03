import ExcelJS from "exceljs";
import type { ProductRowInput, ProductTemplateRow } from "./product-prices-excel";

const SHEET_NAME = "Productos";
const HEADERS = ["Producto", "Categoría", "Precio CUP"] as const;

export const MAX_PRODUCT_IMPORT_ROWS = 2000;

/**
 * Genera el .xlsx de la plantilla con los productos actuales.
 * La categoría va solo como referencia; la columna que se edita es el precio.
 */
export async function buildProductPricesWorkbook(rows: ProductTemplateRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MercaToma";
  const sheet = workbook.addWorksheet(SHEET_NAME);

  sheet.columns = [
    { header: HEADERS[0], key: "product", width: 34 },
    { header: HEADERS[1], key: "category", width: 22 },
    { header: HEADERS[2], key: "price", width: 16 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8EEF7" },
  };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  for (const row of rows) {
    sheet.addRow({ product: row.product, category: row.category, price: row.price });
  }

  sheet.getColumn("price").numFmt = "#,##0.00";

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

interface ReadResult {
  rows: ProductRowInput[];
}

/**
 * Lee el .xlsx subido y devuelve las filas con su número real.
 * Lanza un error legible si faltan columnas o el archivo es inválido.
 */
export async function readProductPricesWorkbook(
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

  const productCol = findColumn("Producto", "Nombre");
  const categoryCol = findColumn("Categoría", "Categoria");
  const priceCol = findColumn("Precio CUP", "Precio");

  const missing: string[] = [];
  if (!productCol) missing.push("Producto");
  if (!priceCol) missing.push("Precio CUP");
  if (missing.length) {
    throw new Error(`Faltan columnas en el archivo: ${missing.join(", ")}.`);
  }

  const cellText = (row: ExcelJS.Row, col: number): string => {
    if (!col) return "";
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

  const rows: ProductRowInput[] = [];
  let dataRows = 0;

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const product = cellText(row, productCol);
    const category = cellText(row, categoryCol);
    const price = cellPrice(row, priceCol);

    // Las filas totalmente vacías se saltan sin contarlas.
    if (!product && !category && (price === "" || price === null)) return;

    dataRows += 1;
    rows.push({ row: rowNumber, product, category, price });
  });

  if (rows.length === 0) {
    throw new Error("El archivo no tiene filas de productos.");
  }
  if (dataRows > MAX_PRODUCT_IMPORT_ROWS) {
    throw new Error(`El archivo tiene ${dataRows} filas; el máximo es ${MAX_PRODUCT_IMPORT_ROWS}.`);
  }

  return { rows };
}
