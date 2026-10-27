import type { Audience } from "./types";

/** El rol 2 es administrador; cualquier otro rol es cliente. */
export function audienceForRole(roleId: number | string | null | undefined): Audience {
  return Number(roleId) === 2 ? "admin" : "client";
}
