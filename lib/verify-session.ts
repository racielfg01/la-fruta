import { getTokenPB } from "./pocketbase";
import { decodePocketBaseToken } from "./auth";

export interface VerifiedSession {
  /** Id real del registro en PocketBase — nunca el que afirma el token. */
  userId: string;
  email: string;
  name: string;
  roleId: string;
}

/**
 * `invalid_session`: el token no vale (firma inválida, caducado, usuario
 * borrado o un id que no es el del titular). La sesión se cierra.
 * `unavailable`: no se pudo comprobar (red caída, PocketBase sin respuesta).
 * El token puede estar perfectamente bien: la sesión NO se cierra.
 */
export type SessionErrorCode = "invalid_session" | "unavailable";

export interface SessionError extends Error {
  code: SessionErrorCode;
}

export function isInvalidSession(error: unknown): boolean {
  return (error as SessionError | undefined)?.code === "invalid_session";
}

function sessionError(code: SessionErrorCode, message: string): SessionError {
  const error = new Error(message) as SessionError;
  error.code = code;
  return error;
}

/**
 * Valida el token CONTRA PocketBase y devuelve la identidad real del titular.
 *
 * `decodePocketBaseToken` (lib/auth.ts) NO autentica a nadie: solo deserializa
 * el payload del JWT y mira la caducidad, sin comprobar la firma. Un token
 * inventado con cualquier `id` lo pasa. Este helper es el que sí autentica:
 * PocketBase valida la firma en cada petición, así que un token forjado o
 * caducado se rechaza, y la regla `id = @request.auth.id` impide además
 * leer el registro de otro usuario.
 *
 * Úsalo en TODA puerta que hoy se apoya solo en `decodePocketBaseToken`.
 */
export async function verifySession(token: string): Promise<VerifiedSession> {
  if (!token) throw sessionError("invalid_session", "Sesión inválida o expirada");

  const payload = decodePocketBaseToken(token);
  if (!payload) throw sessionError("invalid_session", "Sesión inválida o expirada");

  const pb = getTokenPB(token);
  let record: any;
  try {
    record = await pb.collection("users").getOne(payload.userId, { expand: "role_id" });
  } catch (error: any) {
    const status = error?.status ?? error?.response?.status;
    // PocketBase rechazó la petición: la firma no vale, el token caducó, el
    // usuario se borró o el id no es el del titular. No hay sesión.
    if (status === 400 || status === 401 || status === 403 || status === 404) {
      throw sessionError("invalid_session", "Sesión inválida o expirada");
    }
    // Red caída o PocketBase sin responder: no dice nada del token, así que
    // no se cierra la sesión — solo falla esta operación.
    throw sessionError("unavailable", "No se pudo validar la sesión");
  }

  return {
    // El id del registro es la verdad; el del token solo era una pista.
    userId: record.id,
    email: record.email || "",
    name: record.name || record.email || "",
    roleId: record.role_id || "",
  };
}
