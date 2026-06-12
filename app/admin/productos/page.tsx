"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminStore } from "@/lib/admin-store";
import { Product, Unit } from "@/lib/store";
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
import { Plus, Pencil, Trash2, Search, Package, Check } from "lucide-react";
import Link from "next/link";
import { ImageUpload } from "@/components/upload-button";
import { usePagination } from "@/lib/use-pagination";
import { PaginationBar } from "@/components/pagination-bar";
import { useCurrency } from "@/lib/currency";

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
  const { defaultCurrency, currencies, formatPrice, convertPrice } = useCurrency();
  const cupCurrency = currencies.find(c => c.code === 'CUP');
  const usdCurrency = currencies.find(c => c.code === 'USD');

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [step, setStep] = useState(1);

  const handleNewProduct = useCallback(() => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setImageUploaded(false);
    setStep(1);
    setDialogOpen(true);
  }, []);

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

  const {
    paginatedData: paginatedProducts,
    currentPage,
    totalPages,
    perPage,
    goToPage,
    changePerPage,
  } = usePagination(filteredProducts, 10);

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, image: url }));
    setImageUploaded(true);
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, image: e.target.value });
    setImageUploaded(false); // Si escribe manual, desmarcamos la subida
  };

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
    });
    setImageUploaded(false);
    setStep(1);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete);
      setProductToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const data = { ...formData, inStock: formData.stock > 0 };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        const newProduct: Product = {
          ...data,
          id: Date.now().toString(),
        };
        await addProduct(newProduct);
      }
      setDialogOpen(false);
      setFormData(emptyProduct);
      setEditingProduct(null);
      setImageUploaded(false);
      setStep(1);
    } catch (err) {
      console.error('Error al guardar producto:', err);
      alert('Error al guardar el producto. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueCategories = [...new Set(products.map((p) => p.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Productos</h2>
          <p className="text-muted-foreground">
            Gestiona el catálogo de productos
          </p>
        </div>
        <Button onClick={handleNewProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Producto
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {uniqueCategories.filter((cat) => cat).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile: Product Cards */}
      <div className="block md:hidden space-y-3">
        {paginatedProducts.map((product) => (
          <Card key={product.id} className={product.stock <= 0 ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/productos/${product.id}`} className="flex items-center gap-3 hover:opacity-80">
                    <img
                      src={product.image || '/placeholder.svg'}
                      alt={product.name}
                      className="h-12 w-12 rounded-md object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {product.category}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.stock > 0
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {product.stock > 0 ? `${product.stock}(${product.unit}) en stock` : "Agotado"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">${product.price.toFixed(2)}</span>
                    <span className="ml-1">{product.unit}</span>
                    {product.origin && <span className="ml-2">· {product.origin}</span>}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditProduct(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {paginatedProducts.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No se encontraron productos</p>
        )}
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredProducts.length}
          perPage={perPage}
          onPageChange={goToPage}
          onPerPageChange={changePerPage}
        />
      </div>

      {/* Desktop: Products Table */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lista de Productos ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow key={product.id} className={product.stock <= 0 ? "opacity-60" : ""}>
                    <TableCell>
                      <Link
                        href={`/admin/productos/${product.id}`}
                        className="flex items-center gap-3 hover:opacity-80"
                      >
                        <img
                          src={product.image || '/placeholder.svg'}
                          alt={product.name}
                          className="h-12 w-12 rounded-md object-cover"
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
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
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {product.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {product.origin}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          product.stock > 0
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {product.stock > 0 ? `${product.stock}(${product.unit}) en stock` : "Agotado"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedProducts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            perPage={perPage}
            onPageChange={goToPage}
            onPerPageChange={changePerPage}
          />
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${step === 1 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                step === 1 ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {step > 1 ? <Check className="h-3.5 w-3.5" /> : "1"}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Info</span>
            </div>
            <div className="h-px flex-1 bg-border" />
            <div className={`flex items-center gap-2 ${step === 2 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                step === 2 ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>2</div>
              <span className="text-sm font-medium hidden sm:inline">Media & Stock</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="name">Nombre del producto</FieldLabel>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="category">Categoría</FieldLabel>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter((cat) => cat.name).map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="description">Descripción</FieldLabel>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    required
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="price">Precio en CUP ($)</FieldLabel>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                    {usdCurrency && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Equivalente en USD: {formatPrice(convertPrice(formData.price, cupCurrency, usdCurrency), usdCurrency)}
                      </p>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="unit">Unidad</FieldLabel>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) =>
                        setFormData({ ...formData, unit: value as Unit })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="por lb">por lb</SelectItem>
                        <SelectItem value="por kg">por kg</SelectItem>
                        <SelectItem value="c/u">c/u</SelectItem>
                        <SelectItem value="por pinta">por pinta</SelectItem>
                        <SelectItem value="por docena">por docena</SelectItem>
                      </SelectContent>
                    </Select>
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

                  <Field>
                    <FieldLabel htmlFor="status">Estado</FieldLabel>
                    <Select
                      value={formData.visible ? "visible" : "hidden"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, visible: value === "visible" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visible">Visible</SelectItem>
                        <SelectItem value="hidden">Oculto</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
              </div>
            )}

            {/* Step 2: Media & Stock */}
            {step === 2 && (
              <div className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="image">Imagen del producto</FieldLabel>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <Input
                        id="image"
                        type="url"
                        value={formData.image}
                        onChange={handleImageUrlChange}
                        placeholder="https://... o sube una imagen"
                        className="flex-1"
                        disabled={imageUploaded}
                      />
                      <ImageUpload
                        endpoint="productImage"
                        onUploadComplete={handleImageUpload}
                        disabled={imageUploaded}
                      />
                    </div>
                    {imageUploaded && (
                      <div className="text-sm text-green-600">
                        ✅ Imagen subida correctamente. No es necesario ingresar una URL manual.
                      </div>
                    )}
                  </div>
                </Field>

                {formData.image && (
                  <div className="rounded-lg overflow-hidden border">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="h-32 w-full object-cover"
                    />
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
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
                        setFormData({ ...formData, stock, inStock: stock > 0 });
                      }}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="visible">Visible en la tienda</FieldLabel>
                    <div className="flex h-10 items-center">
                      <Switch
                        id="visible"
                        checked={formData.visible}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, visible: checked })
                        }
                      />
                      <label htmlFor="visible" className="text-sm font-medium ml-3">
                        {formData.visible ? "Visible" : "Oculto"}
                      </label>
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {/* Footer */}
            <DialogFooter className="gap-2">
              {step === 1 && (
                <>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="button" onClick={() => setStep(2)}>
                    Siguiente
                  </Button>
                </>
              )}
              {step === 2 && (
                <>
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Anterior
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Guardando..." : editingProduct ? "Guardar Cambios" : "Crear Producto"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto será eliminado
              permanentemente del catálogo.
            </AlertDialogDescription>
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
  );
}
