"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Heart,
  Loader2,
  MapPin,
  RefreshCw,
  ShoppingBag,
  WifiOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { offlineStatus } from "@/lib/offline";

export function OfflineScreen() {
  const router = useRouter();
  const [online, setOnline] = useState(false);
  const [checking, setChecking] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);
  const copy = offlineStatus(online);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => {
      setOnline(false);
      setRetryFailed(false);
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const handleAction = useCallback(async () => {
    if (online) {
      router.push("/");
      router.refresh();
      return;
    }
    setChecking(true);
    setRetryFailed(false);
    try {
      const response = await fetch("/", { method: "HEAD", cache: "no-store" });
      if (response.ok) {
        setOnline(true);
        router.refresh();
      } else {
        setRetryFailed(true);
      }
    } catch {
      setRetryFailed(true);
    } finally {
      setChecking(false);
    }
  }, [online, router]);

  return (
    <main className="flex min-h-dvh flex-col bg-gradient-to-b from-background to-muted/40">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <Image
          src="/icon-192x192.png"
          alt="MercaToma"
          width={72}
          height={72}
          className="h-18 w-18 rounded-2xl"
          priority
        />

        <span
          className={`mt-8 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
            online
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-muted text-muted-foreground"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${online ? "bg-primary" : "bg-muted-foreground"}`}
            aria-hidden="true"
          />
          {online ? "En línea" : "Sin conexión"}
        </span>

        <div className="mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          {online ? (
            <Check className="h-9 w-9" aria-hidden="true" />
          ) : (
            <WifiOff className="h-9 w-9" aria-hidden="true" />
          )}
        </div>

        <h1 className="mt-6 font-[family-name:var(--font-playfair)] text-3xl font-bold text-foreground">
          {copy.title}
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {copy.description}
        </p>

        {retryFailed && !online && (
          <p role="alert" className="mt-3 text-sm font-medium text-destructive">
            Todavía no hay conexión. Inténtalo de nuevo en un momento.
          </p>
        )}

        <Button
          size="lg"
          className="mt-8 h-12 w-full max-w-xs"
          onClick={handleAction}
          disabled={checking}
        >
          {checking ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : online ? (
            <ArrowRight className="mr-2 h-4 w-4" aria-hidden="true" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {checking ? "Comprobando…" : copy.action}
        </Button>

        <div className="mt-10 w-full max-w-sm space-y-4 text-left">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">
              Lo que sigue disponible
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                Tu carrito guardado en este dispositivo
              </li>
              <li className="flex items-center gap-2">
                <Heart className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                Tus favoritos
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                Las direcciones que ya guardaste
              </li>
            </ul>
          </div>
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            Los precios y el stock se actualizan al reconectar. No podrás
            confirmar un pedido mientras estés sin conexión.
          </p>
        </div>
      </div>
    </main>
  );
}
