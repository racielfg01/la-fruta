"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/upload-button";
import { optimizedImageUrl } from "@/lib/image";
import { Plus, Pencil, Trash2, ImageIcon, Loader2 } from "lucide-react";
import {
  getStoriesAction,
  createStoryAction,
  updateStoryAction,
  deleteStoryAction,
  type StoryRow,
  type StoryLinkType,
} from "@/app/actions/admin-extras";
import { getPublicProducts } from "@/app/actions/public-products";
import { getPublicOffers } from "@/app/actions/public-offers";

type StoryForm = Omit<StoryRow, "id">;

const empty: StoryForm = {
  name: "",
  image: "",
  duration: 5,
  linkType: "none",
  productId: "",
  offerId: "",
  active: true,
  sort: 0,
};

interface ProductOption {
  id: string;
  name: string;
}

interface OfferOption {
  id: string;
  name: string;
}

export default function StoriesSubtab() {
  const token = useAuthStore((s) => s.token);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [offers, setOffers] = useState<OfferOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<StoryRow | null>(null);
  const [form, setForm] = useState<StoryForm>(empty);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getStoriesAction(token);
      setStories(data);
    } catch (error: any) {
      toast.error(error?.message || "No se pudieron cargar las historias");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  useEffect(() => {
    getPublicProducts()
      .then(({ products: prods }) =>
        setProducts(prods.map((p) => ({ id: p.id, name: p.name })))
      )
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    getPublicOffers()
      .then((res) => {
        if (res.success) {
          setOffers(res.data.map((o) => ({ id: o.id, name: o.name })));
        } else {
          setOffers([]);
        }
      })
      .catch(() => setOffers([]));
  }, []);

  const productName = (id: string) =>
    products.find((p) => p.id === id)?.name || "Producto no disponible";
  const offerName = (id: string) =>
    offers.find((o) => o.id === id)?.name || "Oferta no disponible";

  const ctaLabel = (s: StoryRow) => {
    if (s.linkType === "product") return `Producto: ${productName(s.productId)}`;
    if (s.linkType === "offer") return `Oferta: ${offerName(s.offerId)}`;
    return "Sin enlace";
  };

  const openNew = () => {
    setEditing(null);
    const nextSort = stories.reduce((max, s) => Math.max(max, s.sort), 0) + 1;
    setForm({ ...empty, sort: nextSort });
    setDialog(true);
  };

  const openEdit = (s: StoryRow) => {
    setEditing(s);
    setForm({
      name: s.name,
      image: s.image,
      duration: s.duration,
      linkType: s.linkType,
      productId: s.productId,
      offerId: s.offerId,
      active: s.active,
      sort: s.sort,
    });
    setDialog(true);
  };

  const save = async () => {
    if (!token) return;
    if (!form.name.trim()) {
      toast.error("El nombre de la historia es requerido");
      return;
    }
    if (!form.image.trim()) {
      toast.error("La imagen de la historia es requerida");
      return;
    }
    const duration = Math.trunc(Number(form.duration));
    if (!Number.isFinite(duration) || duration < 1) {
      toast.error("La duración debe ser de al menos 1 segundo");
      return;
    }
    if (form.linkType === "product" && !form.productId) {
      toast.error("Elige el producto al que lleva la historia");
      return;
    }
    if (form.linkType === "offer" && !form.offerId) {
      toast.error("Elige la oferta a la que lleva la historia");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, duration };
      if (editing) await updateStoryAction(editing.id, payload, token);
      else await createStoryAction(payload, token);
      setDialog(false);
      toast.success(editing ? "Historia actualizada" : "Historia creada");
      load();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo guardar la historia");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: StoryRow, active: boolean) => {
    if (!token || pendingId) return;
    setPendingId(s.id);
    setStories((prev) => prev.map((row) => (row.id === s.id ? { ...row, active } : row)));
    try {
      await updateStoryAction(s.id, { active }, token);
      load();
    } catch (error: any) {
      setStories((prev) => prev.map((row) => (row.id === s.id ? { ...row, active: !active } : row)));
      toast.error(error?.message || "No se pudo actualizar la historia");
    } finally {
      setPendingId(null);
    }
  };

  const remove = async (s: StoryRow) => {
    if (!token) return;
    const name = s.name ? `"${s.name}"` : "sin nombre";
    if (!confirm(`¿Eliminar la historia ${name}?`)) return;
    try {
      await deleteStoryAction(s.id, token);
      toast.success("Historia eliminada");
      load();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo eliminar la historia");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Historias</h3>
          <p className="text-sm text-muted-foreground">
            Tarjetas verticales que se muestran en la portada con desplazamiento horizontal. Al tocarlas se abren a pantalla completa.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Nueva historia
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historias ({stories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Historia</TableHead>
                  <TableHead className="hidden sm:table-cell">Duración</TableHead>
                  <TableHead className="hidden md:table-cell">CTA</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Orden</TableHead>
                  <TableHead className="text-center">Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stories.map((s) => (
                  <TableRow key={s.id} className={s.active ? "" : "opacity-60"}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-9 shrink-0 overflow-hidden rounded border bg-muted">
                          {s.image ? (
                            <img
                              src={optimizedImageUrl(s.image, 120)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{s.name || "Sin nombre"}</p>
                          <p className="truncate text-xs text-muted-foreground sm:hidden">
                            {s.duration}s · {ctaLabel(s)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {s.duration} s
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {ctaLabel(s)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center text-muted-foreground">
                      {s.sort}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={s.active}
                        disabled={pendingId === s.id}
                        onCheckedChange={(v) => toggleActive(s, v)}
                        aria-label={s.active ? "Ocultar historia" : "Mostrar historia"}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)} aria-label="Editar historia">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => remove(s)}
                          aria-label="Eliminar historia"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {stories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No hay historias. La portada usará el comportamiento habitual (banner o hero).
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar historia" : "Nueva historia"}</DialogTitle>
            <DialogDescription>
              Configura la imagen, el nombre, la duración y el enlace de la historia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field>
              <FieldLabel>Imagen</FieldLabel>
              <div className="space-y-2">
                <div className="aspect-[9/16] w-32 overflow-hidden rounded-lg border bg-muted">
                  {form.image ? (
                    <img
                      src={optimizedImageUrl(form.image, 400)}
                      alt="Vista previa de la historia"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                      <span className="text-[10px]">Sin imagen</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="URL de la imagen"
                    className="flex-1"
                  />
                  <ImageUpload
                    endpoint="bannerImage"
                    onUploadComplete={(url) => setForm({ ...form, image: url })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Imagen vertical (recomendado proporción 9:16). Se muestra en la tarjeta y a pantalla completa.
                </p>
              </div>
            </Field>

            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Oferta del día"
              />
              <p className="text-xs text-muted-foreground">
                Se muestra en la esquina inferior izquierda de la tarjeta y del visor.
              </p>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Duración (segundos)</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field>
                <FieldLabel>Orden</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={form.sort}
                  onChange={(e) => setForm({ ...form, sort: Number(e.target.value) || 0 })}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Enlace (CTA)</FieldLabel>
              <Select
                value={form.linkType}
                onValueChange={(v) => setForm({ ...form, linkType: v as StoryLinkType, productId: "", offerId: "" })}
              >
                <SelectTrigger className="w-full" aria-label="Enlace">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin enlace</SelectItem>
                  <SelectItem value="product">Producto concreto</SelectItem>
                  <SelectItem value="offer">Oferta concreta</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {form.linkType === "product" && (
              <Field>
                <FieldLabel>Producto</FieldLabel>
                <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
                  <SelectTrigger className="w-full" aria-label="Producto">
                    <SelectValue placeholder="Elige un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {products.length === 0 && (
                  <p className="text-xs text-muted-foreground">No hay productos disponibles.</p>
                )}
              </Field>
            )}

            {form.linkType === "offer" && (
              <Field>
                <FieldLabel>Oferta</FieldLabel>
                <Select value={form.offerId} onValueChange={(v) => setForm({ ...form, offerId: v })}>
                  <SelectTrigger className="w-full" aria-label="Oferta">
                    <SelectValue placeholder="Elige una oferta" />
                  </SelectTrigger>
                  <SelectContent>
                    {offers.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {offers.length === 0 && (
                  <p className="text-xs text-muted-foreground">No hay ofertas activas disponibles.</p>
                )}
              </Field>
            )}

            <Field>
              <FieldLabel>Estado</FieldLabel>
              <div className="flex h-10 items-center gap-2">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <span className="text-sm text-muted-foreground">
                  {form.active ? "Visible en la portada" : "Oculta"}
                </span>
              </div>
            </Field>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
