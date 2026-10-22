/**
 * Guardado de direcciones de entrega: decidir si se crea una nueva o si se
 * actualiza la que ya existe.
 *
 * Antes, si la dirección ya estaba guardada el guardado se rechazaba como
 * duplicado y las instrucciones (notas) se perdían: era imposible añadirle
 * instrucciones a una dirección existente, y al seleccionarla las notas
 * salían vacías.
 */

export interface SavedAddress {
  id: string;
  alias: string;
  address: string;
  zone: string;
  notes: string;
}

export interface AddressInput {
  address: string;
  zone: string;
  alias: string;
  notes: string;
}

export type SaveAddressPlan =
  | { kind: "create" }
  | { kind: "update"; id: string; alias: string; notes: string };

const normalize = (value: string | null | undefined): string =>
  (value || "").trim().toLowerCase();

/** Dirección guardada que coincide con el texto y la zona indicados. */
export function findSavedAddress(
  addresses: SavedAddress[],
  address: string,
  zone: string
): SavedAddress | undefined {
  const wanted = normalize(address);
  if (!wanted) return undefined;
  const wantedZone = normalize(zone);
  return addresses.find(
    (saved) =>
      normalize(saved.address) === wanted && normalize(saved.zone) === wantedZone
  );
}

/**
 * Plan de guardado: si la dirección ya existe se actualiza (alias e
 * instrucciones), nunca se descarta la información.
 */
export function planSaveAddress(
  addresses: SavedAddress[],
  input: AddressInput
): SaveAddressPlan {
  const dup = findSavedAddress(addresses, input.address, input.zone);
  if (!dup) return { kind: "create" };
  return {
    kind: "update",
    id: dup.id,
    alias: input.alias.trim() || dup.alias,
    notes: input.notes.trim(),
  };
}
