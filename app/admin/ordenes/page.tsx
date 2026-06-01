// // "use client";

// // import { useState, useMemo } from "react";
// // import { useAdminStore, Order } from "@/lib/admin-store";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import {
// //   Table,
// //   TableBody,
// //   TableCell,
// //   TableHead,
// //   TableHeader,
// //   TableRow,
// // } from "@/components/ui/table";
// // import {
// //   Dialog,
// //   DialogContent,
// //   DialogHeader,
// //   DialogTitle,
// //   DialogFooter,
// // } from "@/components/ui/dialog";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "@/components/ui/select";
// // import {
// //   Search,
// //   Eye,
// //   ShoppingBag,
// //   Clock,
// //   CheckCircle,
// //   XCircle,
// //   Truck,
// //   Package,
// //   CreditCard,
// //   MapPin,
// //   User,
// //   Calendar,
// //   FileText,
// // } from "lucide-react";
// // import { cn } from "@/lib/utils";
// // import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";

// // export default function OrdersPage() {
// //   const { orders, updateOrderStatus, updatePaymentStatus } = useAdminStore();
// //   const [search, setSearch] = useState("");
// //   const [statusFilter, setStatusFilter] = useState<string>("all");
// //   const [paymentFilter, setPaymentFilter] = useState<string>("all");
// //   const [isDetailOpen, setIsDetailOpen] = useState(false);
// //   const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

// //   const filteredOrders = useMemo(() => {
// //     return orders
// //       .filter((order) => {
// //         const matchesSearch =
// //           order.id.toLowerCase().includes(search.toLowerCase()) ||
// //           order.userName.toLowerCase().includes(search.toLowerCase()) ||
// //           order.userEmail.toLowerCase().includes(search.toLowerCase());
// //         const matchesStatus = statusFilter === "all" || order.status === statusFilter;
// //         const matchesPayment =
// //           paymentFilter === "all" || order.paymentStatus === paymentFilter;
// //         return matchesSearch && matchesStatus && matchesPayment;
// //       })
// //       .sort(
// //         (a, b) =>
// //           new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
// //       );
// //   }, [orders, search, statusFilter, paymentFilter]);

// //   const stats = useMemo(() => {
// //     const totalRevenue = orders
// //       .filter((o) => o.paymentStatus === "paid")
// //       .reduce((acc, o) => acc + o.total, 0);
// //     return {
// //       total: orders.length,
// //       pending: orders.filter((o) => o.status === "pending").length,
// //       inProgress: orders.filter((o) =>
// //         ["confirmed", "preparing", "shipped"].includes(o.status)
// //       ).length,
// //       completed: orders.filter((o) => o.status === "delivered").length,
// //       totalRevenue,
// //     };
// //   }, [orders]);

// //   const getStatusBadge = (status: Order["status"]) => {
// //     const config = {
// //       pending: { color: "bg-yellow-100 text-yellow-700", label: "Pendiente" },
// //       confirmed: { color: "bg-blue-100 text-blue-700", label: "Confirmado" },
// //       preparing: { color: "bg-orange-100 text-orange-700", label: "Preparando" },
// //       shipped: { color: "bg-purple-100 text-purple-700", label: "Enviado" },
// //       delivered: { color: "bg-green-100 text-green-700", label: "Entregado" },
// //       cancelled: { color: "bg-red-100 text-red-700", label: "Cancelado" },
// //     };
// //     return (
// //       <span
// //         className={cn(
// //           "px-2 py-1 rounded-full text-xs font-medium",
// //           config[status].color
// //         )}
// //       >
// //         {config[status].label}
// //       </span>
// //     );
// //   };

// //   const getPaymentBadge = (status: Order["paymentStatus"]) => {
// //     const config = {
// //       pending: { color: "bg-yellow-100 text-yellow-700", label: "Pendiente" },
// //       paid: { color: "bg-green-100 text-green-700", label: "Pagado" },
// //       refunded: { color: "bg-gray-100 text-gray-700", label: "Reembolsado" },
// //     };
// //     return (
// //       <span
// //         className={cn(
// //           "px-2 py-1 rounded-full text-xs font-medium",
// //           config[status].color
// //         )}
// //       >
// //         {config[status].label}
// //       </span>
// //     );
// //   };

// //   const formatDate = (dateString: string) => {
// //     return new Date(dateString).toLocaleDateString("es-ES", {
// //       year: "numeric",
// //       month: "short",
// //       day: "numeric",
// //       hour: "2-digit",
// //       minute: "2-digit",
// //     });
// //   };

// //   const handleViewDetails = (order: Order) => {
// //     setViewingOrder(order);
// //     setIsDetailOpen(true);
// //   };

// //   const handleStatusChange = (orderId: string, newStatus: Order["status"]) => {
// //     updateOrderStatus(orderId, newStatus);
// //     if (viewingOrder && viewingOrder.id === orderId) {
// //       setViewingOrder({ ...viewingOrder, status: newStatus });
// //     }
// //   };

// //   const handlePaymentStatusChange = (
// //     orderId: string,
// //     newStatus: Order["paymentStatus"]
// //   ) => {
// //     updatePaymentStatus(orderId, newStatus);
// //     if (viewingOrder && viewingOrder.id === orderId) {
// //       setViewingOrder({ ...viewingOrder, paymentStatus: newStatus });
// //     }
// //   };

// //   return (
// //     <div className="space-y-6">
// //       {/* Header */}
// //       <div>
// //         <h2 className="text-2xl font-bold">Gestión de Órdenes</h2>
// //         <p className="text-muted-foreground">
// //           Visualiza y administra todas las órdenes del sistema
// //         </p>
// //       </div>

// //       {/* Stats */}
// //       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
// //         <Card>
// //           <CardContent className="flex items-center gap-4 p-4">
// //             <div className="rounded-full bg-primary/10 p-3">
// //               <ShoppingBag className="h-5 w-5 text-primary" />
// //             </div>
// //             <div>
// //               <p className="text-sm text-muted-foreground">Total Órdenes</p>
// //               <p className="text-2xl font-bold">{stats.total}</p>
// //             </div>
// //           </CardContent>
// //         </Card>
// //         <Card>
// //           <CardContent className="flex items-center gap-4 p-4">
// //             <div className="rounded-full bg-yellow-500/10 p-3">
// //               <Clock className="h-5 w-5 text-yellow-500" />
// //             </div>
// //             <div>
// //               <p className="text-sm text-muted-foreground">Pendientes</p>
// //               <p className="text-2xl font-bold">{stats.pending}</p>
// //             </div>
// //           </CardContent>
// //         </Card>
// //         <Card>
// //           <CardContent className="flex items-center gap-4 p-4">
// //             <div className="rounded-full bg-blue-500/10 p-3">
// //               <Truck className="h-5 w-5 text-blue-500" />
// //             </div>
// //             <div>
// //               <p className="text-sm text-muted-foreground">En Proceso</p>
// //               <p className="text-2xl font-bold">{stats.inProgress}</p>
// //             </div>
// //           </CardContent>
// //         </Card>
// //         <Card>
// //           <CardContent className="flex items-center gap-4 p-4">
// //             <div className="rounded-full bg-green-500/10 p-3">
// //               <CheckCircle className="h-5 w-5 text-green-500" />
// //             </div>
// //             <div>
// //               <p className="text-sm text-muted-foreground">Completadas</p>
// //               <p className="text-2xl font-bold">{stats.completed}</p>
// //             </div>
// //           </CardContent>
// //         </Card>
// //         <Card>
// //           <CardContent className="flex items-center gap-4 p-4">
// //             <div className="rounded-full bg-primary/10 p-3">
// //               <CreditCard className="h-5 w-5 text-primary" />
// //             </div>
// //             <div>
// //               <p className="text-sm text-muted-foreground">Ingresos</p>
// //               <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)}€</p>
// //             </div>
// //           </CardContent>
// //         </Card>
// //       </div>

// //       {/* Filters */}
// //       <Card>
// //         <CardContent className="p-4">
// //           <div className="flex flex-col gap-4 sm:flex-row">
// //             <div className="relative flex-1">
// //               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
// //               <Input
// //                 placeholder="Buscar por ID, cliente o email..."
// //                 value={search}
// //                 onChange={(e) => setSearch(e.target.value)}
// //                 className="pl-9"
// //               />
// //             </div>
// //             <Select value={statusFilter} onValueChange={setStatusFilter}>
// //               <SelectTrigger className="w-full sm:w-44">
// //                 <SelectValue placeholder="Estado" />
// //               </SelectTrigger>
// //               <SelectContent>
// //                 <SelectItem value="all">Todos los estados</SelectItem>
// //                 <SelectItem value="pending">Pendiente</SelectItem>
// //                 <SelectItem value="confirmed">Confirmado</SelectItem>
// //                 <SelectItem value="preparing">Preparando</SelectItem>
// //                 <SelectItem value="shipped">Enviado</SelectItem>
// //                 <SelectItem value="delivered">Entregado</SelectItem>
// //                 <SelectItem value="cancelled">Cancelado</SelectItem>
// //               </SelectContent>
// //             </Select>
// //             <Select value={paymentFilter} onValueChange={setPaymentFilter}>
// //               <SelectTrigger className="w-full sm:w-40">
// //                 <SelectValue placeholder="Pago" />
// //               </SelectTrigger>
// //               <SelectContent>
// //                 <SelectItem value="all">Todos los pagos</SelectItem>
// //                 <SelectItem value="pending">Pendiente</SelectItem>
// //                 <SelectItem value="paid">Pagado</SelectItem>
// //                 <SelectItem value="refunded">Reembolsado</SelectItem>
// //               </SelectContent>
// //             </Select>
// //           </div>
// //         </CardContent>
// //       </Card>

// //       {/* Orders Table */}
// //       <Card>
// //         <CardHeader>
// //           <CardTitle>Lista de Órdenes ({filteredOrders.length})</CardTitle>
// //         </CardHeader>
// //         <CardContent>
// //           <div className="overflow-x-auto">
// //             <Table>
// //               <TableHeader>
// //                 <TableRow>
// //                   <TableHead>ID Orden</TableHead>
// //                   <TableHead>Cliente</TableHead>
// //                   <TableHead>Productos</TableHead>
// //                   <TableHead className="text-right">Total</TableHead>
// //                   <TableHead>Estado</TableHead>
// //                   <TableHead>Pago</TableHead>
// //                   <TableHead>Fecha</TableHead>
// //                   <TableHead className="text-right">Acciones</TableHead>
// //                 </TableRow>
// //               </TableHeader>
// //               <TableBody>
// //                 {filteredOrders.map((order) => (
// //                   <TableRow key={order.id}>
// //                     <TableCell className="font-mono font-medium">
// //                       {order.id}
// //                     </TableCell>
// //                     <TableCell>
// //                       <div>
// //                         <p className="font-medium">{order.userName}</p>
// //                         <p className="text-sm text-muted-foreground">
// //                           {order.userEmail}
// //                         </p>
// //                       </div>
// //                     </TableCell>
// //                     <TableCell>
// //                       <span className="text-sm">
// //                         {order.items.length} producto
// //                         {order.items.length !== 1 && "s"}
// //                       </span>
// //                     </TableCell>
// //                     <TableCell className="text-right font-medium">
// //                       {order.total.toFixed(2)}€
// //                     </TableCell>
// //                     <TableCell>{getStatusBadge(order.status)}</TableCell>
// //                     <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
// //                     <TableCell className="text-sm text-muted-foreground">
// //                       {formatDate(order.createdAt)}
// //                     </TableCell>
// //                     <TableCell className="text-right">
// //                       <Button
// //                         variant="ghost"
// //                         size="icon"
// //                         onClick={() => handleViewDetails(order)}
// //                       >
// //                         <Eye className="h-4 w-4" />
// //                       </Button>
// //                     </TableCell>
// //                   </TableRow>
// //                 ))}
// //                 {filteredOrders.length === 0 && (
// //                   <TableRow>
// //                     <TableCell colSpan={8} className="text-center py-8">
// //                       <p className="text-muted-foreground">
// //                         No se encontraron órdenes
// //                       </p>
// //                     </TableCell>
// //                   </TableRow>
// //                 )}
// //               </TableBody>
// //             </Table>
// //           </div>
// //         </CardContent>
// //       </Card>

// //       {/* Order Detail Dialog */}
// //       <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
// //         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
// //           <DialogHeader>
// //             <DialogTitle className="flex items-center gap-2">
// //               <Package className="h-5 w-5" />
// //               Orden {viewingOrder?.id}
// //             </DialogTitle>
// //           </DialogHeader>
// //           {viewingOrder && (
// //             <div className="space-y-6">
// //               {/* Status Controls */}
// //               <div className="grid gap-4 sm:grid-cols-2">
// //                 <Field>
// //                   <FieldLabel>Estado de la Orden</FieldLabel>
// //                   <Select
// //                     value={viewingOrder.status}
// //                     onValueChange={(value: Order["status"]) =>
// //                       handleStatusChange(viewingOrder.id, value)
// //                     }
// //                   >
// //                     <SelectTrigger>
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="pending">Pendiente</SelectItem>
// //                       <SelectItem value="confirmed">Confirmado</SelectItem>
// //                       <SelectItem value="preparing">Preparando</SelectItem>
// //                       <SelectItem value="shipped">Enviado</SelectItem>
// //                       <SelectItem value="delivered">Entregado</SelectItem>
// //                       <SelectItem value="cancelled">Cancelado</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </Field>
// //                 <Field>
// //                   <FieldLabel>Estado del Pago</FieldLabel>
// //                   <Select
// //                     value={viewingOrder.paymentStatus}
// //                     onValueChange={(value: Order["paymentStatus"]) =>
// //                       handlePaymentStatusChange(viewingOrder.id, value)
// //                     }
// //                   >
// //                     <SelectTrigger>
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="pending">Pendiente</SelectItem>
// //                       <SelectItem value="paid">Pagado</SelectItem>
// //                       <SelectItem value="refunded">Reembolsado</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </Field>
// //               </div>

// //               {/* Customer Info */}
// //               <Card>
// //                 <CardHeader className="pb-3">
// //                   <CardTitle className="text-base flex items-center gap-2">
// //                     <User className="h-4 w-4" />
// //                     Información del Cliente
// //                   </CardTitle>
// //                 </CardHeader>
// //                 <CardContent className="grid gap-3 sm:grid-cols-2">
// //                   <div>
// //                     <p className="text-sm text-muted-foreground">Nombre</p>
// //                     <p className="font-medium">{viewingOrder.userName}</p>
// //                   </div>
// //                   <div>
// //                     <p className="text-sm text-muted-foreground">Email</p>
// //                     <p className="font-medium">{viewingOrder.userEmail}</p>
// //                   </div>
// //                 </CardContent>
// //               </Card>

// //               {/* Delivery Info */}
// //               <Card>
// //                 <CardHeader className="pb-3">
// //                   <CardTitle className="text-base flex items-center gap-2">
// //                     <MapPin className="h-4 w-4" />
// //                     Información de Entrega
// //                   </CardTitle>
// //                 </CardHeader>
// //                 <CardContent className="space-y-3">
// //                   <div>
// //                     <p className="text-sm text-muted-foreground">Dirección</p>
// //                     <p className="font-medium">{viewingOrder.deliveryAddress}</p>
// //                   </div>
// //                   {viewingOrder.deliveryNotes && (
// //                     <div>
// //                       <p className="text-sm text-muted-foreground">Notas</p>
// //                       <p className="font-medium">{viewingOrder.deliveryNotes}</p>
// //                     </div>
// //                   )}
// //                 </CardContent>
// //               </Card>

// //               {/* Order Items */}
// //               <Card>
// //                 <CardHeader className="pb-3">
// //                   <CardTitle className="text-base flex items-center gap-2">
// //                     <ShoppingBag className="h-4 w-4" />
// //                     Productos ({viewingOrder.items.length})
// //                   </CardTitle>
// //                 </CardHeader>
// //                 <CardContent>
// //                   <div className="space-y-3">
// //                     {viewingOrder.items.map((item, index) => (
// //                       <div
// //                         key={index}
// //                         className="flex items-center justify-between py-2 border-b last:border-0"
// //                       >
// //                         <div>
// //                           <p className="font-medium">{item.productName}</p>
// //                           <p className="text-sm text-muted-foreground">
// //                             {item.price.toFixed(2)}€ x {item.quantity}
// //                           </p>
// //                         </div>
// //                         <p className="font-medium">
// //                           {(item.price * item.quantity).toFixed(2)}€
// //                         </p>
// //                       </div>
// //                     ))}
// //                   </div>
// //                   <div className="mt-4 pt-4 border-t space-y-2">
// //                     <div className="flex justify-between text-sm">
// //                       <span className="text-muted-foreground">Subtotal</span>
// //                       <span>{viewingOrder.subtotal.toFixed(2)}€</span>
// //                     </div>
// //                     <div className="flex justify-between text-sm">
// //                       <span className="text-muted-foreground">Envío</span>
// //                       <span>{viewingOrder.deliveryFee.toFixed(2)}€</span>
// //                     </div>
// //                     <div className="flex justify-between font-bold text-lg pt-2 border-t">
// //                       <span>Total</span>
// //                       <span>{viewingOrder.total.toFixed(2)}€</span>
// //                     </div>
// //                   </div>
// //                 </CardContent>
// //               </Card>

// //               {/* Payment & Dates */}
// //               <div className="grid gap-4 sm:grid-cols-2">
// //                 <Card>
// //                   <CardHeader className="pb-3">
// //                     <CardTitle className="text-base flex items-center gap-2">
// //                       <CreditCard className="h-4 w-4" />
// //                       Pago
// //                     </CardTitle>
// //                   </CardHeader>
// //                   <CardContent>
// //                     <p className="font-medium">{viewingOrder.paymentMethod}</p>
// //                     <div className="mt-2">
// //                       {getPaymentBadge(viewingOrder.paymentStatus)}
// //                     </div>
// //                   </CardContent>
// //                 </Card>
// //                 <Card>
// //                   <CardHeader className="pb-3">
// //                     <CardTitle className="text-base flex items-center gap-2">
// //                       <Calendar className="h-4 w-4" />
// //                       Fechas
// //                     </CardTitle>
// //                   </CardHeader>
// //                   <CardContent className="space-y-2">
// //                     <div>
// //                       <p className="text-sm text-muted-foreground">Creada</p>
// //                       <p className="text-sm font-medium">
// //                         {formatDate(viewingOrder.createdAt)}
// //                       </p>
// //                     </div>
// //                     <div>
// //                       <p className="text-sm text-muted-foreground">
// //                         Última actualización
// //                       </p>
// //                       <p className="text-sm font-medium">
// //                         {formatDate(viewingOrder.updatedAt)}
// //                       </p>
// //                     </div>
// //                   </CardContent>
// //                 </Card>
// //               </div>
// //             </div>
// //           )}
// //           <DialogFooter>
// //             <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
// //               Cerrar
// //             </Button>
// //           </DialogFooter>
// //         </DialogContent>
// //       </Dialog>
// //     </div>
// //   );
// // }

// "use client";

// import { useState, useMemo } from "react";
// import { useAdminStore, Order } from "@/lib/admin-store";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import {
//   Search,
//   Eye,
//   ShoppingBag,
//   Clock,
//   CheckCircle,
//   Truck,
//   Package,
//   CreditCard,
//   MapPin,
//   User,
//   Calendar,
//   Info,
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";

// export default function OrdersPage() {
//   const { orders, updateOrderStatus, updatePaymentStatus } = useAdminStore();
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const [paymentFilter, setPaymentFilter] = useState<string>("all");
//   const [isDetailOpen, setIsDetailOpen] = useState(false);
//   const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

//   // Normalización: convertir strings numéricas a number y asegurar valores por defecto
//   const normalizedOrders = useMemo(() => {
//     return orders.map((order) => ({
//       ...order,
//       subtotal: Number(order.subtotal) || 0,
//       deliveryFee: Number(order.deliveryFee) || 0,
//       total: Number(order.total) || 0,
//       items: (order.items || []).map((item) => ({
//         ...item,
//         price: Number(item.price) || 0,
//         quantity: Number(item.quantity) || 0,
//       })),
//     }));
//   }, [orders]);

//   const filteredOrders = useMemo(() => {
//     return normalizedOrders
//       .filter((order) => {
//         const matchesSearch =
//           order.id.toLowerCase().includes(search.toLowerCase()) ||
//           order.userName.toLowerCase().includes(search.toLowerCase()) ||
//           order.userEmail.toLowerCase().includes(search.toLowerCase());
//         const matchesStatus = statusFilter === "all" || order.status === statusFilter;
//         const matchesPayment =
//           paymentFilter === "all" || order.paymentStatus === paymentFilter;
//         return matchesSearch && matchesStatus && matchesPayment;
//       })
//       .sort(
//         (a, b) =>
//           new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//       );
//   }, [normalizedOrders, search, statusFilter, paymentFilter]);

//   const stats = useMemo(() => {
//     const totalRevenue = normalizedOrders
//       .filter((o) => o.paymentStatus === "paid")
//       .reduce((acc, o) => acc + o.total, 0);
//     return {
//       total: normalizedOrders.length,
//       pending: normalizedOrders.filter((o) => o.status === "pending").length,
//       inProgress: normalizedOrders.filter((o) =>
//         ["confirmed", "preparing", "shipped"].includes(o.status)
//       ).length,
//       completed: normalizedOrders.filter((o) => o.status === "delivered").length,
//       totalRevenue,
//     };
//   }, [normalizedOrders]);

//   // --- FUNCIONES DE BADGES CON FALLBACK ---
//   const getStatusBadge = (status: Order["status"]) => {
//     const config: Record<string, { color: string; label: string }> = {
//       pending: { color: "bg-yellow-100 text-yellow-700", label: "Pendiente" },
//       confirmed: { color: "bg-blue-100 text-blue-700", label: "Confirmado" },
//       preparing: { color: "bg-orange-100 text-orange-700", label: "Preparando" },
//       shipped: { color: "bg-purple-100 text-purple-700", label: "Enviado" },
//       delivered: { color: "bg-green-100 text-green-700", label: "Entregado" },
//       cancelled: { color: "bg-red-100 text-red-700", label: "Cancelado" },
//     };
//     const fallback = { color: "bg-gray-100 text-gray-700", label: "Desconocido" };
//     const { color, label } = config[status] || fallback;
//     return (
//       <span className={cn("px-2 py-1 rounded-full text-xs font-medium", color)}>
//         {label}
//       </span>
//     );
//   };

//   const getPaymentBadge = (status: Order["paymentStatus"]) => {
//     const config: Record<string, { color: string; label: string }> = {
//       pending: { color: "bg-yellow-100 text-yellow-700", label: "Pendiente" },
//       paid: { color: "bg-green-100 text-green-700", label: "Pagado" },
//       refunded: { color: "bg-gray-100 text-gray-700", label: "Reembolsado" },
//     };
//     const fallback = { color: "bg-gray-100 text-gray-700", label: "Desconocido" };
//     const { color, label } = config[status] || fallback;
//     return (
//       <span className={cn("px-2 py-1 rounded-full text-xs font-medium", color)}>
//         {label}
//       </span>
//     );
//   };
//   // --------------------------------------

//   const formatDate = (dateString: string) => {
//     if (!dateString) return "Fecha no disponible";
//     return new Date(dateString).toLocaleDateString("es-ES", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   const formatNumber = (num: number) => {
//     return new Intl.NumberFormat("es-ES").format(num);
//   };

//   const handleViewDetails = (order: Order) => {
//     setViewingOrder(order);
//     setIsDetailOpen(true);
//   };

//   const handleStatusChange = (orderId: string, newStatus: Order["status"]) => {
//     updateOrderStatus(orderId, newStatus);
//     if (viewingOrder && viewingOrder.id === orderId) {
//       setViewingOrder({ ...viewingOrder, status: newStatus });
//     }
//   };

//   const handlePaymentStatusChange = (
//     orderId: string,
//     newStatus: Order["paymentStatus"]
//   ) => {
//     updatePaymentStatus(orderId, newStatus);
//     if (viewingOrder && viewingOrder.id === orderId) {
//       setViewingOrder({ ...viewingOrder, paymentStatus: newStatus });
//     }
//   };

//   const statCards = [
//     {
//       key: "total",
//       label: "Total Órdenes",
//       value: stats.total,
//       icon: ShoppingBag,
//       color: "primary",
//       tooltip: "Número total de órdenes realizadas en la plataforma",
//     },
//     {
//       key: "pending",
//       label: "Pendientes",
//       value: stats.pending,
//       icon: Clock,
//       color: "yellow",
//       tooltip: "Órdenes que esperan confirmación",
//     },
//     {
//       key: "inProgress",
//       label: "En Proceso",
//       value: stats.inProgress,
//       icon: Truck,
//       color: "blue",
//       tooltip: "Órdenes en preparación o enviadas",
//     },
//     {
//       key: "completed",
//       label: "Completadas",
//       value: stats.completed,
//       icon: CheckCircle,
//       color: "green",
//       tooltip: "Órdenes entregadas exitosamente",
//     },
//     {
//       key: "revenue",
//       label: "Ingresos",
//       value: stats.totalRevenue,
//       icon: CreditCard,
//       color: "primary",
//       tooltip: "Ingresos totales de órdenes pagadas",
//       isCurrency: true,
//     },
//   ];

//   const colorClasses = {
//     primary: "bg-primary/10 text-primary",
//     yellow: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
//     blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
//     green: "bg-green-500/10 text-green-600 dark:text-green-400",
//   };

//   return (
//     <TooltipProvider>
//       <div className="space-y-6">
//         {/* Header */}
//         <div>
//           <h2 className="text-2xl font-bold">Gestión de Órdenes</h2>
//           <p className="text-muted-foreground">
//             Visualiza y administra todas las órdenes del sistema
//           </p>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
//           {statCards.map((card) => {
//             const Icon = card.icon;
//             const displayValue = card.isCurrency
//               ? `${card.value.toFixed(2)}€`
//               : formatNumber(card.value);
//             return (
//               <Card
//                 key={card.key}
//                 className="group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default"
//               >
//                 <CardContent className="flex items-center gap-3 p-3 sm:p-4">
//                   <div
//                     className={cn(
//                       "rounded-full p-2 sm:p-3 transition-colors duration-200",
//                       colorClasses[card.color as keyof typeof colorClasses]
//                     )}
//                     aria-hidden="true"
//                   >
//                     <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-1.5">
//                       <p className="text-xs sm:text-sm text-muted-foreground truncate">
//                         {card.label}
//                       </p>
//                       <Tooltip>
//                         <TooltipTrigger asChild>
//                           <button
//                             className="text-muted-foreground hover:text-foreground transition-colors"
//                             aria-label={`Más información sobre ${card.label}`}
//                           >
//                             <Info className="h-3 w-3" />
//                           </button>
//                         </TooltipTrigger>
//                         <TooltipContent side="top" className="max-w-xs">
//                           <p>{card.tooltip}</p>
//                         </TooltipContent>
//                       </Tooltip>
//                     </div>
//                     <p className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight tracking-tight">
//                       {displayValue}
//                     </p>
//                   </div>
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </div>

//         {/* Filters */}
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex flex-col gap-4 sm:flex-row">
//               <div className="relative flex-1">
//                 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                 <Input
//                   placeholder="Buscar por ID, cliente o email..."
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   className="pl-9"
//                 />
//               </div>
//               <Select value={statusFilter} onValueChange={setStatusFilter}>
//                 <SelectTrigger className="w-full sm:w-44">
//                   <SelectValue placeholder="Estado" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">Todos los estados</SelectItem>
//                   <SelectItem value="pending">Pendiente</SelectItem>
//                   <SelectItem value="confirmed">Confirmado</SelectItem>
//                   <SelectItem value="preparing">Preparando</SelectItem>
//                   <SelectItem value="shipped">Enviado</SelectItem>
//                   <SelectItem value="delivered">Entregado</SelectItem>
//                   <SelectItem value="cancelled">Cancelado</SelectItem>
//                 </SelectContent>
//               </Select>
//               <Select value={paymentFilter} onValueChange={setPaymentFilter}>
//                 <SelectTrigger className="w-full sm:w-40">
//                   <SelectValue placeholder="Pago" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">Todos los pagos</SelectItem>
//                   <SelectItem value="pending">Pendiente</SelectItem>
//                   <SelectItem value="paid">Pagado</SelectItem>
//                   <SelectItem value="refunded">Reembolsado</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Orders Table */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Lista de Órdenes ({filteredOrders.length})</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="overflow-x-auto">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>ID Orden</TableHead>
//                     <TableHead>Cliente</TableHead>
//                     <TableHead>Productos</TableHead>
//                     <TableHead className="text-right">Total</TableHead>
//                     <TableHead>Estado</TableHead>
//                     <TableHead>Pago</TableHead>
//                     <TableHead>Fecha</TableHead>
//                     <TableHead className="text-right">Acciones</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {filteredOrders.map((order) => (
//                     <TableRow key={order.id}>
//                       <TableCell className="font-mono font-medium">
//                         {order.id}
//                       </TableCell>
//                       <TableCell>
//                         <div>
//                           <p className="font-medium">{order.userName}</p>
//                           <p className="text-sm text-muted-foreground">
//                             {order.userEmail}
//                           </p>
//                         </div>
//                       </TableCell>
//                       <TableCell>
//                         <span className="text-sm">
//                           {order.items.length} producto
//                           {order.items.length !== 1 && "s"}
//                         </span>
//                       </TableCell>
//                       <TableCell className="text-right font-medium">
//                         {order.total.toFixed(2)}€
//                       </TableCell>
//                       <TableCell>{getStatusBadge(order.status)}</TableCell>
//                       <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
//                       <TableCell className="text-sm text-muted-foreground">
//                         {formatDate(order.createdAt)}
//                       </TableCell>
//                       <TableCell className="text-right">
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           onClick={() => handleViewDetails(order)}
//                         >
//                           <Eye className="h-4 w-4" />
//                         </Button>
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                   {filteredOrders.length === 0 && (
//                     <TableRow>
//                       <TableCell colSpan={8} className="text-center py-8">
//                         <p className="text-muted-foreground">
//                           No se encontraron órdenes
//                         </p>
//                       </TableCell>
//                     </TableRow>
//                   )}
//                 </TableBody>
//               </Table>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Order Detail Dialog */}
//         <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
//           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle className="flex items-center gap-2">
//                 <Package className="h-5 w-5" />
//                 Orden {viewingOrder?.id}
//               </DialogTitle>
//             </DialogHeader>
//             {viewingOrder && (
//               <div className="space-y-6">
//                 {/* Status Controls */}
//                 <div className="grid gap-4 sm:grid-cols-2">
//                   <Field>
//                     <FieldLabel>Estado de la Orden</FieldLabel>
//                     <Select
//                       value={viewingOrder.status}
//                       onValueChange={(value: Order["status"]) =>
//                         handleStatusChange(viewingOrder.id, value)
//                       }
//                     >
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="pending">Pendiente</SelectItem>
//                         <SelectItem value="confirmed">Confirmado</SelectItem>
//                         <SelectItem value="preparing">Preparando</SelectItem>
//                         <SelectItem value="shipped">Enviado</SelectItem>
//                         <SelectItem value="delivered">Entregado</SelectItem>
//                         <SelectItem value="cancelled">Cancelado</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </Field>
//                   <Field>
//                     <FieldLabel>Estado del Pago</FieldLabel>
//                     <Select
//                       value={viewingOrder.paymentStatus}
//                       onValueChange={(value: Order["paymentStatus"]) =>
//                         handlePaymentStatusChange(viewingOrder.id, value)
//                       }
//                     >
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="pending">Pendiente</SelectItem>
//                         <SelectItem value="paid">Pagado</SelectItem>
//                         <SelectItem value="refunded">Reembolsado</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </Field>
//                 </div>

//                 {/* Customer Info */}
//                 <Card>
//                   <CardHeader className="pb-3">
//                     <CardTitle className="text-base flex items-center gap-2">
//                       <User className="h-4 w-4" />
//                       Información del Cliente
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="grid gap-3 sm:grid-cols-2">
//                     <div>
//                       <p className="text-sm text-muted-foreground">Nombre</p>
//                       <p className="font-medium">{viewingOrder.userName}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-muted-foreground">Email</p>
//                       <p className="font-medium">{viewingOrder.userEmail}</p>
//                     </div>
//                   </CardContent>
//                 </Card>

//                 {/* Delivery Info */}
//                 <Card>
//                   <CardHeader className="pb-3">
//                     <CardTitle className="text-base flex items-center gap-2">
//                       <MapPin className="h-4 w-4" />
//                       Información de Entrega
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-3">
//                     <div>
//                       <p className="text-sm text-muted-foreground">Dirección</p>
//                       <p className="font-medium">{viewingOrder.deliveryAddress}</p>
//                     </div>
//                     {viewingOrder.deliveryNotes && (
//                       <div>
//                         <p className="text-sm text-muted-foreground">Notas</p>
//                         <p className="font-medium">{viewingOrder.deliveryNotes}</p>
//                       </div>
//                     )}
//                   </CardContent>
//                 </Card>

//                 {/* Order Items */}
//                 <Card>
//                   <CardHeader className="pb-3">
//                     <CardTitle className="text-base flex items-center gap-2">
//                       <ShoppingBag className="h-4 w-4" />
//                       Productos ({viewingOrder.items.length})
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="space-y-3">
//                       {viewingOrder.items.map((item, index) => (
//                         <div
//                           key={index}
//                           className="flex items-center justify-between py-2 border-b last:border-0"
//                         >
//                           <div>
//                             <p className="font-medium">{item.productName}</p>
//                             <p className="text-sm text-muted-foreground">
//                               {item.price.toFixed(2)}€ x {item.quantity}
//                             </p>
//                           </div>
//                           <p className="font-medium">
//                             {(item.price * item.quantity).toFixed(2)}€
//                           </p>
//                         </div>
//                       ))}
//                     </div>
//                     <div className="mt-4 pt-4 border-t space-y-2">
//                       <div className="flex justify-between text-sm">
//                         <span className="text-muted-foreground">Subtotal</span>
//                         <span>{viewingOrder.subtotal.toFixed(2)}€</span>
//                       </div>
//                       <div className="flex justify-between text-sm">
//                         <span className="text-muted-foreground">Envío</span>
//                         <span>{viewingOrder.deliveryFee.toFixed(2)}€</span>
//                       </div>
//                       <div className="flex justify-between font-bold text-lg pt-2 border-t">
//                         <span>Total</span>
//                         <span>{viewingOrder.total.toFixed(2)}€</span>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>

//                 {/* Payment & Dates */}
//                 <div className="grid gap-4 sm:grid-cols-2">
//                   <Card>
//                     <CardHeader className="pb-3">
//                       <CardTitle className="text-base flex items-center gap-2">
//                         <CreditCard className="h-4 w-4" />
//                         Pago
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                       <p className="font-medium">{viewingOrder.paymentMethod}</p>
//                       <div className="mt-2">
//                         {getPaymentBadge(viewingOrder.paymentStatus)}
//                       </div>
//                     </CardContent>
//                   </Card>
//                   <Card>
//                     <CardHeader className="pb-3">
//                       <CardTitle className="text-base flex items-center gap-2">
//                         <Calendar className="h-4 w-4" />
//                         Fechas
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent className="space-y-2">
//                       <div>
//                         <p className="text-sm text-muted-foreground">Creada</p>
//                         <p className="text-sm font-medium">
//                           {formatDate(viewingOrder.createdAt)}
//                         </p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-muted-foreground">
//                           Última actualización
//                         </p>
//                         <p className="text-sm font-medium">
//                           {formatDate(viewingOrder.updatedAt)}
//                         </p>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </div>
//               </div>
//             )}
//             <DialogFooter>
//               <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
//                 Cerrar
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </div>
//     </TooltipProvider>
//   );
// }

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Package,
  CreditCard,
  MapPin,
  User,
  Calendar,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";

export default function OrdersPage() {
  const { orders, updateOrderStatus, updatePaymentStatus } = useAdminStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
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
  const getStatusBadge = (status: Order["status"]) => {
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-700", label: "Pendiente" },
      confirmed: { color: "bg-blue-100 text-blue-700", label: "Confirmado" },
      preparing: { color: "bg-orange-100 text-orange-700", label: "Preparando" },
      shipped: { color: "bg-purple-100 text-purple-700", label: "Enviado" },
      delivered: { color: "bg-green-100 text-green-700", label: "Entregado" },
      cancelled: { color: "bg-red-100 text-red-700", label: "Cancelado" },
    };
    const fallback = { color: "bg-gray-100 text-gray-700", label: "Desconocido" };
    const { color, label } = config[status] || fallback;
    return (
      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", color)}>
        {label}
      </span>
    );
  };

  const getPaymentBadge = (status: Order["paymentStatus"]) => {
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-700", label: "Pendiente" },
      paid: { color: "bg-green-100 text-green-700", label: "Pagado" },
      refunded: { color: "bg-gray-100 text-gray-700", label: "Reembolsado" },
    };
    const fallback = { color: "bg-gray-100 text-gray-700", label: "Desconocido" };
    const { color, label } = config[status] || fallback;
    return (
      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", color)}>
        {label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Fecha no disponible";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-ES").format(num);
  };

  const handleViewDetails = (order: Order) => {
    setViewingOrder(order);
    setIsDetailOpen(true);
  };

  const handleStatusChange = (orderId: string, newStatus: Order["status"]) => {
    updateOrderStatus(orderId, newStatus);
    if (viewingOrder && viewingOrder.id === orderId) {
      setViewingOrder({ ...viewingOrder, status: newStatus });
    }
  };

  const handlePaymentStatusChange = (
    orderId: string,
    newStatus: Order["paymentStatus"]
  ) => {
    updatePaymentStatus(orderId, newStatus);
    if (viewingOrder && viewingOrder.id === orderId) {
      setViewingOrder({ ...viewingOrder, paymentStatus: newStatus });
    }
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
              ? `${card.value.toFixed(2)}€`
              : formatNumber(card.value);
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
                    {getStatusBadge(order.status)}
                    {getPaymentBadge(order.paymentStatus)}
                  </div>
                  <p className="font-bold text-lg">{order.total.toFixed(2)}€</p>
                </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>{order.items.length} producto(s)</span>
                  <span>{formatDate(order.createdAt)}</span>
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
                          {order.total.toFixed(2)}€
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
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

        {/* Order Detail Dialog (sin cambios) */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Orden {viewingOrder?.id}
              </DialogTitle>
            </DialogHeader>
            {viewingOrder && (
              <div className="space-y-6">
                {/* Status Controls */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Estado de la Orden</FieldLabel>
                    <Select
                      value={viewingOrder.status}
                      onValueChange={(value: Order["status"]) =>
                        handleStatusChange(viewingOrder.id, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="confirmed">Confirmado</SelectItem>
                        <SelectItem value="preparing">Preparando</SelectItem>
                        <SelectItem value="shipped">Enviado</SelectItem>
                        <SelectItem value="delivered">Entregado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Estado del Pago</FieldLabel>
                    <Select
                      value={viewingOrder.paymentStatus}
                      onValueChange={(value: Order["paymentStatus"]) =>
                        handlePaymentStatusChange(viewingOrder.id, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="paid">Pagado</SelectItem>
                        <SelectItem value="refunded">Reembolsado</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                {/* Customer Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Información del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="font-medium">{viewingOrder.userName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{viewingOrder.userEmail}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Información de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Dirección</p>
                      <p className="font-medium">{viewingOrder.deliveryAddress}</p>
                    </div>
                    {viewingOrder.deliveryNotes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notas</p>
                        <p className="font-medium">{viewingOrder.deliveryNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Productos ({viewingOrder.items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {viewingOrder.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.price.toFixed(2)}€ x {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium">
                            {(item.price * item.quantity).toFixed(2)}€
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{viewingOrder.subtotal.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Envío</span>
                        <span>{viewingOrder.deliveryFee.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>{viewingOrder.total.toFixed(2)}€</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment & Dates */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Pago
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{viewingOrder.paymentMethod}</p>
                      <div className="mt-2">
                        {getPaymentBadge(viewingOrder.paymentStatus)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Fechas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Creada</p>
                        <p className="text-sm font-medium">
                          {formatDate(viewingOrder.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Última actualización
                        </p>
                        <p className="text-sm font-medium">
                          {formatDate(viewingOrder.updatedAt)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}