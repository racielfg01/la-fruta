import type { Metadata } from "next";
import Link from "next/link";
import { Package, ShoppingCart, ShieldCheck, Truck } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contacto | MercaToma",
  description:
    "Escríbenos por WhatsApp para dudas sobre pedidos, entregas o cambios. También encontrarás accesos rápidos a tu cuenta y al carrito.",
};

const shortcuts = [
  {
    href: "/perfil",
    icon: Package,
    title: "Estado de tu pedido",
    description: "Consulta tus pedidos y sus datos de entrega.",
  },
  {
    href: "/cart",
    icon: ShoppingCart,
    title: "Revisa tu carrito",
    description: "Comprueba lo que llevas antes de escribirnos.",
  },
  {
    href: "/terminos",
    icon: Truck,
    title: "Entregas y pagos",
    description: "Zonas de reparto, plazos y métodos de pago.",
  },
  {
    href: "/privacidad",
    icon: ShieldCheck,
    title: "Privacidad",
    description: "Qué datos usamos y cómo ejercer tus derechos.",
  },
];

export default function ContactoPage() {
  return (
    <PageShell
      title="Contacto"
      subtitle="Estamos para ayudarte con tu pedido, la entrega o cualquier duda."
    >
      <div className="space-y-10">
        <section aria-labelledby="form-title">
          <h2
            id="form-title"
            className="font-[family-name:var(--font-playfair)] text-xl font-bold text-foreground"
          >
            Escríbenos
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Cuéntanos qué necesitas y te respondemos por WhatsApp. Si tu
            consulta es sobre un pedido, incluye el número para que podamos
            revisarlo antes.
          </p>
          <div className="mt-5 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
            <ContactForm />
          </div>
        </section>

        <section aria-labelledby="shortcuts-title">
          <h2
            id="shortcuts-title"
            className="font-[family-name:var(--font-playfair)] text-xl font-bold text-foreground"
          >
            Quizá lo resuelvas antes aquí
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {shortcuts.map(({ href, icon: Icon, title, description }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground group-hover:text-primary">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
