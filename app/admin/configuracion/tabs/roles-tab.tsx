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
import { Plus, Pencil, Trash2, ShieldCheck, Loader2 } from "lucide-react";
import {
  getRolesAction,
  createRoleAction,
  updateRoleAction,
  deleteRoleAction,
} from "@/app/actions/admin-extras";

interface Role { id: string; name: string; [k: string]: any }

export default function RolesPage() {
  const token = useAuthStore((s) => s.token);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    const data = await getRolesAction(token);
    setRoles(data.map((r: any) => ({ id: r.id, name: r.name })));
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const openNew = () => { setEditing(null); setName(""); setDialog(true); };
  const openEdit = (r: Role) => { setEditing(r); setName(r.name); setDialog(true); };
  const save = async () => {
    if (!token || !name.trim()) return;
    if (editing) await updateRoleAction(editing.id, name.trim(), token);
    else await createRoleAction(name.trim(), token);
    setDialog(false);
    load();
  };
  const remove = async (id: string) => {
    if (!token || !confirm("¿Eliminar este rol?")) return;
    await deleteRoleAction(id, token);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Roles</h2>
        <p className="text-muted-foreground">
          Roles del sistema (ej: admin, client)
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nuevo Rol</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Roles ({roles.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {roles.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />{r.name}</span></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {roles.length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No hay roles creados</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Rol" : "Nuevo Rol"}</DialogTitle></DialogHeader>
          <Field>
            <FieldLabel>Nombre</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: admin" />
          </Field>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialog(false)}>Cancelar</Button>
            <Button onClick={save} disabled={!name.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}