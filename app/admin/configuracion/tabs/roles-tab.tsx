"use client";

import { useState } from "react";
import { useAdminStore, Role, RolePermissions, ALL_PERMISSIONS, NO_PERMISSIONS } from "@/lib/admin-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Shield, LayoutDashboard, ShoppingBag, Package, Truck, Users, Cog, Check, X } from "lucide-react";

const PERMISSION_KEYS: { key: keyof RolePermissions; label: string; icon: any }[] = [
  { key: "dashboard", label: "Panel Principal", icon: LayoutDashboard },
  { key: "orders", label: "Órdenes", icon: ShoppingBag },
  { key: "products", label: "Productos", icon: Package },
  { key: "shipping", label: "Envíos", icon: Truck },
  { key: "users", label: "Usuarios", icon: Users },
  { key: "settings", label: "Configuración", icon: Cog },
];

function PermissionsBadge({ permissions }: { permissions?: RolePermissions }) {
  if (!permissions) return <span className="text-xs text-muted-foreground">Sin permisos</span>;
  const count = Object.values(permissions).filter(Boolean).length;
  return (
    <span className="text-xs text-muted-foreground">
      {count}/{PERMISSION_KEYS.length} secciones
    </span>
  );
}

export default function RolesTab() {
  const { roles, addRole, updateRole, deleteRole } = useAdminStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<RolePermissions>({ ...ALL_PERMISSIONS });
  const [toDelete, setToDelete] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setPermissions({ ...ALL_PERMISSIONS });
    setDialogOpen(true);
  };

  const openEdit = (r: Role) => {
    setEditing(r);
    setName(r.name);
    setDescription(r.description);
    setPermissions(r.permissions ? { ...r.permissions } : { ...ALL_PERMISSIONS });
    setDialogOpen(true);
  };

  const togglePermission = (key: keyof RolePermissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = (value: boolean) => {
    setPermissions(value ? { ...ALL_PERMISSIONS } : { ...NO_PERMISSIONS });
  };

  const allChecked = Object.values(permissions).every(Boolean);
  const someChecked = Object.values(permissions).some(Boolean) && !allChecked;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) {
      updateRole(editing.id, { name: name.trim(), description: description.trim(), permissions });
    } else {
      addRole({
        id: crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 10),
        name: name.trim(),
        description: description.trim(),
        permissions,
      });
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Roles ({roles.length})</CardTitle>
          <Button size="sm" onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" /> Nuevo
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rol</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Permisos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      {r.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.description || "—"}</TableCell>
                  <TableCell>
                    <PermissionsBadge permissions={r.permissions} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => { setToDelete(r.id); setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {roles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No hay roles registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Moderador"
                required
              />
            </Field>
            <Field>
              <FieldLabel>Descripción</FieldLabel>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Acceso limitado a órdenes"
              />
            </Field>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel>Permisos de acceso</FieldLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => toggleAll(!allChecked)}
                >
                  {allChecked ? (
                    <><X className="mr-1 h-3 w-3" /> Quitar todos</>
                  ) : (
                    <><Check className="mr-1 h-3 w-3" /> Seleccionar todos</>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PERMISSION_KEYS.map(({ key, label, icon: Icon }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      permissions[key]
                        ? "bg-primary/5 border-primary/20"
                        : "bg-muted/30 border-border hover:bg-muted/50"
                    }`}
                  >
                    <Switch
                      checked={permissions[key]}
                      onCheckedChange={() => togglePermission(key)}
                    />
                    <Icon className={`h-4 w-4 shrink-0 ${permissions[key] ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm ${permissions[key] ? "font-medium" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">{editing ? "Guardar" : "Crear"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
            <AlertDialogDescription>
              Los usuarios con este rol perderán acceso a las secciones configuradas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) deleteRole(toDelete);
                setToDelete(null);
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
