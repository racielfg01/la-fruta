"use client";

import { Suspense, useState, useEffect } from "react";
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
import { Plus, Pencil, Trash2, Search, Package, Loader2 } from "lucide-react";
import Link from "next/link";
import { uploadImage } from "@/app/actions/upload-image";

const emptyProduct: Omit<Product, "id"> = {
  name: "",
  description: "",
  price: 0,
  unit: "por lb",
  image: "",
  category: "",
  origin: "",
  inStock: true,
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

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageUploaded, setImageUploaded] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleNewProduct();
    }
  }, [searchParams]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleNewProduct = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setDialogOpen(true);
  };

  // const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   const localPreview = URL.createObjectURL(file);
  //   setPreviewImage(localPreview);
  //   setUploadingImage(true);

  //   const formData = new FormData();
  //   formData.append("file", file);

  //   try {
  //     const result = await uploadImage(formData);
  //     if (result.success && result.url) {
  //       setFormData((prev) => ({ ...prev, image: result.url }));
  //       setImageUploaded(true); // ← marca que la imagen fue subida
  //       setPreviewImage(null);
  //     } else {
  //       console.error("Error al subir imagen:", result.error);
  //       setPreviewImage(null);
  //     }
  //   } catch (error) {
  //     console.error("Error en la subida:", error);
  //   } finally {
  //     setUploadingImage(false);
  //     URL.revokeObjectURL(localPreview);
  //   }
  // };

  // Manejar cuando el usuario escribe manualmente una URL:
  
  // Dentro de la función ProductsAdmin, modifica handleImageUpload:
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const localPreview = URL.createObjectURL(file);
  setPreviewImage(localPreview);
  setUploadingImage(true);

  const uploadFormData = new FormData();  
  uploadFormData.append("file", file);

  try {
    const result = await uploadImage(uploadFormData);
    if (result.success && result.url) {
      const imageUrl = result.url;       
      setFormData((prev) => ({ ...prev, image: imageUrl }));
      setImageUploaded(true);
      setPreviewImage(null);
    } else {
      console.error("Error al subir imagen:", result.error);
      setPreviewImage(null);
    }
  } catch (error) {
    console.error("Error en la subida:", error);
  } finally {
    setUploadingImage(false);
    URL.revokeObjectURL(localPreview);
  }
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
      inStock: product.inStock,
    });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image.trim()) {
      alert("Debes agregar una imagen (sube un archivo o ingresa una URL)");
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      const newProduct: Product = {
        ...formData,
        id: Date.now().toString(),
      };
      addProduct(newProduct);
    }
    setDialogOpen(false);
    setFormData(emptyProduct);
    setEditingProduct(null);
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
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
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
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Link
                        href={`/admin/productos/${product.id}`}
                        className="flex items-center gap-3 hover:opacity-80"
                      >
                        <img
                          src={product.image}
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
                          product.inStock
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {product.inStock ? "Disponible" : "Agotado"}
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
                {filteredProducts.length === 0 && (
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
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                    {categories.map((cat) => (
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
                <FieldLabel htmlFor="price">Precio ($)</FieldLabel>
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
                  required
                />
              </Field>
            </div>

            {/* <Field>
              <FieldLabel htmlFor="image">URL de la imagen</FieldLabel>
              <Input
                id="image"
                type="url"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                placeholder="https://..."
                required
              />
            </Field>

            {formData.image && (
              <div className="rounded-lg overflow-hidden border">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="h-32 w-full object-cover"
                />
              </div>
            )} */}
            {/* Campo de imagen mejorado */}
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
                    disabled={imageUploaded} // ← deshabilitado si viene de subida
                    required={!imageUploaded} // ← solo requerido si no hay subida
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-auto"
                    disabled={uploadingImage}
                  />
                </div>
                {uploadingImage && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Subiendo imagen...
                  </div>
                )}
                {imageUploaded && (
                  <div className="text-sm text-green-600">
                    ✅ Imagen subida correctamente. No es necesario ingresar una
                    URL manual.
                  </div>
                )}
              </div>
            </Field>

            {/* Previsualización */}
            {(formData.image || previewImage) && (
              <div className="rounded-lg overflow-hidden border">
                <img
                  src={previewImage || formData.image}
                  alt="Preview"
                  className="h-32 w-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <Switch
                id="inStock"
                checked={formData.inStock}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, inStock: checked })
                }
              />
              <label htmlFor="inStock" className="text-sm font-medium">
                Producto disponible
              </label>
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">
                {editingProduct ? "Guardar Cambios" : "Crear Producto"}
              </Button>
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
