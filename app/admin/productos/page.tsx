"use client";

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminStore } from "@/lib/admin-store";
import { useAuthStore } from "@/lib/auth-context";
import { Product, ProductLocation, DEFAULT_UNITS } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  Check,
  MapPin,
  AlertTriangle,
  X,
  PackageOpen,
  SearchX,
} from "lucide-react";
import Link from "next/link";
import { ImageUpload } from "@/components/upload-button";
import { ProductLocationsField } from "@/components/admin/product-locations-field";
import type {
  Province as ProvinceType,
  Municipality as MunicipalityType,
} from "@/lib/admin-store";
import { usePagination } from "@/lib/use-pagination";
import { PaginationBar } from "@/components/pagination-bar";
import { useCurrency } from "@/lib/currency";
import { getPublicLocations } from "@/app/actions/public";
import { getUnitsAction } from "@/app/actions/admin-extras";
import { toast } from "sonner";

const emptyProduct: Omit<Product, "id"> = {
  name: "",
  description: "",
  price: 0,
  unit: "por lb",
  image: "",
  category: "",
  origin: "",
  stock: 0,
  inStock: false,
  visible: true,
  productLocations: [],
  priceMargin: null,
};

export default function ProductsAdminPage() {
  return (
    <Suspense>
      <ProductsAdmin />
    </Suspense>
  );
}

function ProductsAdmin() {
  const searchParams = useSearchParams();
  const { products, categories, addProduct, updateProduct, deleteProduct } =
    useAdminStore();
  const { currencies, formatPrice } = useCurrency();
  // CUP siempre existe en la BD; fallback a la primera activa si no
  const cupCurrency = currencies.find((c) => c.code === "CUP") || currencies[0];
  const usdCurrency = currencies.find((c) => c.code === "USD");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [step, setStep] = useState(1);
  const [municipalities, setMunicipalities] = useState<MunicipalityType[]>([]);
  const [provinces, setProvinces] = useState<ProvinceType[]>([]);
  const [productLocations, setProductLocations] = useState<ProductLocation[]>(
    [],
  );
  // Unidades configurables (Configuración → Unidades). null = aún cargando.
  const [units, setUnits] = useState<string[] | null>(null);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    getUnitsAction(token)
      .then((rows) => setUnits(rows.filter((u) => u.active).map((u) => u.name)))
      .catch(() => setUnits([]));
  }, [token]);

  // La lista configurada; si el producto usa una unidad que ya no está
  // (desactivada o borrada), se ofrece igual para no cambiarla sin querer.
  const unitOptions = useMemo(() => {
    const base = units ?? DEFAULT_UNITS;
    if (formData.unit && !base.includes(formData.unit)) {
      return [formData.unit, ...base];
    }
    return base;
  }, [units, formData.unit]);

  useEffect(() => {
    getPublicLocations().then((d) => {
      setProvinces(d.provinces as ProvinceType[]);
      setMunicipalities(
        d.municipalities.map((m: any) => ({
          id: m.id,
          name: m.name,
          active: m.active !== false,
          id_provincia: m.province || m.id_provincia || "",
        })),
      );
    });
  }, []);

  const resetDialog = useCallback(() => {
    setEditingProduct(null);
    // Unidad por defecto: la de siempre si sigue configurada; si no, la
    // primera de la lista configurada.
    const configured = units && units.length > 0 ? units : null;
    const defaultUnit = configured
      ? configured.includes(emptyProduct.unit)
        ? emptyProduct.unit
        : configured[0]
      : emptyProduct.unit;
    setFormData({ ...emptyProduct, unit: defaultUnit });
    setFormErrors({});
    setImageUploaded(false);
    setProductLocations([]);
    setStep(1);
  }, [units]);

  const handleNewProduct = useCallback(() => {
    resetDialog();
    setDialogOpen(true);
  }, [resetDialog]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleNewProduct();
    }
  }, [searchParams, handleNewProduct]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const hasActiveFilters = search !== "" || categoryFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
  };

  const {
    paginatedData: paginatedProducts,
    currentPage,
    totalPages,
    perPage,
    goToPage,
    changePerPage,
  } = usePagination(filteredProducts, 10);

  // Reset de paginación al cambiar filtros (evita quedar en una página vacía)
  const isFirstFilter = useRef(true);
  useEffect(() => {
    if (isFirstFilter.current) {
      isFirstFilter.current = false;
      return;
    }
    goToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter]);

  // -------------------------------
  // Imagen
  // -------------------------------
  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, image: url }));
    setImageUploaded(true);
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, image: e.target.value });
    setImageUploaded(false);
  };

  const clearImage = () => {
    setFormData({ ...formData, image: "" });
    setImageUploaded(false);
  };

  // -------------------------------
  // Abrir/editar
  // -------------------------------
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      image: product.image,
      category: product.category,
      origin: product.origin,
      stock: product.stock,
      inStock: product.stock > 0,
      visible: product.visible,
      priceMargin: product.priceMargin ?? null,
    });
    setFormErrors({});
    setImageUploaded(false);
    setProductLocations(product.productLocations || []);
    setStep(1);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetDialog();
  };

  // -------------------------------
  // Validación
  // -------------------------------
  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "El nombre es obligatorio";
    if (!formData.category) errors.category = "Selecciona una categoría";
    if (!formData.description.trim())
      errors.description = "La descripción es obligatoria";
    if (!formData.price || formData.price <= 0)
      errors.price = "El precio debe ser mayor a 0";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors: Record<string, string> = {};
    if (formData.stock < 0) errors.stock = "El stock no puede ser negativo";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAll = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "El nombre es obligatorio";
    if (!formData.category) errors.category = "Selecciona una categoría";
    if (!formData.description.trim())
      errors.description = "La descripción es obligatoria";
    if (!formData.price || formData.price <= 0)
      errors.price = "El precio debe ser mayor a 0";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setStep(1);
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep3) {
      // no-op: paso 2 sin validación estricta
    }
    setFormErrors({});
    setStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => {
    setFormErrors({});
    setStep((s) => Math.max(1, s - 1));
  };

  // -------------------------------
  // Borrado
  // -------------------------------
  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      const name =
        products.find((p) => p.id === productToDelete)?.name ?? "Producto";
      deleteProduct(productToDelete);
      setProductToDelete(null);
      toast.success(`"${name}" eliminado`);
    }
    setDeleteDialogOpen(false);
  };

  // -------------------------------
  // Guardar
  // -------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error("Revisa los campos obligatorios");
      return;
    }
    setIsLoading(true);

    const data = { ...formData, inStock: formData.stock > 0 };

    // Derivar municipios desde productLocations: una provincia entera se
    // expande a todos sus municipios. Vacío = disponible en todas las zonas.
    const available = new Set<string>();
    for (const loc of productLocations) {
      if (loc.municipality) available.add(loc.municipality);
      else
        municipalities
          .filter((m) => m.id_provincia === loc.province)
          .forEach((m) => available.add(m.id));
    }
    data.availableMunicipalities = [...available];
    data.productLocations = productLocations;

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        toast.success("Producto actualizado");
      } else {
        const newProduct: Product = { ...data, id: Date.now().toString() };
        await addProduct(newProduct);
        toast.success("Producto creado");
      }
      setDialogOpen(false);
      resetDialog();
    } catch (err) {
      console.error("Error al guardar producto:", err);
      toast.error("Error al guardar el producto. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueCategories = [...new Set(products.map((p) => p.category))];

  const formatProductPrice = (price: number) =>
    cupCurrency ? formatPrice(price, cupCurrency) : `$${price.toFixed(2)}`;

  const formatStock = (product: Product) => {
    if (product.stock <= 0) return "Agotado";
    return `${product.stock} ${product.unit}`;
  };

  const dialogTitle =
    step === 1
      ? editingProduct
        ? "Editar producto · Información"
        : "Nuevo producto · Información"
      : step === 2
        ? "Imagen y visibilidad"
        : "Stock y ubicaciones";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        {/* Header */}
        {/* <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold">Productos</h2>
            <p className="text-muted-foreground">
              Gestiona el catálogo de productos
            </p>
          </div>
          <Button onClick={handleNewProduct} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar producto
          </Button>
        </div> */}

        {/* Toolbar: búsqueda + filtro */}
        {/* <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o descripción…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-10 w-full sm:w-56">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {uniqueCategories
                .filter((cat) => cat)
                .map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10 shrink-0 text-muted-foreground hover:text-foreground"
            >
              Limpiar
            </Button>
          )}
        </div> */}

        {/* Header */}
<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
  <div className="min-w-0">
    <h2 className="font-serif text-2xl font-bold tracking-tight">
      Productos
    </h2>
    <p className="mt-1 text-sm text-muted-foreground">
      {hasActiveFilters ? (
        <>
          <span className="font-medium text-foreground">
            {filteredProducts.length}
          </span>{" "}
          de {products.length} coinciden
        </>
      ) : products.length > 0 ? (
        <>
          <span className="font-medium text-foreground">
            {products.length}
          </span>{" "}
          {products.length === 1 ? "producto" : "productos"} en tu catálogo
        </>
      ) : (
        "Gestiona el catálogo de productos"
      )}
    </p>
  </div>

  <Button
    onClick={handleNewProduct}
    className="w-full shrink-0 gap-2 sm:w-auto"
  >
    <Plus className="h-4 w-4" />
    Agregar producto
  </Button>
</div>

{/* Toolbar: búsqueda + filtro */}
<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
  {/* Buscador */}
  <div className="relative flex-1">
    <Search
      aria-hidden
      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
    />
    <Input
      type="search"
      inputMode="search"
      enterKeyHint="search"
      aria-label="Buscar productos"
      placeholder="Buscar por nombre o descripción…"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="h-10 pl-9 pr-9"
    />
    {search && (
      <button
        type="button"
        onClick={() => setSearch("")}
        aria-label="Limpiar búsqueda"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    )}
  </div>

  {/* Filtro de categoría */}
  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
    <SelectTrigger
      className="h-10 w-full sm:w-56"
      aria-label="Filtrar por categoría"
    >
      <SelectValue placeholder="Categoría" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todas las categorías</SelectItem>
      {uniqueCategories
        .filter((cat) => cat)
        .map((cat) => (
          <SelectItem key={cat} value={cat}>
            {cat}
          </SelectItem>
        ))}
    </SelectContent>
  </Select>

  {/* Limpiar: siempre presente (evita layout shift), oculto si no hay resultados */}
  {filteredProducts.length > 0 && (
    <Button
      variant="ghost"
      size="sm"
      onClick={clearFilters}
      disabled={!hasActiveFilters}
      className="h-10 shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-40"
    >
      Limpiar
    </Button>
  )}
</div>

        {/* Mobile: cards */}
        <div className="block space-y-3 md:hidden">
          {paginatedProducts.map((product) => (
            <Card
              key={product.id}
              className={product.stock <= 0 ? "bg-muted/30" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/admin/productos/${product.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80"
                  >
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="h-14 w-14 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{product.name}</p>
                      <p className="mt-0.5 text-sm font-semibold">
                        {formatProductPrice(product.price)}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          / {product.unit}
                        </span>
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          {product.category}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            product.stock > 0
                              ? "bg-primary/10 text-primary"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {formatStock(product)}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditProduct(product)}
                      aria-label={`Editar ${product.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(product.id)}
                      aria-label={`Eliminar ${product.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {paginatedProducts.length === 0 && (
            <EmptyState
              hasProducts={products.length > 0}
              hasActiveFilters={hasActiveFilters}
              onClear={clearFilters}
              onCreate={handleNewProduct}
            />
          )}

          {filteredProducts.length > 0 && (
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProducts.length}
              perPage={perPage}
              onPageChange={goToPage}
              onPerPageChange={changePerPage}
            />
          )}
        </div>

        {/* Desktop: tabla */}
        <Card className="hidden md:block">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              {filteredProducts.length} producto
              {filteredProducts.length !== 1 ? "s" : ""}
              {hasActiveFilters && products.length !== filteredProducts.length && (
                <span className="text-sm font-normal text-muted-foreground">
                  · de {products.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {paginatedProducts.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="pr-6 text-right">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className={product.stock <= 0 ? "bg-muted/20" : ""}
                      >
                        <TableCell className="pl-6">
                          <Link
                            href={`/admin/productos/${product.id}`}
                            className="flex items-center gap-3 hover:opacity-80"
                          >
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="h-11 w-11 rounded-md object-cover"
                            />
                            <div className="min-w-0">
                              <p className="font-medium">{product.name}</p>
                              <p className="line-clamp-1 max-w-[220px] text-xs text-muted-foreground">
                                {product.description}
                              </p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                            {product.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {formatProductPrice(product.price)}
                          </span>
                          <span className="ml-1 text-xs text-muted-foreground">
                            / {product.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {product.origin || "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              product.stock > 0
                                ? "bg-primary/10 text-primary"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {formatStock(product)}
                          </span>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditProduct(product)}
                                  aria-label={`Editar ${product.name}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteClick(product.id)}
                                  aria-label={`Eliminar ${product.name}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Eliminar</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredProducts.length}
                  perPage={perPage}
                  onPageChange={goToPage}
                  onPerPageChange={changePerPage}
                />
              </>
            ) : (
              <EmptyState
                hasProducts={products.length > 0}
                hasActiveFilters={hasActiveFilters}
                onClear={clearFilters}
                onCreate={handleNewProduct}
              />
            )}
          </CardContent>
        </Card>

        {/* Diálogo de producto — header/footer sticky, body scrollable */}
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle className="text-base">{dialogTitle}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Step indicator */}
              <div className="mb-5 flex items-center gap-2">
                <StepIndicator
                  active={step === 1}
                  done={step > 1}
                  number={1}
                  label="Información"
                />
                <div className="h-px flex-1 bg-border" />
                <StepIndicator
                  active={step === 2}
                  done={step > 2}
                  number={2}
                  label="Imagen"
                />
                <div className="h-px flex-1 bg-border" />
                <StepIndicator
                  active={step === 3}
                  done={false}
                  number={3}
                  label="Stock"
                />
              </div>

              <form
                id="product-form"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Paso 1: Información */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="name">
                          Nombre <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (formErrors.name)
                              setFormErrors((p) => {
                                const n = { ...p };
                                delete n.name;
                                return n;
                              });
                          }}
                          aria-invalid={!!formErrors.name}
                          className={
                            formErrors.name
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }
                        />
                        {formErrors.name && (
                          <p className="mt-1 text-xs text-destructive">
                            {formErrors.name}
                          </p>
                        )}
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="category">
                          Categoría <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => {
                            setFormData({ ...formData, category: value });
                            if (formErrors.category)
                              setFormErrors((p) => {
                                const n = { ...p };
                                delete n.category;
                                return n;
                              });
                          }}
                        >
                          <SelectTrigger
                            className={
                              formErrors.category
                                ? "border-destructive focus:ring-destructive"
                                : ""
                            }
                          >
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories
                              .filter((cat) => cat.name)
                              .map((cat) => (
                                <SelectItem key={cat.id} value={cat.name}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {formErrors.category && (
                          <p className="mt-1 text-xs text-destructive">
                            {formErrors.category}
                          </p>
                        )}
                        {categories.filter((cat) => cat.name).length === 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            No hay categorías.{" "}
                            <Link
                              href="/admin/categorias"
                              className="text-primary underline-offset-2 hover:underline"
                            >
                              Crear una
                            </Link>
                          </p>
                        )}
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="description">
                        Descripción <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          });
                          if (formErrors.description)
                            setFormErrors((p) => {
                              const n = { ...p };
                              delete n.description;
                              return n;
                            });
                        }}
                        rows={3}
                        aria-invalid={!!formErrors.description}
                        className={
                          formErrors.description
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />
                      {formErrors.description && (
                        <p className="mt-1 text-xs text-destructive">
                          {formErrors.description}
                        </p>
                      )}
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field>
                        <FieldLabel htmlFor="price">
                          Precio ({cupCurrency?.code || "CUP"}){" "}
                          <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              price: parseFloat(e.target.value) || 0,
                            });
                            if (formErrors.price)
                              setFormErrors((p) => {
                                const n = { ...p };
                                delete n.price;
                                return n;
                              });
                          }}
                          aria-invalid={!!formErrors.price}
                          className={
                            formErrors.price
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }
                        />
                        {formErrors.price && (
                          <p className="mt-1 text-xs text-destructive">
                            {formErrors.price}
                          </p>
                        )}
                        {!formErrors.price &&
                          usdCurrency &&
                          cupCurrency &&
                          formData.price > 0 && (
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              ≈{" "}
                              {formatPrice(
                                (formData.price / cupCurrency.exchangeRate) *
                                  usdCurrency.exchangeRate,
                                usdCurrency,
                              )}
                            </p>
                          )}
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="priceMargin">
                          Margen de ganancia ({'"%"'})
                        </FieldLabel>
                        <Input
                          id="priceMargin"
                          type="number"
                          step="0.1"
                          min="0"
                          value={formData.priceMargin ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setFormData({
                              ...formData,
                              priceMargin: v === '' ? null : Math.max(0, parseFloat(v) || 0),
                            });
                          }}
                          placeholder="Vacío = usa el margen global"
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Se aplica solo al precio en CUP. USD muestra el precio
                          base. Vacío o 0 = usa el margen global de la
                          configuración.
                        </p>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="unit">Unidad</FieldLabel>
                        <Select
                          value={formData.unit}
                          onValueChange={(value) =>
                            setFormData({ ...formData, unit: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {unitOptions.map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {units && units.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No hay unidades configuradas. Agrégalas en
                            Configuración → Unidades.
                          </p>
                        )}
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="origin">Origen</FieldLabel>
                        <Input
                          id="origin"
                          value={formData.origin}
                          onChange={(e) =>
                            setFormData({ ...formData, origin: e.target.value })
                          }
                          placeholder="Ej: Villa Clara"
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {/* Paso 2: Imagen y visibilidad */}
                {step === 2 && (
                  <div className="space-y-4">
                    <Field>
                      <FieldLabel htmlFor="image">Imagen</FieldLabel>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            id="image"
                            type="url"
                            value={formData.image}
                            onChange={handleImageUrlChange}
                            placeholder="Pega una URL o sube un archivo"
                            className="flex-1"
                          />
                          <ImageUpload
                            endpoint="productImage"
                            onUploadComplete={handleImageUpload}
                          />
                        </div>

                        {imageUploaded && (
                          <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-500">
                            <Check className="h-3.5 w-3.5" />
                            Imagen subida correctamente
                          </p>
                        )}

                        {formData.image && (
                          <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                            <img
                              src={formData.image}
                              alt="Vista previa"
                              className="h-full w-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={clearImage}
                              className="absolute right-2 top-2 h-8 gap-1.5 px-2.5 shadow-md"
                            >
                              <X className="h-3.5 w-3.5" />
                              Quitar
                            </Button>
                          </div>
                        )}
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel>Visibilidad</FieldLabel>
                      <div className="flex h-10 items-center gap-3 rounded-md border px-3">
                        <Switch
                          id="visible"
                          checked={formData.visible}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, visible: checked })
                          }
                        />
                        <label
                          htmlFor="visible"
                          className="cursor-pointer text-sm font-medium"
                        >
                          {formData.visible ? "Visible en la tienda" : "Oculto"}
                        </label>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Los productos ocultos no aparecen en la tienda pero se
                        conservan en tu catálogo.
                      </p>
                    </Field>
                  </div>
                )}

                {/* Paso 3: Stock y disponibilidad por ubicación */}
                {step === 3 && (
                  <div className="space-y-4">
                    <Field>
                      <FieldLabel htmlFor="stock">Stock disponible</FieldLabel>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        step="1"
                        value={formData.stock}
                        onChange={(e) => {
                          const stock = parseInt(e.target.value) || 0;
                          setFormData({
                            ...formData,
                            stock,
                            inStock: stock > 0,
                          });
                          if (formErrors.stock)
                            setFormErrors((p) => {
                              const n = { ...p };
                              delete n.stock;
                              return n;
                            });
                        }}
                        aria-invalid={!!formErrors.stock}
                        className={
                          formErrors.stock
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />
                      {formErrors.stock && (
                        <p className="mt-1 text-xs text-destructive">
                          {formErrors.stock}
                        </p>
                      )}
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {formData.stock > 0
                          ? "Se mostrará como disponible en la tienda."
                          : "Se mostrará como agotado."}
                      </p>
                    </Field>

                    <Field>
                      <FieldLabel className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        Disponibilidad por ubicación
                      </FieldLabel>
                      <ProductLocationsField
                        value={productLocations}
                        onChange={setProductLocations}
                        provinces={provinces}
                        municipalities={municipalities}
                        defaultStock={formData.stock}
                      />
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {productLocations.length === 0
                          ? "Sin selección = disponible en todas las zonas."
                          : `${productLocations.length} zona${productLocations.length !== 1 ? "s" : ""} configurada${productLocations.length !== 1 ? "s" : ""}.`}
                      </p>
                    </Field>
                  </div>
                )}
              </form>
            </div>

            <DialogFooter className="border-t bg-background px-6 py-4 sm:justify-between">
              <div>
                {step > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={goBack}
                    className="gap-1.5"
                  >
                    Atrás
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {step === 1 && (
                  <>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button type="button" onClick={goNext}>
                      Siguiente
                    </Button>
                  </>
                )}
                {step === 2 && (
                  <Button type="button" onClick={goNext}>
                    Siguiente
                  </Button>
                )}
                {step === 3 && (
                  <Button type="submit" form="product-form" disabled={isLoading}>
                    {isLoading
                      ? "Guardando…"
                      : editingProduct
                        ? "Guardar cambios"
                        : "Crear producto"}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmación de borrado */}
        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div className="min-w-0">
                  <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                  <AlertDialogDescription className="mt-1">
                    Esta acción no se puede deshacer. El producto se eliminará
                    permanentemente del catálogo.
                  </AlertDialogDescription>
                </div>
              </div>
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
      </div>
    </TooltipProvider>
  );
}

// -------------------------------
// Indicador de paso
// -------------------------------
function StepIndicator({
  active,
  done,
  number,
  label,
}: {
  active: boolean;
  done: boolean;
  number: number;
  label: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
          active
            ? "bg-primary text-primary-foreground"
            : done
              ? "bg-primary/15 text-primary"
              : "bg-muted"
        }`}
      >
        {done ? <Check className="h-3.5 w-3.5" /> : number}
      </div>
      <span className="hidden text-sm font-medium sm:inline">{label}</span>
    </div>
  );
}

// -------------------------------
// Estado vacío (diferenciado)
// -------------------------------
function EmptyState({
  hasProducts,
  hasActiveFilters,
  onClear,
  onCreate,
}: {
  hasProducts: boolean;
  hasActiveFilters: boolean;
  onClear: () => void;
  onCreate: () => void;
}) {
  const showNoResults = hasProducts && hasActiveFilters;
  const Icon = showNoResults ? SearchX : PackageOpen;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mb-1.5 text-base font-semibold">
        {showNoResults
          ? "Sin resultados"
          : hasProducts
            ? "No se encontraron productos"
            : "Aún no hay productos"}
      </h3>
      <p className="mb-5 max-w-sm text-sm text-muted-foreground">
        {showNoResults
          ? "Ningún producto coincide con los filtros aplicados."
          : hasProducts
            ? "Prueba con otro término de búsqueda."
            : "Agrega tu primer producto para comenzar a vender."}
      </p>
      {showNoResults ? (
        <Button variant="outline" onClick={onClear}>
          Limpiar filtros
        </Button>
      ) : (
        <Button onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar producto
        </Button>
      )}
    </div>
  );
}