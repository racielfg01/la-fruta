"use client";

import { useEffect, useState } from "react";
import { OfferCard } from "@/components/offer-card";
import { visibleOffers } from "@/lib/offers-view";
import type { PublicOffer } from "@/lib/offers";

/**
 * Listado completo de ofertas para `/ofertas`: en rejilla, con la
 * descripción entera. Es el destino del enlace «Ver más» de cada tarjeta de
 * la portada.
 */
export function OffersList({ offers }: { offers: PublicOffer[] }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const visible = visibleOffers(offers, now);

  if (visible.length === 0) {
    return (
      <p className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        Ahora mismo no hay ofertas activas. Vuelve pronto: se renuevan seguido.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {visible.map((offer) => (
        <OfferCard key={offer.id} offer={offer} now={now} variant="list" />
      ))}
    </div>
  );
}
