import { describe, expect, it } from "vitest";
import {
  daysUntilBirthday,
  isValidBirthDate,
  normalizeBirthDate,
  upcomingBirthdays,
  type BirthdayCandidate,
} from "@/lib/birthdays";

const NOW = new Date("2026-11-17T12:00:00.000Z");

function person(overrides: Partial<BirthdayCandidate> = {}): BirthdayCandidate {
  return {
    id: "u1",
    name: "Ana",
    birthDate: "1990-11-20",
    orders: 3,
    totalSpent: 450,
    ...overrides,
  };
}

describe("fecha de nacimiento", () => {
  it("normaliza el formato de PocketBase y el ISO", () => {
    expect(normalizeBirthDate("1990-11-20 00:00:00.000Z")).toBe("1990-11-20");
    expect(normalizeBirthDate("1990-11-20T00:00:00.000Z")).toBe("1990-11-20");
    expect(normalizeBirthDate("1990-11-20")).toBe("1990-11-20");
    expect(normalizeBirthDate("")).toBe("");
  });

  it("rechaza fechas imposibles, futuras o demasiado antiguas", () => {
    expect(isValidBirthDate("2026-02-30", NOW)).toBe(false);
    expect(isValidBirthDate("2026-11-18", NOW)).toBe(false);
    expect(isValidBirthDate("1890-01-01", NOW)).toBe(false);
    expect(isValidBirthDate("1990-11-20", NOW)).toBe(true);
  });
});

describe("días hasta el cumpleaños", () => {
  it("cuenta los días y cruza el año", () => {
    expect(daysUntilBirthday("1990-11-20", NOW)).toEqual({ days: 3, date: "2026-11-20" });
    expect(daysUntilBirthday("1990-01-05", NOW)).toEqual({ days: 49, date: "2027-01-05" });
  });

  it("devuelve cero el mismo día", () => {
    expect(daysUntilBirthday("1990-11-17", NOW)).toEqual({ days: 0, date: "2026-11-17" });
  });

  it("usa el 28 de febrero cuando nació un 29 en año no bisiesto", () => {
    expect(daysUntilBirthday("2000-02-29", new Date("2026-03-01T12:00:00.000Z"))).toEqual({
      days: 364,
      date: "2027-02-28",
    });
  });
});

describe("listado del panel", () => {
  it("incluye solo compradores con fecha válida dentro de la ventana", () => {
    const list = upcomingBirthdays(
      [
        person(),
        person({ id: "u2", name: "Luis", birthDate: "1985-12-01" }),
        person({ id: "u3", name: "Sin fecha", birthDate: "" }),
        person({ id: "u4", name: "Sin compras", birthDate: "1980-11-19", orders: 0 }),
      ],
      NOW,
      30
    );
    expect(list.map((p) => p.name)).toEqual(["Ana", "Luis"]);
    expect(list[0].daysUntil).toBe(3);
  });

  it("con todos los modos devuelve los cumpleaños ordenados", () => {
    const list = upcomingBirthdays(
      [person({ id: "u1", birthDate: "1990-01-05" }), person({ id: "u2", birthDate: "1990-11-20" })],
      NOW,
      null
    );
    expect(list.map((p) => p.name)).toEqual(["Ana", "Ana"]);
    expect(list[0].daysUntil).toBe(3);
  });
});
