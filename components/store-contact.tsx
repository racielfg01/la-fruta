"use client";

import { useEffect } from "react";
import { Clock, MessageCircle } from "lucide-react";
import { useSettingsStore } from "@/lib/settings-store";
import { whatsAppLink } from "@/lib/whatsapp";

/** Datos de contacto y horario tomados de la configuración del admin. */
function useStoreContact() {
  const settings = useSettingsStore((s) => s.settings);
  const init = useSettingsStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return {
    schedule: (settings.storeSchedule || "").trim(),
    phone: (settings.whatsappPhone || "").trim(),
    whatsappHref: whatsAppLink(
      settings.whatsappPhone,
      "Hola, necesito ayuda con mi pedido"
    ),
  };
}

/** Tarjetas de WhatsApp y horario para la página de contacto. */
export function StoreContactPanel() {
  const { schedule, phone, whatsappHref } = useStoreContact();

  if (!whatsappHref && !schedule) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {whatsappHref && (
        <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <MessageCircle className="h-4 w-4 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">WhatsApp</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Atención personalizada
            </p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
            >
              {phone}
            </a>
          </div>
        </div>
      )}
      {schedule && (
        <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Horario</p>
            <p className="mt-0.5 whitespace-pre-line text-xs text-muted-foreground">
              {schedule}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Horario de atención en una línea, para el pie de página. */
export function StoreScheduleFooter() {
  const { schedule } = useStoreContact();

  if (!schedule) return null;

  return (
    <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
      <Clock className="h-4 w-4" aria-hidden="true" />
      <span className="whitespace-pre-line">{schedule}</span>
    </p>
  );
}
