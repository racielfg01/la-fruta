"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  ChevronsRight,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  User,
  UserCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DeliveryZone, Order } from "@/lib/admin-store";
import {
  ORDER_FLOW,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  canCancelOrder,
  nextOrderStatus,
  paymentMethodLabel,
} from "@/lib/order-flow";
import { formatOrderDate } from "@/lib/order-dates";
import { useOrderMoney } from "@/lib/use-order-money";
import { cn } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "./order-badges";

interface OrderDetailDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryZones?: DeliveryZone[];
  /**
   * Vista del cliente: sin avanzar, cobrar ni cancelar. El historial de
   * `/perfil` reutiliza la misma plantilla, solo para consulta.
   */
  readOnly?: boolean;
  /** Cuenta que hizo el pedido; `userName` de la orden es quien recibe. */
  customer?: { name?: string; email?: string } | null;
  onAdvance?: (
    order: Order,
    nextStatus: Order["status"]
  ) => Promise<void> | void;
  onPaymentStatusChange?: (
    orderId: string,
    status: Order["paymentStatus"]
  ) => Promise<void> | void;
  onCancel?: (orderId: string, reason: string) => Promise<void> | void;
}

type BusyAction = "advance" | "payment" | "cancel" | null;

export function OrderDetailDialog({
  order,
  open,
  onOpenChange,
  deliveryZones = [],
  readOnly = false,
  customer,
  onAdvance,
  onPaymentStatusChange,
  onCancel,
}: OrderDetailDialogProps) {
  const { formatOrderMoney, hasCupBase } = useOrderMoney();
  const [busy, setBusy] = useState<BusyAction>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const stepIndex = ORDER_FLOW.indexOf(order.status);
  const nextStatus = nextOrderStatus(order.status);
  const zone = deliveryZones.find((z) => z.id === order.zoneId);
  const shortId = order.id.slice(0, 8);
  const customerEmail = customer?.email || order.userEmail;
  const canCancel = !readOnly && canCancelOrder(order.status) && !!onCancel;
  const showAdvance = !readOnly && !!nextStatus && !!onAdvance;
  const showZone = !!zone || !readOnly;
  const isTransfer = order.paymentMethod?.startsWith("transfer");
  const money = (amount: number) =>
    formatOrderMoney(amount, order.currencyCode);

  const run = async (
    action: Exclude<BusyAction, null>,
    task: () => Promise<void> | void,
    successMessage: string
  ) => {
    setBusy(action);
    try {
      await task();
      toast.success(successMessage);
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la orden"
      );
      return false;
    } finally {
      setBusy(null);
    }
  };

  const handleAdvance = () => {
    if (!nextStatus || !onAdvance) return;
    void run(
      "advance",
      () => onAdvance(order, nextStatus),
      `Orden actualizada a ${ORDER_STATUS_LABELS[nextStatus].toLowerCase()}`
    );
  };

  const handlePaymentStatusChange = (status: string) => {
    if (!onPaymentStatusChange) return;
    const next = status as Order["paymentStatus"];
    if (next === order.paymentStatus) return;
    void run(
      "payment",
      () => onPaymentStatusChange(order.id, next),
      `Pago marcado como ${PAYMENT_STATUS_LABELS[next].toLowerCase()}`
    );
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      toast.success("ID copiado");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("No se pudo copiar el ID");
    }
  };

  const confirmCancel = async () => {
    const reason = cancelReason.trim();
    if (!reason || !onCancel) return;
    const done = await run(
      "cancel",
      () => onCancel(order.id, reason),
      "Orden cancelada"
    );
    if (done) {
      setCancelOpen(false);
      setCancelReason("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,54rem)] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader className="shrink-0 gap-3 border-b bg-muted/40 px-5 pb-4 pr-12 pt-5 text-left sm:px-6 sm:pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Package className="size-4.5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="flex items-baseline gap-1.5 text-base font-semibold leading-tight">
                    Orden{" "}
                    <span className="font-mono text-sm font-normal text-muted-foreground">
                      #{shortId}
                    </span>
                  </DialogTitle>
                  <DialogDescription className="truncate text-xs">
                    {formatOrderDate(order.createdAt)} · Recibe:{" "}
                    {order.userName || "sin nombre"}
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCopyId}
                  aria-label="Copiar el ID completo de la orden"
                  title={order.id}
                >
                  {copied ? (
                    <Check className="size-3.5 text-primary" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
                <span className="sr-only" aria-live="polite">
                  {copied ? "ID copiado" : ""}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pl-[2.875rem]">
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
            </div>

            <div className="pl-[2.875rem] sm:pl-0 sm:text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-semibold tabular-nums leading-tight sm:text-2xl">
                {money(order.total)}
              </p>
              {hasCupBase(order.currencyCode) && (
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatOrderMoney(order.total, "CUP")}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <div className="grid gap-7 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] md:gap-8">
            <div className="space-y-7">
              <Section icon={Package} title="Estado de la orden">
                {order.status === "cancelled" ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <Ban
                      className="mt-0.5 size-4 shrink-0 text-destructive"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-destructive">
                        Orden cancelada
                      </p>
                      {order.cancelReason && (
                        <p className="mt-0.5 text-xs text-destructive/90">
                          Motivo: {order.cancelReason}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <ol className="flex items-start" aria-label="Progreso de la orden">
                      {ORDER_FLOW.map((step, index) => {
                        const reached = index <= stepIndex;
                        const isCurrent = index === stepIndex;
                        return (
                          <li
                            key={step}
                            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                            aria-current={isCurrent ? "step" : undefined}
                          >
                            <div className="flex w-full items-center">
                              <span
                                className={cn(
                                  "h-px flex-1",
                                  index === 0
                                    ? "bg-transparent"
                                    : reached
                                      ? "bg-primary"
                                      : "bg-border"
                                )}
                                aria-hidden="true"
                              />
                              <span
                                className={cn(
                                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums",
                                  reached
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-muted-foreground",
                                  isCurrent &&
                                    "ring-2 ring-primary/25 ring-offset-2 ring-offset-background"
                                )}
                              >
                                {index < stepIndex ? (
                                  <Check className="size-3.5" />
                                ) : (
                                  index + 1
                                )}
                              </span>
                              <span
                                className={cn(
                                  "h-px flex-1",
                                  index === ORDER_FLOW.length - 1
                                    ? "bg-transparent"
                                    : isCurrent
                                      ? "bg-primary"
                                      : "bg-border"
                                )}
                                aria-hidden="true"
                              />
                            </div>
                            <span
                              className={cn(
                                "hidden max-w-full text-center text-[10px] leading-tight sm:block sm:text-[11px]",
                                isCurrent
                                  ? "font-semibold text-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              {ORDER_STATUS_LABELS[step]}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                    <p className="text-xs text-muted-foreground sm:hidden">
                      Paso {stepIndex + 1} de {ORDER_FLOW.length} ·{" "}
                      <span className="font-medium text-foreground">
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {nextStatus ? (
                        <>
                          Siguiente paso:{" "}
                          <span className="font-medium text-foreground">
                            {ORDER_STATUS_LABELS[nextStatus]}
                          </span>
                        </>
                      ) : (
                        "La orden está completada."
                      )}
                    </p>
                  </>
                )}
              </Section>

              <Section icon={UserCheck} title="Quién recibe">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <DetailField label="Nombre completo" className="sm:col-span-2">
                    {order.userName || "No registrado"}
                  </DetailField>
                  <DetailField label="Teléfono">
                    {order.contactPhone ? (
                      <a
                        href={`tel:${order.contactPhone}`}
                        className="inline-flex items-center gap-1.5 hover:underline underline-offset-4"
                      >
                        <Phone
                          className="size-3.5 text-muted-foreground"
                          aria-hidden="true"
                        />
                        {order.contactPhone}
                      </a>
                    ) : (
                      "No registrado"
                    )}
                  </DetailField>
                  <DetailField label="Carnet de identidad">
                    {order.contactCarnet || "No registrado"}
                  </DetailField>
                </dl>
              </Section>

              <Section
                icon={ShoppingBag}
                title="Productos"
                action={
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {order.items.length} artículo
                    {order.items.length !== 1 && "s"}
                  </span>
                }
              >
                {order.items.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    Esta orden no tiene productos registrados.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-lg border">
                    <ul className="divide-y">
                      {order.items.map((item, index) => (
                        <li
                          key={`${item.productId}-${index}`}
                          className="flex items-start justify-between gap-3 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium break-words">
                              {item.productName}
                            </p>
                            <p className="text-xs text-muted-foreground tabular-nums">
                              {item.quantity} × {money(item.price)}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-medium tabular-nums">
                            {money(item.price * item.quantity)}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <dl className="space-y-1.5 border-t bg-muted/40 px-3 py-2.5 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Subtotal</dt>
                        <dd className="tabular-nums">
                          {money(order.subtotal)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Envío</dt>
                        <dd className="tabular-nums">
                          {money(order.deliveryFee)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t pt-1.5 font-semibold">
                        <dt>Total</dt>
                        <dd className="text-right tabular-nums">
                          {money(order.total)}
                          {hasCupBase(order.currencyCode) && (
                            <span className="block text-xs font-normal text-muted-foreground">
                              {formatOrderMoney(order.total, "CUP")}
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </Section>

              <Section icon={MapPin} title="Entrega">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <DetailField label="Dirección" className="sm:col-span-2">
                    {order.deliveryAddress || "No especificada"}
                  </DetailField>
                  {showZone && (
                    <DetailField label="Zona de envío">
                      {zone?.name || "No especificada"}
                    </DetailField>
                  )}
                  <DetailField label="Notas de entrega">
                    {order.deliveryNotes || "Sin notas"}
                  </DetailField>
                </dl>
              </Section>
            </div>

            <aside className="space-y-7">
              <Section icon={User} title="Cliente">
                <dl className="space-y-3">
                  <DetailField label="Nombre">
                    {customer?.name || "No registrado"}
                  </DetailField>
                  <DetailField label="Email">
                    {customerEmail ? (
                      <a
                        href={`mailto:${customerEmail}`}
                        className="hover:underline underline-offset-4"
                      >
                        {customerEmail}
                      </a>
                    ) : (
                      "No registrado"
                    )}
                  </DetailField>
                </dl>
                <p className="text-xs text-muted-foreground">
                  Cuenta que realizó el pedido.
                </p>
              </Section>

              <Section icon={CreditCard} title="Pago">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {paymentMethodLabel(order.paymentMethod)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cobro en {order.currencyCode}
                      </p>
                    </div>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>

                  {!readOnly && onPaymentStatusChange && (
                    <div className="space-y-1.5">
                      <label
                        htmlFor="order-payment-status"
                        className="text-xs text-muted-foreground"
                      >
                        Estado del pago
                      </label>
                      <Select
                        value={order.paymentStatus}
                        onValueChange={handlePaymentStatusChange}
                        disabled={busy !== null}
                      >
                        <SelectTrigger
                          id="order-payment-status"
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="paid">Pagado</SelectItem>
                          <SelectItem value="refunded">Reembolsado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {isTransfer && (
                    <div className="space-y-2.5 rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Datos de la transferencia
                      </p>
                      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                        {order.bankName && (
                          <DetailRow label="Banco" value={order.bankName} />
                        )}
                        {order.accountNumber && (
                          <DetailRow
                            label="Cuenta"
                            value={order.accountNumber}
                            mono
                          />
                        )}
                        {order.reference && (
                          <DetailRow
                            label="Referencia"
                            value={order.reference}
                          />
                        )}
                        {!!order.transferAmount && (
                          <DetailRow
                            label="Monto"
                            value={`${order.transferAmount.toFixed(2)} ${order.currencyCode}`}
                          />
                        )}
                      </dl>
                      {order.receipt && (
                        <a
                          href={order.receipt}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline underline-offset-4"
                        >
                          <FileText className="size-3.5" aria-hidden="true" />
                          Ver comprobante
                          <ExternalLink
                            className="size-3"
                            aria-hidden="true"
                          />
                        </a>
                      )}
                      {!readOnly &&
                        onPaymentStatusChange &&
                        order.paymentStatus !== "paid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-green-700 border-green-600/40 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-500/10"
                          disabled={busy !== null}
                          onClick={() =>
                            void run(
                              "payment",
                              () =>
                                onPaymentStatusChange(order.id, "paid"),
                              "Pago marcado como pagado"
                            )
                          }
                        >
                          {busy === "payment" ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          Confirmar pago
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Section>

              <Section icon={Calendar} title="Registro">
                <dl className="space-y-3">
                  <DetailField label="Creada">
                    {formatOrderDate(order.createdAt)}
                  </DetailField>
                  <DetailField label="Última actualización">
                    {formatOrderDate(order.updatedAt)}
                  </DetailField>
                </dl>
              </Section>
            </aside>
          </div>
        </div>

        <DialogFooter
          className={cn(
            "shrink-0 flex-col gap-2 border-t bg-background px-5 py-3.5 sm:flex-row sm:items-center sm:px-6",
            readOnly ? "sm:justify-end" : "sm:justify-between"
          )}
        >
          <div className="flex items-center gap-2 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              className={cn("shrink-0", readOnly && "w-full sm:w-auto")}
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
            {showAdvance && nextStatus && (
              <Button
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={handleAdvance}
                disabled={busy !== null}
              >
                {busy === "advance" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ChevronsRight className="size-4" />
                )}
                Avanzar a {ORDER_STATUS_LABELS[nextStatus]}
              </Button>
            )}
          </div>
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="self-start text-destructive hover:bg-destructive/10 hover:text-destructive sm:order-1"
              onClick={() => setCancelOpen(true)}
              disabled={busy !== null}
            >
              <Ban className="size-4" />
              Cancelar orden
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle
                className="size-5 text-destructive"
                aria-hidden="true"
              />
              Cancelar la orden #{shortId}
            </DialogTitle>
            <DialogDescription>
              Se marcará como cancelada y se repondrá el stock de sus
              productos. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label
              htmlFor="order-cancel-reason"
              className="text-sm font-medium"
            >
              Motivo de la cancelación
            </label>
            <Textarea
              id="order-cancel-reason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Ej.: el cliente lo solicitó, no hay stock de un producto..."
              rows={3}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Obligatorio. Queda guardado con la orden.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={busy === "cancel"}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
              disabled={!cancelReason.trim() || busy === "cancel"}
            >
              {busy === "cancel" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Ban className="size-4" />
              )}
              Confirmar cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function Section({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Icon
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function DetailField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium break-words">{children}</dd>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-right text-sm font-medium break-all",
          mono && "font-mono text-xs"
        )}
      >
        {value}
      </dd>
    </>
  );
}
