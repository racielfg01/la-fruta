import { describe, expect, test, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/home-experience", () => ({
  HomeExperience: ({ children }: { children?: ReactNode }) => children,
}));

vi.mock("@/app/actions/public", () => ({
  getPublicBanners: async () => [],
  getPublicSettings: async () => ({}),
}));

vi.mock("@/app/actions/public-products", () => ({
  getPublicProducts: async () => ({
    products: [],
    categories: [],
    categoryIcons: {},
  }),
}));

vi.mock("@/app/actions/public-offers", () => ({
  getPublicOffers: async () => ({ success: true, data: [] }),
}));

vi.mock("@/app/actions/public-stories", () => ({
  getPublicStories: async () => [],
}));

import HomePage from "@/app/page";

async function homeHtml(): Promise<string> {
  const page = await HomePage();
  return renderToStaticMarkup(createElement("div", null, page));
}

describe("FAQ de la portada", () => {
  test("cada pregunta es un resumen desplegable", async () => {
    const html = await homeHtml();

    expect(html.match(/<summary\b/g)).toHaveLength(6);
    expect(html).toContain("¿Qué métodos de pago puedo usar?");
  });

  test("los desplegables comparten nombre para que solo uno quede abierto", async () => {
    const html = await homeHtml();
    const details = html.match(/<details\b[^>]*>/g) ?? [];

    expect(details).toHaveLength(6);
    expect(details.every((tag) => tag.includes('name="home-faq"'))).toBe(true);
  });

  test("las respuestas siguen en el HTML que leen los motores de búsqueda", async () => {
    const html = await homeHtml();

    expect(html).toContain("Puedes pagar en efectivo al recibir el pedido");
  });
});
