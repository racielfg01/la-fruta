/**
 * Cumpleaños de clientes que han comprado. Solo se usa en el panel del admin:
 * la fecha de nacimiento es un dato personal y nunca se muestra en la tienda.
 */

export interface BirthdayCandidate {
  id: string;
  name: string;
  birthDate: string;
  orders: number;
  totalSpent: number;
}

export interface BirthdayPerson extends BirthdayCandidate {
  daysUntil: number;
  nextDate: string;
}

const DAY_MS = 86_400_000;

export function normalizeBirthDate(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  const datePart = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : "";
}

export function isValidBirthDate(value: unknown, now: Date = new Date()): boolean {
  const iso = normalizeBirthDate(value);
  if (!iso) return false;
  const [year, month, day] = iso.split("-").map(Number);
  if (year < 1900) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  return date.getTime() <= today.getTime();
}

function occurrence(year: number, month: number, day: number): Date {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return new Date(Date.UTC(year, month - 1, Math.min(day, lastDay)));
}

export function daysUntilBirthday(
  birthDate: string,
  now: Date = new Date()
): { days: number; date: string } | null {
  const iso = normalizeBirthDate(birthDate);
  if (!iso) return null;
  const [, month, day] = iso.split("-").map(Number);
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  let next = occurrence(now.getUTCFullYear(), month, day);
  if (next.getTime() < today.getTime()) {
    next = occurrence(now.getUTCFullYear() + 1, month, day);
  }
  return {
    days: Math.round((next.getTime() - today.getTime()) / DAY_MS),
    date: next.toISOString().slice(0, 10),
  };
}

export function upcomingBirthdays(
  people: BirthdayCandidate[],
  now: Date = new Date(),
  withinDays: number | null = 30
): BirthdayPerson[] {
  return people
    .filter((person) => person.orders > 0 && isValidBirthDate(person.birthDate, now))
    .map((person) => {
      const next = daysUntilBirthday(person.birthDate, now);
      return { ...person, daysUntil: next?.days ?? Number.POSITIVE_INFINITY, nextDate: next?.date ?? "" };
    })
    .filter((person) => withinDays === null || person.daysUntil <= withinDays)
    .sort((a, b) => a.daysUntil - b.daysUntil || a.name.localeCompare(b.name, "es"));
}
