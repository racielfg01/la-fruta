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
import { Loader2, User, Package, MapPin, Mail, Phone, Calendar, Edit2, Save, X } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, token, isAuthenticated, setUser } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    gender: "",
  });

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

  const loadOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getUserOrders(token);
      setOrders(data);
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
        // Construir el objeto actualizado con todos los campos requeridos
        const updatedUser: AuthUser = {
          id: user.id,
          name: result.user.name ?? user.name,
          email: result.user.email ?? user.email,
          phone: result.user.phone ?? user.phone,
          address: result.user.address ?? user.address,
          gender: result.user.gender ?? user.gender,
          created_at: user.created_at,
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
    return (
      <Badge className={config[status]?.color || "bg-gray-100"}>
        {config[status]?.label || status}
      </Badge>
    );
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
            {/* Sidebar con datos del usuario */}
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
                          className="w-full px-3 py-2 border rounded-md"
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
                            {updating ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4 mr-1" />}
                            Guardar
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
                            <span>Miembro desde: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => setEditMode(true)}>
                          <Edit2 className="h-4 w-4 mr-1" />
                          Editar perfil
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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Historial de Órdenes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No tienes órdenes aún</p>
                      <Link href="/#products">
                        <Button variant="link" className="mt-2">Ir a comprar</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                            <div>
                              <span className="font-medium">Orden #{order.id}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {new Date(order.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="space-y-2">
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{item.productName} x{item.quantity}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Entrega: {order.delivery_address}
                          </div>
                        </div>
                      ))}
                    </div>
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