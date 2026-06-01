"use client";

import { useParams, useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Package,
  MapPin,
  Tag,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProductDetailAdmin() {
  const params = useParams();
  const router = useRouter();
  const { products, deleteProduct } = useAdminStore();

  const product = products.find((p) => p.id === params.id);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Producto no encontrado</h2>
        <p className="text-muted-foreground mb-4">
          El producto que buscas no existe o ha sido eliminado.
        </p>
        <Button asChild>
          <Link href="/admin/productos">Volver a productos</Link>
        </Button>
      </div>
    );
  }

  const handleDelete = () => {
    deleteProduct(product.id);
    router.push("/admin/productos");
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" asChild className="w-fit">
          <Link href="/admin/productos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a productos
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/productos?edit=${product.id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El producto &quot;{product.name}&quot;
                  será eliminado permanentemente del catálogo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Image */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            <div className="aspect-square overflow-hidden rounded-t-lg">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <Badge
                  variant={product.stock > 0 ? "default" : "destructive"}
                  className="text-sm"
                >
                  {product.stock > 0 ? (
                    <>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {product.stock} en stock
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 h-3 w-3" />
                      Agotado
                    </>
                  )}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ID: {product.id}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl font-serif">{product.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price & Unit */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                ${product.price.toFixed(2)}
              </span>
              <span className="text-lg text-muted-foreground">{product.unit}</span>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Descripción
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            <Separator />

            {/* Details Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Tag className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Categoría</p>
                  <p className="font-medium">{product.category}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Origen</p>
                  <p className="font-medium">{product.origin}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Precio</p>
                  <p className="font-medium">
                    ${product.price.toFixed(2)} {product.unit}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                {product.stock > 0 ? (
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Disponibilidad</p>
                  <p className="font-medium">
                    {product.stock > 0 ? `${product.stock} en stock` : "Sin stock"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa en Tienda</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Así se verá este producto en la tienda para los clientes:
          </p>
          <div className="max-w-sm border rounded-lg overflow-hidden bg-card">
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold">{product.name}</h3>
                <span className="text-primary font-bold">
                  ${product.price.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {product.description}
              </p>
              <Button className="w-full" size="sm" disabled={product.stock <= 0}>
                {product.stock > 0 ? "Agregar al Carrito" : "Sin Stock"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
