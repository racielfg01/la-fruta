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
import { Plus, Pencil, Trash2, Globe, Loader2 } from "lucide-react";
import {
  getCountriesAction,
  createCountryAction,
  updateCountryAction,
  deleteCountryAction,
} from "@/app/actions/admin-extras";

interface Country { id: string; name: string; code: string; phoneCode: string; currencyCode: string }
const empty: Omit<Country, "id"> = { name: "", code: "", phoneCode: "", currencyCode: "" };

export default function PaisesPage() {
  const token = useAuthStore((s) => s.token);
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
  const openEdit = (c: Country) => { setEditing(c); setForm({ name: c.name, code: c.code, phoneCode: c.phoneCode, currencyCode: c.currencyCode }); setDialog(true); };
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
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Moneda</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {countries.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium"><span className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />{c.name}</span></TableCell>
                    <TableCell className="uppercase">{c.code}</TableCell>
                    <TableCell className="font-mono">+{c.phoneCode}</TableCell>
                    <TableCell>{c.currencyCode}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
            <Field><FieldLabel>Nombre</FieldLabel>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Cuba" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field><FieldLabel>Código</FieldLabel>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CU" />
              </Field>
              <Field><FieldLabel>Código tel.</FieldLabel>
                <Input value={form.phoneCode} onChange={(e) => setForm({ ...form, phoneCode: e.target.value })} placeholder="53" />
              </Field>
              <Field><FieldLabel>Moneda</FieldLabel>
                <Input value={form.currencyCode} onChange={(e) => setForm({ ...form, currencyCode: e.target.value })} placeholder="CUP" />
              </Field>
            </div>
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