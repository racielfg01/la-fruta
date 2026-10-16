"use client";

import { useMemo, useState, useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, RefreshCw, ChevronRight, AlertTriangle } from "lucide-react";
import { getPublicLocations } from "@/app/actions/public";

interface Municipality {
  id: string;
  name: string;
  province: string;
}

type LoadError = "network" | "empty";

export function LocationSelector({
  onComplete,
  initial,
}: {
  onComplete: (loc: {
    province: string;
    municipality: string;
    provinceName?: string;
    municipalityName?: string;
  }) => void;
  initial?: { province: string; municipality: string };
}) {
  const provinceId = useId();
  const municipalityId = useId();
  const hintId = useId();

  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [province, setProvince] = useState(initial?.province || "");
  const [municipality, setMunicipality] = useState(initial?.municipality || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<LoadError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPublicLocations()
      .then((data) => {
        if (cancelled) return;
        const activeMunicipalities = data.municipalities.filter((m) => m.active !== false);
        const activeProvinceIds = new Set(activeMunicipalities.map((m) => m.province));
        const activeProvinces = data.provinces.filter((p) => activeProvinceIds.has(p.id));
        setProvinces(activeProvinces);
        setMunicipalities(activeMunicipalities);
        if (activeProvinces.length === 0) setError("empty");
      })
      .catch((e) => {
        if (cancelled) return;
        console.error("getPublicLocations failed:", e);
        setError("network");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filteredMunicipalities = useMemo(
    () => municipalities.filter((m) => m.province === province),
    [municipalities, province]
  );

  const isEdit = Boolean(initial);
  const ready = Boolean(province && municipality);

  const hint = !province
    ? "Empieza por la provincia para desbloquear los municipios."
    : !municipality
    ? "Ahora elige el municipio de entrega."
    : "Listo. Tus productos se filtrarán por esta zona.";

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Cargando ubicaciones…</span>
        <div className="space-y-2">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (error) {
    const retry = () => setReloadKey((k) => k + 1);
    return (
      <div
        role="alert"
        className="space-y-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {error === "network"
                ? "No pudimos cargar las ubicaciones"
                : "Aún no hay ubicaciones configuradas"}
            </p>
            <p className="text-sm text-muted-foreground">
              {error === "network"
                ? "Revisa tu conexión e inténtalo de nuevo. Tu selección se conservará cuando vuelvas."
                : "Un administrador debe crear las provincias y municipios desde Configuración → Ubicaciones."}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={retry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
        <span>
          {isEdit
            ? "Cambia la zona para ver disponibilidad distinta."
            : "Tu zona define el catálogo y el stock que puedes comprar."}
        </span>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={provinceId}>Provincia</Label>
          <Select
            value={province}
            onValueChange={(v) => {
              setProvince(v);
              setMunicipality("");
            }}
          >
            <SelectTrigger id={provinceId} className="w-full">
              <SelectValue placeholder="Selecciona la provincia" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor={municipalityId}>Municipio</Label>
            {province && filteredMunicipalities.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {filteredMunicipalities.length} disponible
                {filteredMunicipalities.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <Select
            value={municipality}
            onValueChange={setMunicipality}
            disabled={!province || filteredMunicipalities.length === 0}
          >
            <SelectTrigger id={municipalityId} className="w-full">
              <SelectValue
                placeholder={
                  !province
                    ? "Primero elige la provincia"
                    : filteredMunicipalities.length === 0
                    ? "Sin municipios en esta provincia"
                    : "Selecciona el municipio"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {filteredMunicipalities.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
        <Button
          type="button"
          className="w-full"
          disabled={!ready}
          aria-describedby={hintId}
          onClick={() =>
            onComplete({
              province,
              municipality,
              provinceName: provinces.find((p) => p.id === province)?.name,
              municipalityName: municipalities.find((m) => m.id === municipality)?.name,
            })
          }
        >
          {isEdit ? "Guardar ubicación" : "Ver productos disponibles"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
