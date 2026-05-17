"use client";

import { useAdminStore } from "@/lib/admin-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Tags,
  Truck,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Users,
  ShoppingBag,
  Coins,
  Clock,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { products, categories, deliveryZones, users, orders, currencies } =
    useAdminStore();

  const totalProducts = products.length;
  const inStockProducts = products.filter((p) => p.inStock).length;
  const outOfStockProducts = totalProducts - inStockProducts;
  const totalCategories = categories.length;
  const avgDeliveryPrice =
    deliveryZones.reduce((sum, z) => sum + z.price, 0) / deliveryZones.length;

  // User stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "active").length;

  // Order stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const completedOrders = orders.filter((o) => o.status === "delivered").length;
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  // Currency stats
  const activeCurrencies = currencies.filter((c) => c.isActive).length;
  const defaultCurrency = currencies.find((c) => c.isDefault);

  const stats = [
    {
      title: "Total Productos",
      value: totalProducts,
      icon: Package,
      description: `${inStockProducts} disponibles`,
      href: "/admin/productos",
      color: "text-primary",
    },
    {
      title: "Categorías",
      value: totalCategories,
      icon: Tags,
      description: "Categorías activas",
      href: "/admin/categorias",
      color: "text-orange-500",
    },
    {
      title: "Usuarios",
      value: totalUsers,
      icon: Users,
      description: `${activeUsers} activos`,
      href: "/admin/usuarios",
      color: "text-blue-500",
    },
    {
      title: "Órdenes",
      value: totalOrders,
      icon: ShoppingBag,
      description: `${pendingOrders} pendientes`,
      href: "/admin/ordenes",
      color: "text-purple-500",
    },
  ];

  const recentOrders = orders
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-700", label: "Pendiente" },
      confirmed: { color: "bg-blue-100 text-blue-700", label: "Confirmado" },
      preparing: { color: "bg-orange-100 text-orange-700", label: "Preparando" },
      shipped: { color: "bg-purple-100 text-purple-700", label: "Enviado" },
      delivered: { color: "bg-green-100 text-green-700", label: "Entregado" },
      cancelled: { color: "bg-red-100 text-red-700", label: "Cancelado" },
    };
    return (
      <span
        className={`text-xs px-2 py-1 rounded-full ${config[status]?.color || "bg-gray-100 text-gray-700"}`}
      >
        {config[status]?.label || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif font-bold">Panel Principal</h2>
        <p className="text-muted-foreground">
          Bienvenido al panel de administración de La Fruta
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Revenue & Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-500/10 p-3">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ingresos Totales</p>
              <p className="text-2xl font-bold">
                {defaultCurrency?.symbol || "€"}
                {totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                De {completedOrders} órdenes completadas
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Envío Promedio</p>
              <p className="text-2xl font-bold">
                {defaultCurrency?.symbol || "€"}
                {avgDeliveryPrice.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                {deliveryZones.length} zonas configuradas
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-500/10 p-3">
              <Coins className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monedas Activas</p>
              <p className="text-2xl font-bold">{activeCurrencies}</p>
              <p className="text-xs text-muted-foreground">
                {defaultCurrency?.code || "EUR"} como predeterminada
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(outOfStockProducts > 0 || pendingOrders > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {outOfStockProducts > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-destructive text-base">
                  <AlertCircle className="h-5 w-5" />
                  Alertas de Inventario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tienes{" "}
                  <span className="font-semibold text-destructive">
                    {outOfStockProducts} producto(s)
                  </span>{" "}
                  sin stock.
                </p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/admin/productos">Ver productos</Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {pendingOrders > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-yellow-600 text-base">
                  <Clock className="h-5 w-5" />
                  Órdenes Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tienes{" "}
                  <span className="font-semibold text-yellow-600">
                    {pendingOrders} orden(es)
                  </span>{" "}
                  pendientes de procesar.
                </p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/admin/ordenes">Ver órdenes</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions & Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild className="justify-start">
              <Link href="/admin/productos?action=new">
                <Package className="mr-2 h-4 w-4" />
                Agregar Nuevo Producto
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/admin/usuarios">
                <Users className="mr-2 h-4 w-4" />
                Gestionar Usuarios
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/admin/ordenes">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Ver Órdenes
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/admin/monedas">
                <Coins className="mr-2 h-4 w-4" />
                Configurar Monedas
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Órdenes Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href="/admin/ordenes"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {order.status === "delivered" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {order.id} - {order.userName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} productos - {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {defaultCurrency?.symbol || "€"}
                      {order.total.toFixed(2)}
                    </p>
                    {getStatusBadge(order.status)}
                  </div>
                </Link>
              ))}
              {recentOrders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay órdenes recientes
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-4" asChild>
              <Link href="/admin/ordenes">Ver todas las órdenes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
