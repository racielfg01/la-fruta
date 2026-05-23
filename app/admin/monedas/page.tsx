// // "use client";

// // import { useState, useMemo } from "react";
// // import { useAdminStore, Currency } from "@/lib/admin-store";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
// //   DialogDescription,
// // } from "@/components/ui/dialog";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "@/components/ui/select";
// // import {
// //   AlertDialog,
// //   AlertDialogAction,
// //   AlertDialogCancel,
// //   AlertDialogContent,
// //   AlertDialogDescription,
// //   AlertDialogFooter,
// //   AlertDialogHeader,
// //   AlertDialogTitle,
// // } from "@/components/ui/alert-dialog";
// // import { Switch } from "@/components/ui/switch";
// // import {
// //   Plus,
// //   Pencil,
// //   Trash2,
// //   Search,
// //   Coins,
// //   Star,
// //   Check,
// //   X,
// //   TrendingUp,
// //   Globe,
// //   RefreshCw,
// // } from "lucide-react";
// // import { cn } from "@/lib/utils";
// // import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";

// // export default function CurrenciesPage() {
// //   const {
// //     currencies,
// //     addCurrency,
// //     updateCurrency,
// //     deleteCurrency,
// //     setDefaultCurrency,
// //   } = useAdminStore();
// //   const [search, setSearch] = useState("");
// //   const [statusFilter, setStatusFilter] = useState<string>("all");
// //   const [isDialogOpen, setIsDialogOpen] = useState(false);
// //   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
// //   const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
// //   const [currencyToDelete, setCurrencyToDelete] = useState<Currency | null>(null);
// //   const [formData, setFormData] = useState({
// //     code: "",
// //     name: "",
// //     symbol: "",
// //     exchangeRate: 1,
// //     isActive: true,
// //   });

// //   const filteredCurrencies = useMemo(() => {
// //     return currencies.filter((currency) => {
// //       const matchesSearch =
// //         currency.code.toLowerCase().includes(search.toLowerCase()) ||
// //         currency.name.toLowerCase().includes(search.toLowerCase());
// //       const matchesStatus =
// //         statusFilter === "all" ||
// //         (statusFilter === "active" && currency.isActive) ||
// //         (statusFilter === "inactive" && !currency.isActive);
// //       return matchesSearch && matchesStatus;
// //     });
// //   }, [currencies, search, statusFilter]);

// //   const stats = useMemo(() => {
// //     const defaultCurrency = currencies.find((c) => c.isDefault);
// //     return {
// //       total: currencies.length,
// //       active: currencies.filter((c) => c.isActive).length,
// //       inactive: currencies.filter((c) => !c.isActive).length,
// //       defaultCurrency: defaultCurrency?.code || "N/A",
// //     };
// //   }, [currencies]);

// //   const handleOpenDialog = (currency?: Currency) => {
// //     if (currency) {
// //       setEditingCurrency(currency);
// //       setFormData({
// //         code: currency.code,
// //         name: currency.name,
// //         symbol: currency.symbol,
// //         exchangeRate: currency.exchangeRate ?? 1,
// //         isActive: currency.isActive,
// //       });
// //     } else {
// //       setEditingCurrency(null);
// //       setFormData({
// //         code: "",
// //         name: "",
// //         symbol: "",
// //         exchangeRate: 1,
// //         isActive: true,
// //       });
// //     }
// //     setIsDialogOpen(true);
// //   };

// //   const handleSave = () => {
// //     if (editingCurrency) {
// //       updateCurrency(editingCurrency.id, formData);
// //     } else {
// //       const newCurrency: Currency = {
// //         id: Date.now().toString(),
// //         ...formData,
// //         exchangeRate: formData.exchangeRate ?? 1,
// //         isDefault: false,
// //       };
// //       addCurrency(newCurrency);
// //     }
// //     setIsDialogOpen(false);
// //   };

// //   const handleDelete = () => {
// //     if (currencyToDelete && !currencyToDelete.isDefault) {
// //       deleteCurrency(currencyToDelete.id);
// //       setCurrencyToDelete(null);
// //     }
// //     setIsDeleteOpen(false);
// //   };

// //   const handleToggleActive = (currency: Currency) => {
// //     updateCurrency(currency.id, { isActive: !currency.isActive });
// //   };

// //   const handleSetDefault = (currency: Currency) => {
// //     if (!currency.isDefault && currency.isActive) {
// //       setDefaultCurrency(currency.id);
// //     }
// //   };

// //   // Convertidor de moneda: convierte una cantidad de la moneda base a la moneda destino
// //   // La moneda base es la predeterminada (exchangeRate = 1)
// //   const convertAmount = (amount: number, targetCurrency: Currency) => {
// //     // Si no hay moneda base o no tiene tasa válida, retornar el mismo monto
// //     if (!defaultCurrency || targetCurrency.exchangeRate == null) return amount;
// //     // La conversión es: amount * (exchangeRate de la moneda destino) porque la base es 1
// //     return amount * (targetCurrency.exchangeRate ?? 1);
// //   };

// //   const defaultCurrency = currencies.find((c) => c.isDefault);

// //   return (
// //     <div className="space-y-6">
// //       {/* Header */}
// //       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
// //         <div>
// //           <h2 className="text-2xl font-bold">Gestión de Monedas</h2>
// //           <p className="text-muted-foreground">
// //             Administra las monedas y tipos de cambio del sistema
// //           </p>
// //         </div>
// //         <Button onClick={() => handleOpenDialog()} className="gap-2">
// //           <Plus className="h-4 w-4" />
// //           Nueva Moneda
// //         </Button>
// //       </div>

// //       {/* Stats */}
// //       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
// //         <Card>
// //           <CardContent className="flex items-center gap-4 p-4">
// //             <div className="rounded-full bg-primary/10 p-3">
// //               <Coins className="h-5 w-5 text-primary" />
// //             </div>
// //             <div>
// //               <p className="text-sm text-muted-foreground">Total Monedas</p>
// //               <p className="text-2xl font-bold">{stats.total}</p>
// //             </div>
// //           </CardContent>
// //         </Card>
// //         <Card>
// //           <CardContent className="flex items-center gap-4 p-4">
// //             <div className="rounded-full bg-green-500/10 p-3">
// //               <Check className="h-5 w-5 text-green-500" />
// //             </div>
// //             <div>
// //               <p className="text-sm text-muted-foreground">Activas</p>
// //               <p className="text-2xl font-bold">{stats.active}</p>
// //             </div>
// //           </CardContent>
// //         </Card>
// //         <Card>
// //           <CardContent className="flex items-center gap-4 p-4">
// //             <div className="rounded-full bg-gray-500/10 p-3">
// //               <X className="h-5 w-5 text-gray-500" />
// //             </div>
// //             <div>
// //               <p className="text-sm text-muted-foreground">Inactivas</p>
// //               <p className="text-2xl font-bold">{stats.inactive}</p>
// //             </div>
// //           </CardContent>
// //         </Card>
// //         <Card>
// //           <CardContent className="flex items-center gap-4 p-4">
// //             <div className="rounded-full bg-yellow-500/10 p-3">
// //               <Star className="h-5 w-5 text-yellow-500" />
// //             </div>
// //             <div>
// //               <p className="text-sm text-muted-foreground">Predeterminada</p>
// //               <p className="text-2xl font-bold">{stats.defaultCurrency}</p>
// //             </div>
// //           </CardContent>
// //         </Card>
// //       </div>

// //       {/* Currency Converter Card */}
// //       {defaultCurrency && (
// //         <Card>
// //           <CardHeader>
// //             <CardTitle className="flex items-center gap-2">
// //               <RefreshCw className="h-5 w-5" />
// //               Convertidor de Moneda
// //             </CardTitle>
// //             <CardDescription>
// //               Conversión de ejemplo basada en 1000 {defaultCurrency.symbol} ({defaultCurrency.code})
// //             </CardDescription>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
// //               {currencies
// //                 .filter((c) => c.isActive && !c.isDefault)
// //                 .slice(0, 4)
// //                 .map((currency) => (
// //                   <div
// //                     key={currency.id}
// //                     className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
// //                   >
// //                     <div>
// //                       <p className="font-medium">{currency.code}</p>
// //                       <p className="text-xs text-muted-foreground">
// //                         {currency.name}
// //                       </p>
// //                     </div>
// //                     <div className="text-right">
// //                       <p className="font-bold">
// //                         {currency.symbol}
// //                         {convertAmount(1000, currency).toFixed(2)}
// //                       </p>
// //                       <p className="text-xs text-muted-foreground">
// //                         1 {defaultCurrency.code} ={" "}
// //                         {(currency.exchangeRate ?? 1).toFixed(4)} {currency.code}
// //                       </p>
// //                     </div>
// //                   </div>
// //                 ))}
// //             </div>
// //           </CardContent>
// //         </Card>
// //       )}

// //       {/* Filters */}
// //       <Card>
// //         <CardContent className="p-4">
// //           <div className="flex flex-col gap-4 sm:flex-row">
// //             <div className="relative flex-1">
// //               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
// //               <Input
// //                 placeholder="Buscar por código o nombre..."
// //                 value={search}
// //                 onChange={(e) => setSearch(e.target.value)}
// //                 className="pl-9"
// //               />
// //             </div>
// //             <Select value={statusFilter} onValueChange={setStatusFilter}>
// //               <SelectTrigger className="w-full sm:w-40">
// //                 <SelectValue placeholder="Estado" />
// //               </SelectTrigger>
// //               <SelectContent>
// //                 <SelectItem value="all">Todas</SelectItem>
// //                 <SelectItem value="active">Activas</SelectItem>
// //                 <SelectItem value="inactive">Inactivas</SelectItem>
// //               </SelectContent>
// //             </Select>
// //           </div>
// //         </CardContent>
// //       </Card>

// //       {/* Currencies Table */}
// //       <Card>
// //         <CardHeader>
// //           <CardTitle>Lista de Monedas ({filteredCurrencies.length})</CardTitle>
// //         </CardHeader>
// //         <CardContent>
// //           <div className="overflow-x-auto">
// //             <Table>
// //               <TableHeader>
// //                 <TableRow>
// //                   <TableHead>Moneda</TableHead>
// //                   <TableHead>Símbolo</TableHead>
// //                   <TableHead className="text-right">Tasa de Cambio</TableHead>
// //                   <TableHead>Estado</TableHead>
// //                   <TableHead>Predeterminada</TableHead>
// //                   <TableHead className="text-right">Acciones</TableHead>
// //                 </TableRow>
// //               </TableHeader>
// //               <TableBody>
// //                 {filteredCurrencies.map((currency) => (
// //                   <TableRow key={currency.id}>
// //                     <TableCell>
// //                       <div className="flex items-center gap-3">
// //                         <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
// //                           <Globe className="h-5 w-5 text-primary" />
// //                         </div>
// //                         <div>
// //                           <p className="font-medium">{currency.code}</p>
// //                           <p className="text-sm text-muted-foreground">
// //                             {currency.name}
// //                           </p>
// //                         </div>
// //                       </div>
// //                     </TableCell>
// //                     <TableCell>
// //                       <span className="text-lg font-medium">{currency.symbol}</span>
// //                     </TableCell>
// //                     <TableCell className="text-right">
// //                       <div className="flex items-center justify-end gap-2">
// //                         <TrendingUp className="h-4 w-4 text-muted-foreground" />
// //                         <span className="font-mono">
// //                           {(currency.exchangeRate ?? 1).toFixed(4)}
// //                         </span>
// //                       </div>
// //                     </TableCell>
// //                     <TableCell>
// //                       <div className="flex items-center gap-2">
// //                         <Switch
// //                           checked={currency.isActive}
// //                           onCheckedChange={() => handleToggleActive(currency)}
// //                           disabled={currency.isDefault}
// //                         />
// //                         <span
// //                           className={cn(
// //                             "text-sm",
// //                             currency.isActive
// //                               ? "text-green-600"
// //                               : "text-muted-foreground"
// //                           )}
// //                         >
// //                           {currency.isActive ? "Activa" : "Inactiva"}
// //                         </span>
// //                       </div>
// //                     </TableCell>
// //                     <TableCell>
// //                       {currency.isDefault ? (
// //                         <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
// //                           <Star className="h-3 w-3 fill-current" />
// //                           Predeterminada
// //                         </span>
// //                       ) : (
// //                         <Button
// //                           variant="outline"
// //                           size="sm"
// //                           onClick={() => handleSetDefault(currency)}
// //                           disabled={!currency.isActive}
// //                         >
// //                           Establecer
// //                         </Button>
// //                       )}
// //                     </TableCell>
// //                     <TableCell className="text-right">
// //                       <div className="flex justify-end gap-2">
// //                         <Button
// //                           variant="ghost"
// //                           size="icon"
// //                           onClick={() => handleOpenDialog(currency)}
// //                         >
// //                           <Pencil className="h-4 w-4" />
// //                         </Button>
// //                         <Button
// //                           variant="ghost"
// //                           size="icon"
// //                           className="text-destructive hover:text-destructive"
// //                           onClick={() => {
// //                             setCurrencyToDelete(currency);
// //                             setIsDeleteOpen(true);
// //                           }}
// //                           disabled={currency.isDefault}
// //                         >
// //                           <Trash2 className="h-4 w-4" />
// //                         </Button>
// //                       </div>
// //                     </TableCell>
// //                   </TableRow>
// //                 ))}
// //                 {filteredCurrencies.length === 0 && (
// //                   <TableRow>
// //                     <TableCell colSpan={6} className="text-center py-8">
// //                       <p className="text-muted-foreground">
// //                         No se encontraron monedas
// //                       </p>
// //                     </TableCell>
// //                   </TableRow>
// //                 )}
// //               </TableBody>
// //             </Table>
// //           </div>
// //         </CardContent>
// //       </Card>

// //       {/* Exchange Rate Info */}
// //       <Card>
// //         <CardContent className="p-4">
// //           <div className="flex items-start gap-3">
// //             <div className="rounded-full bg-blue-500/10 p-2">
// //               <TrendingUp className="h-4 w-4 text-blue-500" />
// //             </div>
// //             <div>
// //               <p className="font-medium">Información sobre Tasas de Cambio</p>
// //               <p className="text-sm text-muted-foreground mt-1">
// //                 Las tasas de cambio se expresan en relación con la moneda predeterminada ({defaultCurrency?.code || "EUR"}).
// //                 Por ejemplo, una tasa de 1.08 para USD significa que 1 {defaultCurrency?.code || "EUR"} = 1.08 USD.
// //                 Actualiza las tasas regularmente para mantener precios precisos.
// //               </p>
// //             </div>
// //           </div>
// //         </CardContent>
// //       </Card>

// //       {/* Currency Form Dialog */}
// //       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
// //         <DialogContent className="max-w-md">
// //           <DialogHeader>
// //             <DialogTitle>
// //               {editingCurrency ? "Editar Moneda" : "Nueva Moneda"}
// //             </DialogTitle>
// //             <DialogDescription>
// //               {editingCurrency
// //                 ? "Modifica los datos de la moneda seleccionada"
// //                 : "Agrega una nueva moneda al sistema"}
// //             </DialogDescription>
// //           </DialogHeader>
// //           <FieldGroup>
// //             <div className="grid grid-cols-2 gap-4">
// //               <Field>
// //                 <FieldLabel>Código (ISO)</FieldLabel>
// //                 <Input
// //                   value={formData.code}
// //                   onChange={(e) =>
// //                     setFormData({
// //                       ...formData,
// //                       code: e.target.value.toUpperCase(),
// //                     })
// //                   }
// //                   placeholder="USD"
// //                   maxLength={3}
// //                 />
// //               </Field>
// //               <Field>
// //                 <FieldLabel>Símbolo</FieldLabel>
// //                 <Input
// //                   value={formData.symbol}
// //                   onChange={(e) =>
// //                     setFormData({ ...formData, symbol: e.target.value })
// //                   }
// //                   placeholder="$"
// //                   maxLength={3}
// //                 />
// //               </Field>
// //             </div>
// //             <Field>
// //               <FieldLabel>Nombre completo</FieldLabel>
// //               <Input
// //                 value={formData.name}
// //                 onChange={(e) =>
// //                   setFormData({ ...formData, name: e.target.value })
// //                 }
// //                 placeholder="Dólar Estadounidense"
// //               />
// //             </Field>
// //             <Field>
// //               <FieldLabel>
// //                 Tasa de cambio (respecto a {defaultCurrency?.code || "EUR"})
// //               </FieldLabel>
// //               <Input
// //                 type="number"
// //                 step="0.0001"
// //                 min="0"
// //                 value={formData.exchangeRate}
// //                 onChange={(e) =>
// //                   setFormData({
// //                     ...formData,
// //                     exchangeRate: parseFloat(e.target.value) || 1,
// //                   })
// //                 }
// //                 placeholder="1.08"
// //               />
// //             </Field>
// //             <Field>
// //               <div className="flex items-center justify-between">
// //                 <FieldLabel>Estado activo</FieldLabel>
// //                 <Switch
// //                   checked={formData.isActive}
// //                   onCheckedChange={(checked) =>
// //                     setFormData({ ...formData, isActive: checked })
// //                   }
// //                 />
// //               </div>
// //               <p className="text-sm text-muted-foreground">
// //                 Las monedas inactivas no estarán disponibles para los clientes
// //               </p>
// //             </Field>
// //           </FieldGroup>
// //           <DialogFooter className="gap-2">
// //             <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
// //               Cancelar
// //             </Button>
// //             <Button
// //               onClick={handleSave}
// //               disabled={!formData.code || !formData.name || !formData.symbol}
// //             >
// //               {editingCurrency ? "Guardar Cambios" : "Crear Moneda"}
// //             </Button>
// //           </DialogFooter>
// //         </DialogContent>
// //       </Dialog>

// //       {/* Delete Confirmation */}
// //       <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
// //         <AlertDialogContent>
// //           <AlertDialogHeader>
// //             <AlertDialogTitle>¿Eliminar moneda?</AlertDialogTitle>
// //             <AlertDialogDescription>
// //               {currencyToDelete?.isDefault ? (
// //                 <span className="text-destructive">
// //                   No puedes eliminar la moneda predeterminada. Primero establece
// //                   otra moneda como predeterminada.
// //                 </span>
// //               ) : (
// //                 <>
// //                   Esta acción no se puede deshacer. Se eliminará permanentemente la
// //                   moneda <strong>{currencyToDelete?.name}</strong> (
// //                   {currencyToDelete?.code}) del sistema.
// //                 </>
// //               )}
// //             </AlertDialogDescription>
// //           </AlertDialogHeader>
// //           <AlertDialogFooter>
// //             <AlertDialogCancel>Cancelar</AlertDialogCancel>
// //             {!currencyToDelete?.isDefault && (
// //               <AlertDialogAction
// //                 onClick={handleDelete}
// //                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
// //               >
// //                 Eliminar
// //               </AlertDialogAction>
// //             )}
// //           </AlertDialogFooter>
// //         </AlertDialogContent>
// //       </AlertDialog>
// //     </div>
// //   );
// // }

// "use client";

// import { useState, useMemo, useEffect } from "react";
// import { useAdminStore, Currency } from "@/lib/admin-store";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
//   DialogDescription,
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
// import { Switch } from "@/components/ui/switch";
// import {
//   Plus,
//   Pencil,
//   Trash2,
//   Search,
//   Coins,
//   Star,
//   Check,
//   X,
//   TrendingUp,
//   Globe,
//   RefreshCw,
//   Loader2,
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";

// export default function CurrenciesPage() {
//   const {
//     currencies,
//     addCurrency,
//     updateCurrency,
//     deleteCurrency,
//     setDefaultCurrency,
//     initialize,
//     loaded,
//     loading,
//   } = useAdminStore();

//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
//   const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
//   const [currencyToDelete, setCurrencyToDelete] = useState<Currency | null>(null);
//   const [formData, setFormData] = useState({
//     code: "",
//     name: "",
//     symbol: "",
//     exchangeRate: 1,
//     isActive: true,
//   });

//   // Inicializar datos al montar el componente
//   useEffect(() => {
//     if (!loaded && !loading) {
//       initialize();
//     }
//   }, [initialize, loaded, loading]);

//   const filteredCurrencies = useMemo(() => {
//     return currencies.filter((currency) => {
//       const matchesSearch =
//         currency.code.toLowerCase().includes(search.toLowerCase()) ||
//         currency.name.toLowerCase().includes(search.toLowerCase());
//       const matchesStatus =
//         statusFilter === "all" ||
//         (statusFilter === "active" && currency.isActive) ||
//         (statusFilter === "inactive" && !currency.isActive);
//       return matchesSearch && matchesStatus;
//     });
//   }, [currencies, search, statusFilter]);

//   const stats = useMemo(() => {
//     const defaultCurrency = currencies.find((c) => c.isDefault);
//     return {
//       total: currencies.length,
//       active: currencies.filter((c) => c.isActive).length,
//       inactive: currencies.filter((c) => !c.isActive).length,
//       defaultCurrency: defaultCurrency?.code || "N/A",
//     };
//   }, [currencies]);

//   const defaultCurrency = currencies.find((c) => c.isDefault);

//   const handleOpenDialog = (currency?: Currency) => {
//     if (currency) {
//       setEditingCurrency(currency);
//       setFormData({
//         code: currency.code,
//         name: currency.name,
//         symbol: currency.symbol,
//         exchangeRate: currency.exchangeRate ?? 1,
//         isActive: currency.isActive,
//       });
//     } else {
//       setEditingCurrency(null);
//       setFormData({
//         code: "",
//         name: "",
//         symbol: "",
//         exchangeRate: 1,
//         isActive: true,
//       });
//     }
//     setIsDialogOpen(true);
//   };

//   const handleSave = async () => {
//     if (editingCurrency) {
//       await updateCurrency(editingCurrency.id, formData);
//     } else {
//       const newCurrency: Currency = {
//         id: Date.now().toString(),
//         ...formData,
//         exchangeRate: formData.exchangeRate ?? 1,
//         isDefault: false,
//       };
//       await addCurrency(newCurrency);
//     }
//     setIsDialogOpen(false);
//   };

//   const handleDelete = async () => {
//     if (currencyToDelete && !currencyToDelete.isDefault) {
//       await deleteCurrency(currencyToDelete.id);
//       setCurrencyToDelete(null);
//     }
//     setIsDeleteOpen(false);
//   };

//   const handleToggleActive = async (currency: Currency) => {
//     await updateCurrency(currency.id, { isActive: !currency.isActive });
//   };

//   const handleSetDefault = async (currency: Currency) => {
//     if (!currency.isDefault && currency.isActive) {
//       await setDefaultCurrency(currency.id);
//     }
//   };

//   const convertAmount = (amount: number, targetCurrency: Currency) => {
//     if (!defaultCurrency || targetCurrency.exchangeRate == null) return amount;
//     return amount * (targetCurrency.exchangeRate ?? 1);
//   };

//   // Mostrar estado de carga mientras se obtienen datos
//   if (loading && !loaded) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="text-center space-y-4">
//           <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
//           <p className="text-muted-foreground">Cargando monedas...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h2 className="text-2xl font-bold">Gestión de Monedas</h2>
//           <p className="text-muted-foreground">
//             Administra las monedas y tipos de cambio del sistema
//           </p>
//         </div>
//         <Button onClick={() => handleOpenDialog()} className="gap-2">
//           <Plus className="h-4 w-4" />
//           Nueva Moneda
//         </Button>
//       </div>

//       {/* Stats */}
//       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//         <Card>
//           <CardContent className="flex items-center gap-4 p-4">
//             <div className="rounded-full bg-primary/10 p-3">
//               <Coins className="h-5 w-5 text-primary" />
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Total Monedas</p>
//               <p className="text-2xl font-bold">{stats.total}</p>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="flex items-center gap-4 p-4">
//             <div className="rounded-full bg-green-500/10 p-3">
//               <Check className="h-5 w-5 text-green-500" />
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Activas</p>
//               <p className="text-2xl font-bold">{stats.active}</p>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="flex items-center gap-4 p-4">
//             <div className="rounded-full bg-gray-500/10 p-3">
//               <X className="h-5 w-5 text-gray-500" />
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Inactivas</p>
//               <p className="text-2xl font-bold">{stats.inactive}</p>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="flex items-center gap-4 p-4">
//             <div className="rounded-full bg-yellow-500/10 p-3">
//               <Star className="h-5 w-5 text-yellow-500" />
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Predeterminada</p>
//               <p className="text-2xl font-bold">{stats.defaultCurrency}</p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Currency Converter Card (solo si hay monedas activas y defaultCurrency) */}
//       {defaultCurrency && currencies.filter(c => c.isActive && !c.isDefault).length > 0 && (
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <RefreshCw className="h-5 w-5" />
//               Convertidor de Moneda
//             </CardTitle>
//             <CardDescription>
//               Conversión de ejemplo basada en 1000 {defaultCurrency.symbol} ({defaultCurrency.code})
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//               {currencies
//                 .filter((c) => c.isActive && !c.isDefault)
//                 .slice(0, 4)
//                 .map((currency) => (
//                   <div
//                     key={currency.id}
//                     className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
//                   >
//                     <div>
//                       <p className="font-medium">{currency.code}</p>
//                       <p className="text-xs text-muted-foreground">
//                         {currency.name}
//                       </p>
//                     </div>
//                     <div className="text-right">
//                       <p className="font-bold">
//                         {currency.symbol}
//                         {convertAmount(1000, currency).toFixed(2)}
//                       </p>
//                       <p className="text-xs text-muted-foreground">
//                         1 {defaultCurrency.code} ={" "}
//                         {(currency.exchangeRate ?? 1).toFixed(4)} {currency.code}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Filters */}
//       <Card>
//         <CardContent className="p-4">
//           <div className="flex flex-col gap-4 sm:flex-row">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//               <Input
//                 placeholder="Buscar por código o nombre..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="pl-9"
//               />
//             </div>
//             <Select value={statusFilter} onValueChange={setStatusFilter}>
//               <SelectTrigger className="w-full sm:w-40">
//                 <SelectValue placeholder="Estado" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">Todas</SelectItem>
//                 <SelectItem value="active">Activas</SelectItem>
//                 <SelectItem value="inactive">Inactivas</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Currencies Table */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Lista de Monedas ({filteredCurrencies.length})</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Moneda</TableHead>
//                   <TableHead>Símbolo</TableHead>
//                   <TableHead className="text-right">Tasa de Cambio</TableHead>
//                   <TableHead>Estado</TableHead>
//                   <TableHead>Predeterminada</TableHead>
//                   <TableHead className="text-right">Acciones</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredCurrencies.map((currency) => (
//                   <TableRow key={currency.id}>
//                     <TableCell>
//                       <div className="flex items-center gap-3">
//                         <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
//                           <Globe className="h-5 w-5 text-primary" />
//                         </div>
//                         <div>
//                           <p className="font-medium">{currency.code}</p>
//                           <p className="text-sm text-muted-foreground">
//                             {currency.name}
//                           </p>
//                         </div>
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <span className="text-lg font-medium">{currency.symbol}</span>
//                     </TableCell>
//                     <TableCell className="text-right">
//                       <div className="flex items-center justify-end gap-2">
//                         <TrendingUp className="h-4 w-4 text-muted-foreground" />
//                         <span className="font-mono">
//                           {(currency.exchangeRate ?? 1).toFixed(4)}
//                         </span>
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <Switch
//                           checked={currency.isActive}
//                           onCheckedChange={() => handleToggleActive(currency)}
//                           disabled={currency.isDefault}
//                         />
//                         <span
//                           className={cn(
//                             "text-sm",
//                             currency.isActive
//                               ? "text-green-600"
//                               : "text-muted-foreground"
//                           )}
//                         >
//                           {currency.isActive ? "Activa" : "Inactiva"}
//                         </span>
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       {currency.isDefault ? (
//                         <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
//                           <Star className="h-3 w-3 fill-current" />
//                           Predeterminada
//                         </span>
//                       ) : (
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => handleSetDefault(currency)}
//                           disabled={!currency.isActive}
//                         >
//                           Establecer
//                         </Button>
//                       )}
//                     </TableCell>
//                     <TableCell className="text-right">
//                       <div className="flex justify-end gap-2">
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           onClick={() => handleOpenDialog(currency)}
//                         >
//                           <Pencil className="h-4 w-4" />
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           className="text-destructive hover:text-destructive"
//                           onClick={() => {
//                             setCurrencyToDelete(currency);
//                             setIsDeleteOpen(true);
//                           }}
//                           disabled={currency.isDefault}
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//                 {filteredCurrencies.length === 0 && (
//                   <TableRow>
//                     <TableCell colSpan={6} className="text-center py-8">
//                       <p className="text-muted-foreground">
//                         No se encontraron monedas
//                       </p>
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Exchange Rate Info */}
//       <Card>
//         <CardContent className="p-4">
//           <div className="flex items-start gap-3">
//             <div className="rounded-full bg-blue-500/10 p-2">
//               <TrendingUp className="h-4 w-4 text-blue-500" />
//             </div>
//             <div>
//               <p className="font-medium">Información sobre Tasas de Cambio</p>
//               <p className="text-sm text-muted-foreground mt-1">
//                 Las tasas de cambio se expresan en relación con la moneda predeterminada ({defaultCurrency?.code || "EUR"}).
//                 Por ejemplo, una tasa de 1.08 para USD significa que 1 {defaultCurrency?.code || "EUR"} = 1.08 USD.
//                 Actualiza las tasas regularmente para mantener precios precisos.
//               </p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Currency Form Dialog */}
//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle>
//               {editingCurrency ? "Editar Moneda" : "Nueva Moneda"}
//             </DialogTitle>
//             <DialogDescription>
//               {editingCurrency
//                 ? "Modifica los datos de la moneda seleccionada"
//                 : "Agrega una nueva moneda al sistema"}
//             </DialogDescription>
//           </DialogHeader>
//           <FieldGroup>
//             <div className="grid grid-cols-2 gap-4">
//               <Field>
//                 <FieldLabel>Código (ISO)</FieldLabel>
//                 <Input
//                   value={formData.code}
//                   onChange={(e) =>
//                     setFormData({
//                       ...formData,
//                       code: e.target.value.toUpperCase(),
//                     })
//                   }
//                   placeholder="USD"
//                   maxLength={3}
//                 />
//               </Field>
//               <Field>
//                 <FieldLabel>Símbolo</FieldLabel>
//                 <Input
//                   value={formData.symbol}
//                   onChange={(e) =>
//                     setFormData({ ...formData, symbol: e.target.value })
//                   }
//                   placeholder="$"
//                   maxLength={3}
//                 />
//               </Field>
//             </div>
//             <Field>
//               <FieldLabel>Nombre completo</FieldLabel>
//               <Input
//                 value={formData.name}
//                 onChange={(e) =>
//                   setFormData({ ...formData, name: e.target.value })
//                 }
//                 placeholder="Dólar Estadounidense"
//               />
//             </Field>
//             <Field>
//               <FieldLabel>
//                 Tasa de cambio (respecto a {defaultCurrency?.code || "EUR"})
//               </FieldLabel>
//               <Input
//                 type="number"
//                 step="0.0001"
//                 min="0"
//                 value={formData.exchangeRate}
//                 onChange={(e) =>
//                   setFormData({
//                     ...formData,
//                     exchangeRate: parseFloat(e.target.value) || 1,
//                   })
//                 }
//                 placeholder="1.08"
//               />
//             </Field>
//             <Field>
//               <div className="flex items-center justify-between">
//                 <FieldLabel>Estado activo</FieldLabel>
//                 <Switch
//                   checked={formData.isActive}
//                   onCheckedChange={(checked) =>
//                     setFormData({ ...formData, isActive: checked })
//                   }
//                 />
//               </div>
//               <p className="text-sm text-muted-foreground">
//                 Las monedas inactivas no estarán disponibles para los clientes
//               </p>
//             </Field>
//           </FieldGroup>
//           <DialogFooter className="gap-2">
//             <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
//               Cancelar
//             </Button>
//             <Button
//               onClick={handleSave}
//               disabled={!formData.code || !formData.name || !formData.symbol}
//             >
//               {editingCurrency ? "Guardar Cambios" : "Crear Moneda"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Delete Confirmation */}
//       <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>¿Eliminar moneda?</AlertDialogTitle>
//             <AlertDialogDescription>
//               {currencyToDelete?.isDefault ? (
//                 <span className="text-destructive">
//                   No puedes eliminar la moneda predeterminada. Primero establece
//                   otra moneda como predeterminada.
//                 </span>
//               ) : (
//                 <>
//                   Esta acción no se puede deshacer. Se eliminará permanentemente la
//                   moneda <strong>{currencyToDelete?.name}</strong> (
//                   {currencyToDelete?.code}) del sistema.
//                 </>
//               )}
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancelar</AlertDialogCancel>
//             {!currencyToDelete?.isDefault && (
//               <AlertDialogAction
//                 onClick={handleDelete}
//                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//               >
//                 Eliminar
//               </AlertDialogAction>
//             )}
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }

"use client";

import { useState, useMemo, useEffect } from "react";
import { useAdminStore, Currency } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DialogDescription,
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
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Coins,
  Star,
  Check,
  X,
  TrendingUp,
  Globe,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";

export default function CurrenciesPage() {
  const {
    currencies,
    addCurrency,
    updateCurrency,
    deleteCurrency,
    setDefaultCurrency,
    initialize,
    loaded,
    loading,
  } = useAdminStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [currencyToDelete, setCurrencyToDelete] = useState<Currency | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    symbol: "",
    exchangeRate: 1,
    isActive: true,
  });

  // Inicializar datos al montar el componente
  useEffect(() => {
    if (!loaded && !loading) {
      initialize();
    }
  }, [initialize, loaded, loading]);

  // Normalizar monedas: convertir snake_case a camelCase y asegurar valores numéricos/booleanos
  const normalizedCurrencies = useMemo(() => {
    return currencies.map((c: any) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      exchangeRate: Number(c.exchange_rate) || 1,
      isDefault: c.is_default === true,
      isActive: c.is_active === true,
    })) as Currency[];
  }, [currencies]);

  const filteredCurrencies = useMemo(() => {
    return normalizedCurrencies.filter((currency) => {
      const matchesSearch =
        currency.code.toLowerCase().includes(search.toLowerCase()) ||
        currency.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && currency.isActive) ||
        (statusFilter === "inactive" && !currency.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [normalizedCurrencies, search, statusFilter]);

  const stats = useMemo(() => {
    const defaultCurrency = normalizedCurrencies.find((c) => c.isDefault);
    return {
      total: normalizedCurrencies.length,
      active: normalizedCurrencies.filter((c) => c.isActive).length,
      inactive: normalizedCurrencies.filter((c) => !c.isActive).length,
      defaultCurrency: defaultCurrency?.code || "N/A",
    };
  }, [normalizedCurrencies]);

  const defaultCurrency = normalizedCurrencies.find((c) => c.isDefault);

  const handleOpenDialog = (currency?: Currency) => {
    if (currency) {
      setEditingCurrency(currency);
      setFormData({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        exchangeRate: currency.exchangeRate ?? 1,
        isActive: currency.isActive,
      });
    } else {
      setEditingCurrency(null);
      setFormData({
        code: "",
        name: "",
        symbol: "",
        exchangeRate: 1,
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingCurrency) {
      await updateCurrency(editingCurrency.id, formData);
    } else {
      // La nueva moneda se crea con isDefault = false (el backend o store se encargará)
      const newCurrency: Currency = {
        id: Date.now().toString(),
        code: formData.code,
        name: formData.name,
        symbol: formData.symbol,
        exchangeRate: formData.exchangeRate,
        isDefault: false,
        isActive: formData.isActive,
      };
      await addCurrency(newCurrency);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (currencyToDelete && !currencyToDelete.isDefault) {
      await deleteCurrency(currencyToDelete.id);
      setCurrencyToDelete(null);
    }
    setIsDeleteOpen(false);
  };

  const handleToggleActive = async (currency: Currency) => {
    await updateCurrency(currency.id, { isActive: !currency.isActive });
  };

  const handleSetDefault = async (currency: Currency) => {
    if (!currency.isDefault && currency.isActive) {
      await setDefaultCurrency(currency.id);
    }
  };

  const convertAmount = (amount: number, targetCurrency: Currency) => {
    if (!defaultCurrency || targetCurrency.exchangeRate == null) return amount;
    return amount * targetCurrency.exchangeRate;
  };

  // Pantalla de carga mientras se obtienen datos
  if (loading && !loaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando monedas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Monedas</h2>
          <p className="text-muted-foreground">
            Administra las monedas y tipos de cambio del sistema
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Moneda
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Monedas</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-500/10 p-3">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Activas</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-gray-500/10 p-3">
              <X className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inactivas</p>
              <p className="text-2xl font-bold">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-yellow-500/10 p-3">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Predeterminada</p>
              <p className="text-2xl font-bold">{stats.defaultCurrency}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currency Converter Card (solo si hay monedas activas no predeterminadas) */}
      {defaultCurrency && filteredCurrencies.some(c => c.isActive && !c.isDefault) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Convertidor de Moneda
            </CardTitle>
            <CardDescription>
              Conversión de ejemplo basada en 1000 {defaultCurrency.symbol} ({defaultCurrency.code})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredCurrencies
                .filter((c) => c.isActive && !c.isDefault)
                .slice(0, 4)
                .map((currency) => (
                  <div
                    key={currency.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{currency.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {currency.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {currency.symbol}
                        {convertAmount(1000, currency).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        1 {defaultCurrency.code} ={" "}
                        {(currency.exchangeRate ?? 1).toFixed(4)} {currency.code}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="inactive">Inactivas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Currencies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Monedas ({filteredCurrencies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Símbolo</TableHead>
                  <TableHead className="text-right">Tasa de Cambio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Predeterminada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCurrencies.map((currency) => (
                  <TableRow key={currency.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{currency.code}</p>
                          <p className="text-sm text-muted-foreground">
                            {currency.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-lg font-medium">{currency.symbol}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">
                          {currency.exchangeRate.toFixed(4)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={currency.isActive}
                          onCheckedChange={() => handleToggleActive(currency)}
                          disabled={currency.isDefault}
                        />
                        <span
                          className={cn(
                            "text-sm",
                            currency.isActive
                              ? "text-green-600"
                              : "text-muted-foreground"
                          )}
                        >
                          {currency.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {currency.isDefault ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                          <Star className="h-3 w-3 fill-current" />
                          Predeterminada
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(currency)}
                          disabled={!currency.isActive}
                        >
                          Establecer
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(currency)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setCurrencyToDelete(currency);
                            setIsDeleteOpen(true);
                          }}
                          disabled={currency.isDefault}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCurrencies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No se encontraron monedas
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rate Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-500/10 p-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Información sobre Tasas de Cambio</p>
              <p className="text-sm text-muted-foreground mt-1">
                Las tasas de cambio se expresan en relación con la moneda predeterminada ({defaultCurrency?.code || "EUR"}).
                Por ejemplo, una tasa de 1.08 para USD significa que 1 {defaultCurrency?.code || "EUR"} = 1.08 USD.
                Actualiza las tasas regularmente para mantener precios precisos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCurrency ? "Editar Moneda" : "Nueva Moneda"}
            </DialogTitle>
            <DialogDescription>
              {editingCurrency
                ? "Modifica los datos de la moneda seleccionada"
                : "Agrega una nueva moneda al sistema"}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Código (ISO)</FieldLabel>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="USD"
                  maxLength={3}
                />
              </Field>
              <Field>
                <FieldLabel>Símbolo</FieldLabel>
                <Input
                  value={formData.symbol}
                  onChange={(e) =>
                    setFormData({ ...formData, symbol: e.target.value })
                  }
                  placeholder="$"
                  maxLength={3}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>Nombre completo</FieldLabel>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Dólar Estadounidense"
              />
            </Field>
            <Field>
              <FieldLabel>
                Tasa de cambio (respecto a {defaultCurrency?.code || "EUR"})
              </FieldLabel>
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={formData.exchangeRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    exchangeRate: parseFloat(e.target.value) || 1,
                  })
                }
                placeholder="1.08"
              />
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>Estado activo</FieldLabel>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Las monedas inactivas no estarán disponibles para los clientes
              </p>
            </Field>
          </FieldGroup>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.code || !formData.name || !formData.symbol}
            >
              {editingCurrency ? "Guardar Cambios" : "Crear Moneda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar moneda?</AlertDialogTitle>
            <AlertDialogDescription>
              {currencyToDelete?.isDefault ? (
                <span className="text-destructive">
                  No puedes eliminar la moneda predeterminada. Primero establece
                  otra moneda como predeterminada.
                </span>
              ) : (
                <>
                  Esta acción no se puede deshacer. Se eliminará permanentemente la
                  moneda <strong>{currencyToDelete?.name}</strong> (
                  {currencyToDelete?.code}) del sistema.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {!currencyToDelete?.isDefault && (
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}