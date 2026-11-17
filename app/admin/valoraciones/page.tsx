"use client";

import { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";

import { OrderDetailDialog } from "@/components/order-detail-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminStore, type Order } from "@/lib/admin-store";
import { formatOrderDate } from "@/lib/order-dates";
import { ratingSummary } from "@/lib/order-ratings";
import { cn } from "@/lib/utils";

function Stars({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${value} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-4",
            n <= value
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/40"
          )}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export default function RatingsPage() {
  const { orders } = useAdminStore();
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Order | null>(null);
  const [open, setOpen] = useState(false);

  const rated = useMemo(
    () =>
      orders
        .filter((o) => Number(o.deliveryRating) >= 1 && Number(o.deliveryRating) <= 5)
        .sort((a, b) =>
          new Date(b.deliveredAt || b.createdAt).getTime() -
          new Date(a.deliveredAt || a.createdAt).getTime()
        ),
    [orders]
  );
  const summary = ratingSummary(rated);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rated;
    return rated.filter(
      (o) =>
        o.id.toLowerCase().includes(term) ||
        o.userName.toLowerCase().includes(term) ||
        (o.deliveryComment || "").toLowerCase().includes(term)
    );
  }, [rated, search]);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-serif font-bold">Valoraciones de entrega</h1>
        <p className="text-sm text-muted-foreground">
          {summary.count > 0 ? (
            <>
              {summary.count} {summary.count === 1 ? "valoración" : "valoraciones"} ·
              promedio {summary.average.toFixed(1)} de 5
            </>
          ) : (
            "Todavía no hay valoraciones de entrega."
          )}
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por pedido, cliente o texto…"
          aria-label="Buscar valoraciones"
          className="h-11 pl-9"
        />
      </div>

      {rated.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm font-medium">Aún no hay valoraciones</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Aparecerán aquí cuando un cliente valore una entrega dentro de las
            72 horas posteriores.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay valoraciones que coincidan con la búsqueda.
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border">
          {filtered.map((order) => (
            <li key={order.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={Number(order.deliveryRating)} />
                    <span className="text-sm font-semibold tabular-nums">
                      {Number(order.deliveryRating)}/5
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed break-words">
                    {order.deliveryComment || "Sin descripción."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.userName || "Cliente sin nombre"} ·{" "}
                    {formatOrderDate(order.deliveredAt || order.createdAt)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 shrink-0 sm:h-9"
                  onClick={() => {
                    setViewing(order);
                    setOpen(true);
                  }}
                >
                  Ver pedido
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Los pedidos entregados antes de existir esta función no tienen fecha de
        entrega y no se pueden valorar.
      </p>

      <OrderDetailDialog
        order={viewing}
        open={open}
        onOpenChange={setOpen}
        readOnly
      />
    </div>
  );
}
