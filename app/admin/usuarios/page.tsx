// "use client";

// import { useState, useMemo } from "react";
// import { useAdminStore, User } from "@/lib/admin-store";
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
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import {
//   Plus,
//   Pencil,
//   Trash2,
//   Search,
//   Users,
//   UserCheck,
//   UserX,
//   Shield,
//   Eye,
//   Mail,
//   Phone,
//   MapPin,
//   ShoppingBag,
//   DollarSign,
//   Calendar,
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";

// export default function UsersPage() {
//   const { users, addUser, updateUser, deleteUser } = useAdminStore();
//   const [search, setSearch] = useState("");
//   const [roleFilter, setRoleFilter] = useState<string>("all");
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [isDetailOpen, setIsDetailOpen] = useState(false);
//   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
//   const [editingUser, setEditingUser] = useState<User | null>(null);
//   const [viewingUser, setViewingUser] = useState<User | null>(null);
//   const [userToDelete, setUserToDelete] = useState<User | null>(null);
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     address: "",
//     role: "user" as "admin" | "user",
//     status: "active" as "active" | "inactive" | "suspended",
//   });

//   const filteredUsers = useMemo(() => {
//     return users.filter((user) => {
//       const matchesSearch =
//         user.name.toLowerCase().includes(search.toLowerCase()) ||
//         user.email.toLowerCase().includes(search.toLowerCase()) ||
//         user.phone.includes(search);
//       const matchesRole = roleFilter === "all" || user.role_id === roleFilter;
//       const matchesStatus = statusFilter === "all" || user.status === statusFilter;
//       return matchesSearch && matchesRole && matchesStatus;
//     });
//   }, [users, search, roleFilter, statusFilter]);

//   const stats = useMemo(() => {
//     return {
//       total: users.length,
//       active: users.filter((u) => u.status === "active").length,
//       admins: users.filter((u) => u.role === "admin").length,
//       suspended: users.filter((u) => u.status === "suspended").length,
//     };
//   }, [users]);

//   const handleOpenDialog = (user?: User) => {
//     if (user) {
//       setEditingUser(user);
//       setFormData({
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         address: user.address,
//         role: user.role,
//         status: user.status,
//       });
//     } else {
//       setEditingUser(null);
//       setFormData({
//         name: "",
//         email: "",
//         phone: "",
//         address: "",
//         role: "customer",
//         status: "active",
//       });
//     }
//     setIsDialogOpen(true);
//   };

//   const handleSave = () => {
//     if (editingUser) {
//       updateUser(editingUser.id, formData);
//     } else {
//       const newUser: User = {
//         id: Date.now().toString(),
//         ...formData,
//         createdAt: new Date().toISOString().split("T")[0],
//         totalOrders: 0,
//         totalSpent: 0,
//       };
//       addUser(newUser);
//     }
//     setIsDialogOpen(false);
//   };

//   const handleDelete = () => {
//     if (userToDelete) {
//       deleteUser(userToDelete.id);
//       setUserToDelete(null);
//     }
//     setIsDeleteOpen(false);
//   };

//   const handleViewDetails = (user: User) => {
//     setViewingUser(user);
//     setIsDetailOpen(true);
//   };

//   const getStatusBadge = (status: User["status"]) => {
//     const styles = {
//       active: "bg-green-100 text-green-700",
//       inactive: "bg-gray-100 text-gray-700",
//       suspended: "bg-red-100 text-red-700",
//     };
//     const labels = {
//       active: "Activo",
//       inactive: "Inactivo",
//       suspended: "Suspendido",
//     };
//     return (
//       <span className={cn("px-2 py-1 rounded-full text-xs font-medium", styles[status])}>
//         {labels[status]}
//       </span>
//     );
//   };

//   const getRoleBadge = (role: User["role"]) => {
//     const styles = {
//       admin: "bg-purple-100 text-purple-700",
//       customer: "bg-blue-100 text-blue-700",
//     };
//     const labels = {
//       admin: "Administrador",
//       customer: "Cliente",
//     };
//     return (
//       <span className={cn("px-2 py-1 rounded-full text-xs font-medium", styles[role])}>
//         {labels[role]}
//       </span>
//     );
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
//           <p className="text-muted-foreground">
//             Administra los usuarios y sus permisos
//           </p>
//         </div>
//         <Button onClick={() => handleOpenDialog()} className="gap-2">
//           <Plus className="h-4 w-4" />
//           Nuevo Usuario
//         </Button>
//       </div>

//       {/* Stats */}
//       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//         <Card>
//           <CardContent className="flex items-center gap-4 p-4">
//             <div className="rounded-full bg-primary/10 p-3">
//               <Users className="h-5 w-5 text-primary" />
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Total Usuarios</p>
//               <p className="text-2xl font-bold">{stats.total}</p>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="flex items-center gap-4 p-4">
//             <div className="rounded-full bg-green-500/10 p-3">
//               <UserCheck className="h-5 w-5 text-green-500" />
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Activos</p>
//               <p className="text-2xl font-bold">{stats.active}</p>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="flex items-center gap-4 p-4">
//             <div className="rounded-full bg-purple-500/10 p-3">
//               <Shield className="h-5 w-5 text-purple-500" />
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Administradores</p>
//               <p className="text-2xl font-bold">{stats.admins}</p>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="flex items-center gap-4 p-4">
//             <div className="rounded-full bg-red-500/10 p-3">
//               <UserX className="h-5 w-5 text-red-500" />
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Suspendidos</p>
//               <p className="text-2xl font-bold">{stats.suspended}</p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Filters */}
//       <Card>
//         <CardContent className="p-4">
//           <div className="flex flex-col gap-4 sm:flex-row">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//               <Input
//                 placeholder="Buscar por nombre, email o teléfono..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="pl-9"
//               />
//             </div>
//             <Select value={roleFilter} onValueChange={setRoleFilter}>
//               <SelectTrigger className="w-full sm:w-40">
//                 <SelectValue placeholder="Rol" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">Todos los roles</SelectItem>
//                 <SelectItem value="admin">Administrador</SelectItem>
//                 <SelectItem value="customer">Cliente</SelectItem>
//               </SelectContent>
//             </Select>
//             <Select value={statusFilter} onValueChange={setStatusFilter}>
//               <SelectTrigger className="w-full sm:w-40">
//                 <SelectValue placeholder="Estado" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">Todos los estados</SelectItem>
//                 <SelectItem value="active">Activo</SelectItem>
//                 <SelectItem value="inactive">Inactivo</SelectItem>
//                 <SelectItem value="suspended">Suspendido</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Users Table */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Lista de Usuarios ({filteredUsers.length})</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Usuario</TableHead>
//                   <TableHead>Contacto</TableHead>
//                   <TableHead>Rol</TableHead>
//                   <TableHead>Estado</TableHead>
//                   <TableHead className="text-right">Órdenes</TableHead>
//                   <TableHead className="text-right">Total Gastado</TableHead>
//                   <TableHead className="text-right">Acciones</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredUsers.map((user) => (
//                   <TableRow key={user.id}>
//                     <TableCell>
//                       <div>
//                         <p className="font-medium">{user.name}</p>
//                         <p className="text-sm text-muted-foreground">
//                           Desde {user.created_at}
//                         </p>
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <div className="text-sm">
//                         <p>{user.email}</p>
//                         <p className="text-muted-foreground">{user.phone}</p>
//                       </div>
//                     </TableCell>
//                     <TableCell>{getRoleBadge(user.role_id)}</TableCell>
//                     <TableCell>{getStatusBadge(user.status)}</TableCell>
//                     <TableCell className="text-right">{user.total_orders?? 0}</TableCell>
//                    <TableCell className="text-right font-medium">  {(user.total_spent ?? 0).toFixed(2)}€</TableCell>
//                     <TableCell className="text-right">
//                       <div className="flex justify-end gap-2">
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           onClick={() => handleViewDetails(user)}
//                         >
//                           <Eye className="h-4 w-4" />
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           onClick={() => handleOpenDialog(user)}
//                         >
//                           <Pencil className="h-4 w-4" />
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           className="text-destructive hover:text-destructive"
//                           onClick={() => {
//                             setUserToDelete(user);
//                             setIsDeleteOpen(true);
//                           }}
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//                 {filteredUsers.length === 0 && (
//                   <TableRow>
//                     <TableCell colSpan={7} className="text-center py-8">
//                       <p className="text-muted-foreground">
//                         No se encontraron usuarios
//                       </p>
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* User Form Dialog */}
//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle>
//               {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
//             </DialogTitle>
//           </DialogHeader>
//           <FieldGroup>
//             <Field>
//               <FieldLabel>Nombre completo</FieldLabel>
//               <Input
//                 value={formData.name}
//                 onChange={(e) =>
//                   setFormData({ ...formData, name: e.target.value })
//                 }
//                 placeholder="María García"
//               />
//             </Field>
//             <Field>
//               <FieldLabel>Correo electrónico</FieldLabel>
//               <Input
//                 type="email"
//                 value={formData.email}
//                 onChange={(e) =>
//                   setFormData({ ...formData, email: e.target.value })
//                 }
//                 placeholder="maria@ejemplo.com"
//               />
//             </Field>
//             <Field>
//               <FieldLabel>Teléfono</FieldLabel>
//               <Input
//                 value={formData.phone}
//                 onChange={(e) =>
//                   setFormData({ ...formData, phone: e.target.value })
//                 }
//                 placeholder="+34 612 345 678"
//               />
//             </Field>
//             <Field>
//               <FieldLabel>Dirección</FieldLabel>
//               <Input
//                 value={formData.address}
//                 onChange={(e) =>
//                   setFormData({ ...formData, address: e.target.value })
//                 }
//                 placeholder="Calle Mayor 123, Madrid"
//               />
//             </Field>
//             <div className="grid grid-cols-2 gap-4">
//               <Field>
//                 <FieldLabel>Rol</FieldLabel>
//                 <Select
//                   value={formData.role}
//                   onValueChange={(value: "admin" | "customer") =>
//                     setFormData({ ...formData, role: value })
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="customer">Cliente</SelectItem>
//                     <SelectItem value="admin">Administrador</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </Field>
//               <Field>
//                 <FieldLabel>Estado</FieldLabel>
//                 <Select
//                   value={formData.status}
//                   onValueChange={(value: "active" | "inactive" | "suspended") =>
//                     setFormData({ ...formData, status: value })
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="active">Activo</SelectItem>
//                     <SelectItem value="inactive">Inactivo</SelectItem>
//                     <SelectItem value="suspended">Suspendido</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </Field>
//             </div>
//           </FieldGroup>
//           <DialogFooter className="gap-2">
//             <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
//               Cancelar
//             </Button>
//             <Button onClick={handleSave}>
//               {editingUser ? "Guardar Cambios" : "Crear Usuario"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* User Detail Dialog */}
//       <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
//         <DialogContent className="max-w-lg">
//           <DialogHeader>
//             <DialogTitle>Detalles del Usuario</DialogTitle>
//           </DialogHeader>
//           {viewingUser && (
//             <div className="space-y-6">
//               <div className="flex items-center gap-4">
//                 <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
//                   <Users className="h-8 w-8 text-primary" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-semibold">{viewingUser.name}</h3>
//                   <div className="flex gap-2 mt-1">
//                     {getRoleBadge(viewingUser.role_id)}
//                     {getStatusBadge(viewingUser.status)}
//                   </div>
//                 </div>
//               </div>

//               <div className="grid gap-4 sm:grid-cols-2">
//                 <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
//                   <Mail className="h-5 w-5 text-muted-foreground" />
//                   <div>
//                     <p className="text-xs text-muted-foreground">Email</p>
//                     <p className="text-sm font-medium">{viewingUser.email}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
//                   <Phone className="h-5 w-5 text-muted-foreground" />
//                   <div>
//                     <p className="text-xs text-muted-foreground">Teléfono</p>
//                     <p className="text-sm font-medium">{viewingUser.phone}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 sm:col-span-2">
//                   <MapPin className="h-5 w-5 text-muted-foreground" />
//                   <div>
//                     <p className="text-xs text-muted-foreground">Dirección</p>
//                     <p className="text-sm font-medium">{viewingUser.address}</p>
//                   </div>
//                 </div>
//               </div>

//               <div className="grid grid-cols-3 gap-4">
//                 <div className="text-center p-4 rounded-lg bg-muted/50">
//                   <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-primary" />
//                   <p className="text-2xl font-bold">{viewingUser.total_orders??0}</p>
//                   <p className="text-xs text-muted-foreground">Órdenes</p>
//                 </div>
//                 <div className="text-center p-4 rounded-lg bg-muted/50">
//                   <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
//                   <p className="text-2xl font-bold">{(viewingUser.total_spent ?? 0).toFixed(2)}€</p>
//                   <p className="text-xs text-muted-foreground">Total Gastado</p>
//                 </div>
//                 <div className="text-center p-4 rounded-lg bg-muted/50">
//                   <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
//                   <p className="text-sm font-bold">{viewingUser.created_at}</p>
//                   <p className="text-xs text-muted-foreground">Registro</p>
//                 </div>
//               </div>
//             </div>
//           )}
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
//               Cerrar
//             </Button>
//             <Button
//               onClick={() => {
//                 setIsDetailOpen(false);
//                 if (viewingUser) handleOpenDialog(viewingUser);
//               }}
//             >
//               Editar Usuario
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Delete Confirmation */}
//       <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
//             <AlertDialogDescription>
//               Esta acción no se puede deshacer. Se eliminará permanentemente el
//               usuario <strong>{userToDelete?.name}</strong> y todos sus datos
//               asociados.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancelar</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={handleDelete}
//               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//             >
//               Eliminar
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }

"use client";

import { useState, useMemo } from "react";
import { useAdminStore, User } from "@/lib/admin-store";
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
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  UserCheck,
  UserX,
  Shield,
  Eye,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  DollarSign,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";

// Mapeo de role_id a nombre y estilos
const ROLE_MAP: Record<number, { name: string; label: string; style: string }> =
  {
    1: { name: "user", label: "Cliente", style: "bg-blue-100 text-blue-700" },
    2: {
      name: "admin",
      label: "Administrador",
      style: "bg-purple-100 text-purple-700",
    },
  };

// Mapeo de status a estilos
const STATUS_MAP = {
  active: { label: "Activo", style: "bg-green-100 text-green-700" },
  inactive: { label: "Inactivo", style: "bg-gray-100 text-gray-700" },
  suspended: { label: "Suspendido", style: "bg-red-100 text-red-700" },
};

export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser } = useAdminStore();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    role_id: 1, // 1 = user, 2 = admin
    status: "active" as "active" | "inactive" | "suspended",
  });

  // Normalizar usuarios (asegurar valores por defecto)
  const normalizedUsers = useMemo(() => {
    return users.map((user) => ({
      ...user,
      total_orders: user.total_orders ?? 0,
      total_spent: user.total_spent ?? 0,
      created_at: user.created_at || new Date().toISOString(),
    }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    return normalizedUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.phone.includes(search);
      const matchesRole = roleFilter === "all" || user.role_id === roleFilter;
      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [normalizedUsers, search, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const adminRoleId = Object.keys(ROLE_MAP).find(
      (key) => ROLE_MAP[Number(key)].name === "admin",
    );
    return {
      total: normalizedUsers.length,
      active: normalizedUsers.filter((u) => u.status === "active").length,
      admins: normalizedUsers.filter((u) => u.role_id === Number(adminRoleId))
        .length,
      suspended: normalizedUsers.filter((u) => u.status === "suspended").length,
    };
  }, [normalizedUsers]);

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role_id: user.role_id,
        status: user.status,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        role_id: 1,
        status: "active",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingUser) {
      updateUser(editingUser.id, formData);
    } else {
      const newUser: User = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role_id: formData.role_id,
        status: formData.status,
        created_at: new Date().toISOString(),
        total_orders: 0,
        total_spent: 0,
        password_hash: "", // se generará en el backend
        gender: null,
      };
      addUser(newUser);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      setUserToDelete(null);
    }
    setIsDeleteOpen(false);
  };

  const handleViewDetails = (user: User) => {
    setViewingUser(user);
    setIsDetailOpen(true);
  };

  const getStatusBadge = (status: User["status"]) => {
    const config = STATUS_MAP[status] || STATUS_MAP.inactive;
    return (
      <span
        className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          config.style,
        )}
      >
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (roleId: number) => {
    const role = ROLE_MAP[roleId] || ROLE_MAP[1];
    return (
      <span
        className={cn("px-2 py-1 rounded-full text-xs font-medium", role.style)}
      >
        {role.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Administra los usuarios y sus permisos
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Usuarios</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-500/10 p-3">
              <UserCheck className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Activos</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-purple-500/10 p-3">
              <Shield className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Administradores</p>
              <p className="text-2xl font-bold">{stats.admins}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-red-500/10 p-3">
              <UserX className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Suspendidos</p>
              <p className="text-2xl font-bold">{stats.suspended}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={roleFilter === "all" ? "all" : String(roleFilter)}
              onValueChange={(val) =>
                setRoleFilter(val === "all" ? "all" : Number(val))
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="2">Administrador</SelectItem>
                <SelectItem value="1">Cliente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
                <SelectItem value="suspended">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Órdenes</TableHead>
                  <TableHead className="text-right">Total Gastado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Desde {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{user.email}</p>
                        <p className="text-muted-foreground">{user.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role_id)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-right">
                      {" "}
                      {Number(user.total_orders) || 0}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {(Number(user.total_spent) || 0).toFixed(2)}€
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No se encontraron usuarios
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Nombre completo</FieldLabel>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="María García"
              />
            </Field>
            <Field>
              <FieldLabel>Correo electrónico</FieldLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="maria@ejemplo.com"
              />
            </Field>
            <Field>
              <FieldLabel>Teléfono</FieldLabel>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+34 612 345 678"
              />
            </Field>
            <Field>
              <FieldLabel>Dirección</FieldLabel>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Calle Mayor 123, Madrid"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Rol</FieldLabel>
                <Select
                  value={String(formData.role_id)}
                  onValueChange={(val) =>
                    setFormData({ ...formData, role_id: Number(val) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Cliente</SelectItem>
                    <SelectItem value="2">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Estado</FieldLabel>
                <Select
                  value={formData.status}
                  onValueChange={(val: "active" | "inactive" | "suspended") =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="suspended">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingUser ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{viewingUser.name}</h3>
                  <div className="flex gap-2 mt-1">
                    {getRoleBadge(viewingUser.role_id)}
                    {getStatusBadge(viewingUser.status)}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{viewingUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="text-sm font-medium">{viewingUser.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 sm:col-span-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dirección</p>
                    <p className="text-sm font-medium">{viewingUser.address}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">
                    {viewingUser.total_orders}
                  </p>
                  <p className="text-xs text-muted-foreground">Órdenes</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">
                    {(Number(viewingUser.total_spent) || 0).toFixed(2)}€
                  </p>
                  <p className="text-xs text-muted-foreground">Total Gastado</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-bold">
                    {new Date(viewingUser.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Registro</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setIsDetailOpen(false);
                if (viewingUser) handleOpenDialog(viewingUser);
              }}
            >
              Editar Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              usuario <strong>{userToDelete?.name}</strong> y todos sus datos
              asociados.
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
  );
}
