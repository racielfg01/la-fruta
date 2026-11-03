"use client";

import { useState, useMemo } from "react";
import { useAdminStore, Order } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Eye,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  CreditCard,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { OrderDetailDialog } from "@/components/order-detail-dialog";
import { cn } from "@/lib/utils";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/order-badges";
import { formatOrderDate } from "@/lib/order-dates";
import { useOrderMoney } from "@/lib/use-order-money";
import { useCurrency } from "@/lib/currency";

export default function OrdersPage() {
  const { orders, users, deliveryZones, updateOrderStatus, updatePaymentStatus } = useAdminStore();
  const { defaultCurrency, formatPrice, convertPrice } = useCurrency();
  const {
    formatOrderMoney: orderMoney,
    hasCupBase: showCupBase,
    cupCurrency,
  } = useOrderMoney();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Normalización: convertir strings numéricas a number
  const normalizedOrders = useMemo(() => {
    return orders.map((order) => ({
      ...order,
      subtotal: Number(order.subtotal) || 0,
      deliveryFee: Number(order.deliveryFee) || 0,
      total: Number(order.total) || 0,
      items: (order.items || []).map((item) => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
      })),
    }));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return normalizedOrders
      .filter((order) => {
        const matchesSearch =
          order.id.toLowerCase().includes(search.toLowerCase()) ||
          order.userName.toLowerCase().includes(search.toLowerCase()) ||
          order.userEmail.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        const matchesPayment =
          paymentFilter === "all" || order.paymentStatus === paymentFilter;
        return matchesSearch && matchesStatus && matchesPayment;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [normalizedOrders, search, statusFilter, paymentFilter]);

  // Paginación
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredOrders.slice(start, end);
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Resetear página cuando cambian los filtros
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Estadísticas
  const stats = useMemo(() => {
    const totalRevenue = normalizedOrders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((acc, o) => acc + o.total, 0);
    return {
      total: normalizedOrders.length,
      pending: normalizedOrders.filter((o) => o.status === "pending").length,
      inProgress: normalizedOrders.filter((o) =>
        ["confirmed", "preparing", "shipped"].includes(o.status)
      ).length,
      completed: normalizedOrders.filter((o) => o.status === "delivered").length,
      totalRevenue,
    };
  }, [normalizedOrders]);

  // Badges con fallback

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-ES").format(num);
  };

  const handleViewDetails = (order: Order) => {
    setViewingOrder(order);
    setDetailOpen(true);
  };

  const viewingCustomer = useMemo(() => {
    if (!viewingOrder) return null;
    const account = users.find((user) => user.id === viewingOrder.userId);
    return account ? { name: account.name, email: account.email } : null;
  }, [users, viewingOrder]);

  const handleAdvance = async (order: Order, nextStatus: Order["status"]) => {
    await updateOrderStatus(order.id, nextStatus);
    setViewingOrder((current) =>
      current && current.id === order.id
        ? { ...current, status: nextStatus, updatedAt: new Date().toISOString() }
        : current
    );
  };

  const handlePaymentStatusChange = async (
    orderId: string,
    newStatus: Order["paymentStatus"]
  ) => {
    await updatePaymentStatus(orderId, newStatus);
    setViewingOrder((current) =>
      current && current.id === orderId
        ? { ...current, paymentStatus: newStatus, updatedAt: new Date().toISOString() }
        : current
    );
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    await updateOrderStatus(orderId, "cancelled", reason);
    setViewingOrder((current) =>
      current && current.id === orderId
        ? {
            ...current,
            status: "cancelled",
            cancelReason: reason,
            updatedAt: new Date().toISOString(),
          }
        : current
    );
  };

  const statCards = [
    {
      key: "total",
      label: "Total Órdenes",
      value: stats.total,
      icon: ShoppingBag,
      color: "primary",
      tooltip: "Número total de órdenes realizadas en la plataforma",
    },
    {
      key: "pending",
      label: "Pendientes",
      value: stats.pending,
      icon: Clock,
      color: "yellow",
      tooltip: "Órdenes que esperan confirmación",
    },
    {
      key: "inProgress",
      label: "En Proceso",
      value: stats.inProgress,
      icon: Truck,
      color: "blue",
      tooltip: "Órdenes en preparación o enviadas",
    },
    {
      key: "completed",
      label: "Completadas",
      value: stats.completed,
      icon: CheckCircle,
      color: "green",
      tooltip: "Órdenes entregadas exitosamente",
    },
    {
      key: "revenue",
      label: "Ingresos",
      value: stats.totalRevenue,
      icon: CreditCard,
      color: "primary",
      tooltip: "Ingresos totales de órdenes pagadas",
      isCurrency: true,
    },
  ];

  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    yellow: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
  };

  // Paginación: cambiar página
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Gestión de Órdenes</h2>
          <p className="text-muted-foreground">
            Visualiza y administra todas las órdenes del sistema
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {statCards.map((card) => {
            const Icon = card.icon;
            const displayValue = card.isCurrency
              ? `${card.value.toFixed(2)} CUP`
              : formatNumber(card.value);
            const usdValue = card.isCurrency && cupCurrency && defaultCurrency
              ? formatPrice(convertPrice(card.value, cupCurrency, defaultCurrency), defaultCurrency)
              : null;
            return (
              <Card
                key={card.key}
                className="group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default"
              >
                <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                  <div
                    className={cn(
                      "rounded-full p-2 sm:p-3 transition-colors duration-200",
                      colorClasses[card.color as keyof typeof colorClasses]
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {card.label}
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={`Más información sobre ${card.label}`}
                          >
                            <Info className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>{card.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight tracking-tight">
                      {displayValue}
                    </p>
                    {usdValue && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {usdValue}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID, cliente o email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    handleFilterChange();
                  }}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="preparing">Preparando</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={paymentFilter}
                onValueChange={(val) => {
                  setPaymentFilter(val);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los pagos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="refunded">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Vista de lista para móvil (cards) */}
        <div className="block md:hidden space-y-4">
          {paginatedOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {order.id}
                    </p>
                    <p className="font-semibold">{order.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.userEmail}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewDetails(order)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <OrderStatusBadge status={order.status} />
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </div>
                    <p className="font-bold text-lg">{orderMoney(order.total, order.currencyCode)}</p>
                    {showCupBase(order.currencyCode) && (
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(order.total, cupCurrency)}
                      </p>
                    )}
                  </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>{order.items.length} producto(s)</span>
                  <span>{formatOrderDate(order.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {paginatedOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron órdenes
            </div>
          )}
        </div>

        {/* Tabla para desktop */}
        <div className="hidden md:block">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Órdenes ({filteredOrders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Orden</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">
                          {order.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.userName}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.userEmail}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {order.items.length} producto
                            {order.items.length !== 1 && "s"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {orderMoney(order.total, order.currencyCode)}
                          {showCupBase(order.currencyCode) && (
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(order.total, cupCurrency)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={order.paymentStatus} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatOrderDate(order.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {paginatedOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <p className="text-muted-foreground">
                            No se encontraron órdenes
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Paginación (común para ambas vistas) */}
        {filteredOrders.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mostrar</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(val) => {
                  setItemsPerPage(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                por página
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <OrderDetailDialog
          order={viewingOrder}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          deliveryZones={deliveryZones}
          customer={viewingCustomer}
          onAdvance={handleAdvance}
          onPaymentStatusChange={handlePaymentStatusChange}
          onCancel={handleCancelOrder}
        />
      </div>
    </TooltipProvider>
  );
}
