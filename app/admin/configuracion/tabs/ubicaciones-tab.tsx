"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, MapPin, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import {
  getProvincesAction,
  createProvinceAction,
  updateProvinceAction,
  deleteProvinceAction,
  toggleProvinceAction,
  getMunicipalitiesAction,
  createMunicipalityAction,
  updateMunicipalityAction,
  deleteMunicipalityAction,
  toggleMunicipalityAction,
} from "@/app/actions/admin-extras";

type Province = { id: string; name: string; active: boolean };
type Municipality = { id: string; name: string; province: string; active: boolean };

export default function UbicacionesPage() {
  const token = useAuthStore((s) => s.token);
  const [tab, setTab] = useState("provincias");
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProvs, setExpandedProvs] = useState<Set<string>>(new Set());

  const [provDialog, setProvDialog] = useState(false);
  const [editingProv, setEditingProv] = useState<Province | null>(null);
  const [provName, setProvName] = useState("");

  const [munDialog, setMunDialog] = useState(false);
  const [editingMun, setEditingMun] = useState<Municipality | null>(null);
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

  const grouped = useMemo(() => {
    const map = new Map<string, { province: Province; muns: Municipality[] }>();
    for (const p of provinces) {
      map.set(p.id, { province: p, muns: [] });
    }
    for (const m of municipalities) {
      const group = map.get(m.province);
      if (group) group.muns.push(m);
    }
    return Array.from(map.values());
  }, [provinces, municipalities]);

  const toggleExpand = (id: string) => {
    setExpandedProvs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleProvActive = async (p: Province) => {
    if (!token) return;
    await toggleProvinceAction(p.id, !p.active, token);
    load();
  };

  const toggleMunActive = async (m: Municipality) => {
    if (!token) return;
    await toggleMunicipalityAction(m.id, !m.active, token);
    load();
  };

  const provNameOf = (id: string) => provinces.find((p) => p.id === id)?.name || id;

  // Province CRUD
  const resetProv = () => { setEditingProv(null); setProvName(""); };
  const openNewProv = () => { resetProv(); setProvDialog(true); };
  const openEditProv = (p: Province) => { setEditingProv(p); setProvName(p.name); setProvDialog(true); };
  const saveProv = async () => {
    if (!token || !provName.trim()) return;
    if (editingProv) await updateProvinceAction(editingProv.id, provName.trim(), token);
    else await createProvinceAction(provName.trim(), token);
    setProvDialog(false);
    resetProv();
    load();
  };
  const removeProv = async (id: string) => {
    if (!token || !confirm("¿Eliminar esta provincia y sus municipios?")) return;
    await deleteProvinceAction(id, token);
    load();
  };

  // Municipality CRUD
  const resetMun = () => { setEditingMun(null); setMunName(""); setMunProvince(""); };
  const openNewMun = (provId?: string) => { resetMun(); if (provId) setMunProvince(provId); setMunDialog(true); };
  const openEditMun = (m: Municipality) => { setEditingMun(m); setMunName(m.name); setMunProvince(m.province); setMunDialog(true); };
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

        {/* ── Provincias ── */}
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
                      <TableHead>Municipios</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {provinces.map((p) => (
                      <TableRow key={p.id} className={!p.active ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {municipalities.filter((m) => m.province === p.id).length}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={p.active}
                            onCheckedChange={() => toggleProvActive(p)}
                          />
                        </TableCell>
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
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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

        {/* ── Municipios agrupados ── */}
        <TabsContent value="municipios" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openNewMun()}>
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
              ) : grouped.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No hay provincias creadas</p>
              ) : (
                <div className="space-y-2">
                  {grouped.map(({ province, muns }) => {
                    const isExpanded = expandedProvs.has(province.id);
                    return (
                      <div key={province.id} className="border rounded-lg overflow-hidden">
                        <div
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${!province.active ? "opacity-50" : ""}`}
                          onClick={() => toggleExpand(province.id)}
                        >
                          <button className="shrink-0 text-muted-foreground">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          <MapPin className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-medium flex-1">{province.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {muns.length} municipio{muns.length !== 1 && "s"}
                          </span>
                          <Switch
                            checked={province.active}
                            onCheckedChange={() => toggleProvActive(province)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={muns.length === 0}
                            title={muns.length === 0 ? "Agrega al menos un municipio para habilitar" : ""}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={(e) => { e.stopPropagation(); openNewMun(province.id); }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {isExpanded && (
                          <div className="border-t">
                            {muns.length === 0 ? (
                              <p className="px-4 py-3 text-sm text-muted-foreground">
                                No hay municipios en esta provincia
                              </p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead className="w-24">Estado</TableHead>
                                    <TableHead className="w-24 text-right">Acciones</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {muns.map((m) => (
                                    <TableRow key={m.id} className={!m.active ? "opacity-50" : ""}>
                                      <TableCell className="font-medium">{m.name}</TableCell>
                                      <TableCell>
                                        <Switch
                                          checked={m.active}
                                          onCheckedChange={() => toggleMunActive(m)}
                                        />
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
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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
                  {provinces.filter((p) => p.active).map((p) => (
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
