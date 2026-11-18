import { describe, expect, test, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => createElement("img", props),
}));

import { BrandMark } from "@/components/brand-mark";

function render(props: { storeName?: string; logo?: string; compact?: boolean } = {}) {
  return renderToStaticMarkup(createElement(BrandMark, props));
}

describe("BrandMark", () => {
  test("con la marca por defecto parte el nombre y usa el logo de respaldo", () => {
    const html = render();

    expect(html).toContain(">Merca</span>");
    expect(html).toContain(">Toma</span>");
    expect(html).toContain('src="/icon-512x512.png"');
  });

  test("con otro nombre muestra el nombre completo y el logo configurado", () => {
    const html = render({ storeName: "La Fruta", logo: "/logo-tienda.png" });

    expect(html).toContain(">La Fruta</span>");
    expect(html).not.toContain(">Merca</span>");
    expect(html).toContain('src="/logo-tienda.png"');
  });

  test("la variante compacta usa el logo de 36 px", () => {
    expect(render({ compact: true })).toContain("h-9 w-9");
    expect(render()).toContain("h-10 w-10");
  });
});
