import { describe, expect, test } from "vitest";
import {
  canApplyStock,
  canDeletePurchase,
  canDeleteSupplier,
  formatSupplierMoney,
  isSuppliersSetupError,
  latestPrices,
  paginateSuppliers,
  purchaseTotal,
  stockDeltas,
  toProductOption,
  toPurchase,
  toPurchaseItem,
  toSupplier,
  validatePurchaseInput,
  validateSupplierInput,
  type Purchase,
  type Supplier,
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

  test("validatePurchaseInput rejects empty product and missing unit price", () => {
    const input = {
      supplier: "s1",
      purchasedAt: "2026-11-20",
      notes: "",
      items: [{ product: "p1", quantity: 1, unitPrice: 10 }],
    };
    expect(() =>
      validatePurchaseInput({ ...input, items: [{ product: "  ", quantity: 1, unitPrice: 10 }] })
    ).toThrow(/producto/i);
    for (const unitPrice of [null, undefined, ""]) {
      expect(() =>
        validatePurchaseInput({
          ...input,
          items: [{ product: "p1", quantity: 1, unitPrice: unitPrice as unknown as number }],
        })
      ).toThrow(/precio/i);
    }
    expect(
      validatePurchaseInput({
        ...input,
        items: [{ product: "p1", quantity: 1, unitPrice: 0 }],
      })
    ).toEqual({ ...input, items: [{ product: "p1", quantity: 1, unitPrice: 0 }] });
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

  test("latestPrices is deterministic: newest date wins, later line wins on ties", () => {
    const catalog = [{ id: "p1", name: "Tomate", unit: "por kg" }];
    const first = makePurchase({
      purchasedAt: "2026-11-20",
      items: [
        { id: "i1", product: "p1", productName: "Tomate", quantity: 1, unitPrice: 1200 },
        { id: "i2", product: "p1", productName: "Tomate", quantity: 1, unitPrice: 1300 },
      ],
    });
    const newer = makePurchase({
      id: "buy2",
      purchasedAt: "2026-11-21",
      items: [{ id: "i3", product: "p1", productName: "Tomate", quantity: 1, unitPrice: 1500 }],
    });
    expect(latestPrices([first, newer], catalog)[0].unitPrice).toBe(1500);
    expect(latestPrices([newer, first], catalog)[0].unitPrice).toBe(1500);
    expect(latestPrices([first], catalog)[0].unitPrice).toBe(1300);
  });
});

describe("money formatting", () => {
  test("formatSupplierMoney uses es-ES with two decimals", () => {
    const expected = new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    expect(formatSupplierMoney(1234.5)).toBe(expected.format(1234.5));
    expect(formatSupplierMoney(0)).toContain("0,00");
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

describe("supplier pagination", () => {
  const suppliers: Supplier[] = Array.from({ length: 25 }, (_, index) => ({
    id: `s${index + 1}`,
    name: `S${index + 1}`,
    phone: `555-${index + 1}`,
  }));

  test("paginateSuppliers returns ten suppliers and the requested page metadata", () => {
    const result = paginateSuppliers(suppliers, 2);
    expect(result.items.map((supplier) => supplier.name)).toEqual([
      "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19", "S20",
    ]);
    expect(result).toMatchObject({
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
      hasPrevious: true,
      hasNext: true,
    });
  });

  test("paginateSuppliers clamps a page past the end to the last page", () => {
    const result = paginateSuppliers(suppliers, 99);
    expect(result.items.map((supplier) => supplier.name)).toEqual([
      "S21", "S22", "S23", "S24", "S25",
    ]);
    expect(result).toMatchObject({ page: 3, hasPrevious: true, hasNext: false });
  });

  test("paginateSuppliers clamps a zero page to the first page", () => {
    const result = paginateSuppliers(suppliers, 0);
    expect(result.items[0].name).toBe("S1");
    expect(result).toMatchObject({ page: 1, hasPrevious: false, hasNext: true });
  });

  test("paginateSuppliers keeps an empty list on page one", () => {
    expect(paginateSuppliers([], 4)).toEqual({
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    });
  });

  test("paginateSuppliers does not create a second page for exactly ten suppliers", () => {
    const result = paginateSuppliers(suppliers.slice(0, 10), 1);
    expect(result).toMatchObject({
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    });
  });
});
