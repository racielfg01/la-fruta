"use client";

import { useEffect, useState } from "react";
import { BadgePercent, Plus, Timer, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { countdownParts, isOfferActive, type PublicOffer } from "@/lib/offers";

/**
 * Contador descendente hasta el vencimiento: días, horas, minutos y segundos.
 * Antes de hidratar (now null) muestra «…» para no destellar fechas en el
 * HTML estático; si la oferta no tiene fecha utilizable, «Sin límite».
 */
function OfferCountdown({
  endDate,
  now,
}: {
  endDate: string;
  now: number | null;
}) {
  const parts = now !== null ? countdownParts(endDate, now) : null;

  return (
    <div className="flex items-center gap-1" aria-label="Tiempo restante">
      <Timer className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {parts === null ? (
        <span className="text-xs text-muted-foreground">
          {now === null ? "…" : "Sin límite"}
        </span>
      ) : (
        (
          [
            [parts.days, "días"],
            [parts.hours, "hrs"],
            [parts.minutes, "min"],
            [parts.seconds, "seg"],
          ] as const
        ).map(([v, l]) => (
          <div
            key={l}
            className="flex flex-col items-center rounded-md bg-muted px-1.5 py-0.5"
          >
            <span className="text-xs font-bold tabular-nums leading-none">
              {String(v).padStart(2, "0")}
            </span>
            <span className="text-[9px] leading-none text-muted-foreground">
              {l}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

/**
 * Sección de ofertas de la portada. El precio de la oferta es FINAL: se
 * muestra tal cual (convertido a la moneda elegida) sin margen de ganancia.
 * Sin ofertas vigentes no se renderiza nada.
 */
export function OffersSection({ offers }: { offers: PublicOffer[] }) {
  const [now, setNow] = useState<number | null>(null);

  // El contador vive solo en el cliente: el HTML inicial no destella fechas.
  // Tick de un segundo para que los segundos del contador corran de verdad.
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
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
  // Vencida con la página abierta: desaparece sin recargar.
  const visible = offers.filter((o) =>
    now === null
      ? o.active
      : isOfferActive({ active: o.active, end_date: o.endDate }, now)
  );

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
            const inCart = cartItems.some((item) => item.offer?.id === offer.id);
            const expired =
              now !== null &&
              !isOfferActive({ active: offer.active, end_date: offer.endDate }, now);
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
                      <OfferCountdown endDate={offer.endDate} now={now} />
                    </div>

                    <Button
                      className="w-full gap-2"
                      disabled={expired}
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
