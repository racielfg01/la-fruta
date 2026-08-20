"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Loader2, Check } from "lucide-react";
import { getPublicLocations } from "@/app/actions/public";

interface Municipality {
  id: string;
  name: string;
  province: string;
}

export function LocationSelector({
  onComplete,
  initial,
}: {
  onComplete: (loc: { province: string; municipality: string }) => void;
  initial?: { province: string; municipality: string };
}) {
  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [province, setProvince] = useState(initial?.province || "");
  const [municipality, setMunicipality] = useState(initial?.municipality || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicLocations().then((data) => {
      setProvinces(data.provinces);
      setMunicipalities(data.municipalities);
      setLoading(false);
    });
  }, []);

  const filteredMunicipalities = useMemo(
    () => municipalities.filter((m) => m.province === province),
    [municipalities, province]
  );

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">¿Dónde recibimos tu pedido?</h2>
            <p className="text-sm text-muted-foreground">
              Selecciona tu provincia y municipio para ver los productos disponibles en tu zona.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Provincia</Label>
              <Select value={province} onValueChange={(v) => { setProvince(v); setMunicipality(""); }}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecciona tu provincia" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {provinces.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Municipio</Label>
              <Select value={municipality} onValueChange={setMunicipality} disabled={!province}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={province ? "Selecciona tu municipio" : "Primero elige la provincia"} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {filteredMunicipalities.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full h-11 gap-2"
              disabled={!province || !municipality}
              onClick={() => onComplete({ province, municipality })}
            >
              <Check className="h-4 w-4" />
              Guardar mi ubicación
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}