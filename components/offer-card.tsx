"use client";

import { BadgePercent, Check, Plus, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCartStore } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { countdownParts, type PublicOffer } from "@/lib/offers";
import { isOfferExpired } from "@/lib/offers-view";
import { convertOfferPrice, offerCurrencyCode } from "@/lib/offer-currency";
import { cn } from "@/lib/utils";

/**
 * Contador descendente hasta el vencimiento: días, horas, minutos y segundos.
 * Antes de hidratar (now null) muestra «…» para no destellar fechas en el
 * HTML estático; si la oferta no tiene fecha utilizable, «Sin límite».
 */
export function OfferCountdown({
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
 * Tarjeta de oferta, compartida por el carrusel de la portada y el listado de
 * `/ofertas`.
 *
 * El precio de la oferta es FINAL: se muestra tal cual (convertido a la
 * moneda elegida) sin margen de ganancia.
 *
 * Al pulsar la imagen se abre el detalle con la descripción entera, el
 * precio, el contador y el botón de agregar.
 */
export function OfferCard({
  offer,
  now,
  variant = "carousel",
}: {
  offer: PublicOffer;
  now: number | null;
  variant?: "carousel" | "list";
}) {
  const addOfferItem = useCartStore((state) => state.addOfferItem);
  const cartItems = useCartStore((state) => state.items);
  const { currencies, defaultCurrency, formatPrice } = useCurrency();

  const sourceCode = offerCurrencyCode(offer);
  const formatOfferPrice = (price: number) => {
    if (!defaultCurrency || currencies.length === 0) {
      return `${price.toFixed(2)} ${sourceCode}`;
    }
    const converted = convertOfferPrice(
      price,
      currencies,
      sourceCode,
      defaultCurrency.code
    );
    return formatPrice(converted, defaultCurrency);
  };

  const inCart = cartItems.some((item) => item.offer?.id === offer.id);
  const expired = isOfferExpired(offer, now);
  const isList = variant === "list";

  const image = offer.image ? (
    <img
      src={offer.image}
      alt={offer.name}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
    />
  ) : (
    <div className="flex h-full items-center justify-center">
      <BadgePercent className="h-10 w-10 text-muted-foreground" />
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
      <div className="relative aspect-[16/9] bg-muted">
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={`Ver detalles de ${offer.name}`}
              className="group block h-full w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {image}
            </button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-muted">
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
              <DialogTitle className="mt-1 text-lg">{offer.name}</DialogTitle>
            </DialogHeader>

            <DialogDescription>{offer.description}</DialogDescription>

            <div className="flex items-end justify-between gap-3">
              <span className="text-2xl font-bold text-primary">
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
          </DialogContent>
        </Dialog>

        <div className="pointer-events-none absolute left-2.5 top-2.5">
          <Badge variant={offer.type === "combo" ? "default" : "secondary"}>
            {offer.type === "combo" ? "Combo" : "Rebaja"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3
          className={cn(
            "font-semibold text-foreground",
            isList ? "text-base" : "line-clamp-2 text-sm"
          )}
        >
          {offer.name}
        </h3>
        <p
          className={cn(
            "text-xs text-muted-foreground",
            !isList && "line-clamp-2"
          )}
        >
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
}
