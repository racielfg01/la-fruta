"use server";

import { getPB, getAllRecords } from "@/lib/pocketbase";
import {
  isOfferActive,
  toAdminOffer,
  toPublicOffer,
  type PublicOffer,
} from "@/lib/offers";

/**
 * Ofertas vigentes para la portada: solo las activas y con fecha límite por
 * delante (la vencida o desactivada no se muestra), las más nuevas primero.
 */
export async function getPublicOffers(): Promise<
  | { success: true; data: PublicOffer[] }
  | { success: false; error: string }
> {
  try {
    const pb = getPB();
    const list = await getAllRecords(pb, "offers", { sort: "-created" });
    const data = list
      .map((r) => toAdminOffer(r as Record<string, any>))
      // Ojo: `filter(isOfferActive)` pasaría el ÍNDICE del array como `now`
      // (segundo parámetro) y el filtro de fecha no filtraría nunca: salían
      // ofertas vencidas con el botón de agregar activo.
      .filter((o) => isOfferActive(o))
      .map(toPublicOffer);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching public offers:", error);
    return { success: false, error: "No se pudieron cargar las ofertas" };
  }
}
