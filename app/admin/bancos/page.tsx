"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Landmark,
  Copy,
} from "lucide-react";
import {
  getBanksAction,
  createBankAction,
  updateBankAction,
  deleteBankAction,
  getBankAccountsAction,
  createBankAccountAction,
  updateBankAccountAction,
  deleteBankAccountAction,
} from "@/app/actions/admin-extras";

interface Bank { id: string; name: string; active: boolean }
interface Account {
  id: string; bank: string; accountNumber: string; accountType: string;
  owner: string; ci: string; currency: string; active: boolean;
  transferLimit: number; transferCount: number;
}
const emptyAccount = {
  bank: "", accountNumber: "", accountType: "", owner: "", ci: "",
  currency: "CUP", active: true, transferLimit: 0, transferCount: 0,
};

export default function BancosPage() {
  const token = useAuthStore((s) => s.token);
  const [tab, setTab] = useState("bancos");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [bankDialog, setBankDialog] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [bankName, setBankName] = useState("");
  const [bankActive, setBankActive] = useState(true);

  const [accDialog, setAccDialog] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [accForm, setAccForm] = useState<any>(emptyAccount);

  const load = useCallback(async () => {
    if (!token) return;
    const [b, a] = await Promise.all([getBanksAction(token), getBankAccountsAction(token)]);
    setBanks(b);
    setAccounts(a);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const openNewBank = () => { setEditingBank(null); setBankName(""); setBankActive(true); setBankDialog(true); };
  const openEditBank = (b: Bank) => { setEditingBank(b); setBankName(b.name); setBankActive(b.active); setBankDialog(true); };
  const saveBank = async () => {
    if (!token || !bankName.trim()) return;
    if (editingBank) await updateBankAction(editingBank.id, { name: bankName.trim(), active: bankActive }, token);
    else await createBankAction(bankName.trim(), token);
    setBankDialog(false); load();
  };
  const removeBank = async (id: string) => {
    if (!token || !confirm("¿Eliminar este banco? Las cuentas asociadas se eliminan.")) return;
    await deleteBankAction(id, token); load();
  };

  const openNewAcc = () => { setEditingAcc(null); setAccForm(emptyAccount); setAccDialog(true); };
  const openEditAcc = (a: Account) => { setEditingAcc(a); setAccForm({ ...a }); setAccDialog(true); };
  const saveAcc = async () => {
    if (!token || !accForm.accountNumber.trim() || !accForm.bank) return;
    if (editingAcc) await updateBankAccountAction(editingAcc.id, accForm, token);
    else await createBankAccountAction(accForm, token);
    setAccDialog(false); load();
  };
  const removeAcc = async (id: string) => {
    if (!token || !confirm("¿Eliminar esta cuenta bancaria?")) return;
    await deleteBankAccountAction(id, token); load();
  };
  const copyNum = async (n: string) => {
    try { await navigator.clipboard.writeText(n); } catch { /* noop */ }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bancos y Cuentas</h2>
        <p className="text-muted-foreground">
          Cuentas para transferencias: el límite desactiva la cuenta automáticamente
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="bancos">Bancos</TabsTrigger>
          <TabsTrigger value="cuentas">Cuentas bancarias</TabsTrigger>
        </TabsList>

        <TabsContent value="bancos" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewBank}><Plus className="mr-2 h-4 w-4" /> Nuevo Banco</Button>
          </div>
          <Card>
            <CardHeader><CardTitle>Bancos ({banks.length})</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Nombre</TableHead><TableHead>Activo</TableHead><TableHead className="text-right">Acciones</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {banks.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium"><span className="flex items-center gap-2"><Landmark className="h-4 w-4 text-primary" />{b.name}</span></TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${b.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {b.active ? "Activo" : "Inactivo"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditBank(b)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeBank(b.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {banks.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No hay bancos creados</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cuentas" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewAcc}><Plus className="mr-2 h-4 w-4" /> Nueva Cuenta</Button>
          </div>
          <Card>
            <CardHeader><CardTitle>Cuentas ({accounts.length})</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Banco</TableHead><TableHead>Cuenta</TableHead><TableHead>Moneda</TableHead>
                    <TableHead>Transferencias</TableHead><TableHead>Límite</TableHead><TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {accounts.map((a) => {
                      const full = a.transferLimit > 0 && a.transferCount >= a.transferLimit;
                      return (
                        <TableRow key={a.id}>
                          <TableCell>{a.bank}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 font-mono text-sm">
                              {a.accountNumber}
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyNum(a.accountNumber)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </span>
                          </TableCell>
                          <TableCell>{a.currency}</TableCell>
                          <TableCell>{a.transferCount}</TableCell>
                          <TableCell>{a.transferLimit || "∞"}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${!a.active || full ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                              {full ? "Límite alcanzado" : a.active ? "Activa" : "Inactiva"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditAcc(a)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeAcc(a.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {accounts.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay cuentas creadas</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bank dialog */}
      <Dialog open={bankDialog} onOpenChange={setBankDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingBank ? "Editar Banco" : "Nuevo Banco"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Field><FieldLabel>Nombre</FieldLabel>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ej: Banco de Crédito y Comercio (BANDEC)" />
            </Field>
            <div className="flex items-center justify-between">
              <Label>¿Activo?</Label>
              <Switch checked={bankActive} onCheckedChange={setBankActive} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBankDialog(false)}>Cancelar</Button>
            <Button onClick={saveBank} disabled={!bankName.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account dialog */}
      <Dialog open={accDialog} onOpenChange={setAccDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAcc ? "Editar Cuenta" : "Nueva Cuenta"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Field><FieldLabel>Banco</FieldLabel>
              <Select value={accForm.bank} onValueChange={(v) => setAccForm({ ...accForm, bank: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona el banco" /></SelectTrigger>
                <SelectContent>
                  {banks.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field><FieldLabel>Número de cuenta</FieldLabel>
                <Input value={accForm.accountNumber} onChange={(e) => setAccForm({ ...accForm, accountNumber: e.target.value })} />
              </Field>
              <Field><FieldLabel>Tipo</FieldLabel>
                <Input value={accForm.accountType} onChange={(e) => setAccForm({ ...accForm, accountType: e.target.value })} placeholder="Ej: Cuenta Corriente" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field><FieldLabel>Titular</FieldLabel>
                <Input value={accForm.owner} onChange={(e) => setAccForm({ ...accForm, owner: e.target.value })} />
              </Field>
              <Field><FieldLabel>CI / RUC</FieldLabel>
                <Input value={accForm.ci} onChange={(e) => setAccForm({ ...accForm, ci: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field><FieldLabel>Moneda</FieldLabel>
                <Select value={accForm.currency} onValueChange={(v) => setAccForm({ ...accForm, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUP">CUP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field><FieldLabel>Límite de transferencias (0 = ilimitado)</FieldLabel>
                <Input type="number" value={accForm.transferLimit} onChange={(e) => setAccForm({ ...accForm, transferLimit: Number(e.target.value) || 0 })} />
              </Field>
            </div>
            <div className="flex items-center justify-between">
              <Label>¿Activa?</Label>
              <Switch checked={accForm.active} onCheckedChange={(v) => setAccForm({ ...accForm, active: v })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAccDialog(false)}>Cancelar</Button>
            <Button onClick={saveAcc} disabled={!accForm.accountNumber.trim() || !accForm.bank}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}