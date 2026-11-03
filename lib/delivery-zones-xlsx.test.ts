import { describe, test, expect } from "vitest";
import ExcelJS from "exceljs";
import { buildZonesWorkbook, readZonesWorkbook } from "./delivery-zones-xlsx";

describe("buildZonesWorkbook / readZonesWorkbook", () => {
  test("exporta y vuelve a leer las mismas filas", async () => {
    const rows = [
      { province: "Ciego de Ávila", municipality: "Morón", zone: "Zona Sur", price: 300 },
      { province: "La Habana", municipality: "Playa", zone: "Zona Centro", price: 250.5 },
    ];

    const buffer = await buildZonesWorkbook(rows);
    const parsed = await readZonesWorkbook(buffer);

    expect(parsed.rows.map(({ province, municipality, zone, price }) => ({
      province,
      municipality,
      zone,
      price,
    }))).toEqual(rows);
  });

  test("conserva precios con decimales", async () => {
    const buffer = await buildZonesWorkbook([
      { province: "La Habana", municipality: "Playa", zone: "Zona A", price: 1234.56 },
    ]);

    const parsed = await readZonesWorkbook(buffer);

    expect(parsed.rows[0].price).toBe(1234.56);
  });

  test("rechaza un archivo sin las columnas esperadas", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Hoja1");
    sheet.addRow(["Algo", "Otro"]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    await expect(readZonesWorkbook(buffer)).rejects.toThrow(/Provincia/);
  });

  test("ignora filas vacías", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Zonas");
    sheet.addRow(["Provincia", "Municipio", "Zona", "Precio CUP"]);
    sheet.addRow([]);
    sheet.addRow(["La Habana", "Playa", "Zona Centro", 100]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const parsed = await readZonesWorkbook(buffer);

    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].row).toBe(3);
  });
});
