"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { optimizedImageUrl } from "@/lib/image";

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  linkType: "none" | "product" | "url";
  productId: string;
  url: string;
}

/**
 * Destino del banner. Un producto que ya no está visible en la tienda deja la
 * franja como informativa en lugar de llevar a una ficha que no existe.
 */
function resolveHref(banner: Banner, validProductIds: string[]): string | null {
  if (banner.linkType === "product") {
    if (!banner.productId) return null;
    return validProductIds.includes(banner.productId)
      ? `/product/${banner.productId}`
      : null;
  }
  if (banner.linkType === "url") return banner.url || null;
  return null;
}

function SlideContent({ banner }: { banner: Banner }) {
  return (
    <>
      {banner.image ? (
        <Image
          src={optimizedImageUrl(banner.image, 1600)}
          alt={banner.title || banner.subtitle || "Banner de la tienda"}
          fill
          sizes="(max-width: 1024px) 100vw, 1200px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/85 to-primary/60" />
      )}
      {(banner.title || banner.subtitle) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-4 sm:p-6">
          {banner.title && (
            <p className="text-lg font-semibold leading-tight text-white sm:text-2xl">
              {banner.title}
            </p>
          )}
          {banner.subtitle && (
            <p className="mt-1 text-sm text-white/85 sm:text-base">
              {banner.subtitle}
            </p>
          )}
        </div>
      )}
    </>
  );
}

export function BannerCarousel({
  banners,
  validProductIds,
}: {
  banners: Banner[];
  validProductIds: string[];
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    onSelect();
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (banners.length === 0) return null;

  const multiple = banners.length > 1;

  return (
    <section className="container mx-auto px-4 pt-2 sm:px-6 lg:px-4">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: false }}
        aria-label="Banners de la tienda"
      >
        <CarouselContent className="ml-0">
          {banners.map((banner, index) => {
            const href = resolveHref(banner, validProductIds);
            const external = href ? /^https?:\/\//i.test(href) : false;
            const frame = cn(
              "group relative block aspect-[16/10] w-full overflow-hidden rounded-2xl border bg-muted sm:aspect-[7/2]",
              href && "cursor-pointer"
            );
            const content = <SlideContent banner={banner} />;

            return (
              <CarouselItem
                key={banner.id}
                className="pl-0"
                aria-label={`${index + 1} de ${banners.length}`}
              >
                {!href ? (
                  <div className={frame}>{content}</div>
                ) : external ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={frame}
                    aria-label={`${banner.title || "Banner"}: abrir enlace`}
                  >
                    {content}
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                      Ver más
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </a>
                ) : (
                  <Link
                    href={href}
                    className={frame}
                    aria-label={`${banner.title || "Banner"}: ver más`}
                  >
                    {content}
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                      Ver más
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                )}
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {multiple && (
          <>
            <CarouselPrevious
              variant="secondary"
              className="left-3 hidden opacity-90 sm:inline-flex"
            />
            <CarouselNext
              variant="secondary"
              className="right-3 hidden opacity-90 sm:inline-flex"
            />
          </>
        )}
      </Carousel>

      {multiple && (
        <div className="mt-3 flex justify-center gap-1.5">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => api?.scrollTo(index)}
              aria-label={`Ir al banner ${index + 1}`}
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
    </section>
  );
}
