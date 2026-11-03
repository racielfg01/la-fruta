import { describe, test, expect } from "vitest";
import {
  buildProductTemplateRows,
  planProductPriceImport,
  buildProductPriceUpdate,
} from "./product-prices-excel";

const existing = [
  { id: "p1", name: "Tomate", price: 100, category: "Verduras" },
  { id: "p2", name: "Aguacate", price: 200, category: "Frutas" },
  { id: "p3", name: "Pimiento verde", price: 150, category: "Verduras" },
];

describe("buildProductTemplateRows", () => {
  test("usa el nombre y la categoría del producto", () => {
    const rows = buildProductTemplateRows(existing);

    expect(rows).toEqual([
      { product: "Aguacate", category: "Frutas", price: 200 },
      { product: "Pimiento verde", category: "Verduras", price: 150 },
      { product: "Tomate", category: "Verduras", price: 100 },
    ]);
  });

  test("ordena por categoría y deja los sin categoría al final", () => {
    const rows = buildProductTemplateRows([
      { name: "Suelto", price: 10, category: "" },
      { name: "Zanahoria", price: 20, category: "Verduras" },
      { name: "Banana", price: 30, category: "Frutas" },
    ]);

    expect(rows.map((r) => r.product)).toEqual(["Banana", "Zanahoria", "Suelto"]);
  });
});

describe("planProductPriceImport", () => {
  test("actualiza el precio de un producto sin importar tildes ni mayúsculas", () => {
    const plan = planProductPriceImport(
      [{ row: 2, product: "  AGUÁCATE ", category: "Frutas", price: 350 }],
      existing
    );

    expect(plan.errors).toEqual([]);
    expect(plan.updates).toEqual([
      { id: "p2", product: "Aguacate", category: "Frutas", price: 350 },
    ]);
  });

  test("acepta precio en formato cubano", () => {
    const plan = planProductPriceImport(
      [{ row: 2, product: "Tomate", category: "Verduras", price: "1.234,50" }],
      existing
    );

    expect(plan.updates[0].price).toBe(1234.5);
  });

  test("no crea productos que no existen: los reporta", () => {
    const plan = planProductPriceImport(
      [{ row: 4, product: "Mango", category: "Frutas", price: 300 }],
      existing
    );

    expect(plan.updates).toEqual([]);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].row).toBe(4);
    expect(plan.errors[0].message).toContain("Mango");
  });

  test("reporta precio inválido", () => {
    const plan = planProductPriceImport(
      [{ row: 5, product: "Tomate", category: "Verduras", price: "" }],
      existing
    );

    expect(plan.updates).toEqual([]);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].message.toLowerCase()).toContain("precio");
  });

  test("reporta precio negativo", () => {
    const plan = planProductPriceImport(
      [{ row: 6, product: "Tomate", category: "Verduras", price: -1 }],
      existing
    );

    expect(plan.updates).toEqual([]);
    expect(plan.errors).toHaveLength(1);
  });

  test("reporta fila sin nombre de producto", () => {
    const plan = planProductPriceImport(
      [{ row: 7, product: "   ", category: "Verduras", price: 100 }],
      existing
    );

    expect(plan.updates).toEqual([]);
    expect(plan.errors).toHaveLength(1);
  });

  test("aplica la primera fila y reporta la repetida", () => {
    const plan = planProductPriceImport(
      [
        { row: 2, product: "Tomate", category: "Verduras", price: 120 },
        { row: 3, product: "tomate", category: "Verduras", price: 130 },
      ],
      existing
    );

    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].price).toBe(120);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].row).toBe(3);
  });

  test("no confunde dos productos distintos", () => {
    const plan = planProductPriceImport(
      [{ row: 2, product: "Aguacate", category: "Frutas", price: 999 }],
      existing
    );

    expect(plan.updates.map((u) => u.id)).toEqual(["p2"]);
  });
});

describe("buildProductPriceUpdate", () => {
  test("devuelve solo el precio", () => {
    expect(buildProductPriceUpdate(275.5)).toEqual({ price: 275.5 });
  });
});
