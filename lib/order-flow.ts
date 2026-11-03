import type { Order } from "./admin-store";

/** Orden lineal del fulfillment; refleja `VALID_ORDER_TRANSITIONS` en app/actions/admin.ts. */
export const ORDER_FLOW: Order["status"][] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

export const ORDER_STATUS_LABELS: Record<Order["status"], string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const PAYMENT_STATUS_LABELS: Record<Order["paymentStatus"], string> = {
  pending: "Pendiente",
  paid: "Pagado",
  refunded: "Reembolsado",
};

export function nextOrderStatus(status: Order["status"]): Order["status"] | null {
  const index = ORDER_FLOW.indexOf(status);
  if (index < 0 || index === ORDER_FLOW.length - 1) return null;
  return ORDER_FLOW[index + 1];
}

/** El servidor solo permite cancelar antes de enviar. */
export function canCancelOrder(status: Order["status"]): boolean {
  return status === "pending" || status === "confirmed" || status === "preparing";
}

export function paymentMethodLabel(method: string): string {
  switch (method) {
    case "cash":
      return "Efectivo";
    case "transfer":
      return "Transferencia";
    case "transfer_cup":
      return "Transferencia CUP";
    default:
      return method || "No especificado";
  }
}
