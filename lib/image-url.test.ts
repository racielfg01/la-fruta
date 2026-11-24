import { describe, expect, it } from "vitest";
import { isSvgImageUrl } from "./image-url";

describe("isSvgImageUrl", () => {
  it("detecta una URL terminada en .svg", () => {
    expect(isSvgImageUrl("/categorias/frutas.svg")).toBe(true);
    expect(isSvgImageUrl("https://cdn.example.com/icono.SVG")).toBe(true);
  });

  it("detecta .svg con query string o fragmento", () => {
    expect(isSvgImageUrl("https://cdn.example.com/i.svg?v=2")).toBe(true);
    expect(isSvgImageUrl("/i.svg#tail")).toBe(true);
  });

  it("no confunde otras extensiones con SVG", () => {
    expect(isSvgImageUrl("/foto.png")).toBe(false);
    expect(isSvgImageUrl("/icono.svgx")).toBe(false);
    expect(isSvgImageUrl("")).toBe(false);
  });
});
