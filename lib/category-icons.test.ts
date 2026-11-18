import { describe, expect, it } from "vitest";
import {
  CATEGORY_ICON_OPTIONS,
  categoryIcon,
  isValidCategoryIcon,
  normalizeCategoryKey,
} from "@/lib/category-icons";

describe("clave de categoría", () => {
  it("normaliza mayúsculas, acentos y espacios", () => {
    expect(normalizeCategoryKey("Cítricos")).toBe("citricos");
    expect(normalizeCategoryKey("  Frutas Tropicales  ")).toBe("frutas-tropicales");
  });
});

describe("icono de categoría", () => {
  it("devuelve el SVG de las categorías conocidas", () => {
    expect(categoryIcon("Huevos")).toBe("/categorias/huevos.svg");
    expect(categoryIcon("Frutas")).toBe("/categorias/frutas.svg");
    expect(categoryIcon("Vegetales")).toBe("/categorias/vegetales.svg");
    expect(categoryIcon("Cítricos")).toBe("/categorias/citricos.svg");
  });

  it("acepta las claves inglesas que ya usa el catálogo", () => {
    expect(categoryIcon("Fruits")).toBe("/categorias/frutas.svg");
    expect(categoryIcon("Vegetables")).toBe("/categorias/vegetales.svg");
  });

  it("devuelve null si no hay icono, para no inventar uno", () => {
    expect(categoryIcon("Quesos importados")).toBeNull();
    expect(categoryIcon("")).toBeNull();
  });
});

describe("icono elegido en el admin", () => {
  it("prefiere el icono guardado para esa categoría", () => {
    expect(categoryIcon("Frutas", { Frutas: "huevos" })).toBe("/categorias/huevos.svg");
  });

  it("solo acepta claves de la lista cerrada", () => {
    expect(isValidCategoryIcon("huevos")).toBe(true);
    expect(isValidCategoryIcon("../../secreto")).toBe(false);
    expect(isValidCategoryIcon("")).toBe(false);
  });

  it("ofrece opciones para el selector del admin", () => {
    expect(CATEGORY_ICON_OPTIONS.some((option) => option.key === "vegetales")).toBe(true);
  });
});
