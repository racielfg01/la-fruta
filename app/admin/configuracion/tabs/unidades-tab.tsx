"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Scale, Loader2 } from "lucide-react";
import {
  getUnitsAction,
  createUnitAction,
  updateUnitAction,
  deleteUnitAction,
  type UnitRow,
} from "@/app/actions/admin-extras";

const empty: Omit<UnitRow, "id" | "productsCount"> = { name: "", active: true };

export default function UnidadesTab() {
  const token = useAuthStore((s) => s.token);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<UnitRow | null>(null);
  const [form, setForm] = useState<Omit<UnitRow, "id" | "productsCount">>(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const data = await getUnitsAction(token);
    setUnits(data);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setDialog(true);
  };
  const openEdit = (u: UnitRow) => {
    setEditing(u);
    setForm({ name: u.name, active: u.active });
    setDialog(true);
  };
  const save = async () => {
    if (!token || !form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) await updateUnitAction(editing.id, form, token);
      else await createUnitAction(form, token);
      setDialog(false);
      toast.success(editing ? "Unidad actualizada" : "Unidad creada");
      load();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo guardar la unidad");
    } finally {
      setSaving(false);
    }
  };
  const toggleActive = async (u: UnitRow, active: boolean) => {
    if (!token) return;
    try {
      await updateUnitAction(u.id, { active }, token);
      load();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo actualizar la unidad");
    }
  };
  const remove = async (u: UnitRow) => {
    if (!token) return;
    const extra =
      u.productsCount > 0
        ? ` ${u.productsCount} producto(s) la usan y conservarán su texto.`
        : "";
    if (!confirm(`¿Eliminar la unidad "${u.name}"?${extra}`)) return;
    try {
      await deleteUnitAction(u.id, token);
      toast.success("Unidad eliminada");
      load();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo eliminar la unidad");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Unidades</h2>
        <p className="text-muted-foreground">
          Unidades de venta de los productos. Se muestran junto al precio
          (por ejemplo, «/ por kg»).
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Unidad
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unidades ({units.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-center">Activo</TableHead>
                  <TableHead className="text-center">Productos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((u) => (
                  <TableRow key={u.id} className={u.active ? "" : "opacity-60"}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        {u.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={u.active}
                        onCheckedChange={(v) => toggleActive(u, v)}
                      />
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {u.productsCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => remove(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {units.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No hay unidades creadas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Unidad" : "Nueva Unidad"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: por kg"
              />
            </Field>
            {editing && (
              <p className="text-xs text-muted-foreground">
                Si cambias el nombre, los productos que usan esta unidad pasan al
                nuevo nombre.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={!form.name.trim() || saving}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
