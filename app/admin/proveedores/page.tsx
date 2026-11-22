"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getSupplierDetailAction,
  getSuppliersOverviewAction,
  type SupplierDetail,
  type SuppliersOverview,
} from "@/app/actions/suppliers";
import { SupplierDetailPanel } from "@/components/admin/suppliers/supplier-detail";
import { SupplierSidebar } from "@/components/admin/suppliers/supplier-sidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuthStore } from "@/lib/auth-context";

export default function ProveedoresPage() {
  const token = useAuthStore((s) => s.token);
  const [overview, setOverview] = useState<SuppliersOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupplierDetail | null>(null);
  const detailRequestRef = useRef<string | null>(null);

  const load = useCallback(async (): Promise<SuppliersOverview | null> => {
    if (!token) {
      setLoading(false);
      return null;
    }
    setLoading(true);
    try {
      const result = await getSuppliersOverviewAction(token);
      setOverview(result);
      return result;
    } catch (error) {
      console.error("Error loading suppliers overview:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la información de proveedores"
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadDetail = async (id: string) => {
    detailRequestRef.current = id;
    if (!token || overview?.setupNeeded) return;
    try {
      const result = await getSupplierDetailAction(token, id);
      if (detailRequestRef.current === id) setDetail(result);
    } catch (error) {
      console.error("Error loading supplier detail:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el detalle del proveedor"
      );
      if (detailRequestRef.current === id) setDetail(null);
    }
  };

  const handleSelect = (id: string) => {
    if (overview?.setupNeeded) return;
    setSelectedId(id);
    setDetail(null);
    void loadDetail(id);
  };

  const handleCreated = async () => {
    if (overview?.setupNeeded) return;
    const result = await load();
    if (
      result &&
      selectedId &&
      !result.suppliers.some((supplier) => supplier.id === selectedId)
    ) {
      detailRequestRef.current = null;
      setSelectedId(null);
      setDetail(null);
    }
  };

  const handleError = (message: string) => {
    toast.error(message);
  };

  const handleChanged = () => {
    void load();
    if (selectedId && !overview?.setupNeeded) void loadDetail(selectedId);
  };

  if (loading && !overview) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const setupNeeded = overview?.setupNeeded ?? false;
  const selectedSupplier =
    overview?.suppliers.find((supplier) => supplier.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Proveedores</h2>
        <p className="text-muted-foreground">
          Gestiona contactos, compras y precios por proveedor.
        </p>
      </div>

      {setupNeeded && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Falta preparar PocketBase</AlertTitle>
          <AlertDescription>
            Ejecuta el script de configuración de colecciones para habilitar
            proveedores y compras. Mientras tanto, esta sección permanece en
            modo de solo lectura.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <SupplierSidebar
          suppliers={overview?.suppliers ?? []}
          selectedId={selectedId}
          onSelect={handleSelect}
          onCreated={handleCreated}
          onError={handleError}
          setupNeeded={setupNeeded}
        />

        {!setupNeeded && selectedSupplier ? (
          <SupplierDetailPanel
            supplier={selectedSupplier}
            detail={detail}
            products={overview?.products ?? []}
            token={token}
            onChanged={handleChanged}
          />
        ) : (
          <div className="flex min-h-[240px] items-center justify-center rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            Selecciona un proveedor
          </div>
        )}
      </div>
    </div>
  );
}
