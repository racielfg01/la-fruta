"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgePercent, ChevronLeft, ChevronRight } from "lucide-react";
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
  // Si se puede desplazar. Se guarda en estado (como hace el propio
  // carrusel) porque leer `api.canScrollNext()` al pintar deja la flecha
  // desfasada: solo se recalcularía al volver a pintar.
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // El contador vive solo en el cliente: el HTML inicial no destella fechas.
  // Tick de un segundo para que los segundos del contador corran de verdad.
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
      setCanPrev(api.canScrollPrev());
      setCanNext(api.canScrollNext());
    };
    api.on("select", onSelect);
    // 'reInit' salta cuando cambia el número de diapositivas (una oferta
    // vence con la página abierta): sin esto el punto resaltado se queda
    // apuntando a una diapositiva que ya no existe.
    api.on("reInit", onSelect);
    onSelect();
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
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
               <Link
            href="/ofertas"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ver más
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
            {/* <Badge variant="secondary">{visible.length}</Badge>
            {multiple && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8"
                  onClick={() => api?.scrollPrev()}
                  disabled={!canPrev}
                  aria-label="Oferta anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8"
                  onClick={() => api?.scrollNext()}
                  disabled={!canNext}
                  aria-label="Oferta siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )} */}
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

        <div className="mt-4 flex items-center justify-center gap-3">
          {multiple && (
            <div className="flex gap-1.5">
              {visible.map((offer, index) => (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => api?.scrollTo(index)}
                  aria-label={`Ir a la oferta ${index + 1}`}
                  aria-current={index === current}
                  // El punto es pequeño pero el objetivo es de 24 px: el
                  // relleno se compensa para no separar la fila.
                  className="-m-2 rounded-full p-2"
                >
                  <span
                    className={cn(
                      "block h-2 rounded-full transition-all",
                      index === current
                        ? "w-6 bg-primary"
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                </button>
              ))}
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
