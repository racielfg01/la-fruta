"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminStore, Category } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Plus, Pencil, Trash2, Tags, Package, Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/upload-button";

const emptyCategory: Omit<Category, "id"> = {
  name: "",
  description: "",
  image: "",
};

export default function CategoriesAdminPage() {
  return (
    <Suspense>
      <CategoriesAdmin />
    </Suspense>
  );
}

function CategoriesAdmin() {
  const searchParams = useSearchParams();
  const { categories, products, addCategory, updateCategory, deleteCategory } =
    useAdminStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState(emptyCategory);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [imageUploaded, setImageUploaded] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleNewCategory();
    }
  }, [searchParams]);

  const getProductCount = (categoryName: string) => {
    return products.filter((p) => p.category === categoryName).length;
  };

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, image: url }));
    setImageUploaded(true);
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, image: e.target.value });
    setImageUploaded(false);
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    setFormData(emptyCategory);
    setImageUploaded(false);
    setDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      image: category.image,
    });
    setImageUploaded(false);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete);
      setCategoryToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategory(editingCategory.id, formData);
    } else {
      const newCategory: Category = {
        ...formData,
        id: Date.now().toString(),
      };
      addCategory(newCategory);
    }
    setDialogOpen(false);
    setFormData(emptyCategory);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Categorías</h2>
          <p className="text-muted-foreground">
            Gestiona las categorías de productos
          </p>
        </div>
        <Button onClick={handleNewCategory}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const productCount = getProductCount(category.name);
          return (
            <Card key={category.id} className="overflow-hidden">
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={category.image || '/placeholder.svg'}
                  alt={category.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <h3 className="text-lg font-semibold text-white">
                    {category.name}
                  </h3>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {category.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>{productCount} productos</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Tags className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay categorías</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza creando tu primera categoría para organizar tus productos.
            </p>
            <Button onClick={handleNewCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Categoría
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Category Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Resumen de Categorías
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categories.map((category) => {
              const productCount = getProductCount(category.name);
              const percentage =
                products.length > 0
                  ? Math.round((productCount / products.length) * 100)
                  : 0;
              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-muted-foreground">
                      {productCount} productos ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="name">Nombre de la categoría</FieldLabel>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Frutas Tropicales"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Descripción</FieldLabel>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe brevemente esta categoría..."
                rows={3}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="image">Imagen de la categoría</FieldLabel>
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
                    required
                  />
                  <ImageUpload
                    endpoint="categoryImage"
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

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">
                {editingCategory ? "Guardar Cambios" : "Crear Categoría"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los productos asociados a esta
              categoría no serán eliminados pero quedarán sin categoría asignada.
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
