/** Texto de la pantalla sin conexión según el estado real de la red. */
export function offlineStatus(online: boolean): {
  title: string;
  description: string;
  action: string;
} {
  return online
    ? {
        title: "Conexión restaurada",
        description: "Ya puedes volver a la tienda y ver los productos actualizados.",
        action: "Volver a la tienda",
      }
    : {
        title: "Sin conexión",
        description: "No pudimos cargar la tienda. Revisa tu conexión o espera a que vuelva la señal.",
        action: "Reintentar",
      };
}
