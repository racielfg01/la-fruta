import Image from "next/image";
import Link from "next/link";

/** Pie de página compartido por la tienda y las páginas de información. */
export function SiteFooter() {
  return (
    <footer className="border-t bg-card py-8 md:py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-primary/20">
              <Image
                className="object-cover"
                src={"/icon-512x512.png"}
                alt="logo"
                width={40}
                height={40}
                priority
              />
            </div>
            <div>
              <span className="font-[family-name:var(--font-playfair)] text-lg font-bold">
                <span className="text-primary">Merca</span>
                <span className="text-destructive">Toma</span>
              </span>
              <p className="text-xs text-muted-foreground">Del campo a tu mesa</p>
            </div>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground md:gap-6">
            <Link href="/terminos" className="transition-colors hover:text-foreground">
              Términos
            </Link>
            <Link href="/privacidad" className="transition-colors hover:text-foreground">
              Privacidad
            </Link>
            <Link href="/contacto" className="transition-colors hover:text-foreground">
              Contacto
            </Link>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MercaToma. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
