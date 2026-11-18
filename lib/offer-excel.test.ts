import { describe, test, expect } from "vitest";
import {
  buildOfferCreateRecord,
  planOfferImport,
  type OfferCreation,
  type OfferRowInput,
} from "./offer-excel";

const products = [
  { id: "p1", name: "Ajo" },
  { id: "p2", name: "Pimiento verde" },
];

function row(over: Partial<OfferRowInput> = {}): OfferRowInput {
  return {
    row: 2,
    name: "Combo familiar",
    description: "Verduras surtidas",
    type: "Combo",
    product: "",
    price: 1500,
    endDate: "2027-01-01T12:00",
    active: "Sí",
    ...over,
  };
}

function creation(over: Partial<OfferCreation> = {}): OfferCreation {
  return {
    row: 2,
    name: "Combo familiar",
    description: "Verduras surtidas",
    price: 1500,
    currencyCode: "CUP",
    type: "combo",
    productId: "",
    endDate: "2027-01-01T12:00",
    active: true,
    ...over,
  };
}

describe("planOfferImport", () => {
  test("crea una rebaja con el producto resuelto por nombre y precio en formato cubano", () => {
    const plan = planOfferImport(
      [row({ name: "Rebaja de ajo", type: "Rebaja", product: "  AJO ", price: "1.200,50" })],
      [],
      products
    );

    expect(plan.errors).toEqual([]);
    expect(plan.creates).toEqual([
      creation({
        name: "Rebaja de ajo",
        type: "product",
        productId: "p1",
        price: 1200.5,
      }),
    ]);
  });

  test("un combo no lleva producto y respeta la celda Activa en No", () => {
    const plan = planOfferImport([row({ active: "No" })], [], products);

    expect(plan.errors).toEqual([]);
    expect(plan.creates[0]).toMatchObject({
      type: "combo",
      productId: "",
      active: false,
      currencyCode: "CUP",
    });
  });

  test("acepta varias filas y conserva su número", () => {
    const plan = planOfferImport(
      [
        row({ name: "Combo A" }),
        row({ row: 5, name: "Combo B", price: 200 }),
      ],
      [],
      products
    );

    expect(plan.errors).toEqual([]);
    expect(plan.creates.map((c) => [c.row, c.name])).toEqual([
      [2, "Combo A"],
      [5, "Combo B"],
    ]);
  });

  test("no sobrescribe una oferta existente con el mismo nombre aunque cambien tildes y mayúsculas", () => {
    const plan = planOfferImport(
      [row({ name: "  COMBO FAMILIAR " })],
      [{ name: "Combo familiar" }],
      products
    );

    expect(plan.creates).toEqual([]);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].row).toBe(2);
    expect(plan.errors[0].message).toMatch(/ya existe/i);
  });

  test("rechaza la segunda fila con el mismo nombre del archivo", () => {
    const plan = planOfferImport(
      [row({ name: "Combo familiar" }), row({ row: 3, name: "combo familiar", price: 200 })],
      [],
      products
    );

    expect(plan.creates).toHaveLength(1);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].row).toBe(3);
    expect(plan.errors[0].message).toMatch(/repetida/i);
  });

  test("reporta la fila sin nombre", () => {
    const plan = planOfferImport([row({ row: 4, name: "   " })], [], products);

    expect(plan.creates).toEqual([]);
    expect(plan.errors[0]).toMatchObject({ row: 4 });
    expect(plan.errors[0].message).toMatch(/nombre/i);
  });

  test("reporta la fila sin descripción", () => {
    const plan = planOfferImport([row({ row: 5, description: "" })], [], products);

    expect(plan.creates).toEqual([]);
    expect(plan.errors[0]).toMatchObject({ row: 5 });
    expect(plan.errors[0].message).toMatch(/descripción/i);
  });

  test("reporta la fila con precio inválido", () => {
    const plan = planOfferImport([row({ row: 6, price: "caro" })], [], products);

    expect(plan.creates).toEqual([]);
    expect(plan.errors[0]).toMatchObject({ row: 6 });
    expect(plan.errors[0].message).toMatch(/precio/i);
  });

  test("reporta la fila con tipo desconocido", () => {
    const plan = planOfferImport([row({ row: 7, type: "2x1" })], [], products);

    expect(plan.creates).toEqual([]);
    expect(plan.errors[0]).toMatchObject({ row: 7 });
    expect(plan.errors[0].message).toMatch(/tipo/i);
  });

  test("reporta la rebaja sin producto y el producto que no existe", () => {
    const sinProducto = planOfferImport([row({ row: 8, type: "Rebaja" })], [], products);
    const desconocido = planOfferImport(
      [row({ row: 9, type: "Rebaja", product: "Mango" })],
      [],
      products
    );

    expect(sinProducto.creates).toEqual([]);
    expect(sinProducto.errors[0].row).toBe(8);
    expect(desconocido.creates).toEqual([]);
    expect(desconocido.errors[0].row).toBe(9);
    expect(desconocido.errors[0].message).toMatch(/Mango/);
  });

  test("reporta la fila con fecha de vencimiento inválida", () => {
    const plan = planOfferImport([row({ row: 10, endDate: "no es fecha" })], [], products);

    expect(plan.creates).toEqual([]);
    expect(plan.errors[0]).toMatchObject({ row: 10 });
    expect(plan.errors[0].message).toMatch(/vencimiento/i);
  });

  test("reporta la fila con Activa ilegible en vez de inventar un valor", () => {
    const plan = planOfferImport([row({ row: 11, active: "quizá" })], [], products);

    expect(plan.creates).toEqual([]);
    expect(plan.errors[0]).toMatchObject({ row: 11 });
    expect(plan.errors[0].message).toMatch(/activa/i);
  });
});

describe("buildOfferCreateRecord", () => {
  test("guarda el precio en CUP y deja el producto vacío en los combos", () => {
    const record = buildOfferCreateRecord(creation());

    expect(record).toMatchObject({
      name: "Combo familiar",
      currency_code: "CUP",
      price: 1500,
      type: "combo",
      active: true,
    });
    expect(record).not.toHaveProperty("product_id");
  });

  test("guarda la relación del producto solo en las rebajas", () => {
    const record = buildOfferCreateRecord(
      creation({ type: "product", productId: "p1", endDate: "2027-01-01T12:00:00Z" })
    );

    expect(record.product_id).toBe("p1");
    expect(record.end_date).toBe("2027-01-01T12:00:00.000Z");
  });
});
