"use client";

import { useMemo, useState } from "react";
import { CheckCheck, ChevronDown, Eraser, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const stockNum = (stock?: number) =>
  Number.isFinite(stock) ? (stock as number) : 0;

export function ProductLocationsField({
  value,
  onChange,
  provinces: allProvinces,
  municipalities,
  defaultStock = 0,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  // Solo se ofrecen provincias habilitadas (Configuración → Ubicaciones).
  const provinces = useMemo(
    () => allProvinces.filter((p) => p.active),
    [allProvinces]
  );

  const q = query.trim().toLowerCase();

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
      : [
          ...value,
          {
            id: uid(),
            province: provId,
            municipality: munId,
            stock: defaultStock,
          },
        ];
    onChange(next);
  };
  const setMunStock = (provId: string, munId: string, stock: number) =>
    onChange(
      value.map((l) =>
        l.province === provId && l.municipality === munId ? { ...l, stock } : l
      )
    );

  const selectAll = () =>
    onChange(
      provinces.map((p) => ({
        id: uid(),
        province: p.id,
        stock: defaultStock,
      }))
    );
  const clearAll = () => onChange([]);

  const coveredCount = provinces.filter((p) => fullOf(p.id)).length;
  const allCovered = provinces.length > 0 && coveredCount === provinces.length;

  const rows = useMemo(() => {
    return provinces
      .map((prov) => {
        const allMuns = municipalities.filter(
          (m) => m.id_provincia === prov.id
        );
        if (!q) return { prov, shownMuns: allMuns, allMuns };
        const provMatch = prov.name.toLowerCase().includes(q);
        const shownMuns = provMatch
          ? allMuns
          : allMuns.filter((m) => m.name.toLowerCase().includes(q));
        if (!provMatch && shownMuns.length === 0) return null;
        return { prov, shownMuns, allMuns };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [provinces, municipalities, q]);

  if (provinces.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {allProvinces.length === 0
          ? "No hay provincias registradas. Gestiónalas en Configuración."
          : "No hay provincias habilitadas. Actívalas en Configuración."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {/* Buscador + acciones masivas */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar provincia o municipio"
            aria-label="Buscar provincia o municipio"
            className="pl-8 pr-8"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {coveredCount} de {provinces.length} provincias
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={selectAll}
            disabled={allCovered}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Todas
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={clearAll}
            disabled={value.length === 0}
          >
            <Eraser className="h-3.5 w-3.5" />
            Limpiar
          </Button>
        </div>
      </div>

      {rows.length === 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          Sin coincidencias para “{query.trim()}”.
        </p>
      )}

      {rows.length > 0 && (
        <div className="divide-y overflow-hidden rounded-lg border">
          {rows.map(({ prov, shownMuns, allMuns }) => {
            const full = fullOf(prov.id);
            const selectedCount = allMuns.filter((m) =>
              hasMun(prov.id, m.id)
            ).length;
            const isExpanded = q ? true : expanded.has(prov.id);
            const canExpand = !full && allMuns.length > 0;
            const stateLabel = full
              ? "Toda la provincia"
              : selectedCount > 0
                ? `${selectedCount}/${allMuns.length} municipios`
                : allMuns.length > 0
                  ? `${allMuns.length} municipios`
                  : "";
            return (
              <div key={prov.id}>
                <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Checkbox
                      id={`pl-full-${prov.id}`}
                      checked={
                        full
                          ? true
                          : selectedCount > 0
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={(c) => setFull(prov.id, c === true)}
                    />
                    <Label
                      htmlFor={`pl-full-${prov.id}`}
                      className="min-w-0 cursor-pointer truncate font-medium"
                    >
                      {prov.name}
                    </Label>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {stateLabel}
                    </span>
                  </div>

                  {full && (
                    <div className="flex shrink-0 items-center gap-2">
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
                        className="w-24"
                      />
                    </div>
                  )}

                  {canExpand && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(prov.id)}
                      aria-expanded={isExpanded}
                      aria-controls={`pl-munlist-${prov.id}`}
                      className="-mr-1 flex items-center gap-1 rounded-md px-1 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                      Municipios
                    </button>
                  )}
                </div>

                {isExpanded && canExpand && (
                  <div
                    id={`pl-munlist-${prov.id}`}
                    className="divide-y divide-border/60 border-t bg-muted/30"
                  >
                    {shownMuns.length === 0 && (
                      <p className="px-3 py-2 pl-9 text-xs text-muted-foreground">
                        Sin municipios que coincidan.
                      </p>
                    )}
                    {shownMuns.map((m) => {
                      const checked = hasMun(prov.id, m.id);
                      const loc = munOf(prov.id, m.id);
                      return (
                        <div
                          key={m.id}
                          className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-1 py-1.5 pl-9 pr-3"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <Checkbox
                              id={`pl-mun-${m.id}`}
                              checked={checked}
                              onCheckedChange={() => toggleMun(prov.id, m.id)}
                            />
                            <Label
                              htmlFor={`pl-mun-${m.id}`}
                              className="min-w-0 cursor-pointer truncate text-sm font-normal"
                            >
                              {m.name}
                            </Label>
                          </div>
                          {checked && (
                            <div className="flex shrink-0 items-center gap-2">
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
                                  setMunStock(
                                    prov.id,
                                    m.id,
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-24"
                              />
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
        </div>
      )}
    </div>
  );
}
