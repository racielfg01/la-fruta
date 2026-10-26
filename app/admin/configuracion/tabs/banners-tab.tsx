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
  getBannersAction,
  createBannerAction,
  updateBannerAction,
  deleteBannerAction,
  type BannerRow,
  type BannerLinkType,
} from "@/app/actions/admin-extras";
import { getPublicProducts } from "@/app/actions/public-products";

type BannerForm = Omit<BannerRow, "id">;

const empty: BannerForm = {
  title: "",
  subtitle: "",
  image: "",
  linkType: "none",
  productId: "",
  url: "",
  active: true,
  sort: 0,
};

interface ProductOption {
  id: string;
  name: string;
}

export default function BannersTab() {
  const token = useAuthStore((s) => s.token);
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<BannerRow | null>(null);
  const [form, setForm] = useState<BannerForm>(empty);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getBannersAction(token);
      setBanners(data);
    } catch (error: any) {
      toast.error(error?.message || "No se pudieron cargar los banners");
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

  const productName = (id: string) =>
    products.find((p) => p.id === id)?.name || "Producto no disponible";

  const openNew = () => {
    setEditing(null);
    // El nuevo banner se coloca al final.
    const nextSort = banners.reduce((max, b) => Math.max(max, b.sort), 0) + 1;
    setForm({ ...empty, sort: nextSort });
    setDialog(true);
  };

  const openEdit = (b: BannerRow) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle,
      image: b.image,
      linkType: b.linkType,
      productId: b.productId,
      url: b.url,
      active: b.active,
      sort: b.sort,
    });
    setDialog(true);
  };

  const save = async () => {
    if (!token) return;
    if (form.linkType === "product" && !form.productId) {
      toast.error("Elige el producto al que lleva el banner");
      return;
    }
    if (form.linkType === "url" && !form.url.trim()) {
      toast.error("Escribe la URL a la que lleva el banner");
      return;
    }
    setSaving(true);
    try {
      if (editing) await updateBannerAction(editing.id, form, token);
      else await createBannerAction(form, token);
      setDialog(false);
      toast.success(editing ? "Banner actualizado" : "Banner creado");
      load();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo guardar el banner");
    } finally {
      setSaving(false);
    }
  };

  // El interruptor se mueve al instante y se revierte si el guardado falla:
  // con un PocketBase lento, esperar la respuesta parece que "no hizo nada".
  const toggleActive = async (b: BannerRow, active: boolean) => {
    if (!token || pendingId) return;
    setPendingId(b.id);
    setBanners((prev) =>
      prev.map((row) => (row.id === b.id ? { ...row, active } : row))
    );
    try {
      await updateBannerAction(b.id, { active }, token);
      load();
    } catch (error: any) {
      setBanners((prev) =>
        prev.map((row) => (row.id === b.id ? { ...row, active: !active } : row))
      );
      toast.error(error?.message || "No se pudo actualizar el banner");
    } finally {
      setPendingId(null);
    }
  };

  const remove = async (b: BannerRow) => {
    if (!token) return;
    const name = b.title ? `"${b.title}"` : "sin título";
    if (!confirm(`¿Eliminar el banner ${name}?`)) return;
    try {
      await deleteBannerAction(b.id, token);
      toast.success("Banner eliminado");
      load();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo eliminar el banner");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Banners</h2>
        <p className="text-muted-foreground">
          Franjas que se muestran en la portada, debajo del encabezado de la
          tienda. Se ordenan de menor a mayor y solo se ven las activas; si no
          hay ninguna, la portada queda igual.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Banner
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Banners ({banners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Banner</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Al tocar
                  </TableHead>
                  <TableHead className="text-center hidden sm:table-cell">
                    Orden
                  </TableHead>
                  <TableHead className="text-center">Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((b) => (
                  <TableRow key={b.id} className={b.active ? "" : "opacity-60"}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-20 shrink-0 overflow-hidden rounded border bg-muted">
                          {b.image ? (
                            <img
                              src={optimizedImageUrl(b.image, 240)}
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
                          <p className="truncate font-medium">
                            {b.title || "Sin título"}
                          </p>
                          {b.subtitle && (
                            <p className="truncate text-xs text-muted-foreground">
                              {b.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {b.linkType === "product"
                        ? productName(b.productId)
                        : b.linkType === "url"
                          ? b.url
                          : "No lleva a ningún lado"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center text-muted-foreground">
                      {b.sort}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={b.active}
                        disabled={pendingId === b.id}
                        onCheckedChange={(v) => toggleActive(b, v)}
                        aria-label={
                          b.active
                            ? "Ocultar banner de la portada"
                            : "Mostrar banner en la portada"
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(b)}
                          aria-label="Editar banner"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => remove(b)}
                          aria-label="Eliminar banner"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {banners.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No hay banners. La portada se muestra sin carrusel.
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
            <DialogTitle>
              {editing ? "Editar Banner" : "Nuevo Banner"}
            </DialogTitle>
            <DialogDescription>
              Elige la imagen y, si quieres, a dónde lleva al tocarlo en la
              portada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field>
              <FieldLabel>Imagen</FieldLabel>
              <div className="space-y-2">
                <div className="aspect-[21/9] w-full overflow-hidden rounded-lg border bg-muted">
                  {form.image ? (
                    <img
                      src={optimizedImageUrl(form.image, 800)}
                      alt="Vista previa del banner"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                      <span className="text-xs">Sin imagen</span>
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
                  Horizontal, 21:9 (por ejemplo 1400 × 600). En móvil se recorta
                  por el centro.
                </p>
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Título</FieldLabel>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Frutas de temporada"
                />
              </Field>
              <Field>
                <FieldLabel>Subtítulo</FieldLabel>
                <Input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Ej: Recién llegadas del campo"
                />
              </Field>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              Título y subtítulo son opcionales: si los dejas vacíos, se ve solo
              la imagen.
            </p>

            <Field>
              <FieldLabel>Al tocar</FieldLabel>
              <Select
                value={form.linkType}
                onValueChange={(v) =>
                  setForm({ ...form, linkType: v as BannerLinkType })
                }
              >
                <SelectTrigger className="w-full" aria-label="Al tocar">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    No lleva a ningún lado (informativo)
                  </SelectItem>
                  <SelectItem value="product">Abrir un producto</SelectItem>
                  <SelectItem value="url">Abrir una URL</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {form.linkType === "product" && (
              <Field>
                <FieldLabel>Producto</FieldLabel>
                <Select
                  value={form.productId}
                  onValueChange={(v) => setForm({ ...form, productId: v })}
                >
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
                  <p className="text-xs text-muted-foreground">
                    No hay productos visibles en la tienda.
                  </p>
                )}
              </Field>
            )}

            {form.linkType === "url" && (
              <Field>
                <FieldLabel>URL</FieldLabel>
                <Input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://… o /productos?categoria=Ofertas"
                />
                <p className="text-xs text-muted-foreground">
                  Debe empezar por http(s):// o por /. Ahí entrará la página de
                  ofertas cuando exista.
                </p>
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Orden</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={form.sort}
                  onChange={(e) =>
                    setForm({ ...form, sort: Number(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Menor número, más cerca del principio.
                </p>
              </Field>
              <Field>
                <FieldLabel>Estado</FieldLabel>
                <div className="flex h-10 items-center gap-2">
                  <Switch
                    checked={form.active}
                    onCheckedChange={(v) => setForm({ ...form, active: v })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {form.active ? "Visible en la portada" : "Oculto"}
                  </span>
                </div>
              </Field>
            </div>
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
