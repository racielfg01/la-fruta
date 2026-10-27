"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/lib/auth-context";
import {
  announceNewProductsAction,
  getNotificationOverviewAction,
  getPushConfigAction,
  sendTestPushAction,
  subscribePushAction,
  unsubscribePushAction,
  updateNotificationSettingsAction,
} from "@/app/actions/notifications";
import {
  PushPermissionError,
  getPushSubscription,
  isIos,
  isPushSupported,
  isStandalone,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push/client";
import { remainingCooldownMs } from "@/lib/push/payloads";
import type { NotificationOverview, PushConfigResult } from "@/lib/push/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  Bell,
  BellRing,
  Loader2,
  Package,
  Send,
  ShoppingBag,
  Smartphone,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function NotificacionesPage() {
  const token = useAuthStore((s) => s.token);
  const [overview, setOverview] = useState<NotificationOverview | null>(null);
  const [config, setConfig] = useState<PushConfigResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState(true);
  const [iphoneNeedsInstall, setIphoneNeedsInstall] = useState(false);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [pushConfig, result] = await Promise.all([
        getPushConfigAction(),
        getNotificationOverviewAction(token),
      ]);
      setConfig(pushConfig);
      if (result.success) {
        setOverview(result);
      } else {
        toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSupported(isPushSupported());
    setIphoneNeedsInstall(isIos() && !isStandalone());

    getPushSubscription()
      .then(async (subscription) => {
        setSubscribed(!!subscription);
        if (subscription && token) {
          await subscribePushAction(token, subscription.toJSON());
        }
      })
      .catch(() => undefined);
  }, [token]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const cooldownSeconds = useMemo(() => {
    if (!overview) return 0;
    return Math.ceil(
      remainingCooldownMs(overview.settings.lastProductsPushAt, now) / 1000
    );
  }, [overview, now]);

  const ready = !loading && !!overview;
  const blocked = !ready || overview?.setupNeeded || !config?.configured;

  const handleToggle = async (
    key: "newOrder" | "newUser" | "newProducts",
    value: boolean
  ) => {
    if (!token || !overview) return;
    setSaving(key);
    setOverview({
      ...overview,
      settings: { ...overview.settings, [key]: value },
    });
    try {
      const result = await updateNotificationSettingsAction(token, { [key]: value });
      if (!result.success) {
        toast.error(result.error || "No se pudo guardar.");
      } else {
        toast.success("Preferencia guardada.");
      }
      await load();
    } finally {
      setSaving(null);
    }
  };

  const handleActivate = async () => {
    if (!token || !config?.publicKey) {
      toast.error("Faltan las claves VAPID en el servidor.");
      return;
    }
    if (iphoneNeedsInstall) {
      toast.info("En iPhone, añade la web a la pantalla de inicio y ábrela desde ahí.");
      return;
    }

    setBusy(true);
    try {
      const subscription = await subscribeToPush(config.publicKey);
      const result = await subscribePushAction(token, subscription.toJSON());
      if (!result.success) {
        await unsubscribeFromPush();
        throw new Error(result.error || "No se pudo activar este dispositivo.");
      }
      setSubscribed(true);
      toast.success("Este dispositivo recibirá los avisos.");
      await load();
    } catch (error) {
      if (error instanceof PushPermissionError) {
        toast.error(
          error.permission === "denied"
            ? "Bloqueaste los avisos. Cámbialo en los ajustes del navegador."
            : "No se concedió permiso para los avisos."
        );
      } else {
        toast.error(error instanceof Error ? error.message : "No se pudo activar.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDeactivate = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const subscription = await getPushSubscription();
      if (subscription) {
        const result = await unsubscribePushAction(token, subscription.endpoint);
        if (!result.success) throw new Error(result.error || "No se pudo desactivar.");
      }
      await unsubscribeFromPush();
      setSubscribed(false);
      toast.success("Este dispositivo ya no recibirá avisos.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo desactivar.");
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    if (!token) return;
    const subscription = await getPushSubscription();
    if (!subscription) {
      toast.error("Activa este dispositivo antes de enviar una prueba.");
      return;
    }
    setBusy(true);
    try {
      const result = await sendTestPushAction(token, subscription.endpoint);
      if (!result.success) {
        toast.error(result.error || "No se pudo enviar la prueba.");
        return;
      }
      toast.success("Prueba enviada. Revisa este dispositivo.");
    } finally {
      setBusy(false);
    }
  };

  const handleAnnounce = async () => {
    if (!token || !overview) return;
    setBusy(true);
    try {
      const result = await announceNewProductsAction(token);
      if (!result.success) {
        toast.error(result.error || "No se pudo enviar el aviso.");
        return;
      }
      toast.success(
        `Aviso enviado a ${result.sent ?? 0} dispositivo(s)` +
          (result.failed ? `; ${result.failed} falló(aron).` : ".")
      );
      await load();
    } finally {
      setBusy(false);
    }
  };

  const announceLabel = (() => {
    if (!overview) return "Avisar a clientes";
    if (overview.setupNeeded) return "Falta preparar PocketBase";
    if (!config?.configured) return "Faltan las claves VAPID";
    if (!overview.settings.newProducts) return "Aviso de productos apagado";
    if (overview.counts.clients === 0) return "Sin clientes suscritos";
    if (overview.counts.newProducts === 0) return "Sin productos nuevos";
    if (cooldownSeconds > 0) return `Espera ${cooldownSeconds} s`;
    return "Avisar a clientes";
  })();

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notificaciones</h2>
        <p className="text-muted-foreground">
          Avisos push para pedidos, cuentas nuevas y productos nuevos.
        </p>
      </div>

      {overview?.setupNeeded && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Falta preparar PocketBase</AlertTitle>
          <AlertDescription>
            Ejecuta <code>node scripts/setup-push.mjs</code> una vez y recarga esta página.
            Crea los campos y la colección de suscripciones.
          </AlertDescription>
        </Alert>
      )}

      {!config?.configured && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Faltan las claves VAPID</AlertTitle>
          <AlertDescription>
            Añade <code>VAPID_PUBLIC_KEY</code>, <code>VAPID_PRIVATE_KEY</code> y{" "}
            <code>VAPID_SUBJECT</code> en Vercel y vuelve a desplegar. Hasta entonces no se
            envía ningún aviso; la tienda sigue funcionando.
          </AlertDescription>
        </Alert>
      )}

      {!supported && (
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertTitle>Este navegador no admite avisos push</AlertTitle>
          <AlertDescription>
            Prueba con Chrome, Edge o Firefox actualizado. La configuración y los envíos a
            otros dispositivos siguen funcionando.
          </AlertDescription>
        </Alert>
      )}

      {iphoneNeedsInstall && supported && (
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertTitle>iPhone: primero instala la web</AlertTitle>
          <AlertDescription>
            En Safari, toca Compartir → Añadir a pantalla de inicio, abre MercaToma desde
            ese icono y vuelve aquí para activar los avisos.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Eventos
            </CardTitle>
            <CardDescription>
              Elige qué avisos se envían. Los pedidos y las cuentas van a los administradores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <EventRow
              icon={<ShoppingBag className="h-4 w-4" />}
              title="Pedido nuevo"
              description="Código, cliente, total y zona."
              checked={overview?.settings.newOrder ?? true}
              disabled={blocked || saving !== null}
              onChange={(value) => handleToggle("newOrder", value)}
            />
            <EventRow
              icon={<UserPlus className="h-4 w-4" />}
              title="Usuario nuevo"
              description="Cuando se registra un cliente, desde la tienda o desde el panel."
              checked={overview?.settings.newUser ?? true}
              disabled={blocked || saving !== null}
              onChange={(value) => handleToggle("newUser", value)}
            />
            <EventRow
              icon={<Package className="h-4 w-4" />}
              title="Productos nuevos"
              description="Aviso manual a los clientes que activaron sus avisos."
              checked={overview?.settings.newProducts ?? true}
              disabled={blocked || saving !== null}
              onChange={(value) => handleToggle("newProducts", value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Este dispositivo
            </CardTitle>
            <CardDescription>
              Los avisos se piden solo al pulsar. Puedes desactivarlos cuando quieras.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                {subscribed ? (
                  <BellRing className="h-4 w-4 text-primary" />
                ) : (
                  <Bell className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{subscribed ? "Activado en este dispositivo" : "Sin activar"}</span>
              </div>
              <Badge variant={subscribed ? "default" : "secondary"}>
                {overview?.counts.admins ?? 0} admin(es)
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {subscribed ? (
                <>
                  <Button variant="outline" onClick={handleTest} disabled={busy || blocked}>
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Enviar prueba
                  </Button>
                  <Button variant="ghost" onClick={handleDeactivate} disabled={busy}>
                    Desactivar
                  </Button>
                </>
              ) : (
                <Button onClick={handleActivate} disabled={busy || blocked || !supported}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                  Activar este dispositivo
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Si cierras sesión, este dispositivo deja de recibir avisos. Cerrar la pestaña no
              los desactiva.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Productos nuevos
          </CardTitle>
          <CardDescription>
            Solo se avisa a clientes registrados que activaron los avisos desde la tienda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-bold">{overview?.counts.newProducts ?? 0}</p>
              <p className="text-sm text-muted-foreground">
                producto(s) visible(s) desde el último aviso
              </p>
              {overview?.counts.newProductNames.length ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {overview.counts.newProductNames.join(", ")}
                  {(overview.counts.newProducts ?? 0) > overview.counts.newProductNames.length
                    ? ` y ${overview.counts.newProducts - overview.counts.newProductNames.length} más`
                    : ""}
                </p>
              ) : null}
            </div>
            <div className="text-right text-sm">
              <p className="font-medium">{overview?.counts.clients ?? 0} cliente(s) suscrito(s)</p>
              {overview?.settings.lastProductsPushAt ? (
                <p className="text-muted-foreground">
                  Último aviso:{" "}
                  {new Date(
                    overview.settings.lastProductsPushAt.replace(" ", "T")
                  ).toLocaleString("es-ES")}
                </p>
              ) : (
                <p className="text-muted-foreground">Todavía no hay avisos enviados.</p>
              )}
            </div>
          </div>

          <Button
            onClick={handleAnnounce}
            disabled={busy || blocked || !overview?.canAnnounce || cooldownSeconds > 0}
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {announceLabel}
          </Button>

          {overview && !overview.settings.newProducts && (
            <p className="text-sm text-muted-foreground">
              Enciende «Productos nuevos» arriba para poder enviar.
            </p>
          )}
          {overview && overview.settings.newProducts && overview.counts.clients === 0 && (
            <p className="text-sm text-muted-foreground">
              Cuando un cliente active sus avisos en la tienda, aparecerá aquí y podrás avisarle.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EventRow({
  icon,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div className="flex gap-3">
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
        <div>
          <p className="font-medium leading-tight">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-label={`Avisar ${title.toLowerCase()}`}
      />
    </div>
  );
}
