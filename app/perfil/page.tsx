"use client";

import { useState, useEffect } from "react";
import { useAuthStore, AuthUser } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { getUserOrders, updateUserProfile } from "@/app/actions/orders";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  User,
  Package,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  ShoppingBag,
  CreditCard,
  Truck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";

export default function ProfilePage() {
  const { user, token, isAuthenticated, setUser } = useAuthStore();
  const router = useRouter();
  const { defaultCurrency, formatPrice, convertPrice } = useCurrency();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    gender: "",
  });

  // Redirigir si no autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        gender: user.gender || "",
      });
    }
    loadOrders();
  }, [isAuthenticated, user]);

  // Filtrar órdenes según búsqueda
  useEffect(() => {
    if (!orders.length) return;
    const filtered = orders.filter((order) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.id.toLowerCase().includes(searchLower) ||
        order.items.some((item: any) =>
          item.productName.toLowerCase().includes(searchLower)
        ) ||
        order.delivery_address.toLowerCase().includes(searchLower)
      );
    });
    setFilteredOrders(filtered);
    setCurrentPage(1); // reset page when filter changes
  }, [searchTerm, orders]);

  const loadOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getUserOrders(token);
      // Normalizar números (PostgreSQL devuelve numeric como string)
      const normalized = data.map((order: any) => ({
        ...order,
        subtotal: Number(order.subtotal) || 0,
        delivery_fee: Number(order.delivery_fee) || 0,
        total: Number(order.total) || 0,
        items: order.items.map((item: any) => ({
          ...item,
          price: Number(item.price) || 0,
        })),
      }));
      setOrders(normalized);
      setFilteredOrders(normalized);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!token || !user) return;
    setUpdating(true);
    try {
      const result = await updateUserProfile(formData, token);
      if (result.success && result.user) {
        const updatedUser: AuthUser = {
          id: user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          address: result.user.address,
          gender: result.user.gender,
          created_at: result.user.created_at,
          role_id: user.role_id,
        };
        setUser(updatedUser);
        setEditMode(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-700", label: "Pendiente" },
      confirmed: { color: "bg-blue-100 text-blue-700", label: "Confirmado" },
      preparing: { color: "bg-orange-100 text-orange-700", label: "Preparando" },
      shipped: { color: "bg-purple-100 text-purple-700", label: "Enviado" },
      delivered: { color: "bg-green-100 text-green-700", label: "Entregado" },
      cancelled: { color: "bg-red-100 text-red-700", label: "Cancelado" },
    };
    const { color, label } = config[status] || { color: "bg-gray-100 text-gray-700", label: status };
    return <Badge className={color}>{label}</Badge>;
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-foreground mb-8">
            Mi Perfil
          </h1>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Sidebar - Datos del usuario */}
            <div className="md:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <User className="h-12 w-12 text-primary" />
                    </div>
                    {editMode ? (
                      <div className="w-full space-y-3">
                        <Input
                          placeholder="Nombre"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <Input
                          placeholder="Email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <Input
                          placeholder="Teléfono"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                        <Input
                          placeholder="Dirección"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                        <select
                          className="w-full px-3 py-2 border rounded-md bg-background"
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        >
                          <option value="">Seleccionar género</option>
                          <option value="masculino">Masculino</option>
                          <option value="femenino">Femenino</option>
                          <option value="otro">Otro</option>
                          <option value="prefiero-no-decir">Prefiero no decir</option>
                        </select>
                        <div className="flex gap-2 pt-2">
                          <Button onClick={handleUpdate} disabled={updating} className="flex-1">
                            {updating ? <Loader2 className="animate-spin h-4 w-4" /> : <> <Save className="h-4 w-4 mr-1" /> Guardar</>}
                          </Button>
                          <Button variant="outline" onClick={() => setEditMode(false)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold">{user?.name}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                        <div className="w-full mt-4 space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{user?.phone || "No especificado"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{user?.address || "No especificada"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Miembro desde:{" "}
                              {user?.created_at
                                ? new Date(user.created_at).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => setEditMode(true)}>
                          <Edit2 className="h-4 w-4 mr-1" /> Editar perfil
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Historial de órdenes */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="space-y-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Historial de Órdenes
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por ID, producto o dirección..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-9 w-full sm:w-64"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse h-20 bg-muted rounded-lg" />
                      ))}
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        {searchTerm ? "No se encontraron órdenes" : "No tienes órdenes aún"}
                      </p>
                      {!searchTerm && (
                        <Link href="/#products">
                          <Button variant="link" className="mt-2">Ir a comprar</Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {currentOrders.map((order) => {
                          const isExpanded = expandedOrderId === order.id;
                          return (
                            <Card
                              key={order.id}
                              className={cn(
                                "transition-all duration-200",
                                isExpanded && "ring-1 ring-primary/20"
                              )}
                            >
                              <CardContent className="p-4">
                                {/* Cabecera compacta (siempre visible) */}
                                <div
                                  className="flex flex-wrap items-center justify-between gap-2 cursor-pointer"
                                  onClick={() => toggleExpand(order.id)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono text-sm font-semibold">
                                        #{order.id.slice(0, 8)}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString()}
                                      </span>
                                      {getStatusBadge(order.status)}
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                      {order.items.length} producto(s)
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-lg">{formatPrice(order.total, defaultCurrency)}</div>
                                    <Button variant="ghost" size="sm" className="h-8 px-2">
                                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </div>

                                {/* Detalles expandidos */}
                                {isExpanded && (
                                  <div className="mt-4 pt-4 border-t space-y-4">
                                    {/* Items */}
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium text-foreground flex items-center gap-1">
                                        <Package className="h-4 w-4" /> Productos
                                      </h4>
                                      {order.items.map((item: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="flex justify-between text-sm py-1 border-b last:border-0"
                                        >
                                          <span>
                                            {item.productName} x{item.quantity}
                                          </span>
                                          <span className="font-medium">
                                            {formatPrice(item.price * item.quantity, defaultCurrency)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Resumen de precios */}
                                    <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>{formatPrice(order.subtotal, defaultCurrency)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                          <Truck className="h-3 w-3" /> Envío
                                        </span>
                                        <span>{formatPrice(order.delivery_fee, defaultCurrency)}</span>
                                      </div>
                                      <div className="flex justify-between font-bold pt-1 border-t">
                                        <span>Total</span>
                                        <span>{formatPrice(order.total, defaultCurrency)}</span>
                                      </div>
                                    </div>

                                    {/* Información de pago y entrega */}
                                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                                      <div className="space-y-1">
                                        <p className="text-muted-foreground flex items-center gap-1">
                                          <CreditCard className="h-3 w-3" /> Pago
                                        </p>
                                        <p className="font-medium capitalize">
                                          {order.payment_method} -{" "}
                                          {order.payment_status === "paid" ? "Pagado" : "Pendiente"}
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-muted-foreground flex items-center gap-1">
                                          <MapPin className="h-3 w-3" /> Entrega
                                        </p>
                                        <p className="font-medium">{order.delivery_address}</p>
                                        {order.delivery_notes && (
                                          <p className="text-xs text-muted-foreground">
                                            Nota: {order.delivery_notes}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {/* Paginación completa */}
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Mostrar</span>
                          <select
                            className="border rounded px-2 py-1 bg-background"
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                          >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                          </select>
                          <span>por página</span>
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
                          <div className="flex gap-1">
                            {getPageNumbers().map((page, idx) =>
                              page === "..." ? (
                                <span key={idx} className="px-2 text-muted-foreground">
                                  ...
                                </span>
                              ) : (
                                <Button
                                  key={idx}
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  className="w-8 h-8 p-0"
                                  onClick={() => goToPage(page as number)}
                                >
                                  {page}
                                </Button>
                              )
                            )}
                          </div>
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
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}