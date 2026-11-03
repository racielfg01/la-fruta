import { cn } from "@/lib/utils";
import type { Order } from "@/lib/admin-store";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-flow";

const ORDER_STATUS_CLASSES: Record<Order["status"], string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-400/15 dark:text-yellow-300",
  confirmed:
    "bg-blue-100 text-blue-800 dark:bg-blue-400/15 dark:text-blue-300",
  preparing:
    "bg-orange-100 text-orange-800 dark:bg-orange-400/15 dark:text-orange-300",
  shipped:
    "bg-purple-100 text-purple-800 dark:bg-purple-400/15 dark:text-purple-300",
  delivered:
    "bg-green-100 text-green-800 dark:bg-green-400/15 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-300",
};

const PAYMENT_STATUS_CLASSES: Record<Order["paymentStatus"], string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-400/15 dark:text-yellow-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-400/15 dark:text-green-300",
  refunded: "bg-muted text-muted-foreground",
};

function Badge({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        className
      )}
    >
      <span
        className="size-1.5 shrink-0 rounded-full bg-current opacity-70"
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

export function OrderStatusBadge({
  status,
  className,
}: {
  status: Order["status"];
  className?: string;
}) {
  return (
    <Badge className={cn(ORDER_STATUS_CLASSES[status], className)}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: Order["paymentStatus"];
  className?: string;
}) {
  return (
    <Badge className={cn(PAYMENT_STATUS_CLASSES[status], className)}>
      {PAYMENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
