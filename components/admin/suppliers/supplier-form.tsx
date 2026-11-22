"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createSupplierAction,
  updateSupplierAction,
} from "@/app/actions/suppliers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/auth-context";
import { validateSupplierInput, type Supplier } from "@/lib/suppliers";

interface SupplierFormProps {
  open: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onSaved: () => void;
  setupNeeded?: boolean;
}

export function SupplierForm({
  open,
  supplier,
  onClose,
  onSaved,
  setupNeeded = false,
}: SupplierFormProps) {
  const token = useAuthStore((s) => s.token);
  const [name, setName] = useState(supplier?.name ?? "");
  const [phone, setPhone] = useState(supplier?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setupNeeded || !token || saving) return;

    let input: { name: string; phone: string };
    try {
      input = validateSupplierInput({ name, phone });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Revisa los datos del proveedor"
      );
      return;
    }

    setSaving(true);
    try {
      if (supplier) {
        await updateSupplierAction(token, supplier.id, input);
        toast.success("Proveedor actualizado");
      } else {
        await createSupplierAction(token, input);
        toast.success("Proveedor creado");
      }
      onSaved();
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el proveedor"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {supplier ? "Editar proveedor" : "Nuevo proveedor"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="supplierName">Nombre</FieldLabel>
            <Input
              id="supplierName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Distribuidora La Esperanza"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="supplierPhone">Teléfono</FieldLabel>
            <Input
              id="supplierPhone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: 5555 1234"
              required
            />
          </Field>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving || setupNeeded || !token}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {supplier ? "Guardar cambios" : "Crear proveedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
