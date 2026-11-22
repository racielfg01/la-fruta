import { describe, expect, test } from "vitest";
import {
  canApplyStock,
  canDeletePurchase,
  canDeleteSupplier,
  isSuppliersSetupError,
  latestPrices,
  purchaseTotal,
  stockDeltas,
  toProductOption,
  toPurchase,
  toPurchaseItem,
  toSupplier,
  validatePurchaseInput,
  validateSupplierInput,
  type Purchase,
} from "./suppliers";

function makePurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: "buy1",
    supplier: "s1",
    purchasedAt: "2026-11-20 10:00:00",
    notes: "",
    stockAppliedAt: null,
    total: 1200,
    items: [
      { id: "i1", product: "p1", productName: "Tomate", quantity: 1, unitPrice: 1200 },
    ],
    ...overrides,
  };
}

describe("suppliers mapping", () => {
  test("toSupplier maps id, name and phone", () => {
    expect(toSupplier({ id: "s1", name: "Frutas SA", phone: "555-1234" })).toEqual({
      id: "s1",
      name: "Frutas SA",
      phone: "555-1234",
    });
  });

  test("toProductOption maps id, name and unit", () => {
    expect(toProductOption({ id: "p1", name: "Tomate", unit: "por kg" })).toEqual({
      id: "p1",
      name: "Tomate",
      unit: "por kg",
    });
  });

  test("toPurchaseItem maps snake_case record fields", () => {
    expect(
      toPurchaseItem({
        id: "i1",
        purchase: "buy1",
        product: "p1",
        product_name: "Tomate",
        quantity: 2,
        unit_price: 1200,
      })
    ).toEqual({ id: "i1", product: "p1", productName: "Tomate", quantity: 2, unitPrice: 1200 });
  });

  test("toPurchase maps dates, nullable stock mark and computed total", () => {
    const items = [
      { id: "i1", product: "p1", productName: "Tomate", quantity: 2, unitPrice: 1200 },
      { id: "i2", product: "p2", productName: "Limón", quantity: 1, unitPrice: 900 },
    ];
    expect(
      toPurchase(
        {
          id: "buy1",
          supplier: "s1",
          purchased_at: "2026-11-20 10:00:00",
          notes: "Nota",
          stock_applied_at: "",
        },
        items
      )
    ).toEqual({
      id: "buy1",
      supplier: "s1",
      purchasedAt: "2026-11-20 10:00:00",
      notes: "Nota",
      stockAppliedAt: null,
      total: 3300,
      items,
    });
  });
});

describe("suppliers validation", () => {
  test("validateSupplierInput requires name and phone", () => {
    expect(() => validateSupplierInput({ name: "  ", phone: "555" })).toThrow(/nombre/);
    expect(() => validateSupplierInput({ name: "Frutas SA", phone: "" })).toThrow(/teléfono/);
    expect(validateSupplierInput({ name: "  Frutas SA  ", phone: " 555 " })).toEqual({
      name: "Frutas SA",
      phone: "555",
    });
  });

  test("validatePurchaseInput requires items and valid line values", () => {
    const input = {
      supplier: "s1",
      purchasedAt: "2026-11-20",
      notes: "",
      items: [{ product: "p1", quantity: 1, unitPrice: 10 }],
    };
    expect(() => validatePurchaseInput({ ...input, items: [] })).toThrow(/item/i);
    expect(() =>
      validatePurchaseInput({ ...input, items: [{ product: "p1", quantity: 0, unitPrice: 10 }] })
    ).toThrow(/cantidad/i);
    expect(() =>
      validatePurchaseInput({ ...input, items: [{ product: "p1", quantity: 1, unitPrice: -1 }] })
    ).toThrow(/precio/i);
    expect(validatePurchaseInput(input)).toEqual(input);
  });
});

describe("purchase totals and prices", () => {
  test("purchaseTotal multiplies quantity by unitPrice and sums", () => {
    expect(
      purchaseTotal([
        { product: "p1", quantity: 2, unitPrice: 1200 },
        { product: "p2", quantity: 1, unitPrice: 900 },
      ])
    ).toBe(3300);
    expect(purchaseTotal([])).toBe(0);
  });

  test("latestPrices uses the most recent purchase price and the catalog unit", () => {
    const recent = makePurchase({
      purchasedAt: "2026-11-20",
      items: [{ id: "i1", product: "p1", productName: "Tomate", quantity: 1, unitPrice: 1500 }],
    });
    const older = makePurchase({
      id: "buy0",
      purchasedAt: "2026-11-01",
      items: [{ id: "i0", product: "p1", productName: "Tomate", quantity: 1, unitPrice: 1200 }],
    });
    expect(
      latestPrices([recent, older], [{ id: "p1", name: "Tomate", unit: "por kg" }])
    ).toEqual([
      {
        product: "p1",
        productName: "Tomate",
        unit: "por kg",
        unitPrice: 1500,
        purchasedAt: "2026-11-20",
      },
    ]);
  });
});

describe("stock and deletion rules", () => {
  test("canApplyStock is true only when stock was not applied", () => {
    expect(canApplyStock(makePurchase())).toBe(true);
    expect(canApplyStock(makePurchase({ stockAppliedAt: "2026-11-21 09:00:00" }))).toBe(false);
  });

  test("stockDeltas reports existing updates and missing products", () => {
    const purchase = makePurchase({
      total: 3000,
      items: [
        { id: "i1", product: "p1", productName: "Tomate", quantity: 3, unitPrice: 1000 },
        { id: "i2", product: "p2", productName: "Limón", quantity: 2, unitPrice: 1000 },
      ],
    });
    expect(stockDeltas(purchase, ["p1"])).toEqual({
      updates: [{ product: "p1", quantity: 3 }],
      missing: ["p2"],
    });
  });

  test("deletion depends on linked purchases and applied stock", () => {
    expect(canDeleteSupplier([])).toBe(true);
    expect(canDeleteSupplier([makePurchase()])).toBe(false);
    expect(canDeletePurchase(makePurchase())).toBe(true);
    expect(canDeletePurchase(makePurchase({ stockAppliedAt: "2026-11-21 09:00:00" }))).toBe(false);
  });
});

describe("suppliers setup error detection", () => {
  test("isSuppliersSetupError detects missing collections but not other errors", () => {
    expect(isSuppliersSetupError({ status: 404 })).toBe(true);
    expect(isSuppliersSetupError(new Error("Collection 'suppliers' not found."))).toBe(true);
    expect(isSuppliersSetupError(new Error("red"))).toBe(false);
    expect(isSuppliersSetupError(null)).toBe(false);
  });
});
