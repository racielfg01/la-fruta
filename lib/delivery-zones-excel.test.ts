import { describe, test, expect } from "vitest";
import {
  normalizeZoneKey,
  parseZonePrice,
  buildZoneTemplateRows,
  planZoneImport,
  buildZoneCreateRecord,
  buildZonePriceUpdate,
} from "./delivery-zones-excel";

const provinces = [
  { id: "p1", name: "La Habana" },
  { id: "p2", name: "Ciego de Ávila" },
];

const municipalities = [
  { id: "m1", name: "Playa", provinceId: "p1" },
  { id: "m2", name: "Centro Habana", provinceId: "p1" },
  { id: "m3", name: "Morón", provinceId: "p2" },
];

describe("normalizeZoneKey", () => {
  test("ignora mayúsculas, tildes y espacios sobrantes", () => {
    expect(normalizeZoneKey("  Zona Centro ")).toBe("zona centro");
    expect(normalizeZoneKey("CIEGO DE ÁVILA")).toBe(normalizeZoneKey("ciego de avila"));
  });
});

describe("parseZonePrice", () => {
  test("acepta número de Excel", () => {
    expect(parseZonePrice(1234.5)).toBe(1234.5);
  });

  test("acepta coma decimal y punto de miles", () => {
    expect(parseZonePrice("1.234,50")).toBe(1234.5);
  });

  test("acepta espacios y símbolo de moneda", () => {
    expect(parseZonePrice("$ 350")).toBe(350);
  });

  test("rechaza vacío, texto y negativos", () => {
    expect(parseZonePrice("")).toBeNull();
    expect(parseZonePrice("   ")).toBeNull();
    expect(parseZonePrice("abc")).toBeNull();
    expect(parseZonePrice(-5)).toBeNull();
  });

  test("acepta cero", () => {
    expect(parseZonePrice(0)).toBe(0);
  });
});

describe("buildZoneTemplateRows", () => {
  test("usa nombres y ordena por provincia, municipio y zona", () => {
    const rows = buildZoneTemplateRows(
      [
        { name: "Zona Norte", price: 500, provinceId: "p1", municipalityId: "m2" },
        { name: "Zona Sur", price: 300, provinceId: "p2", municipalityId: "m3" },
        { name: "Zona Centro", price: 200, provinceId: "p1", municipalityId: "m1" },
      ],
      provinces,
      municipalities
    );

    expect(rows).toEqual([
      { province: "Ciego de Ávila", municipality: "Morón", zone: "Zona Sur", price: 300 },
      { province: "La Habana", municipality: "Centro Habana", zone: "Zona Norte", price: 500 },
      { province: "La Habana", municipality: "Playa", zone: "Zona Centro", price: 200 },
    ]);
  });
});

describe("planZoneImport", () => {
  const existing = [
    { id: "z1", name: "Zona Centro", price: 100, provinceId: "p1", municipalityId: "m1" },
  ];

  test("actualiza el precio de una zona existente sin importar tildes ni mayúsculas", () => {
    const plan = planZoneImport(
      [{ row: 2, province: "la habana", municipality: "PLAYA", zone: "zona centro", price: 250 }],
      existing,
      provinces,
      municipalities
    );

    expect(plan.errors).toEqual([]);
    expect(plan.updates).toEqual([
      { id: "z1", zone: "Zona Centro", provinceName: "La Habana", municipalityName: "Playa", price: 250 },
    ]);
    expect(plan.creates).toEqual([]);
  });

  test("crea la zona cuando no existe", () => {
    const plan = planZoneImport(
      [{ row: 3, province: "Ciego de Ávila", municipality: "Morón", zone: "Zona Nueva", price: 400 }],
      existing,
      provinces,
      municipalities
    );

    expect(plan.errors).toEqual([]);
    expect(plan.updates).toEqual([]);
    expect(plan.creates).toEqual([
      {
        zone: "Zona Nueva",
        provinceId: "p2",
        municipalityId: "m3",
        provinceName: "Ciego de Ávila",
        municipalityName: "Morón",
        price: 400,
      },
    ]);
  });

  test("no confunde dos zonas con el mismo nombre en municipios distintos", () => {
    const shared = [
      { id: "a", name: "Zona Centro", price: 100, provinceId: "p1", municipalityId: "m1" },
      { id: "b", name: "Zona Centro", price: 900, provinceId: "p1", municipalityId: "m2" },
    ];
    const plan = planZoneImport(
      [{ row: 2, province: "La Habana", municipality: "Centro Habana", zone: "Zona Centro", price: 800 }],
      shared,
      provinces,
      municipalities
    );

    expect(plan.errors).toEqual([]);
    expect(plan.updates.map((u) => u.id)).toEqual(["b"]);
  });

  test("reporta provincia desconocida", () => {
    const plan = planZoneImport(
      [{ row: 5, province: "Marte", municipality: "Playa", zone: "Zona X", price: 100 }],
      existing,
      provinces,
      municipalities
    );

    expect(plan.updates).toEqual([]);
    expect(plan.creates).toEqual([]);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].row).toBe(5);
    expect(plan.errors[0].message).toContain("Marte");
  });

  test("reporta municipio que no pertenece a la provincia", () => {
    const plan = planZoneImport(
      [{ row: 6, province: "La Habana", municipality: "Morón", zone: "Zona X", price: 100 }],
      existing,
      provinces,
      municipalities
    );

    expect(plan.creates).toEqual([]);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].message).toContain("Morón");
  });

  test("reporta precio inválido sin tocar la zona", () => {
    const plan = planZoneImport(
      [{ row: 7, province: "La Habana", municipality: "Playa", zone: "Zona Centro", price: "" }],
      existing,
      provinces,
      municipalities
    );

    expect(plan.updates).toEqual([]);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].message.toLowerCase()).toContain("precio");
  });

  test("reporta fila repetida en el archivo y aplica la primera", () => {
    const plan = planZoneImport(
      [
        { row: 2, province: "La Habana", municipality: "Playa", zone: "Zona Centro", price: 300 },
        { row: 3, province: "La Habana", municipality: "Playa", zone: "Zona Centro", price: 250 },
      ],
      existing,
      provinces,
      municipalities
    );

    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].price).toBe(300);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].row).toBe(3);
  });

  test("no repite una zona nueva que aparece dos veces", () => {
    const plan = planZoneImport(
      [
        { row: 2, province: "Ciego de Ávila", municipality: "Morón", zone: "Zona Nueva", price: 100 },
        { row: 3, province: "Ciego de Ávila", municipality: "Morón", zone: "Zona Nueva", price: 200 },
      ],
      existing,
      provinces,
      municipalities
    );

    expect(plan.creates).toHaveLength(1);
    expect(plan.errors).toHaveLength(1);
  });
});

describe("buildZonePriceUpdate", () => {
  test("devuelve solo el precio, sin tocar el resto de la zona", () => {
    expect(buildZonePriceUpdate(275.5)).toEqual({ price: 275.5 });
  });
});

describe("buildZoneCreateRecord", () => {
  test("usa valores por defecto para lo que el Excel no trae", () => {
    expect(
      buildZoneCreateRecord({
        zone: "Zona Nueva",
        provinceId: "p2",
        municipalityId: "m3",
        provinceName: "Ciego de Ávila",
        municipalityName: "Morón",
        price: 400,
      })
    ).toEqual({
      name: "Zona Nueva",
      min_distance: 0,
      max_distance: 0,
      price: 400,
      estimated_time: "Por definir",
      active: true,
      province: "p2",
      municipality: "m3",
    });
  });
});
