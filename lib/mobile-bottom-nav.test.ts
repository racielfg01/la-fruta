import { describe, expect, test, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const nav = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
}));

vi.mock("@/lib/store", () => ({
  useCartStore: (selector: (state: { getTotalItems: () => number }) => unknown) =>
    selector({ getTotalItems: () => 0 }),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuthStore: () => ({ isAuthenticated: false }),
}));

import { MobileBottomNav } from "@/components/mobile-bottom-nav";

function props() {
  return {
    categories: [],
    categoryCounts: {},
    selectedCategories: [],
    toggleCategory: () => {},
    clearCategories: () => {},
  };
}

function linkClass(html: string, href: string): string {
  const link = html.match(new RegExp(`<a[^>]*href="${href}"[^>]*>`));
  if (!link) throw new Error(`No hay enlace a ${href}`);
  return link[0];
}

describe("barra inferior móvil", () => {
  test("el fondo de la barra es blanco", () => {
    const html = renderToStaticMarkup(createElement(MobileBottomNav, props()));
    const bar = html.match(/<nav[^>]*>/)?.[0] ?? "";

    expect(bar).toContain("bg-white");
    expect(bar).not.toContain("bg-background/95");
  });

  test("el ítem activo tiene fondo verde con icono y texto blancos", () => {
    nav.pathname = "/favoritos";
    const html = renderToStaticMarkup(createElement(MobileBottomNav, props()));

    expect(linkClass(html, "/favoritos")).toContain("bg-green-700 text-white");
  });

  test("los ítems inactivos no llevan el fondo verde del activo", () => {
    nav.pathname = "/favoritos";
    const html = renderToStaticMarkup(createElement(MobileBottomNav, props()));

    expect(linkClass(html, "/")).not.toContain("bg-green-700");
    expect(linkClass(html, "/")).toContain("text-slate-600");
  });
});
