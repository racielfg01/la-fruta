"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-context";
import {
  PushPermissionError,
  getPushSubscription,
  isIos,
  isPushSupported,
  isStandalone,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push/client";
import {
  getPushConfigAction,
  subscribePushAction,
  unsubscribePushAction,
} from "@/app/actions/notifications";

export function NotificationBell() {
  const { token, user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState(true);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);

  const ready = !isLoading && mounted;
  const isAdmin = Number(user?.role_id) === 2;

  useEffect(() => {
    setMounted(true);
    setSupported(isPushSupported());
  }, []);

  useEffect(() => {
    if (!ready || isAdmin) return;
    // Se pide al cargar para que el clic no tenga que esperar a la red: el
    // permiso del navegador debe pedirse dentro del gesto del usuario.
    getPushConfigAction()
      .then((result) => {
        setConfigured(result.configured);
        setPublicKey(result.publicKey);
      })
      .catch(() => undefined);
  }, [ready, isAdmin]);

  useEffect(() => {
    if (!ready || !isAuthenticated || !token || isAdmin || !supported) return;
    let cancelled = false;

    getPushSubscription()
      .then(async (subscription) => {
        if (cancelled || !subscription) return;
        setSubscribed(true);
        // Reafirma la suscripción con la cuenta actual (por si cambió el
        // dueño del dispositivo o se perdió la fila).
        await subscribePushAction(token, subscription.toJSON());
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [ready, isAuthenticated, token, isAdmin, supported]);

  if (!mounted || !ready || isAdmin) return null;

  const handleClick = async () => {
    if (!isAuthenticated || !token) {
      router.push("/auth/login");
      return;
    }

    if (!supported) {
      toast.error("Este navegador no admite avisos push.");
      return;
    }
    if (isIos() && !isStandalone()) {
      toast.info("En iPhone, añade la web a la pantalla de inicio y ábrela desde ahí.");
      return;
    }

    setBusy(true);
    try {
      if (subscribed) {
        const subscription = await getPushSubscription();
        const endpoint = subscription?.endpoint;
        if (endpoint) {
          const result = await unsubscribePushAction(token, endpoint);
          if (!result.success) throw new Error(result.error || "No se pudo desactivar.");
        }
        await unsubscribeFromPush();
        setSubscribed(false);
        toast.success("Avisos desactivados en este dispositivo.");
        return;
      }

      if (!configured || !publicKey) {
        toast.error("Los avisos todavía no están configurados.");
        return;
      }

      const subscription = await subscribeToPush(publicKey);
      const result = await subscribePushAction(token, subscription.toJSON());
      if (!result.success) {
        await unsubscribeFromPush();
        throw new Error(result.error || "No se pudo activar el aviso.");
      }
      setSubscribed(true);
      toast.success("Avisos de productos nuevos activados.");
    } catch (error) {
      if (error instanceof PushPermissionError) {
        toast.error(
          error.permission === "denied"
            ? "Bloqueaste los avisos. Cámbialo en los ajustes del navegador."
            : "No se concedió permiso para los avisos."
        );
      } else {
        toast.error(error instanceof Error ? error.message : "No se pudo cambiar el aviso.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={subscribed}
      aria-label={subscribed ? "Desactivar avisos de productos nuevos" : "Activar avisos de productos nuevos"}
      title={subscribed ? "Avisos activados" : "Avisos de productos nuevos"}
    >
      {busy ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : subscribed ? (
        <BellRing className="h-5 w-5 text-primary" />
      ) : (
        <Bell className="h-5 w-5" />
      )}
    </Button>
  );
}
