"use client";

import { useEffect, useState } from "react";
import { BadgePercent, Plus, Timer, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import type { PublicOffer } from "@/lib/offers";

function timeRemaining(endDate: string, now: number) {
  const end = new Date(endDate.replace(" ", "T")).getTime();
  const diff = Math.max(0, end - now);
  return {
    expired: end <= now,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
  };
}

/**
 * Sección de ofertas de la portada. El precio de la oferta es FINAL: se
 * muestra tal cual (convertido a la moneda elegida) sin margen de ganancia.
 * Sin ofertas vigentes no se renderiza nada.
 */
export function OffersSection({ offers }: { offers: PublicOffer[] }) {
  const [now, setNow] = useState<number | null>(null);

  // El contador vive solo en el cliente: el HTML inicial no destella fechas.
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const addOfferItem = useCartStore((state) => state.addOfferItem);
  const cartItems = useCartStore((state) => state.items);
  const { currencies, defaultCurrency, formatPrice, convertPrice } = useCurrency();
  const cupCurrency = currencies.find((c) => c.code === "CUP");

  const formatOfferPrice = (priceCup: number) => {
    if (!cupCurrency || !defaultCurrency) return `${priceCup.toFixed(2)} CUP`;
    return formatPrice(convertPrice(priceCup, cupCurrency, defaultCurrency), defaultCurrency);
  };

  // Mientras el HTML no hidrata, se muestran las fechas estáticas del servidor.
  const visible = offers.filter((o) => {
    if (now === null) return o.active;
    return o.active && !timeRemaining(o.endDate, now).expired;
  });

  if (visible.length === 0) return null;

  return (
    <section aria-labelledby="ofertas" className="border-t bg-muted/30 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="ofertas"
            className="flex items-center gap-2 font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground"
          >
            <BadgePercent className="h-5 w-5 text-primary" />
            Ofertas
          </h2>
          <Badge variant="secondary">{visible.length}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {visible.map((offer) => {
            const remaining = timeRemaining(offer.endDate, now ?? Date.now());
            const inCart = cartItems.some((item) => item.offer?.id === offer.id);
            return (
              <div
                key={offer.id}
                className="flex flex-col overflow-hidden rounded-xl border bg-card"
              >
                <div className="relative aspect-[16/9] bg-muted">
                  {offer.image ? (
                    <img
                      src={offer.image}
                      alt={offer.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BadgePercent className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute left-2.5 top-2.5">
                    <Badge variant={offer.type === "combo" ? "default" : "secondary"}>
                      {offer.type === "combo" ? "Combo" : "Rebaja"}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                    {offer.name}
                  </h3>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {offer.description}
                  </p>

                  <div className="mt-auto space-y-3 pt-2">
                    <div className="flex items-end justify-between gap-2">
                      <span className="text-lg font-bold text-primary">
                        {formatOfferPrice(offer.price)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Timer className="h-3.5 w-3.5" />
                        {remaining.expired
                          ? "Vencida"
                          : remaining.days > 0
                            ? `Termina en ${remaining.days} d ${remaining.hours} h`
                            : remaining.hours > 0
                              ? `Termina en ${remaining.hours} h ${remaining.minutes} m`
                              : `Termina en ${remaining.minutes} m`}
                      </span>
                    </div>

                    <Button
                      className="w-full gap-2"
                      disabled={remaining.expired}
                      onClick={() => addOfferItem(offer)}
                    >
                      {inCart ? (
                        <>
                          <Check className="h-4 w-4" /> Agregado
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" /> Agregar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
