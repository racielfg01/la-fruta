import { isOfferActive, type PublicOffer } from "./offers";

/**
 * ¿La oferta ya venció?
 *
 * Sin `now` (el HTML todavía sin hidratar) nadie se da por vencido: el
 * servidor no puede saberlo y el contador aún no corre. El botón de agregar
 * solo se desactiva cuando el cliente ya tiene la hora.
 */
export function isOfferExpired(offer: PublicOffer, now: number | null): boolean {
  if (now === null) return false;
  return !isOfferActive(
    { active: offer.active, end_date: offer.endDate },
    now,
  );
}

/**
 * Las ofertas que se enseñan.
 *
 * Con hora: solo las activas y no vencidas (una vencida no se puede
 * comprar). Sin hora: las activas, para que el HTML del servidor no
 * esconda nada que luego el cliente vaya a enseñar.
 */
export function visibleOffers(
  offers: PublicOffer[],
  now: number | null,
): PublicOffer[] {
  return offers.filter((o) =>
    now === null
      ? o.active
      : isOfferActive({ active: o.active, end_date: o.endDate }, now),
  );
}
