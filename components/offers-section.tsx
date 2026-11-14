"use client";

import { useEffect, useState } from "react";
import { BadgePercent, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { OfferCard } from "@/components/offer-card";
import { visibleOffers } from "@/lib/offers-view";
import type { PublicOffer } from "@/lib/offers";
import { cn } from "@/lib/utils";

/**
 * Sección de ofertas de la portada: listado con scroll horizontal.
 *
 * Reutiliza el carrusel de `@/components/ui/carousel` (el mismo que mueve
 * los banners). El precio de la oferta es FINAL: la tarjeta lo muestra tal
 * cual, sin margen de ganancia. Sin ofertas vigentes no se renderiza nada.
 */
export function OffersSection({ offers }: { offers: PublicOffer[] }) {
  const [now, setNow] = useState<number | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // El contador vive solo en el cliente: el HTML inicial no destella fechas.
  // Tick de un segundo para que los segundos del contador corran de verdad.
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    onSelect();
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Mientras el HTML no hidrata, se muestran las ofertas tal cual las dejó
  // el servidor. Vencida con la página abierta: desaparece sin recargar.
  const visible = visibleOffers(offers, now);

  if (visible.length === 0) return null;

  const multiple = visible.length > 1;

  return (
    <section aria-labelledby="ofertas" className="border-t bg-muted/30 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            id="ofertas"
            className="flex items-center gap-2 font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground"
          >
            <BadgePercent className="h-5 w-5 text-primary" />
            Ofertas
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{visible.length}</Badge>
            {multiple && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8"
                  onClick={() => api?.scrollPrev()}
                  disabled={!api?.canScrollPrev()}
                  aria-label="Oferta anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8"
                  onClick={() => api?.scrollNext()}
                  disabled={!api?.canScrollNext()}
                  aria-label="Oferta siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <Carousel
          setApi={setApi}
          opts={{ align: "start", loop: false }}
          aria-label="Ofertas de la tienda"
        >
          <CarouselContent className="-ml-4">
            {visible.map((offer) => (
              <CarouselItem
                key={offer.id}
                className="pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3"
                aria-label={offer.name}
              >
                <OfferCard offer={offer} now={now} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {multiple && (
          <div className="mt-4 flex justify-center gap-1.5">
            {visible.map((offer, index) => (
              <button
                key={offer.id}
                type="button"
                onClick={() => api?.scrollTo(index)}
                aria-label={`Ir a la oferta ${index + 1}`}
                aria-current={index === current}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === current
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
