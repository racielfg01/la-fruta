// "use client";

// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { ShoppingCart, Leaf, Menu, X, Settings, LogOut, User } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { useCartStore } from "@/lib/store";
// import { useAuthStore } from "@/lib/auth-context";
// import { useState } from "react";

// export function Header() {
//   const totalItems = useCartStore((state) => state.getTotalItems());
//   const { isAuthenticated, user, logout } = useAuthStore();
//   const router = useRouter();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

//   const isAdmin = user?.role_id === 2; 

//   return (
//     <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
//       <div className="container mx-auto flex h-16 items-center justify-between px-4">
//         <Link href="/" className="flex items-center gap-2">
//           <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
//             <Leaf className="h-5 w-5 text-primary-foreground" />
//           </div>
//           <span className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-foreground">
//             MercaToma
//           </span>
//         </Link>

//         <nav className="hidden items-center gap-6 md:flex">
//           <Link
//             href="/"
//             className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
//           >
//             Tienda
//           </Link>
//           <Link
//             href="/cart"
//             className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
//           >
//             Carrito
//           </Link>
//           {/* Mostrar Admin solo si el usuario es administrador */}
//           {isAdmin && (
//             <Link
//               href="/admin"
//               className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
//             >
//               <span className="flex items-center gap-1">
//                 <Settings className="h-4 w-4" />
//                 Admin
//               </span>
//             </Link>
//           )}
//         </nav>

//         <div className="flex items-center gap-2">
//           <Link href="/cart">
//             <Button variant="ghost" size="icon" className="relative">
//               <ShoppingCart className="h-5 w-5" />
//               {totalItems > 0 && (
//                 <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
//                   {totalItems}
//                 </Badge>
//               )}
//               <span className="sr-only">Carrito de compras</span>
//             </Button>
//           </Link>

//           {isAuthenticated && user ? (
//             <div className="hidden md:flex items-center gap-2">
//               <Link href="/perfil">
//                 <Button variant="ghost" size="sm" className="flex items-center gap-2">
//                   <User className="h-4 w-4" />
//                   {user.name}
//                 </Button>
//               </Link>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => {
//                   logout();
//                   router.push("/");
//                 }}
//               >
//                 <LogOut className="h-5 w-5" />
//                 <span className="sr-only">Cerrar sesión</span>
//               </Button>
//             </div>
//           ) : (
//             <div className="hidden md:flex items-center gap-2">
//               <Link href="/auth/login">
//                 <Button variant="ghost" size="sm">Iniciar Sesión</Button>
//               </Link>
//               <Link href="/auth/signup">
//                 <Button size="sm">Registrarse</Button>
//               </Link>
//             </div>
//           )}

//           <Button
//             variant="ghost"
//             size="icon"
//             className="md:hidden"
//             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//           >
//             {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
//           </Button>
//         </div>
//       </div>

//       {mobileMenuOpen && (
//         <div className="border-t bg-card md:hidden">
//           <nav className="container mx-auto flex flex-col gap-2 px-4 py-4">
//             <Link
//               href="/"
//               className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
//               onClick={() => setMobileMenuOpen(false)}
//             >
//               Tienda
//             </Link>
//             <Link
//               href="/cart"
//               className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
//               onClick={() => setMobileMenuOpen(false)}
//             >
//               Carrito
//             </Link>
//             {/* Admin en menú móvil solo para administradores */}
//             {isAdmin && (
//               <Link
//                 href="/admin"
//                 className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
//                 onClick={() => setMobileMenuOpen(false)}
//               >
//                 <span className="flex items-center gap-1">
//                   <Settings className="h-4 w-4" />
//                   Admin
//                 </span>
//               </Link>
//             )}

//             {isAuthenticated && user ? (
//               <>
//                 <Link
//                   href="/perfil"
//                   className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
//                   onClick={() => setMobileMenuOpen(false)}
//                 >
//                   <span className="flex items-center gap-1">
//                     <User className="h-4 w-4" />
//                     {user.name}
//                   </span>
//                 </Link>
//                 <button
//                   onClick={() => {
//                     logout();
//                     router.push("/");
//                     setMobileMenuOpen(false);
//                   }}
//                   className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground text-left"
//                 >
//                   <span className="flex items-center gap-1">
//                     <LogOut className="h-4 w-4" />
//                     Cerrar Sesión
//                   </span>
//                 </button>
//               </>
//             ) : (
//               <>
//                 <Link
//                   href="/auth/login"
//                   className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
//                   onClick={() => setMobileMenuOpen(false)}
//                 >
//                   Iniciar Sesión
//                 </Link>
//                 <Link
//                   href="/auth/signup"
//                   className="rounded-md px-3 py-2 text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
//                   onClick={() => setMobileMenuOpen(false)}
//                 >
//                   Registrarse
//                 </Link>
//               </>
//             )}
//           </nav>
//         </div>
//       )}
//     </header>
//   );
// }

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Leaf, Menu, X, Settings, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import Image from "next/image";

export function Header() {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isAuthenticated, user, logout, isLoading } = useAuthStore();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Evitar errores de hidratación de React
  useEffect(() => {
    setMounted(true);
  }, []);

  // Esperar a que Zustand termine de hidratar desde localStorage
  const ready = !isLoading;
  const isAdmin = ready && Number(user?.role_id) === 2;

  // No renderizar el contador hasta que esté montado en el cliente
  const cartBadge = mounted && totalItems > 0 && (
    <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
      {totalItems}
    </Badge>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden">
            <Image className="object-cover" src={"/icon-512x512.png"} alt="logo" width={40} height={40} priority/>
          </div>
          <span className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-foreground">
            <span className="text-primary">Merca</span><span className="text-destructive">Toma</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Tienda
          </Link>
          <Link
            href="/cart"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Carrito
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Admin
              </span>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartBadge}
              <span className="sr-only">Carrito de compras</span>
            </Button>
          </Link>

            {ready && isAuthenticated && user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/perfil">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {user.name}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Cerrar sesión</span>
              </Button>
            </div>
          ) : ready ? (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Registrarse</Button>
              </Link>
            </div>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t bg-card md:hidden">
          <nav className="container mx-auto flex flex-col gap-2 px-4 py-4">
            <Link
              href="/"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tienda
            </Link>
            <Link
              href="/cart"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Carrito
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  Admin
                </span>
              </Link>
            )}

          {ready && isAuthenticated && user ? (
              <>
                <Link
                  href="/perfil"
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {user.name}
                  </span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    router.push("/");
                    setMobileMenuOpen(false);
                  }}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground text-left"
                >
                  <span className="flex items-center gap-1">
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </span>
                </button>
              </>
            ) : ready ? (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-md px-3 py-2 text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}