import { describe, expect, it } from "vitest";
import {
  categoryFromSlug,
  categoryMetadata,
  categorySlug,
  faqItems,
  faqPageSchema,
  itemListSchema,
  llmsTxt,
  localBusinessSchema,
} from "@/lib/seo-content";

const settings = {
  storeName: "MercaToma",
  whatsappPhone: "5352013998",
  storeSchedule: "Lunes a sábado, 8:00 AM - 6:00 PM",
};

describe("SEO y AEO de la tienda local", () => {
  it("convierte nombres de categoría a slug y viceversa", () => {
    expect(categorySlug("Frutas y Cítricos")).toBe("frutas-y-citricos");
    expect(categorySlug("  Viandas  ")).toBe("viandas");
    expect(
      categoryFromSlug("frutas-y-citricos", ["Viandas", "Frutas y Cítricos"])
    ).toBe("Frutas y Cítricos");
    expect(categoryFromSlug("viandas", ["Viandas"])).toBe("Viandas");
  });

  it("titula la categoría con intención local de Santiago", () => {
    const meta = categoryMetadata("Frutas y Cítricos", 12);
    expect(meta.title).toContain("Frutas y Cítricos");
    expect(meta.title).toContain("Santiago de Cuba");
    expect(meta.title).not.toContain("MercaToma");
    expect(meta.description).toContain("Frutas y Cítricos");
    expect(meta.description).toContain("a domicilio");
    expect(meta.description).toContain("12");
    expect(meta.description.length).toBeLessThanOrEqual(160);
  });

  it("declara la tienda como comercio local con zona, teléfono y horario", () => {
    const schema = localBusinessSchema(settings);
    expect(schema["@type"]).toBe("GroceryStore");
    expect(schema.telephone).toBe("+5352013998");
    expect(schema.areaServed.name).toBe("Santiago de Cuba");
    expect(schema.address.addressCountry).toBe("CU");
    expect(schema.openingHours).toBe(settings.storeSchedule);
  });

  it("responde con hechos reales las preguntas que la gente hace", () => {
    const items = faqItems(settings);
    const text = items.map((i) => `${i.question} ${i.answer}`).join(" ").toLowerCase();
    for (const term of ["santiago de cuba", "domicilio", "peso", "efectivo", "whatsapp"]) {
      expect(text).toContain(term);
    }
    expect(faqPageSchema(items)["@type"]).toBe("FAQPage");
    expect(faqPageSchema(items).mainEntity).toHaveLength(items.length);
  });

  it("enumera los productos de una categoría para los motores", () => {
    const schema = itemListSchema("Viandas", [
      { id: "abc", name: "Plátano" },
      { id: "def", name: "Yuca" },
    ]);
    expect(schema["@type"]).toBe("ItemList");
    expect(schema.numberOfItems).toBe(2);
    expect(schema.itemListElement[1].position).toBe(2);
    expect(schema.itemListElement[1].url).toContain("/product/def");
  });

  it("publica un resumen legible para agentes de IA", () => {
    const text = llmsTxt(settings);
    for (const term of [
      "# MercaToma",
      "Santiago de Cuba",
      "productos agrícolas",
      "bien pesados",
      "+53 5201 3998",
      "/sitemap.xml",
    ]) {
      expect(text).toContain(term);
    }
  });
});
