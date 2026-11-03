import {
  normalizeTextKey as normalizeZoneKey,
  parsePriceValue as parseZonePrice,
} from "./sheet-values";

/**
 * Lógica pura del intercambio de precios de zonas de envío en Excel.
 * Sin dependencias de librerías: solo transforma filas ya leídas.
 */

export interface ZoneTemplateRow {
  province: string;
  municipality: string;
  zone: string;
  price: number;
}

export interface ZoneRowInput {
  /** Número de fila en el archivo, para los mensajes de error. */
  row: number;
  province: string;
  municipality: string;
  zone: string;
  price: string | number;
}

export interface ProvinceRef {
  id: string;
  name: string;
}

export interface MunicipalityRef {
  id: string;
  name: string;
  provinceId: string;
}

export interface ExistingZoneRef {
  id: string;
  name: string;
  price: number;
  provinceId?: string;
  municipalityId?: string;
}

export interface ZoneUpdate {
  id: string;
  zone: string;
  provinceName: string;
  municipalityName: string;
  price: number;
}

export interface ZoneCreation {
  zone: string;
  provinceId: string;
  municipalityId: string;
  provinceName: string;
  municipalityName: string;
  price: number;
}

export interface ZoneRowError {
  row: number;
  message: string;
}

export interface ZoneImportPlan {
  updates: ZoneUpdate[];
  creates: ZoneCreation[];
  errors: ZoneRowError[];
}

export {
  normalizeTextKey as normalizeZoneKey,
  parsePriceValue as parseZonePrice,
} from "./sheet-values";

/** Filas de la plantilla, con nombres en vez de ids y orden estable. */
export function buildZoneTemplateRows(
  zones: Pick<ExistingZoneRef, "name" | "price" | "provinceId" | "municipalityId">[],
  provinces: ProvinceRef[],
  municipalities: MunicipalityRef[]
): ZoneTemplateRow[] {
  const provinceName = (id?: string) => provinces.find((p) => p.id === id)?.name ?? "";
  const municipalityName = (id?: string) => municipalities.find((m) => m.id === id)?.name ?? "";

  return zones
    .map((zone) => ({
      province: provinceName(zone.provinceId),
      municipality: municipalityName(zone.municipalityId),
      zone: zone.name,
      price: zone.price,
    }))
    .sort(
      (a, b) =>
        a.province.localeCompare(b.province, "es") ||
        a.municipality.localeCompare(b.municipality, "es") ||
        a.zone.localeCompare(b.zone, "es")
    );
}

/** Decide qué actualizar, qué crear y qué rechazar, sin tocar la base de datos. */
export function planZoneImport(
  rows: ZoneRowInput[],
  existingZones: ExistingZoneRef[],
  provinces: ProvinceRef[],
  municipalities: MunicipalityRef[]
): ZoneImportPlan {
  const plan: ZoneImportPlan = { updates: [], creates: [], errors: [] };
  const seen = new Set<string>();

  const provincesByKey = new Map(provinces.map((p) => [normalizeZoneKey(p.name), p]));
  const municipalitiesByKey = new Map(
    municipalities.map((m) => [`${m.provinceId}::${normalizeZoneKey(m.name)}`, m])
  );
  const existingByKey = new Map(
    existingZones.map((z) => [
      `${z.provinceId ?? ""}::${z.municipalityId ?? ""}::${normalizeZoneKey(z.name)}`,
      z,
    ])
  );

  for (const row of rows) {
    const province = provincesByKey.get(normalizeZoneKey(row.province));
    if (!province) {
      plan.errors.push({ row: row.row, message: `Provincia no encontrada: "${row.province}"` });
      continue;
    }

    const municipality = municipalitiesByKey.get(
      `${province.id}::${normalizeZoneKey(row.municipality)}`
    );
    if (!municipality) {
      plan.errors.push({
        row: row.row,
        message: `Municipio no encontrado en ${province.name}: "${row.municipality}"`,
      });
      continue;
    }

    const zoneKey = `${province.id}::${municipality.id}::${normalizeZoneKey(row.zone)}`;
    if (!normalizeZoneKey(row.zone)) {
      plan.errors.push({ row: row.row, message: "Falta el nombre de la zona" });
      continue;
    }

    const price = parseZonePrice(row.price);
    if (price === null) {
      plan.errors.push({
        row: row.row,
        message: `Precio inválido para "${row.zone}": "${row.price}"`,
      });
      continue;
    }

    if (seen.has(zoneKey)) {
      plan.errors.push({
        row: row.row,
        message: `Fila repetida: "${row.zone}" ya apareció antes en este archivo`,
      });
      continue;
    }
    seen.add(zoneKey);

    const match = existingByKey.get(zoneKey);
    if (match) {
      plan.updates.push({
        id: match.id,
        zone: match.name,
        provinceName: province.name,
        municipalityName: municipality.name,
        price,
      });
    } else {
      plan.creates.push({
        zone: String(row.zone).trim(),
        provinceId: province.id,
        municipalityId: municipality.id,
        provinceName: province.name,
        municipalityName: municipality.name,
        price,
      });
    }
  }

  return plan;
}

/** Cuerpo mínimo para actualizar una zona: solo cambia el precio. */
export function buildZonePriceUpdate(price: number): { price: number } {
  return { price };
}

/** Registro completo para una zona nueva; el Excel no trae distancia ni tiempo. */
export function buildZoneCreateRecord(creation: ZoneCreation): {
  name: string;
  min_distance: number;
  max_distance: number;
  price: number;
  estimated_time: string;
  active: boolean;
  province: string;
  municipality: string;
} {
  return {
    name: creation.zone,
    min_distance: 0,
    max_distance: 0,
    price: creation.price,
    estimated_time: "Por definir",
    active: true,
    province: creation.provinceId,
    municipality: creation.municipalityId,
  };
}
