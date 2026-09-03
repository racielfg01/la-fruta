"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { ProductLocation } from "@/lib/store";
import type { Province, Municipality } from "@/lib/admin-store";

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

interface Props {
  value: ProductLocation[];
  onChange: (locs: ProductLocation[]) => void;
  provinces: Province[];
  municipalities: Municipality[];
  defaultStock?: number;
}

const stockNum = (stock?: number) => (Number.isFinite(stock) ? (stock as number) : 0);

export function ProductLocationsField({
  value,
  onChange,
  provinces,
  municipalities,
  defaultStock = 0,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (provId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(provId)) next.delete(provId);
      else next.add(provId);
      return next;
    });

  const fullOf = (provId: string) =>
    value.find((l) => l.province === provId && !l.municipality);
  const munOf = (provId: string, munId: string) =>
    value.find((l) => l.province === provId && l.municipality === munId);
  const hasMun = (provId: string, munId: string) =>
    value.some((l) => l.province === provId && l.municipality === munId);

  const setFull = (provId: string, full: boolean) => {
    const next = value.filter((l) => l.province !== provId);
    if (full) next.push({ id: uid(), province: provId, stock: defaultStock });
    onChange(next);
  };
  const setFullStock = (provId: string, stock: number) =>
    onChange(
      value.map((l) =>
        l.province === provId && !l.municipality ? { ...l, stock } : l
      )
    );

  const toggleMun = (provId: string, munId: string) => {
    const exists = hasMun(provId, munId);
    const next = exists
      ? value.filter((l) => !(l.province === provId && l.municipality === munId))
      : [...value, { id: uid(), province: provId, municipality: munId, stock: defaultStock }];
    onChange(next);
  };
  const setMunStock = (provId: string, munId: string, stock: number) =>
    onChange(
      value.map((l) =>
        l.province === provId && l.municipality === munId ? { ...l, stock } : l
      )
    );

  return (
    <div className="space-y-2">
      {provinces.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No hay provincias registradas. Gestiona las provincias en Configuración.
        </p>
      )}
      {provinces.map((prov) => {
        const muns = municipalities.filter((m) => m.id_provincia === prov.id);
        const full = fullOf(prov.id);
        const isExpanded = expanded.has(prov.id);
        const selectedMuns = muns.filter((m) => hasMun(prov.id, m.id));
        return (
          <div
            key={prov.id}
            className="rounded-lg border bg-card p-3 shadow-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <Checkbox
                  id={`pl-full-${prov.id}`}
                  checked={!!full}
                  onCheckedChange={(c) => setFull(prov.id, !!c)}
                />
                <Label
                  htmlFor={`pl-full-${prov.id}`}
                  className="cursor-pointer font-medium"
                >
                  {prov.name}
                </Label>
                <span className="text-xs text-muted-foreground">
                  (toda la provincia)
                </span>
              </div>
              {full && (
                <div className="flex shrink-0 items-center gap-2 pl-6 sm:pl-0">
                  <Label
                    htmlFor={`pl-stock-${prov.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    Stock
                  </Label>
                  <Input
                    id={`pl-stock-${prov.id}`}
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={stockNum(full.stock)}
                    onChange={(e) =>
                      setFullStock(prov.id, Number(e.target.value) || 0)
                    }
                    className="h-8 w-24"
                  />
                </div>
              )}
            </div>

            {muns.length > 0 && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => toggleExpand(prov.id)}
                  className="flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                  Municipios{selectedMuns.length > 0 ? ` (${selectedMuns.length})` : ""}
                </button>
                {isExpanded && (
                  <div className="mt-2 space-y-1">
                    {muns.map((m) => {
                      const checked = hasMun(prov.id, m.id);
                      const loc = munOf(prov.id, m.id);
                      return (
                        <div
                          key={m.id}
                          className="flex flex-col gap-1 rounded-md p-1 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Checkbox
                              id={`pl-mun-${m.id}`}
                              checked={checked}
                              disabled={!!full}
                              onCheckedChange={() => toggleMun(prov.id, m.id)}
                            />
                            <Label
                              htmlFor={`pl-mun-${m.id}`}
                              className={`cursor-pointer text-sm font-normal ${
                                full ? "cursor-not-allowed text-muted-foreground" : ""
                              }`}
                            >
                              {m.name}
                            </Label>
                          </div>
                          {checked && (
                            <div className="flex shrink-0 items-center gap-2 pl-6 sm:pl-0">
                              <Label
                                htmlFor={`pl-mun-stock-${m.id}`}
                                className="text-xs text-muted-foreground"
                              >
                                Stock
                              </Label>
                              <Input
                                id={`pl-mun-stock-${m.id}`}
                                type="number"
                                min={0}
                                inputMode="numeric"
                                value={stockNum(loc?.stock)}
                                onChange={(e) =>
                                  setMunStock(prov.id, m.id, Number(e.target.value) || 0)
                                }
                                className="h-8 w-24"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
