"use client";

// Tarjetas de datos guardados del perfil: direcciones de entrega y
// beneficiarios. Reutilizan las mismas acciones que el checkout; aquí solo se
// añade la posibilidad de editar un beneficiario (antes solo crear y borrar).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { isValidPhone } from "@/lib/contact-validation";
import { cn } from "@/lib/utils";
import {
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Trash2,
  Truck,
  UserRound,
  Users,
} from "lucide-react";
import {
  createBeneficiaryAction,
  createUserAddressAction,
  deleteBeneficiaryAction,
  deleteUserAddressAction,
  getBeneficiariesAction,
  getUserAddressesAction,
  updateBeneficiaryAction,
  updateUserAddressAction,
  type Beneficiary,
  type UserAddress,
} from "@/app/actions/saved";
import { getPublicDeliveryZones } from "@/app/actions/public";

// Radix Select no admite value="" en un item: se usa un centinela.
const NO_ZONE = "sin-zona";

/** Lista guardada con carga, error reintentable y recarga tras cada cambio. */
function useSavedList<T>(
  token: string | null,
  fetcher: (token: string) => Promise<T[]>
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  // En desarrollo el efecto corre dos veces: sin este guardia, una respuesta
  // lenta que falla después de una que funcionó pintaba un error falso.
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    if (!token) return;
    const id = ++requestId.current;
    setLoading(true);
    setFailed(false);
    try {
      const data = await fetcher(token);
      if (id === requestId.current) setItems(data);
    } catch {
      if (id === requestId.current) setFailed(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [token, fetcher]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, failed, reload };
}

type SectionProps = {
  token: string | null;
  className?: string;
};

function SectionCard({
  title,
  description,
  unit,
  icon: Icon,
  count,
  onAdd,
  addLabel,
  loading,
  className,
  children,
}: {
  title: string;
  description: string;
  unit: string;
  icon: typeof MapPin;
  count: number;
  onAdd: () => void;
  addLabel: string;
  loading: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {title}
            {count > 0 && (
              <Badge variant="secondary" aria-label={`${count} ${unit}`}>
                {count}
              </Badge>
            )}
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0 sm:h-8"
            onClick={onAdd}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {addLabel}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2" aria-busy="true" aria-live="polite">
            <span className="sr-only">Cargando {title.toLowerCase()}…</span>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
  actionLabel,
  onAdd,
}: {
  icon: typeof MapPin;
  title: string;
  hint: string;
  actionLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center">
      <Icon
        className="mx-auto h-7 w-7 text-muted-foreground/60"
        aria-hidden="true"
      />
      <p className="mt-2 text-sm font-medium text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-[26ch] text-xs text-muted-foreground">
        {hint}
      </p>
      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onAdd}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        {actionLabel}
      </Button>
    </div>
  );
}

function LoadError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center" role="alert">
      <p className="text-sm text-muted-foreground">
        No pudimos cargar {what}.
      </p>
      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Reintentar
      </Button>
    </div>
  );
}

/** Con datos ya en pantalla, un fallo al refrescar no debe borrarlos. */
function StaleNotice({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div
      className="mb-2 flex items-center justify-between gap-2 rounded-md bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground"
      role="status"
    >
      <span>No pudimos actualizar {what}.</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={onRetry}
      >
        Reintentar
      </Button>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

// ── Direcciones ─────────────────────────────────────────────────────────────

type AddressForm = { alias: string; address: string; zone: string; notes: string };

const emptyAddressForm: AddressForm = { alias: "", address: "", zone: "", notes: "" };

function validateAddress(form: AddressForm) {
  const errors: Partial<Record<keyof AddressForm, string>> = {};
  if (!form.address.trim()) errors.address = "Escribe la dirección de entrega";
  if (form.alias.trim().length > 40) errors.alias = "Máximo 40 caracteres";
  if (form.notes.trim().length > 200) errors.notes = "Máximo 200 caracteres";
  return errors;
}

export function SavedAddressesSection({ token, className }: SectionProps) {
  const { items, loading, failed, reload } = useSavedList<UserAddress>(
    token,
    getUserAddressesAction
  );
  const [zones, setZones] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserAddress | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyAddressForm);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<UserAddress | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getPublicDeliveryZones()
      .then((list) =>
        setZones(
          list
            .filter((zone) => zone.active && zone.name)
            .map((zone) => zone.name)
        )
      )
      .catch(() => setZones([]));
  }, []);

  // Al editar, conserva la zona guardada aunque ya no esté activa.
  const zoneOptions = useMemo(() => {
    const names = [...zones];
    if (editing?.zone && !names.includes(editing.zone)) names.unshift(editing.zone);
    return names;
  }, [zones, editing]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyAddressForm);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (address: UserAddress) => {
    setEditing(address);
    setForm({
      alias: address.alias,
      address: address.address,
      zone: address.zone,
      notes: address.notes,
    });
    setErrors({});
    setOpen(true);
  };

  const submit = async () => {
    if (!token) return;
    const found = validateAddress(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        alias: form.alias.trim() || "Mi dirección",
        address: form.address.trim(),
        zone: form.zone === NO_ZONE ? "" : form.zone,
        notes: form.notes.trim(),
      };
      if (editing) {
        await updateUserAddressAction(editing.id, payload, token);
        toast.success("Dirección actualizada");
      } else {
        await createUserAddressAction(payload, token);
        toast.success("Dirección guardada");
      }
      setOpen(false);
      await reload();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo guardar la dirección");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!token || !toDelete) return;
    setDeleting(true);
    try {
      await deleteUserAddressAction(toDelete.id, token);
      toast.success("Dirección eliminada");
      setToDelete(null);
      await reload();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo eliminar la dirección");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <SectionCard
        title="Direcciones"
        description="Donde sueles recibir tus pedidos. Puedes usarlas al pagar."
        unit="guardadas"
        icon={MapPin}
        count={items.length}
        onAdd={openAdd}
        addLabel="Añadir"
        loading={loading}
        className={className}
      >
        {failed && items.length === 0 ? (
          <LoadError what="tus direcciones" onRetry={reload} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Aún no tienes direcciones"
            hint="Guarda la dirección de tu casa o del trabajo y reutilízala en el checkout."
            actionLabel="Añadir dirección"
            onAdd={openAdd}
          />
        ) : (
          <>
            {failed && (
              <StaleNotice what="tus direcciones" onRetry={reload} />
            )}
            <ul className="space-y-2">
            {items.map((address) => (
              <li
                key={address.id}
                className="rounded-lg border bg-card p-3 transition-colors hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium leading-tight break-words">
                      {address.alias || "Sin nombre"}
                    </p>
                    <p className="text-sm text-muted-foreground break-words">
                      {address.address}
                    </p>
                    {address.zone && (
                      <Badge variant="secondary" className="gap-1 font-normal">
                        <Truck className="h-3 w-3" aria-hidden="true" />
                        {address.zone}
                      </Badge>
                    )}
                    {address.notes && (
                      <p className="text-xs text-muted-foreground break-words">
                        {address.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-9 sm:w-9"
                      aria-label={`Editar ${address.alias || "dirección"}`}
                      onClick={() => openEdit(address)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground hover:text-destructive sm:h-9 sm:w-9"
                      aria-label={`Eliminar ${address.alias || "dirección"}`}
                      onClick={() => setToDelete(address)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          </>
        )}
      </SectionCard>

      <Dialog open={open} onOpenChange={(value) => !saving && setOpen(value)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar dirección" : "Nueva dirección"}
            </DialogTitle>
            <DialogDescription>
              Se guarda en tu cuenta para usarla en próximos pedidos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="address-alias">
                Nombre <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="address-alias"
                placeholder="Casa, Trabajo…"
                value={form.alias}
                maxLength={40}
                aria-invalid={!!errors.alias}
                aria-describedby={errors.alias ? "address-alias-error" : undefined}
                onChange={(event) =>
                  setForm({ ...form, alias: event.target.value })
                }
              />
              <FieldError id="address-alias-error" message={errors.alias} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address-line">
                Dirección <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address-line"
                placeholder="Calle, número, entre calles, reparto"
                value={form.address}
                aria-invalid={!!errors.address}
                aria-describedby={
                  errors.address ? "address-line-error" : undefined
                }
                onChange={(event) =>
                  setForm({ ...form, address: event.target.value })
                }
              />
              <FieldError id="address-line-error" message={errors.address} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address-zone">Zona de entrega</Label>
              <Select
                value={form.zone || NO_ZONE}
                onValueChange={(value) =>
                  setForm({ ...form, zone: value === NO_ZONE ? "" : value })
                }
              >
                <SelectTrigger id="address-zone" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ZONE}>Sin zona específica</SelectItem>
                  {zoneOptions.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                El costo del envío depende de la zona.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address-notes">
                Instrucciones{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="address-notes"
                placeholder="Referencias, horario preferido, portón…"
                value={form.notes}
                maxLength={200}
                aria-invalid={!!errors.notes}
                aria-describedby={
                  errors.notes ? "address-notes-error" : undefined
                }
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
              />
              <FieldError id="address-notes-error" message={errors.notes} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={submit} disabled={saving}>
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {editing ? "Guardar cambios" : "Guardar dirección"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(value) => !value && !deleting && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar dirección?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará «{toDelete?.alias || toDelete?.address}» de tu
              cuenta. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className={cn(
                "bg-destructive text-white hover:bg-destructive/90",
                deleting && "opacity-70"
              )}
            >
              {deleting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Beneficiarios ───────────────────────────────────────────────────────────

type BeneficiaryForm = { fullName: string; phone: string; carnet: string };

const emptyBeneficiaryForm: BeneficiaryForm = {
  fullName: "",
  phone: "",
  carnet: "",
};

function validateBeneficiary(form: BeneficiaryForm) {
  const errors: Partial<Record<keyof BeneficiaryForm, string>> = {};
  if (!form.fullName.trim()) errors.fullName = "Escribe el nombre completo";
  if (!form.phone.trim()) {
    errors.phone = "Escribe el teléfono de contacto";
  } else if (!isValidPhone(form.phone)) {
    errors.phone = "Ingresa un teléfono válido, por ejemplo +53 5123 4567";
  }
  if (form.carnet.trim().length > 20) errors.carnet = "Máximo 20 caracteres";
  return errors;
}

export function BeneficiariesSection({ token, className }: SectionProps) {
  const { items, loading, failed, reload } = useSavedList<Beneficiary>(
    token,
    getBeneficiariesAction
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Beneficiary | null>(null);
  const [form, setForm] = useState<BeneficiaryForm>(emptyBeneficiaryForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof BeneficiaryForm, string>>
  >({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Beneficiary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyBeneficiaryForm);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (beneficiary: Beneficiary) => {
    setEditing(beneficiary);
    setForm({
      fullName: beneficiary.fullName,
      phone: beneficiary.phone,
      carnet: beneficiary.carnet,
    });
    setErrors({});
    setOpen(true);
  };

  const submit = async () => {
    if (!token) return;
    const found = validateBeneficiary(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        carnet: form.carnet.trim(),
      };
      if (editing) {
        await updateBeneficiaryAction(editing.id, payload, token);
        toast.success("Beneficiario actualizado");
      } else {
        await createBeneficiaryAction(payload, token);
        toast.success("Beneficiario guardado");
      }
      setOpen(false);
      await reload();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo guardar el beneficiario");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!token || !toDelete) return;
    setDeleting(true);
    try {
      await deleteBeneficiaryAction(toDelete.id, token);
      toast.success("Beneficiario eliminado");
      setToDelete(null);
      await reload();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo eliminar el beneficiario");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <SectionCard
        title="Beneficiarios"
        description="Personas que pueden recibir tus pedidos."
        unit="guardados"
        icon={Users}
        count={items.length}
        onAdd={openAdd}
        addLabel="Añadir"
        loading={loading}
        className={className}
      >
        {failed && items.length === 0 ? (
          <LoadError what="tus beneficiarios" onRetry={reload} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aún no tienes beneficiarios"
            hint="Guarda a quien recibe por ti para no escribir sus datos en cada pedido."
            actionLabel="Añadir beneficiario"
            onAdd={openAdd}
          />
        ) : (
          <>
            {failed && (
              <StaleNotice what="tus beneficiarios" onRetry={reload} />
            )}
            <ul className="space-y-2">
            {items.map((beneficiary) => (
              <li
                key={beneficiary.id}
                className="rounded-lg border bg-card p-3 transition-colors hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium leading-tight break-words">
                      {beneficiary.fullName}
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="break-all">{beneficiary.phone}</span>
                    </p>
                    {beneficiary.carnet && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserRound
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="break-all">{beneficiary.carnet}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-9 sm:w-9"
                      aria-label={`Editar ${beneficiary.fullName}`}
                      onClick={() => openEdit(beneficiary)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground hover:text-destructive sm:h-9 sm:w-9"
                      aria-label={`Eliminar ${beneficiary.fullName}`}
                      onClick={() => setToDelete(beneficiary)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          </>
        )}
      </SectionCard>

      <Dialog open={open} onOpenChange={(value) => !saving && setOpen(value)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar beneficiario" : "Nuevo beneficiario"}
            </DialogTitle>
            <DialogDescription>
              Es la persona que recibe el pedido en tu dirección.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="beneficiary-name">
                Nombre completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="beneficiary-name"
                placeholder="Nombre y apellidos"
                value={form.fullName}
                aria-invalid={!!errors.fullName}
                aria-describedby={
                  errors.fullName ? "beneficiary-name-error" : undefined
                }
                onChange={(event) =>
                  setForm({ ...form, fullName: event.target.value })
                }
              />
              <FieldError
                id="beneficiary-name-error"
                message={errors.fullName}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="beneficiary-phone">
                Teléfono <span className="text-destructive">*</span>
              </Label>
              <Input
                id="beneficiary-phone"
                type="tel"
                inputMode="tel"
                placeholder="+53 5123 4567"
                value={form.phone}
                aria-invalid={!!errors.phone}
                aria-describedby={
                  errors.phone ? "beneficiary-phone-error" : undefined
                }
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
              />
              <FieldError
                id="beneficiary-phone-error"
                message={errors.phone}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="beneficiary-carnet">
                Carnet de identidad{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="beneficiary-carnet"
                placeholder="Número de carnet"
                value={form.carnet}
                maxLength={20}
                aria-invalid={!!errors.carnet}
                aria-describedby={
                  errors.carnet ? "beneficiary-carnet-error" : undefined
                }
                onChange={(event) =>
                  setForm({ ...form, carnet: event.target.value })
                }
              />
              <FieldError
                id="beneficiary-carnet-error"
                message={errors.carnet}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={submit} disabled={saving}>
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {editing ? "Guardar cambios" : "Guardar beneficiario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(value) => !value && !deleting && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar beneficiario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará «{toDelete?.fullName}» de tu cuenta. Esta acción no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className={cn(
                "bg-destructive text-white hover:bg-destructive/90",
                deleting && "opacity-70"
              )}
            >
              {deleting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
