"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Pencil, Trash2, MapPin, Loader2 } from "lucide-react";
import {
  getProvincesAction,
  createProvinceAction,
  updateProvinceAction,
  deleteProvinceAction,
  getMunicipalitiesAction,
  createMunicipalityAction,
  updateMunicipalityAction,
  deleteMunicipalityAction,
} from "@/app/actions/admin-extras";

export default function UbicacionesPage() {
  const token = useAuthStore((s) => s.token);
  const [tab, setTab] = useState("provincias");
  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [municipalities, setMunicipalities] = useState<{ id: string; name: string; province: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Provincias dialog
  const [provDialog, setProvDialog] = useState(false);
  const [editingProv, setEditingProv] = useState<{ id: string; name: string } | null>(null);
  const [provName, setProvName] = useState("");

  // Municipios dialog
  const [munDialog, setMunDialog] = useState(false);
  const [editingMun, setEditingMun] = useState<{ id: string; name: string; province: string } | null>(null);
  const [munName, setMunName] = useState("");
  const [munProvince, setMunProvince] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    const [p, m] = await Promise.all([
      getProvincesAction(token),
      getMunicipalitiesAction(token),
    ]);
    setProvinces(p);
    setMunicipalities(m);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const resetProv = () => {
    setEditingProv(null);
    setProvName("");
  };
  const openNewProv = () => {
    resetProv();
    setProvDialog(true);
  };
  const openEditProv = (p: { id: string; name: string }) => {
    setEditingProv(p);
    setProvName(p.name);
    setProvDialog(true);
  };
  const saveProv = async () => {
    if (!token || !provName.trim()) return;
    if (editingProv) await updateProvinceAction(editingProv.id, provName.trim(), token);
    else await createProvinceAction(provName.trim(), token);
    setProvDialog(false);
    resetProv();
    load();
  };
  const removeProv = async (id: string) => {
    if (!token || !confirm("¿Eliminar esta provincia?")) return;
    await deleteProvinceAction(id, token);
    load();
  };

  const resetMun = () => {
    setEditingMun(null);
    setMunName("");
    setMunProvince("");
  };
  const openNewMun = () => {
    resetMun();
    setMunDialog(true);
  };
  const openEditMun = (m: { id: string; name: string; province: string }) => {
    setEditingMun(m);
    setMunName(m.name);
    setMunProvince(m.province);
    setMunDialog(true);
  };
  const saveMun = async () => {
    if (!token || !munName.trim() || !munProvince) return;
    if (editingMun) await updateMunicipalityAction(editingMun.id, { name: munName.trim(), province: munProvince }, token);
    else await createMunicipalityAction({ name: munName.trim(), province: munProvince }, token);
    setMunDialog(false);
    resetMun();
    load();
  };
  const removeMun = async (id: string) => {
    if (!token || !confirm("¿Eliminar este municipio?")) return;
    await deleteMunicipalityAction(id, token);
    load();
  };

  const provNameOf = (id: string) => provinces.find((p) => p.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Ubicaciones</h2>
        <p className="text-muted-foreground">
          Gestiona provincias y municipios para la entrega por zonas
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="provincias">Provincias</TabsTrigger>
          <TabsTrigger value="municipios">Municipios</TabsTrigger>
        </TabsList>

        <TabsContent value="provincias" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewProv}>
              <Plus className="mr-2 h-4 w-4" /> Nueva Provincia
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Provincias ({provinces.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {provinces.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditProv(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeProv(p.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {provinces.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                          No hay provincias creadas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="municipios" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewMun}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Municipio
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Municipios ({municipalities.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Provincia</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {municipalities.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {provNameOf(m.province)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditMun(m)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeMun(m.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {municipalities.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No hay municipios creados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Province dialog */}
      <Dialog open={provDialog} onOpenChange={setProvDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProv ? "Editar Provincia" : "Nueva Provincia"}</DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel>Nombre</FieldLabel>
            <Input value={provName} onChange={(e) => setProvName(e.target.value)} placeholder="Ej: La Habana" />
          </Field>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setProvDialog(false)}>Cancelar</Button>
            <Button onClick={saveProv} disabled={!provName.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Municipality dialog */}
      <Dialog open={munDialog} onOpenChange={setMunDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMun ? "Editar Municipio" : "Nuevo Municipio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field>
              <FieldLabel>Provincia</FieldLabel>
              <Select value={munProvince} onValueChange={setMunProvince}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la provincia" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input value={munName} onChange={(e) => setMunName(e.target.value)} placeholder="Ej: Plaza de la Revolución" />
            </Field>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMunDialog(false)}>Cancelar</Button>
            <Button onClick={saveMun} disabled={!munName.trim() || !munProvince}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}