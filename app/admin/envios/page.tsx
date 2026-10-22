"use client";

import { useState, useMemo, useEffect } from "react";
import { useAdminStore, DeliveryZone } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Plus,
  Pencil,
  Trash2,
  Truck,
  MapPin,
  Clock,
  DollarSign,
  Info,
  Power,
  PowerOff,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Rows3,
} from "lucide-react";
import { useCurrency } from "@/lib/currency";
import { getPublicLocations } from "@/app/actions/public";

const emptyZone: Omit<DeliveryZone, "id"> = {
  name: "",
  minDistance: 0,
  maxDistance: 0,
  price: 0,
  estimatedTime: "",
  active: true,
};

export default function DeliveryAdmin() {
  const { deliveryZones, addDeliveryZone, updateDeliveryZone, deleteDeliveryZone } =
    useAdminStore();
  const { defaultCurrency, currencies, formatPrice, convertPrice } = useCurrency();
  const cupCurrency = currencies.find((c) => c.code === "CUP") || currencies[0];
  const usdCurrency = currencies.find((c) => c.code === "USD");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [formData, setFormData] = useState(emptyZone);
  const [zoneToDelete, setZoneToDelete] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [municipalities, setMunicipalities] = useState<{ id: string; name: string; id_provincia: string }[]>([]);

  useEffect(() => {
    getPublicLocations().then((loc) => {
      setProvinces(loc.provinces);
      setMunicipalities(loc.municipalities.map((m: any) => ({
        id: m.id,
        name: m.name,
        id_provincia: m.province || m.id_provincia || '',
      })));
    });
  }, []);

  const provinceName = (id?: string) => provinces.find((p) => p.id === id)?.name ?? "";
  const municipalityName = (id?: string) => municipalities.find((m) => m.id === id)?.name ?? "";
  // Las zonas sin ubicación asignada muestran "Sin asignar" en vez de texto vacío.
  const provinceLabel = (id?: string) => provinceName(id) || "Sin provincia asignada";
  const municipalityLabel = (id?: string) => municipalityName(id) || "Sin municipio asignado";

  const activeZones = deliveryZones.filter((z) => z.active);

  const handleNewZone = () => {
    setEditingZone(null);
    setFormData(emptyZone);
    setDialogOpen(true);
  };

  const handleEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      minDistance: zone.minDistance,
      maxDistance: zone.maxDistance,
      price: zone.price,
      estimatedTime: zone.estimatedTime,
      active: zone.active,
      province: zone.province,
      municipality: zone.municipality,
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setZoneToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (zoneToDelete) {
      deleteDeliveryZone(zoneToDelete);
      setZoneToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleToggleActive = (zone: DeliveryZone) => {
    updateDeliveryZone(zone.id, { ...zone, active: !zone.active });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingZone) {
      updateDeliveryZone(editingZone.id, formData);
    } else {
      const newZone: DeliveryZone = {
        ...formData,
        id: Date.now().toString(),
      };
      addDeliveryZone(newZone);
    }
    setDialogOpen(false);
    setFormData(emptyZone);
    setEditingZone(null);
  };

  // ── Grouped data: Province > Municipality > Zones ──
  const groupedZones = useMemo(() => {
    const byProvMun = new Map<string, Map<string, DeliveryZone[]>>();

    for (const z of deliveryZones) {
      const pKey = z.province || "__none";
      const mKey = z.municipality || "__none";
      if (!byProvMun.has(pKey)) byProvMun.set(pKey, new Map());
      const munMap = byProvMun.get(pKey)!;
      if (!munMap.has(mKey)) munMap.set(mKey, []);
      munMap.get(mKey)!.push(z);
    }

    for (const munMap of byProvMun.values()) {
      for (const zones of munMap.values()) {
        zones.sort((a, b) => a.minDistance - b.minDistance);
      }
    }

    const sorted = [...byProvMun.entries()].sort(([a], [b]) => {
      if (a === "__none") return 1;
      if (b === "__none") return -1;
      return provinceName(a).localeCompare(provinceName(b));
    });

    return sorted;
  }, [deliveryZones, provinces]);

  const [openProvinces, setOpenProvinces] = useState<Set<string>>(new Set());
  const [openMunicipalities, setOpenMunicipalities] = useState<Set<string>>(new Set());

  const toggleProvince = (id: string) => {
    setOpenProvinces((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleMunicipality = (key: string) => {
    setOpenMunicipalities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    setOpenProvinces(new Set(groupedZones.map(([k]) => k)));
    const allMun = new Set<string>();
    for (const [, munMap] of groupedZones) {
      for (const mKey of munMap.keys()) allMun.add(mKey);
    }
    setOpenMunicipalities(allMun);
  };

  const collapseAll = () => {
    setOpenProvinces(new Set());
    setOpenMunicipalities(new Set());
  };

  // Stats
  const avgPrice =
    activeZones.length > 0
      ? activeZones.reduce((sum, z) => sum + z.price, 0) / activeZones.length
      : 0;

  const maxCoverage =
    activeZones.length > 0
      ? Math.max(...activeZones.map((z) => z.maxDistance))
      : 0;

  const ZoneRow = ({ zone }: { zone: DeliveryZone }) => (
    <TableRow className={!zone.active ? "opacity-60" : ""}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{zone.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground">
          {zone.minDistance} - {zone.maxDistance} km
        </span>
      </TableCell>
      <TableCell>
        <span className="font-semibold text-primary">
          {formatPrice(zone.price, cupCurrency)}
        </span>
        {usdCurrency && (
          <p className="text-xs text-muted-foreground">USD: {formatPrice(convertPrice(zone.price, cupCurrency, usdCurrency), usdCurrency)}</p>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-4 w-4" />
          {zone.estimatedTime}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={zone.active}
            onCheckedChange={() => handleToggleActive(zone)}
          />
          {zone.active ? (
            <Power className="h-4 w-4 text-green-600" />
          ) : (
            <PowerOff className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEditZone(zone)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(zone.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  const ZoneCard = ({ zone }: { zone: DeliveryZone }) => (
    <Card key={zone.id} className={!zone.active ? "opacity-60" : ""}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium text-sm sm:text-base">{zone.name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
              <p className="text-xs text-muted-foreground">
                {zone.minDistance} - {zone.maxDistance} km
              </p>
              <p className="text-sm font-semibold text-primary">
                {formatPrice(zone.price, cupCurrency)}
              </p>
              {usdCurrency && (
                <p className="text-xs text-muted-foreground">USD: {formatPrice(convertPrice(zone.price, cupCurrency, usdCurrency), usdCurrency)}</p>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {zone.estimatedTime}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Switch
                checked={zone.active}
                onCheckedChange={() => handleToggleActive(zone)}
              />
              {zone.active ? (
                <Power className="h-4 w-4 text-green-600" />
              ) : (
                <PowerOff className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditZone(zone)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(zone.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Precios de Envío</h2>
          <p className="text-muted-foreground">
            Configura las zonas y tarifas de entrega por provincia y municipio.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <LayoutGrid className="mr-1 h-4 w-4" /> Expandir
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <Rows3 className="mr-1 h-4 w-4" /> Colapsar
          </Button>
          <Button onClick={handleNewZone}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Zona
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Zonas Activas</p>
                <p className="text-2xl font-bold">{activeZones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Precio Promedio</p>
                <p className="text-2xl font-bold">{formatPrice(avgPrice, cupCurrency)}</p>
                {usdCurrency && (
                  <p className="text-xs text-muted-foreground">USD: {formatPrice(convertPrice(avgPrice, cupCurrency, usdCurrency), usdCurrency)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cobertura Máxima</p>
                <p className="text-2xl font-bold">{maxCoverage} km</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchical Zone List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Zonas por Provincia
          </CardTitle>
          <CardDescription>
            Zonas agrupadas por provincia y municipio. Las zonas inactivas aparecen atenuadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile: Collapsible cards */}
          <div className="block md:hidden space-y-3">
            {groupedZones.map(([provId, munMap]) => {
              const provIsOpen = openProvinces.has(provId);
              const totalZones = [...munMap.values()].flat().length;
              const activeCount = [...munMap.values()].flat().filter((z) => z.active).length;
              return (
                <div key={provId} className="rounded-lg border bg-card">
                  <button
                    type="button"
                    onClick={() => toggleProvince(provId)}
                    className="flex w-full items-center justify-between p-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {provIsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-medium text-sm">{provinceLabel(provId)}</span>
                      <span className="text-xs text-muted-foreground">
                        {activeCount}/{totalZones} zonas activas
                      </span>
                    </div>
                  </button>
                  {provIsOpen && (
                    <div className="border-t p-2 space-y-2">
                      {[...munMap.entries()]
                        .sort(([a], [b]) => {
                          if (a === "__none") return 1;
                          if (b === "__none") return -1;
                          return municipalityName(a).localeCompare(municipalityName(b));
                        })
                        .map(([munId, zones]) => {
                          const munKey = `${provId}-${munId}`;
                          const munIsOpen = openMunicipalities.has(munKey);
                          return (
                            <div key={munId} className="rounded-md bg-muted/30">
                              <button
                                type="button"
                                onClick={() => toggleMunicipality(munKey)}
                                className="flex w-full items-center justify-between p-2 text-left"
                              >
                                <div className="flex items-center gap-2">
                                  {munIsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                  <span className="text-xs font-medium">{municipalityLabel(munId)}</span>
                                  <span className="text-xs text-muted-foreground">({zones.length})</span>
                                </div>
                              </button>
                              {munIsOpen && (
                                <div className="px-2 pb-2 space-y-2">
                                  {zones.map((z) => <ZoneCard key={z.id} zone={z} />)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
            {groupedZones.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No hay zonas de envío.</p>
            )}
          </div>

          {/* Desktop: Table inside collapsibles */}
          <div className="hidden md:block space-y-4">
            {groupedZones.map(([provId, munMap]) => {
              const provIsOpen = openProvinces.has(provId);
              const totalZones = [...munMap.values()].flat().length;
              const activeCount = [...munMap.values()].flat().filter((z) => z.active).length;
              return (
                <div key={provId} className="rounded-lg border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleProvince(provId)}
                    className="flex w-full items-center justify-between bg-muted/30 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {provIsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">{provinceLabel(provId)}</span>
                      <span className="text-sm text-muted-foreground">
                        {activeCount}/{totalZones} zonas activas
                      </span>
                    </div>
                  </button>
                  {provIsOpen && (
                    <div className="border-t">
                      {[...munMap.entries()]
                        .sort(([a], [b]) => {
                          if (a === "__none") return 1;
                          if (b === "__none") return -1;
                          return municipalityName(a).localeCompare(municipalityName(b));
                        })
                        .map(([munId, zones]) => {
                          const munKey = `${provId}-${munId}`;
                          const munIsOpen = openMunicipalities.has(munKey);
                          return (
                            <div key={munId} className="border-t first:border-t-0">
                              <button
                                type="button"
                                onClick={() => toggleMunicipality(munKey)}
                                className="flex w-full items-center justify-between bg-muted/10 px-8 py-2 text-left hover:bg-muted/30 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  {munIsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                  <span className="text-sm font-medium">{municipalityLabel(munId)}</span>
                                  <span className="text-xs text-muted-foreground">({zones.length} zonas)</span>
                                </div>
                              </button>
                              {munIsOpen && (
                                <div className="px-4 pb-2">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Zona</TableHead>
                                        <TableHead>Distancia</TableHead>
                                        <TableHead>Precio</TableHead>
                                        <TableHead>Tiempo</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {zones.map((z) => <ZoneRow key={z.id} zone={z} />)}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
            {groupedZones.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No hay zonas de envío.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visual Zone Map */}
      <Card>
        <CardHeader>
          <CardTitle>Zonas Activas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 sm:gap-3">
            {activeZones.map((zone, index) => {
              const colors = ["bg-green-500", "bg-yellow-500", "bg-orange-500", "bg-red-500", "bg-purple-500"];
              const color = colors[index % colors.length];
              return (
                <div key={zone.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border">
                  <div className={`w-3 h-3 rounded-full ${color} shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{zone.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {provinceLabel(zone.province)} · {municipalityLabel(zone.municipality)} · {zone.minDistance}-{zone.maxDistance}km
                    </p>
                  </div>
                </div>
              );
            })}
            {activeZones.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">No hay zonas activas.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Zone Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingZone ? "Editar Zona de Envío" : "Nueva Zona de Envío"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field>
              <FieldLabel>Nombre de la zona</FieldLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Zona Centro"
                required
              />
            </Field>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <Field>
                <FieldLabel>Provincia</FieldLabel>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={formData.province || ""}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value, municipality: "" })}
                >
                  <option value="">Sin provincia</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel>Municipio</FieldLabel>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={formData.municipality || ""}
                  onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                  disabled={!formData.province}
                >
                  <option value="">Sin municipio</option>
                  {municipalities
                    .filter((m) => m.id_provincia === formData.province)
                    .map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <Field>
                <FieldLabel>Distancia mínima (km)</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.minDistance}
                  onChange={(e) => setFormData({ ...formData, minDistance: parseFloat(e.target.value) || 0 })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Distancia máxima (km)</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.maxDistance}
                  onChange={(e) => setFormData({ ...formData, maxDistance: parseFloat(e.target.value) || 0 })}
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <Field>
                <FieldLabel>Precio en CUP</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                />
                {usdCurrency && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    USD: {formatPrice(convertPrice(formData.price, cupCurrency, usdCurrency), usdCurrency)}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel>Tiempo estimado</FieldLabel>
                <Input
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                  placeholder="Ej: 30-45 min"
                  required
                />
              </Field>
            </div>

            <div className="flex items-center justify-between pt-2">
              <FieldLabel>Zona activa</FieldLabel>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">
                {editingZone ? "Guardar Cambios" : "Crear Zona"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar zona de envío?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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
