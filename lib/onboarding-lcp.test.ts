import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import vm from "node:vm";

// StoreView trae dependencias de navegador; aquí solo importa qué decide HomeExperience.
vi.mock("@/components/store-view", () => ({ StoreView: () => null }));

import { HomeExperience } from "@/components/home-experience";
import {
  ONBOARDING_STORAGE_KEY,
  onboardingVisibilityScript,
} from "@/lib/onboarding-visibility";

function htmlForReturningVisitor(raw: string | null): Record<string, string> {
  const documentElement = {
    attrs: {} as Record<string, string>,
    setAttribute(name: string, value: string) {
      this.attrs[name] = value;
    },
  };
  const sandbox = {
    localStorage: { getItem: () => raw },
    document: { documentElement },
  };
  vm.runInNewContext(onboardingVisibilityScript(), sandbox);
  return sandbox.document.documentElement.attrs;
}

describe("bienvenida en el HTML inicial", () => {
  it("incluye la imagen y el marcador de la bienvenida en el HTML del servidor", () => {
    const html = renderToStaticMarkup(
      createElement(HomeExperience, {
        products: [],
        categories: [],
        banners: [],
        offers: [],
      })
    );

    expect(html).toContain("/onboarding/bienvenida.webp");
    expect(html).toContain("data-onboarding");
  });

  it("marca como completada solo la sesión que terminó el onboarding", () => {
    const done = JSON.stringify({
      state: { onboardingComplete: true },
      version: 0,
    });
    const pending = JSON.stringify({
      state: { onboardingComplete: false },
      version: 0,
    });

    expect(htmlForReturningVisitor(done)["data-onboarded"]).toBe("true");
    expect(htmlForReturningVisitor(pending)["data-onboarded"]).toBeUndefined();
    expect(htmlForReturningVisitor(null)["data-onboarded"]).toBeUndefined();
    expect(htmlForReturningVisitor("{no es json")["data-onboarded"]).toBeUndefined();
    expect(htmlForReturningVisitor(JSON.stringify({ state: null }))["data-onboarded"]).toBeUndefined();
  });

  it("usa la misma clave de almacenamiento que la tienda persistida", () => {
    expect(ONBOARDING_STORAGE_KEY).toBe("la-fruta-cart");
    expect(onboardingVisibilityScript()).toContain(ONBOARDING_STORAGE_KEY);
  });
});
