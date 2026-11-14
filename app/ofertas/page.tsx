import type { Metadata } from "next";
import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import { OffersList } from "@/components/offers-list";
import { getPublicOffers } from "@/app/actions/public-offers";

/**
 * Las ofertas cambian seguido (se vencen y se crean): la página se rehace
 * cada minuto, como la portada.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Ofertas",
  description:
    "Todas las ofertas de MercaToma: rebajas y combos con precio final y fecha de vencimiento. Mientras dure la oferta, el precio es el que ves.",
  alternates: { canonical: "/ofertas" },
  openGraph: {
    url: "/ofertas",
    title: "Ofertas | MercaToma",
    description:
      "Rebajas y combos con precio final y fecha de vencimiento. Mientras dure la oferta, el precio es el que ves.",
  },
};

/**
 * Listado público de todas las ofertas vigentes. Es el destino del «Ver más»
 * de cada tarjeta de la portada: aquí la descripción se lee entera.
 */
export default async function OffersPage() {
  const result = await getPublicOffers();
  const offers = result.success ? result.data : [];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pb-24 md:pb-8">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground sm:text-3xl">
              Ofertas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Rebajas y combos con precio final. El precio es el que ves hasta
              que vence la oferta.
            </p>
          </div>
          <OffersList offers={offers} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
