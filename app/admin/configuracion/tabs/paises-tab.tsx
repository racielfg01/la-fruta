"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Globe, Loader2 } from "lucide-react";
import {
  getCountriesAction,
  createCountryAction,
  updateCountryAction,
  deleteCountryAction,
} from "@/app/actions/admin-extras";
import { useAdminStore } from "@/lib/admin-store";

interface Country { id: string; name: string; code: string; phoneCode: string; currencyCode: string; emoji: string }
const empty: Omit<Country, "id"> = { name: "", code: "", phoneCode: "", currencyCode: "", emoji: "" };

export default function PaisesPage() {
  const token = useAuthStore((s) => s.token);
  const { currencies } = useAdminStore();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [form, setForm] = useState<Omit<Country, "id">>(empty);

  const load = useCallback(async () => {
    if (!token) return;
    const data = await getCountriesAction(token);
    setCountries(data);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const openNew = () => { setEditing(null); setForm(empty); setDialog(true); };
  const openEdit = (c: Country) => {
    setEditing(c);
    setForm({ name: c.name, code: c.code, phoneCode: c.phoneCode, currencyCode: c.currencyCode, emoji: c.emoji });
    setDialog(true);
  };
  const save = async () => {
    if (!token || !form.name.trim()) return;
    if (editing) await updateCountryAction(editing.id, form, token);
    else await createCountryAction(form, token);
    setDialog(false);
    load();
  };
  const remove = async (id: string) => {
    if (!token || !confirm("¿Eliminar este país?")) return;
    await deleteCountryAction(id, token);
    load();
  };

  const applyFlag = (code: string) => {
    setForm((f) => ({ ...f, code: code.toUpperCase() }));
  };

  const linkedCurrencies = (currencyCode: string) => {
    if (!currencyCode) return null;
    const c = currencies.find((cu: any) => {
      const cuCode = cu.code ?? cu.currency_code;
      return cuCode?.toUpperCase() === currencyCode.toUpperCase();
    });
    return c || null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Países</h2>
        <p className="text-muted-foreground">
          El código telefónico preselecciona la moneda del cliente (ej: +53 → CUP)
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nuevo País</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Países ({countries.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>País</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Moneda</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {countries.map((c) => {
                  const linked = linkedCurrencies(c.currencyCode);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          {c.emoji ? (
                            <span className="text-xl leading-none">{c.emoji}</span>
                          ) : (
                            <Globe className="h-4 w-4 text-primary" />
                          )}
                          {c.name}
                        </span>
                      </TableCell>
                      <TableCell className="uppercase">{c.code}</TableCell>
                      <TableCell className="font-mono">+{c.phoneCode}</TableCell>
                      <TableCell>
                        {linked ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            <span>{(linked as any).symbol || "$"}</span>
                            {c.currencyCode}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{c.currencyCode || "—"}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {countries.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay países creados</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar País" : "Nuevo País"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <Field className="flex-1">
                <FieldLabel>Nombre</FieldLabel>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Cuba" />
              </Field>
              <Field>
                <FieldLabel>Bandera</FieldLabel>
                <Input
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  placeholder="🇨🇺"
                  className="w-16 text-center text-xl"
                  maxLength={4}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field><FieldLabel>Código</FieldLabel>
                <Input
                  value={form.code}
                  onChange={(e) => applyFlag(e.target.value)}
                  onBlur={(e) => applyFlag(e.target.value)}
                  placeholder="CU"
                  maxLength={2}
                />
              </Field>
              <Field><FieldLabel>Código tel.</FieldLabel>
                <Input value={form.phoneCode} onChange={(e) => setForm({ ...form, phoneCode: e.target.value })} placeholder="53" />
              </Field>
              <Field><FieldLabel>Moneda (ISO)</FieldLabel>
                <Input
                  value={form.currencyCode}
                  onChange={(e) => setForm({ ...form, currencyCode: e.target.value.toUpperCase() })}
                  placeholder="CUP"
                  maxLength={3}
                />
              </Field>
            </div>
            {form.currencyCode && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Moneda enlazada:</span>
                {linkedCurrencies(form.currencyCode) ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {(linkedCurrencies(form.currencyCode) as any)?.symbol} {form.currencyCode}
                  </span>
                ) : (
                  <span className="text-amber-600">No existe en el sistema de monedas</span>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialog(false)}>Cancelar</Button>
            <Button onClick={save} disabled={!form.name.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
