"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSettingsStore } from "@/lib/settings-store";
import { whatsAppLink } from "@/lib/whatsapp";

/**
 * Formulario de contacto sin backend: compone el mensaje y abre WhatsApp con
 * el número configurado en Admin → Configuración. Si no hay número, lo avisa.
 */
export function ContactForm() {
  const phone = useSettingsStore((s) => s.settings.whatsappPhone);
  const [name, setName] = useState("");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [opened, setOpened] = useState(false);

  const composed = useMemo(() => {
    const parts = [`Hola, soy ${name.trim() || "un cliente de la tienda"}.`];
    if (orderId.trim()) parts.push(`Mi pedido es el ${orderId.trim()}.`);
    if (message.trim()) parts.push(message.trim());
    return parts.join(" ");
  }, [name, orderId, message]);

  const href = whatsAppLink(phone, composed);
  const canSend = Boolean(href) && message.trim().length > 0;

  if (!href) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">
          El canal de WhatsApp todavía no está configurado.
        </p>
        <p className="mt-1">
          La tienda aún no ha publicado un número de contacto. Mientras tanto
          puedes revisar el estado de tu pedido en{" "}
          <a href="/perfil" className="font-medium text-primary underline underline-offset-2">
            tu perfil
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSend) return;
        setOpened(true);
        window.open(href, "_blank", "noopener,noreferrer");
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Tu nombre</Label>
          <Input
            id="contact-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre y apellidos"
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-order">Número de pedido (opcional)</Label>
          <Input
            id="contact-order"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="Por si escribes sobre un pedido"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-message">¿En qué te ayudamos?</Label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Cuéntanos qué necesitas: un pedido, una entrega, un cambio…"
          className="min-h-28"
          required
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {opened
            ? "Se abrió WhatsApp con tu mensaje escrito."
            : "Se abrirá WhatsApp con tu mensaje escrito. No se envía nada desde esta página."}
        </p>
        <Button type="submit" size="lg" className="h-11 gap-2" disabled={!canSend}>
          {opened ? <MessageCircle className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          Enviar por WhatsApp
        </Button>
      </div>
    </form>
  );
}
