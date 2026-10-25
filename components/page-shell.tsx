import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Estructura común de las páginas de información (términos, privacidad,
 * contacto): cabecera de la tienda, bloque de título y pie compartido.
 */
export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background">
          <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <div className="mx-auto max-w-xl">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a la tienda
              </Link>
              <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </section>
        <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
