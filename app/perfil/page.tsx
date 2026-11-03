"use client";

import { useState, useEffect } from "react";
import { useAuthStore, AuthUser } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { getUserOrders, updateUserProfile } from "@/app/actions/orders";
import {
  BeneficiariesSection,
  SavedAddressesSection,
} from "@/components/profile-saved";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Search,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Headphones,
  MessageCircle,
  Clock,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import ProfileReferrals from "@/components/profile-referrals";
import { OrderDetailDialog } from "@/components/order-detail-dialog";
import { OrderStatusBadge } from "@/components/order-badges";
import { useOrderMoney } from "@/lib/use-order-money";
import { formatOrderDate } from "@/lib/order-dates";
import { useSettingsStore } from "@/lib/settings-store";
import { whatsAppLink } from "@/lib/whatsapp";
import type { Order } from "@/lib/admin-store";

export default function ProfilePage() {
  const { user, token, isAuthenticated, setUser } = useAuthStore();
  const router = useRouter();
  const { formatOrderMoney } = useOrderMoney();
  const settings = useSettingsStore((s) => s.settings);
  const initSettings = useSettingsStore((s) => s.init);
  const whatsappHref = whatsAppLink(
    settings.whatsappPhone,
    "Hola, necesito ayuda con mi pedido"
  );
  const scheduleText = (settings.storeSchedule || "").trim();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "referrals">("orders");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    gender: "",
  });

  // Redirigir si no autenticado
  useEffect(() => {
    initSettings();
  }, [initSettings]);

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
        (order.deliveryAddress || "").toLowerCase().includes(searchLower)
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
      const normalized: Order[] = data.map((order: any) => ({
        ...order,
        subtotal: Number(order.subtotal) || 0,
        deliveryFee: Number(order.deliveryFee) || 0,
        total: Number(order.total) || 0,
        items: order.items.map((item: any) => ({
          ...item,
          quantity: Number(item.quantity) || 0,
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

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-foreground mb-8">
            Mi Perfil
          </h1>

          <div className="flex gap-2 mb-6 overflow-x-auto">
            <Button variant={activeTab === "orders" ? "default" : "outline"} onClick={() => setActiveTab("orders")}>
              <Package className="h-4 w-4 mr-2" />
              Mis Órdenes
            </Button>
            <Button variant={activeTab === "referrals" ? "default" : "outline"} onClick={() => setActiveTab("referrals")}>
              <Gift className="h-4 w-4 mr-2" />
              Referidos y Puntos
            </Button>
            <Button variant={activeTab === "profile" ? "default" : "outline"} onClick={() => setActiveTab("profile")}>
              <User className="h-4 w-4 mr-2" />
              Mi Perfil
            </Button>
          </div>

          {activeTab === "profile" && (
            <div className="grid gap-8 md:grid-cols-2">
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
              <div className="space-y-6">
                <SavedAddressesSection token={token} />
                <BeneficiariesSection token={token} />
              </div>
            </div>
          )}

          {activeTab === "referrals" && <ProfileReferrals token={token} />}

          {activeTab === "orders" && (
          <div className="max-w-4xl">
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
                      <div className="space-y-3">
                        {currentOrders.map((order) => (
                          <Card
                            key={order.id}
                            className="overflow-hidden transition-shadow hover:shadow-sm"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setViewingOrder(order);
                                setDetailOpen(true);
                              }}
                              aria-haspopup="dialog"
                              className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-sm font-semibold">
                                    #{order.id.slice(0, 8)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatOrderDate(order.createdAt)}
                                  </span>
                                  <OrderStatusBadge status={order.status} />
                                </div>
                                <p className="mt-1 truncate text-sm text-muted-foreground">
                                  {order.items.length} producto
                                  {order.items.length !== 1 && "s"}
                                  {order.userName &&
                                    order.userName !== user?.name && (
                                      <> · Para: {order.userName}</>
                                    )}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-lg font-bold tabular-nums">
                                  {formatOrderMoney(
                                    order.total,
                                    order.currencyCode
                                  )}
                                </span>
                                <ChevronRight
                                  className="size-4 text-muted-foreground"
                                  aria-hidden="true"
                                />
                              </div>
                            </button>
                          </Card>
                        ))}
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
          )}

          {/* Soporte */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-primary" />
                Soporte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {whatsappHref && (
                  <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-4">
                    <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">WhatsApp</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Escríbenos para atención personalizada
                      </p>
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        {settings.whatsappPhone}
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-4">
                  <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Soporte vía correo electrónico
                    </p>
                    <a
                      href="mailto:soporte@mercatoma.com"
                      className="text-xs text-primary hover:underline mt-1 inline-block"
                    >
                      soporte@mercatoma.com
                    </a>
                  </div>
                </div>
                {scheduleText && (
                  <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-4">
                    <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Horario</p>
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">
                        {scheduleText}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <OrderDetailDialog
        order={viewingOrder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        readOnly
        customer={user ? { name: user.name, email: user.email } : null}
      />

      <div className="h-20 md:hidden" />
      <MobileBottomNav categories={[]} categoryCounts={{}} selectedCategories={[]} toggleCategory={() => {}} clearCategories={() => {}} />
    </div>
  );
}