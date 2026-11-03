import { describe, test, expect } from "vitest";
import { chooseCurrency } from "./currency-selection";

const cup = { id: "cup", code: "CUP", isDefault: false };
const usd = { id: "usd", code: "USD", isDefault: true };
const eur = { id: "eur", code: "EUR", isDefault: false };

describe("chooseCurrency", () => {
  test("sin elección previa usa CUP aunque otra sea la predeterminada en la base", () => {
    expect(chooseCurrency([usd, cup], null)).toEqual(cup);
  });

  test("respeta la elección explícita del usuario", () => {
    expect(chooseCurrency([usd, cup], "usd")).toEqual(usd);
  });

  test("si la elección guardada ya no existe, vuelve a CUP", () => {
    expect(chooseCurrency([usd, cup], "borrada")).toEqual(cup);
  });

  test("sin CUP usa la predeterminada", () => {
    expect(chooseCurrency([eur, usd], null)).toEqual(usd);
  });

  test("sin CUP ni predeterminada usa la primera", () => {
    expect(chooseCurrency([eur], null)).toEqual(eur);
  });

  test("sin monedas no devuelve nada", () => {
    expect(chooseCurrency([], null)).toBeNull();
  });
});
