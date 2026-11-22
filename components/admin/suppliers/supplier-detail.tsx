"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  applyPurchaseStockAction,
  deletePurchaseAction,
  type ApplyStockResult,
  type SupplierDetail,
} from "@/app/actions/suppliers";
import { PurchaseForm } from "@/components/admin/suppliers/purchase-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  canApplyStock,
  canDeletePurchase,
  purchaseTotal,
  type ProductOption,
  type Purchase,
  type Supplier,
} from "@/lib/suppliers";

interface SupplierDetailPanelProps {
  supplier: Supplier;
  detail: SupplierDetail | null;
  products: ProductOption[];
  token: string | null;
  onChanged: () => void;
}

const priceFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function SupplierDetailPanel({
  supplier,
  detail,
  products,
  token,
  onChanged,
}: SupplierDetailPanelProps) {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [stockPurchase, setStockPurchase] = useState<Purchase | null>(null);
  const [stockOpen, setStockOpen] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const applyingRef = useRef<string | null>(null);
  const [deletePurchase, setDeletePurchase] = useState<Purchase | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deletingRef = useRef<string | null>(null);

  const openStock = (purchase: Purchase) => {
    if (!token || !canApplyStock(purchase)) return;
    setStockPurchase(purchase);
    setStockOpen(true);
  };

  const handleApplyStock = async () => {
    if (
      !stockPurchase ||
      !token ||
      applyingRef.current === stockPurchase.id
    ) {
      return;
    }
    const purchase = stockPurchase;
    applyingRef.current = purchase.id;
    setApplyingId(purchase.id);
    try {
      const result: ApplyStockResult = await applyPurchaseStockAction(
        token,
        purchase.id
      );
      if (result.applied > 0) {
        toast.success(
          `Stock aplicado a ${result.applied} producto${result.applied === 1 ? "" : "s"}`
        );
      }
      if (result.missing.length > 0) {
        const names = result.missing.map(
          (id) => products.find((product) => product.id === id)?.name ?? id
        );
        toast.warning(`Productos no encontrados: ${names.join(", ")}`);
      }
      setStockOpen(false);
      setStockPurchase(null);
      onChanged();
    } catch (error) {
      console.error("Error applying purchase stock:", error);
      toast.error(
        error instanceof Error ? error.message : "No se pudo aplicar el stock"
      );
    } finally {
      applyingRef.current = null;
      setApplyingId(null);
    }
  };

  const openDelete = (purchase: Purchase) => {
    if (!token || !canDeletePurchase(purchase)) return;
    setDeletePurchase(purchase);
    setDeleteOpen(true);
  };

  const handleDeletePurchase = async () => {
    if (
      !deletePurchase ||
      !token ||
      deletingRef.current === deletePurchase.id
    ) {
      return;
    }
    const purchase = deletePurchase;
    deletingRef.current = purchase.id;
    setDeletingId(purchase.id);
    try {
      await deletePurchaseAction(token, purchase.id);
      toast.success("Compra eliminada");
      setDeleteOpen(false);
      setDeletePurchase(null);
      onChanged();
    } catch (error) {
      console.error("Error deleting purchase:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la compra"
      );
    } finally {
      deletingRef.current = null;
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{supplier.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Teléfono: {supplier.phone || "—"}
          </p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Precios</CardTitle>
        </CardHeader>
        <CardContent>
          {detail === null ? (
            <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando precios…
            </p>
          ) : detail.prices.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              Aún no hay precios. Registra una compra para verlos.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead>Unidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.prices.map((price) => (
                    <TableRow key={price.product}>
                      <TableCell className="font-medium">
                        {price.productName}
                      </TableCell>
                      <TableCell className="text-right">
                        {priceFormatter.format(price.unitPrice)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {price.unit || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Compras</CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={() => setPurchaseOpen(true)}
            disabled={!token || products.length === 0 || detail === null}
          >
            + Nueva compra
          </Button>
        </CardHeader>
        <CardContent>
          {detail === null ? (
            <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando compras…
            </p>
          ) : detail.purchases.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              Aún no hay compras registradas para este proveedor.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>{formatDate(purchase.purchasedAt)}</TableCell>
                      <TableCell>{purchase.items.length}</TableCell>
                      <TableCell className="text-right font-medium">
                        {priceFormatter.format(
                          purchaseTotal(purchase.items)
                        )}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-muted-foreground">
                        {purchase.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {canApplyStock(purchase) ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openStock(purchase)}
                              disabled={!token || applyingId === purchase.id}
                            >
                              {applyingId === purchase.id && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Agregar stock
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Stock aplicado
                            </span>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openDelete(purchase)}
                            disabled={
                              !token ||
                              !canDeletePurchase(purchase) ||
                              deletingId === purchase.id
                            }
                            aria-label={`Eliminar compra del ${formatDate(purchase.purchasedAt)}`}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PurchaseForm
        key={purchaseOpen ? "purchase-open" : "purchase-closed"}
        open={purchaseOpen}
        supplierId={supplier.id}
        products={products}
        onClose={() => setPurchaseOpen(false)}
        onSaved={() => {
          setPurchaseOpen(false);
          onChanged();
        }}
      />

      <AlertDialog open={stockOpen} onOpenChange={setStockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Agregar stock de esta compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Se sumarán las cantidades al stock general del catálogo. Esta
              acción solo se puede aplicar una vez por compra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applyingId !== null}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApplyStock}
              disabled={applyingId !== null || !token}
            >
              {applyingId !== null ? "Aplicando..." : "Agregar stock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán la compra y sus líneas. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePurchase}
              disabled={deletingId !== null || !token}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId !== null ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
