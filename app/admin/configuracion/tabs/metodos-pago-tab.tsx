"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/auth-context";
import { useAdminStore } from "@/lib/admin-store";
import {
  getPaymentMethodsAction,
  createPaymentMethodAction,
  updatePaymentMethodAction,
  deletePaymentMethodAction,
  type PaymentMethodRow,
} from "@/app/actions/admin-extras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { ImageUpload } from "@/components/upload-button";
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  name: "",
  type: "cash" as "cash" | "transfer",
  image: "",
  currency: "USD",
  accountNumber: "",
  accountType: "",
  owner: "",
  requiresReceipt: false,
  instructions: "",
  transferLimit: 0,
  transferCount: 0,
  active: true,
  sort: 0,
};

export default function MetodosPagoTab() {
  const token = useAuthStore((s) => s.token);
  const { currencies } = useAdminStore();
  const [methods, setMethods] = useState<PaymentMethodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<PaymentMethodRow | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const rows = await getPaymentMethodsAction(token);
      setMethods(rows);
    } catch {
      toast.error("No se pudieron cargar los métodos de pago");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort: methods.length + 1 });
    setDialog(true);
  };

  const openEdit = (m: PaymentMethodRow) => {
    setEditing(m);
    setForm({ ...m });
    setDialog(true);
  };

  const save = async () => {
    if (!token || !form.name?.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updatePaymentMethodAction(editing.id, form, token);
        toast.success("Método actualizado");
      } else {
        await createPaymentMethodAction(form, token);
        toast.success("Método creado");
      }
      setDialog(false);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (m: PaymentMethodRow, active: boolean) => {
    if (!token) return;
    try {
      await updatePaymentMethodAction(m.id, { active }, token);
      setMethods((prev) => prev.map((x) => (x.id === m.id ? { ...x, active } : x)));
    } catch {
      toast.error("No se pudo actualizar");
    }
  };

  const remove = async (id: string) => {
    if (!token || !confirm("¿Eliminar este método de pago?")) return;
    try {
      await deletePaymentMethodAction(id, token);
      setMethods((prev) => prev.filter((x) => x.id !== id));
      toast.success("Método eliminado");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const activeCurrencyCodes = currencies.filter((c: any) => c.isActive).map((c: any) => c.code);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Métodos de pago</h2>
          <p className="text-muted-foreground">
            Crea, activa o desactiva los métodos que verá el cliente al pagar.
          </p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nuevo método</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado ({methods.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagen</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map((m) => (
                  <TableRow key={m.id} className={m.active ? "" : "opacity-60"}>
                    <TableCell>
                      {m.image ? (
                        <img src={m.image} alt={m.name} className="h-8 w-8 rounded border bg-white object-contain p-0.5" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{m.name}</div>
                      {m.type === "transfer" && m.accountNumber && (
                        <div className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                          {m.accountNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{m.type === "cash" ? "Efectivo" : "Transferencia"}</TableCell>
                    <TableCell>{m.currency}</TableCell>
                    <TableCell>{m.requiresReceipt ? "Sí" : "No"}</TableCell>
                    <TableCell>
                      <Switch checked={m.active} onCheckedChange={(v) => toggleActive(m, v)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {methods.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay métodos de pago. Crea uno para que el cliente pueda pagar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {methods.filter(m => m.active).length === 0 && methods.length > 0 && (
            <p className="mt-3 text-sm text-amber-700">Todos los métodos están desactivados: el cliente no podrá pagar.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar método" : "Nuevo método de pago"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Zelle, Efectivo USD" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Tipo</FieldLabel>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Moneda</FieldLabel>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(activeCurrencyCodes.length ? activeCurrencyCodes : ["USD", "CUP"]).map((code: string) => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel>Imagen / logo</FieldLabel>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="URL o sube una imagen" className="flex-1" />
                  <ImageUpload endpoint="paymentMethodLogo" onUploadComplete={(url) => setForm((p: any) => ({ ...p, image: url }))} />
                </div>
                {form.image && (
                  <img src={form.image} alt="Vista previa" className="h-16 w-auto rounded border bg-white object-contain p-1" />
                )}
              </div>
            </Field>

            {form.type === "transfer" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Número de cuenta / teléfono / wallet</FieldLabel>
                    <Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
                  </Field>
                  <Field>
                    <FieldLabel>Tipo de cuenta (opcional)</FieldLabel>
                    <Input value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })} placeholder="Ej: BEP-20" />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>Titular</FieldLabel>
                  <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel>Instrucciones (opcional)</FieldLabel>
                  <Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Ej: Enviar y adjuntar comprobante" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Límite de transferencias (0 = sin límite)</FieldLabel>
                    <Input type="number" value={form.transferLimit} onChange={(e) => setForm({ ...form, transferLimit: Number(e.target.value) || 0 })} />
                  </Field>
                  <div className="flex items-center justify-between pt-6">
                    <Label>Requiere comprobante</Label>
                    <Switch checked={form.requiresReceipt} onCheckedChange={(v) => setForm({ ...form, requiresReceipt: v })} />
                  </div>
                </div>
              </>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Orden</FieldLabel>
                <Input type="number" value={form.sort} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) || 0 })} />
              </Field>
              <div className="flex items-center justify-between pt-6">
                <Label>Activo</Label>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialog(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.name?.trim()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
