"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin } from "lucide-react";
import { getPublicLocations } from "@/app/actions/public";
import { useCartStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { create } from "zustand";

interface LocationState {
  provinces: { id: string; name: string }[];
  municipalities: { id: string; name: string; province: string }[];
  error: string | null;
  loading: boolean;
  fetchLocations: () => Promise<void>;
  reload: () => void;
}

const useLocationStore = create<LocationState>((set, get) => ({
  provinces: [],
  municipalities: [],
  error: null,
  loading: false,
  fetchLocations: async () => {
    const { loading } = get();
    if (loading) return;
    set({ loading: true, error: null });
    try {
      const data = await getPublicLocations();
      set({
        provinces: data.provinces,
        municipalities: data.municipalities,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      set({
        error: err?.message ?? String(err),
        loading: false,
      });
    }
  },
  reload: () => {
    get().fetchLocations();
  },
}));

export function useLocations() {
  const { provinces, municipalities, error, loading, fetchLocations, reload } =
    useLocationStore();

  useEffect(() => {
    if (provinces.length === 0 && !loading && !error) {
      fetchLocations();
    }
  }, [fetchLocations, provinces.length, loading, error]);

  return { provinces, municipalities, error, loading, reload };
}

export function LocationsError({ error, reload }: { error: string | null; reload: () => void }) {
  if (!error) return null;
  return (
    <div className="flex flex-col items-center gap-2 py-4 text-sm">
      <p className="text-destructive">Error al cargar provincias: {error}</p>
      <Button variant="outline" size="sm" onClick={reload}>
        Reintentar
      </Button>
    </div>
  );
}

export function LocationsLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Cargando ubicaciones...
    </div>
  );
}

export function LocationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const selectOpenRef = useRef(false);

  const blockIfSelectOpen = useCallback((e: Event) => {
    if (selectOpenRef.current) e.preventDefault();
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={blockIfSelectOpen}
        onFocusOutside={blockIfSelectOpen}
        onInteractOutside={blockIfSelectOpen}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Lugar de entrega</DialogTitle>
          <LocationForm onSaved={() => onOpenChange(false)} selectOpenRef={selectOpenRef} />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

function LocationForm({
  onSaved,
  selectOpenRef,
}: {
  onSaved: () => void;
  selectOpenRef: React.MutableRefObject<boolean>;
}) {
  const userLocation = useCartStore((s) => s.userLocation);
  const setUserLocation = useCartStore((s) => s.setUserLocation);
  const { provinces, municipalities, error, loading, reload } = useLocations();
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");

  useEffect(() => {
    if (userLocation?.province) {
      setSelectedProvince(userLocation.province);
      setSelectedMunicipality(userLocation.municipality ?? "");
    }
  }, [userLocation?.province, userLocation?.municipality]);

  const handleSelectOpen = useCallback((isOpen: boolean) => {
    selectOpenRef.current = isOpen;
  }, [selectOpenRef]);

  const handleSave = () => {
    if (!selectedProvince || !selectedMunicipality) return;
    setUserLocation({
      province: selectedProvince,
      municipality: selectedMunicipality,
    });
    onSaved();
  };

  return (
    <>
      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <MapPin className="h-6 w-6 text-primary" />
      </div>
      <h2 className="text-center text-lg font-semibold text-foreground">Lugar de entrega</h2>
      {error ? (
        <LocationsError error={error} reload={reload} />
      ) : loading ? (
        <LocationsLoading />
      ) : (
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Provincia</label>
            <Select
              value={selectedProvince || undefined}
              onValueChange={(v) => {
                setSelectedProvince(v);
                setSelectedMunicipality("");
              }}
              onOpenChange={handleSelectOpen}
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Selecciona tu provincia" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[301]">
                {provinces.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Municipio</label>
            <Select
              value={selectedMunicipality || undefined}
              onValueChange={setSelectedMunicipality}
              disabled={!selectedProvince}
              onOpenChange={handleSelectOpen}
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue
                  placeholder={
                    selectedProvince
                      ? "Selecciona tu municipio"
                      : "Primero selecciona una provincia"
                  }
                />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[301]">
                {municipalities
                  .filter((m) => m.province === selectedProvince)
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      <Button
        onClick={handleSave}
        disabled={!selectedProvince || !selectedMunicipality}
        className="w-full h-11 text-base"
      >
        Confirmar ubicación
      </Button>
    </>
  );
}

export function LocationButton({
  variant = "ghost",
  size = "sm",
  className = "",
}: {
  variant?:
    | "ghost"
    | "outline"
    | "default"
    | "secondary"
    | "link"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
} = {}) {
  const userLocation = useCartStore((s) => s.userLocation);
  const { provinces, loading, reload } = useLocations();
  const [open, setOpen] = useState(false);

  let label = "Lugar de entrega";
  if (loading) {
    label = "Cargando...";
  } else if (userLocation?.province) {
    const found = provinces.find((p) => p.id === userLocation.province);
    label = found?.name ?? "Lugar de entrega";
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => {
          if (provinces.length === 0 && !loading) reload();
          setOpen(true);
        }}
        className={cn("gap-1.5 min-h-[40px]", className)}
      >
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-xs max-w-[80px] truncate">
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
          ) : null}
          {label}
        </span>
      </Button>
      <LocationDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
