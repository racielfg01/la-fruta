"use client";

import { useRef, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createPurchaseAction } from "@/app/actions/suppliers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/auth-context";
import {
  purchaseTotal,
  validatePurchaseInput,
  type ProductOption,
  type PurchaseLineInput,
} from "@/lib/suppliers";

interface PurchaseFormProps {
  open: boolean;
  supplierId: string;
  products: ProductOption[];
  onClose: () => void;
  onSaved: () => void;
}

interface LineForm {
  id: string;
  product: string;
  quantity: string;
  unitPrice: string;
}

const currency = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function today(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function emptyLine(id: string): LineForm {
  return { id, product: "", quantity: "", unitPrice: "" };
}

export function PurchaseForm({
  open,
  supplierId,
  products,
  onClose,
  onSaved,
}: PurchaseFormProps) {
  const token = useAuthStore((s) => s.token);
  const nextLineId = useRef(1);
  const [purchasedAt, setPurchasedAt] = useState(() => today());
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineForm[]>(() => [emptyLine("line-0")]);
  const [saving, setSaving] = useState(false);

  const newLine = () => {
    const line = emptyLine(`line-${nextLineId.current}`);
    nextLineId.current += 1;
    return line;
  };

  const reset = () => {
    setPurchasedAt(today());
    setNotes("");
    setLines([newLine()]);
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const updateLine = (id: string, change: Partial<LineForm>) => {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...change } : line))
    );
  };

  const removeLine = (id: string) => {
    setLines((current) => current.filter((line) => line.id !== id));
  };

  const inputLines = (): PurchaseLineInput[] =>
    lines.map((line) => ({
      product: line.product,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
    }));

  const total = purchaseTotal(inputLines());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !supplierId || saving) return;

    let input;
    try {
      input = validatePurchaseInput({
        supplier: supplierId,
        purchasedAt,
        notes,
        items: inputLines(),
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Revisa los datos de la compra"
      );
      return;
    }

    setSaving(true);
    try {
      await createPurchaseAction(token, input);
      toast.success("Compra registrada");
      reset();
      onSaved();
    } catch (error) {
      console.error("Error creating purchase:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la compra"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva compra</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="purchaseDate">Fecha de compra</FieldLabel>
              <Input
                id="purchaseDate"
                type="date"
                value={purchasedAt}
                onChange={(e) => setPurchasedAt(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="purchaseNotes">Notas</FieldLabel>
              <Textarea
                id="purchaseNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: factura 1234, pago al contado"
                rows={2}
              />
            </Field>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio unitario</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <Select
                        value={line.product}
                        onValueChange={(value) =>
                          updateLine(line.id, { product: value })
                        }
                      >
                        <SelectTrigger
                          aria-label={`Producto línea ${index + 1}`}
                          className="min-w-[180px]"
                        >
                          <SelectValue placeholder="Selecciona un producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.unit
                                ? `${product.name} · ${product.unit}`
                                : product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line.id, { quantity: e.target.value })
                        }
                        aria-label={`Cantidad línea ${index + 1}`}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) =>
                          updateLine(line.id, { unitPrice: e.target.value })
                        }
                        aria-label={`Precio unitario línea ${index + 1}`}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(line.id)}
                        disabled={saving}
                        aria-label={`Quitar línea ${index + 1}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {lines.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      Sin líneas. Agrega al menos un producto.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {currency.format(total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLines((current) => [...current, newLine()])}
              disabled={saving}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar línea
            </Button>
            <p className="text-xs text-muted-foreground">
              El precio unitario es el pagado en esta compra y alimenta la
              tabla de precios.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving || !token || !supplierId}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar compra
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
