import { describe, test, expect } from "vitest";
import ExcelJS from "exceljs";
import { OFFER_HEADERS } from "./offer-excel";
import { buildOfferWorkbook, readOfferWorkbook } from "./offer-xlsx";

describe("buildOfferWorkbook", () => {
  test("la plantilla trae las cabeceras en orden y sin filas precargadas", async () => {
    const buffer = await buildOfferWorkbook();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    const headers: string[] = [];
    sheet.getRow(1).eachCell((cell) => {
      headers.push(String(cell.value ?? ""));
    });

    expect(headers).toEqual([...OFFER_HEADERS]);
    expect(sheet.rowCount).toBe(1);
  });
});

describe("readOfferWorkbook", () => {
  test("lee las filas con su número real y salta las vacías", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Ofertas");
    sheet.addRow([...OFFER_HEADERS]);
    sheet.addRow([]);
    sheet.addRow(["Combo familiar", "Verduras", "Combo", "", 1500, "2027-01-01T12:00", "Sí"]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const { rows } = await readOfferWorkbook(buffer);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      row: 3,
      name: "Combo familiar",
      description: "Verduras",
      type: "Combo",
      price: 1500,
      endDate: "2027-01-01T12:00",
      active: "Sí",
    });
  });

  test("acepta cabeceras sin tildes y el alias Precio", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Ofertas");
    sheet.addRow(["Nombre", "Descripcion", "Tipo", "Producto", "Precio", "Vence", "Activa"]);
    sheet.addRow(["Combo A", "Verduras", "Combo", "", 100, "2027-01-01T12:00", "Sí"]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const { rows } = await readOfferWorkbook(buffer);

    expect(rows[0].price).toBe(100);
    expect(rows[0].description).toBe("Verduras");
  });

  test("convierte una fecha de Excel a datetime-local", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Ofertas");
    sheet.addRow([...OFFER_HEADERS]);
    sheet.addRow(["Combo A", "Verduras", "Combo", "", 100, new Date(2027, 0, 2, 10, 30), "Sí"]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const { rows } = await readOfferWorkbook(buffer);

    expect(rows[0].endDate).toBe("2027-01-02T10:30");
  });

  test("convierte un número de serie de Excel en una fecha real", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Ofertas");
    sheet.addRow([...OFFER_HEADERS]);
    sheet.addRow(["Combo A", "Verduras", "Combo", "", 100, 46324, "Sí"]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const { rows } = await readOfferWorkbook(buffer);

    expect(rows[0].endDate).toBe("2026-10-29T00:00");
  });

  test("rechaza un archivo sin la columna Nombre", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Ofertas");
    sheet.addRow(["Descripción", "Tipo", "Producto", "Precio CUP", "Vence", "Activa"]);
    sheet.addRow(["Verduras", "Combo", "", 100, "2027-01-01T12:00", "Sí"]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    await expect(readOfferWorkbook(buffer)).rejects.toThrow(/Nombre/);
  });

  test("rechaza un archivo sin filas de ofertas", async () => {
    const buffer = await buildOfferWorkbook();

    await expect(readOfferWorkbook(buffer)).rejects.toThrow(/filas/i);
  });
});
