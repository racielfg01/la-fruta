"use client";

import { useState } from "react";
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
import {
  Plus,
  Pencil,
  Trash2,
  Truck,
  MapPin,
  Clock,
  DollarSign,
  Info,
} from "lucide-react";

const emptyZone: Omit<DeliveryZone, "id"> = {
  name: "",
  minDistance: 0,
  maxDistance: 0,
  price: 0,
  estimatedTime: "",
};

export default function DeliveryAdmin() {
  const { deliveryZones, addDeliveryZone, updateDeliveryZone, deleteDeliveryZone } =
    useAdminStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [formData, setFormData] = useState(emptyZone);
  const [zoneToDelete, setZoneToDelete] = useState<string | null>(null);

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

  const sortedZones = [...deliveryZones].sort(
    (a, b) => a.minDistance - b.minDistance
  );

  const avgPrice =
    deliveryZones.length > 0
      ? deliveryZones.reduce((sum, z) => sum + z.price, 0) / deliveryZones.length
      : 0;

  const maxCoverage =
    deliveryZones.length > 0
      ? Math.max(...deliveryZones.map((z) => z.maxDistance))
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Precios de Envío</h2>
          <p className="text-muted-foreground">
            Configura las zonas y tarifas de entrega
          </p>
        </div>
        <Button onClick={handleNewZone}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Zona
        </Button>
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
                <p className="text-2xl font-bold">{deliveryZones.length}</p>
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
                <p className="text-2xl font-bold">${avgPrice.toFixed(2)}</p>
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

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary">
                ¿Cómo funcionan las zonas de envío?
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Las zonas de envío se calculan automáticamente según la distancia
                desde tu tienda hasta la ubicación del cliente. Define rangos de
                distancia, precios y tiempos estimados de entrega para cada zona.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Zones Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Zonas de Envío
          </CardTitle>
          <CardDescription>
            Lista de todas las zonas de entrega configuradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zona</TableHead>
                  <TableHead>Distancia</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Tiempo Estimado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedZones.map((zone) => (
                  <TableRow key={zone.id}>
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
                        ${zone.price.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {zone.estimatedTime}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditZone(zone)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(zone.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {deliveryZones.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No hay zonas de envío configuradas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Visual Zone Map */}
      <Card>
        <CardHeader>
          <CardTitle>Visualización de Zonas</CardTitle>
          <CardDescription>
            Representación visual de las zonas de cobertura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {sortedZones.map((zone, index) => {
              const colors = [
                "bg-green-500",
                "bg-yellow-500",
                "bg-orange-500",
                "bg-red-500",
                "bg-purple-500",
              ];
              const color = colors[index % colors.length];
              return (
                <div
                  key={zone.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                >
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <div>
                    <p className="text-sm font-medium">{zone.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {zone.minDistance}-{zone.maxDistance}km | ${zone.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
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
              <FieldLabel htmlFor="name">Nombre de la zona</FieldLabel>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Zona Centro"
                required
              />
            </Field>

            <div className="grid gap-4 grid-cols-2">
              <Field>
                <FieldLabel htmlFor="minDistance">Distancia mínima (km)</FieldLabel>
                <Input
                  id="minDistance"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.minDistance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minDistance: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="maxDistance">Distancia máxima (km)</FieldLabel>
                <Input
                  id="maxDistance"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.maxDistance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDistance: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <Field>
                <FieldLabel htmlFor="price">Precio ($)</FieldLabel>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="estimatedTime">Tiempo estimado</FieldLabel>
                <Input
                  id="estimatedTime"
                  value={formData.estimatedTime}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedTime: e.target.value })
                  }
                  placeholder="Ej: 30-45 min"
                  required
                />
              </Field>
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">
                {editingZone ? "Guardar Cambios" : "Crear Zona"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar zona de envío?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los clientes en esta zona no
              podrán recibir entregas hasta que se configure una nueva zona.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
