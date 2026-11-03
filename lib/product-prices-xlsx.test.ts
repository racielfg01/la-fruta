import { describe, test, expect } from "vitest";
import ExcelJS from "exceljs";
import { buildProductPricesWorkbook, readProductPricesWorkbook } from "./product-prices-xlsx";

describe("buildProductPricesWorkbook / readProductPricesWorkbook", () => {
  test("exporta y vuelve a leer las mismas filas", async () => {
    const rows = [
      { product: "Aguacate", category: "Frutas", price: 200 },
      { product: "Pimiento verde", category: "Verduras", price: 150.5 },
    ];

    const buffer = await buildProductPricesWorkbook(rows);
    const parsed = await readProductPricesWorkbook(buffer);

    expect(
      parsed.rows.map(({ product, category, price }) => ({ product, category, price }))
    ).toEqual(rows);
  });

  test("conserva precios con decimales", async () => {
    const buffer = await buildProductPricesWorkbook([
      { product: "Tomate", category: "Verduras", price: 1234.56 },
    ]);

    const parsed = await readProductPricesWorkbook(buffer);

    expect(parsed.rows[0].price).toBe(1234.56);
  });

  test("rechaza un archivo sin las columnas esperadas", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Hoja1");
    sheet.addRow(["Algo", "Otro"]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    await expect(readProductPricesWorkbook(buffer)).rejects.toThrow(/Producto/);
  });

  test("rechaza un archivo sin filas", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Productos");
    sheet.addRow(["Producto", "Categoría", "Precio CUP"]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    await expect(readProductPricesWorkbook(buffer)).rejects.toThrow(/filas/i);
  });

  test("ignora filas vacías y conserva el número de fila", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Productos");
    sheet.addRow(["Producto", "Categoría", "Precio CUP"]);
    sheet.addRow([]);
    sheet.addRow(["Tomate", "Verduras", 100]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const parsed = await readProductPricesWorkbook(buffer);

    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].row).toBe(3);
  });
});
