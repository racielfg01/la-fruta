"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAdminStore } from "@/lib/admin-store";
import { useAuthStore } from "@/lib/auth-context";
import { applyOfferImportAction } from "@/app/actions/admin";
import type { OfferImportPlan } from "@/lib/offer-excel";
import {
  isOfferActive,
  validateOfferInput,
  type AdminOffer,
  type OfferType,
} from "@/lib/offers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  BadgePercent,
  Timer,
  Package,
  ImageIcon,
  Download,
  Upload,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { ImageUpload } from "@/components/upload-button";

interface OfferForm {
  name: string;
  description: string;
  price: string;
  currencyCode: string;
  type: OfferType;
  productId: string;
  image: string;
  endDate: string;
  active: boolean;
}

const emptyForm: OfferForm = {
  name: "",
  description: "",
  price: "",
  currencyCode: "CUP",
  type: "combo",
  productId: "",
  image: "",
  endDate: "",
  active: true,
};

/** ISO/PB → valor que entiende un input datetime-local (hora local). */
function toDateTimeLocalValue(endDate: string): string {
  if (!endDate) return "";
  const d = new Date(endDate.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatEndDate(endDate: string): string {
  if (!endDate) return "—";
  const d = new Date(endDate.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });
}

export default function OffersAdminPage() {
  const { offers, products, currencies, addOffer, updateOffer, deleteOffer } = useAdminStore();
  const token = useAuthStore((s) => s.token);
  const defaultCurrencyCode =
    currencies.find((c) => c.isDefault)?.code || "CUP";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminOffer | null>(null);
  const [form, setForm] = useState<OfferForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<AdminOffer | null>(null);

  // ── Plantilla Excel de ofertas ──
  const offerFileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingOffers, setDownloadingOffers] = useState(false);
  const [readingOfferFile, setReadingOfferFile] = useState(false);
  const [offerPlan, setOfferPlan] = useState<OfferImportPlan | null>(null);
  const [offerPreviewOpen, setOfferPreviewOpen] = useState(false);
  const [applyingOfferPlan, setApplyingOfferPlan] = useState(false);

  const productName = (id?: string) =>
    products.find((p) => p.id === id)?.name || "Producto no disponible";

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, currencyCode: defaultCurrencyCode });
    setImageUploaded(false);
    setDialogOpen(true);
  };

  const openEdit = (offer: AdminOffer) => {
    setEditing(offer);
    setForm({
      name: offer.name,
      description: offer.description,
      price: offer.price.toString(),
      currencyCode: offer.currencyCode || "CUP",
      type: offer.type,
      productId: offer.product_id,
      image: offer.image,
      endDate: toDateTimeLocalValue(offer.end_date),
      active: offer.active,
    });
    setImageUploaded(false);
    setDialogOpen(true);
  };

  const handleImageUpload = (url: string) => {
    setForm((prev) => ({ ...prev, image: url }));
    setImageUploaded(true);
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, image: e.target.value }));
    setImageUploaded(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOfferInput(form)) {
      toast.error(
        form.type === "product" && !form.productId
          ? "Selecciona el producto de la rebaja."
          : "Completa nombre, descripción, precio y fecha límite."
      );
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        currencyCode: form.currencyCode,
        type: form.type,
        // Combo: sin producto subyacente.
        productId: form.type === "product" ? form.productId : "",
        image: form.image,
        endDate: form.endDate,
        active: form.active,
      };
      if (editing) {
        await updateOffer(editing.id, data);
        toast.success("Oferta actualizada");
      } else {
        await addOffer(data);
        toast.success("Oferta creada");
      }
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (error: any) {
      console.error("Error saving offer:", error);
      toast.error(error?.message || "Error al guardar la oferta");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!offerToDelete) return;
    setSaving(true);
    try {
      await deleteOffer(offerToDelete.id);
      toast.success("Oferta eliminada");
      setOfferToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error("Error deleting offer:", error);
      toast.error(error?.message || "Error al eliminar la oferta");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (offer: AdminOffer, active: boolean) => {
    try {
      await updateOffer(offer.id, { active });
    } catch (error: any) {
      console.error("Error toggling offer:", error);
      toast.error(error?.message || "Error al actualizar la oferta");
    }
  };

  const handleDownloadOfferTemplate = async () => {
    setDownloadingOffers(true);
    try {
      const { buildOfferWorkbook } = await import("@/lib/offer-xlsx");
      const buffer = await buildOfferWorkbook(
        offers.map((o) => ({
          name: o.name,
          description: o.description,
          type: o.type,
          product: o.type === "product" ? productName(o.product_id) : "",
          price: o.price,
          endDate: toDateTimeLocalValue(o.end_date),
          active: o.active,
        }))
      );
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ofertas-plantilla-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Plantilla de ofertas descargada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos generar la plantilla");
    } finally {
      setDownloadingOffers(false);
    }
  };

  const handleOfferFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setReadingOfferFile(true);
    try {
      const { readOfferWorkbook } = await import("@/lib/offer-xlsx");
      const { planOfferImport } = await import("@/lib/offer-excel");
      const { rows } = await readOfferWorkbook(await file.arrayBuffer());
      const plan = planOfferImport(
        rows,
        offers.map((o) => ({ name: o.name })),
        products.map((p) => ({ id: p.id, name: p.name }))
      );
      if (plan.creates.length === 0) {
        toast.error("El archivo no tiene ofertas aplicables. Revisa los motivos antes de reintentar.");
      }
      setOfferPlan(plan);
      setOfferPreviewOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos leer el archivo");
    } finally {
      setReadingOfferFile(false);
    }
  };

  const handleApplyOfferImport = async () => {
    if (!offerPlan) return;
    if (!token) {
      toast.error("Tu sesión expiró. Vuelve a iniciar sesión.");
      return;
    }

    setApplyingOfferPlan(true);
    try {
      const result = await applyOfferImportAction(offerPlan.creates, token);
      useAdminStore.setState((state) => ({
        offers: [...result.created, ...state.offers],
      }));
      toast.success(`Ofertas creadas: ${result.created.length}`);
      setOfferPreviewOpen(false);
      setOfferPlan(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos crear las ofertas");
    } finally {
      setApplyingOfferPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Ofertas</h2>
          <p className="text-muted-foreground">
            Combos y rebajas que se muestran en la portada
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
          <Button
            variant="outline"
            onClick={handleDownloadOfferTemplate}
            disabled={downloadingOffers}
            className="gap-2"
          >
            {downloadingOffers ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Plantilla
          </Button>
          <Button
            variant="outline"
            onClick={() => offerFileInputRef.current?.click()}
            disabled={readingOfferFile}
            className="gap-2"
          >
            {readingOfferFile ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Subir Excel
          </Button>
          <input
            ref={offerFileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={handleOfferFileSelected}
          />
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Oferta
          </Button>
        </div>
      </div>

      {/* Mobile: tarjetas */}
      <div className="block md:hidden">
        <div className="grid gap-4 sm:grid-cols-2">
          {offers.map((offer) => {
            const vigente = isOfferActive(offer);
            return (
              <Card key={offer.id} className={`overflow-hidden ${vigente ? "" : "opacity-60"}`}>
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {offer.image ? (
                    <img
                      src={offer.image}
                      alt={offer.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BadgePercent className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{offer.name}</h3>
                    <Badge className="shrink-0" variant={offer.type === "combo" ? "default" : "secondary"}>
                      {offer.type === "combo" ? "Combo" : "Rebaja"}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {offer.description || "Sin descripción"}
                  </p>
                  <p className="text-sm font-semibold">
                    {offer.price.toFixed(2)} {offer.currencyCode}
                    {offer.type === "product" && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        · {productName(offer.product_id)}
                      </span>
                    )}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Timer className="h-3.5 w-3.5" />
                    Vence: {formatEndDate(offer.end_date)}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={offer.active}
                        onCheckedChange={(v) => toggleActive(offer, v)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {vigente ? "Vigente" : offer.active ? "Vencida" : "Inactiva"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(offer)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setOfferToDelete(offer);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {offers.length === 0 && (
            <Card className="sm:col-span-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BadgePercent className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No hay ofertas</h3>
                <p className="mb-4 text-center text-muted-foreground">
                  Crea la primera para destacarla en la portada.
                </p>
                <Button onClick={openNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Oferta
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Desktop: tabla */}
      <Card className="hidden overflow-hidden md:block">
        <CardHeader>
          <CardTitle>Lista de Ofertas ({offers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagen</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Precio (CUP)</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead className="text-center">Activa</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => {
                  const vigente = isOfferActive(offer);
                  return (
                    <TableRow key={offer.id} className={vigente ? "" : "opacity-60"}>
                      <TableCell>
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border">
                          {offer.image ? (
                            <img
                              src={offer.image}
                              alt={offer.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0 max-w-[220px]">
                          <p className="truncate font-medium">{offer.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {offer.description || "Sin descripción"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={offer.type === "combo" ? "default" : "secondary"}>
                          {offer.type === "combo" ? "Combo" : "Rebaja"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {offer.type === "product" ? (
                          <span className="flex max-w-[180px] items-center gap-1 text-sm">
                            <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{productName(offer.product_id)}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {offer.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{formatEndDate(offer.end_date)}</p>
                        <p className="text-xs text-muted-foreground">
                          {vigente ? "Vigente" : offer.active ? "Vencida" : "Inactiva"}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={offer.active}
                          onCheckedChange={(v) => toggleActive(offer, v)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(offer)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setOfferToDelete(offer);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {offers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      No hay ofertas. Crea la primera para destacarla en la portada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Formulario */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Oferta" : "Nueva Oferta"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="offerName">Nombre</FieldLabel>
              <Input
                id="offerName"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Combo familiar"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="offerDescription">Descripción</FieldLabel>
              <Textarea
                id="offerDescription"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe qué incluye la oferta…"
                rows={3}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="offerType">Tipo</FieldLabel>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as OfferType })}
                >
                  <SelectTrigger id="offerType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="combo">Combo</SelectItem>
                    <SelectItem value="product">Rebaja de producto</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="offerPrice">Precio ({form.currencyCode})</FieldLabel>
                <Input
                  id="offerPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="Ej: 420"
                  required
                />
              </Field>
            </div>

            {form.type === "product" && (
              <Field>
                <FieldLabel htmlFor="offerProduct">Producto rebajado</FieldLabel>
                <Select
                  value={form.productId}
                  onValueChange={(v) => setForm({ ...form, productId: v })}
                >
                  <SelectTrigger id="offerProduct">
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} · {p.price.toFixed(2)} CUP
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  El stock se valida contra este producto en el checkout.
                </p>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="offerEndDate">Vence</FieldLabel>
              <Input
                id="offerEndDate"
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Al llegar la fecha, la oferta desaparece de la portada.
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="offerImage">Imagen</FieldLabel>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input
                    id="offerImage"
                    type="url"
                    value={form.image}
                    onChange={handleImageUrlChange}
                    placeholder="https://… o sube una imagen"
                    className="flex-1"
                    disabled={imageUploaded}
                  />
                  <ImageUpload
                    endpoint="offerImage"
                    onUploadComplete={handleImageUpload}
                    disabled={imageUploaded}
                  />
                </div>
                {imageUploaded && (
                  <div className="text-sm text-green-600">
                    ✅ Imagen subida correctamente. No es necesario ingresar una URL manual.
                  </div>
                )}
              </div>
            </Field>

            {form.image && (
              <div className="overflow-hidden rounded-lg border">
                <img
                  src={form.image}
                  alt="Preview"
                  className="h-32 w-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Activa</p>
                <p className="text-xs text-muted-foreground">
                  Solo las activas y vigentes salen en la portada.
                </p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : editing ? "Guardar Cambios" : "Crear Oferta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmación de borrado */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar oferta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. «{offerToDelete?.name}» dejará
              de estar disponible en la tienda. Los pedidos ya hechos no se
              ven afectados.
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

      {/* Revisión de la plantilla de ofertas */}
      <Dialog open={offerPreviewOpen} onOpenChange={setOfferPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Revisar ofertas del Excel
            </DialogTitle>
          </DialogHeader>

          {offerPlan && (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Se crean</p>
                  <p className="text-xl font-bold">{offerPlan.creates.length}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Con problemas</p>
                  <p className="text-xl font-bold">{offerPlan.errors.length}</p>
                </div>
              </div>

              <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
                {offerPlan.creates.length > 0 && (
                  <section>
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Ofertas que se crean
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {offerPlan.creates.map((offer) => (
                        <li
                          key={offer.row}
                          className="flex items-center justify-between gap-3 rounded border px-2 py-1"
                        >
                          <span className="min-w-0 truncate">
                            {offer.name}
                            <span className="text-muted-foreground">
                              {" · "}
                              {offer.type === "combo" ? "Combo" : "Rebaja"}
                              {offer.productId ? ` · ${productName(offer.productId)}` : ""}
                            </span>
                          </span>
                          <span className="shrink-0 font-semibold text-primary">
                            {offer.price.toFixed(2)} {offer.currencyCode}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {offerPlan.errors.length > 0 && (
                  <section>
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                      <XCircle className="h-4 w-4 text-destructive" />
                      Filas que no se crean
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {offerPlan.errors.map((error) => (
                        <li
                          key={`${error.row}-${error.message}`}
                          className="rounded border px-2 py-1"
                        >
                          <span className="font-mono text-xs text-muted-foreground">
                            Fila {error.row}:
                          </span>{" "}
                          {error.message}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              onClick={handleApplyOfferImport}
              disabled={applyingOfferPlan || !offerPlan || offerPlan.creates.length === 0}
            >
              {applyingOfferPlan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear ofertas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
