"use client";

import { useState } from "react";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { deleteSupplierAction } from "@/app/actions/suppliers";
import { SupplierForm } from "@/components/admin/suppliers/supplier-form";
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
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/auth-context";
import { paginateSuppliers, type Supplier } from "@/lib/suppliers";

interface SupplierSidebarProps {
  suppliers: Supplier[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreated: () => void;
  onError: (message: string) => void;
  setupNeeded?: boolean;
}

export function SupplierSidebar({
  suppliers,
  selectedId,
  onSelect,
  onCreated,
  onError,
  setupNeeded = false,
}: SupplierSidebarProps) {
  const token = useAuthStore((s) => s.token);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [savingDelete, setSavingDelete] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = suppliers.filter((supplier) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      supplier.name.toLowerCase().includes(q) ||
      supplier.phone.toLowerCase().includes(q)
    );
  });
  const paged = paginateSuppliers(filtered, page);
  const firstVisible = paged.total === 0 ? 0 : (paged.page - 1) * paged.pageSize + 1;
  const lastVisible = Math.min(paged.page * paged.pageSize, paged.total);

  const openCreate = () => {
    if (setupNeeded) return;
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    if (setupNeeded) return;
    setEditing(supplier);
    setFormOpen(true);
  };

  const openDelete = (supplier: Supplier) => {
    if (setupNeeded) return;
    setDeleting(supplier);
    setDeleteOpen(true);
  };

  const handleSaved = () => {
    setFormOpen(false);
    setEditing(null);
    setPage(1);
    onCreated();
  };

  const handleConfirmDelete = async () => {
    if (!deleting || !token || setupNeeded) return;
    setSavingDelete(true);
    try {
      await deleteSupplierAction(token, deleting.id);
      toast.success("Proveedor eliminado");
      setDeleteOpen(false);
      setDeleting(null);
      setPage(1);
      onCreated();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el proveedor";
      onError(message);
    } finally {
      setSavingDelete(false);
    }
  };

  return (
    <>
      <Card className="h-fit">
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Proveedores</CardTitle>
            <Button size="sm" onClick={openCreate} disabled={setupNeeded || !token}>
              <Plus className="mr-2 h-4 w-4" />
              Proveedor
            </Button>
          </div>
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar proveedor..."
            aria-label="Buscar proveedor"
          />
        </CardHeader>
        <CardContent className="space-y-2">
          {paged.items.map((supplier) => {
            const selected = supplier.id === selectedId;
            return (
              <div
                key={supplier.id}
                className={`rounded-lg border p-3 transition-colors ${
                  selected ? "bg-emerald-50 border-emerald-200" : "hover:bg-muted/40"
                }`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onSelect(supplier.id)}
                >
                  <p className="font-medium leading-tight">{supplier.name}</p>
                  <p className="text-sm text-muted-foreground">{supplier.phone}</p>
                </button>
                <div className="mt-3 flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(supplier)}
                    disabled={setupNeeded || !token}
                    aria-label={`Editar ${supplier.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => openDelete(supplier)}
                    disabled={setupNeeded || !token}
                    aria-label={`Eliminar ${supplier.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {suppliers.length === 0
                ? "No hay proveedores registrados."
                : "No se encontraron proveedores."}
            </p>
          )}
        </CardContent>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-6 py-3">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {paged.total === 0
              ? "Sin proveedores"
              : `${firstVisible}–${lastVisible} de ${paged.total} · Página ${paged.page} de ${paged.totalPages}`}
          </p>
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(1)}
              disabled={!paged.hasPrevious}
              aria-label="Primera página"
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(paged.page - 1)}
              disabled={!paged.hasPrevious}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(paged.page + 1)}
              disabled={!paged.hasNext}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(paged.totalPages)}
              disabled={!paged.hasNext}
              aria-label="Última página"
            >
              <ChevronLast className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <SupplierForm
        key={`${formOpen ? "open" : "closed"}-${editing?.id ?? "new"}`}
        open={formOpen}
        supplier={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        setupNeeded={setupNeeded}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. «{deleting?.name}» será eliminado
              del listado de proveedores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={savingDelete || setupNeeded || !token}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {savingDelete ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
