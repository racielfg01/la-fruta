"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Grid3X3,
  ShoppingCart,
  Heart,
  User,
  Leaf,
  Apple,
  Citrus,
  Cherry,
  Grape,
  Carrot,
  Sprout,
} from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MobileBottomNavProps {
  categories: string[];
  categoryCounts: Record<string, number>;
  selectedCategories: string[];
  toggleCategory: (category: string) => void;
  clearCategories: () => void;
}

const categoryConfig: Record<
  string,
  { icon: typeof Leaf; color: string; bgColor: string }
> = {
  Fruits: { icon: Apple, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  Citrus: { icon: Citrus, color: "text-orange-600", bgColor: "bg-orange-50" },
  Berries: { icon: Cherry, color: "text-pink-600", bgColor: "bg-pink-50" },
  Tropical: { icon: Grape, color: "text-amber-600", bgColor: "bg-amber-50" },
  Melons: { icon: Grape, color: "text-green-600", bgColor: "bg-green-50" },
  Vegetables: { icon: Carrot, color: "text-orange-700", bgColor: "bg-orange-50" },
  Roots: { icon: Carrot, color: "text-amber-700", bgColor: "bg-amber-50" },
  Greens: { icon: Leaf, color: "text-green-700", bgColor: "bg-green-50" },
  Herbs: { icon: Sprout, color: "text-emerald-700", bgColor: "bg-emerald-50" },
};

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    Fruits: "Frutas",
    Citrus: "Cítricos",
    Berries: "Bayas",
    Tropical: "Tropicales",
    Melons: "Melones",
    Vegetables: "Verduras",
    Roots: "Tubérculos",
    Greens: "Hortalizas",
    Herbs: "Hierbas",
  };
  return labels[category] || category;
};

export function MobileBottomNav({
  categories,
  categoryCounts,
  selectedCategories,
  toggleCategory,
  clearCategories,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="grid grid-cols-5 h-16">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
              isActive("/") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Home className="h-5 w-5" />
            <span>Inicio</span>
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground"
          >
            <Grid3X3 className="h-5 w-5" />
            <span>Categorías</span>
          </button>
          <Link
            href="/cart"
            className={`relative flex flex-col items-center justify-center gap-1 text-xs ${
              isActive("/cart") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -right-2 -top-1 h-4 min-w-4 px-1 text-[10px] bg-destructive text-destructive-foreground">
                  {totalItems}
                </Badge>
              )}
            </div>
            <span>Carrito</span>
          </Link>
          <Link
            href="/favoritos"
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
              isActive("/favoritos") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Heart className="h-5 w-5" />
            <span>Favoritos</span>
          </Link>
          <Link
            href={isAuthenticated ? "/perfil" : "/auth/login"}
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
              isActive("/perfil") || isActive("/auth") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <User className="h-5 w-5" />
            <span>Perfil</span>
          </Link>
        </div>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle>Categorías</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-wrap gap-2 overflow-y-auto max-h-[calc(70vh-100px)]">
            <Button
              variant={selectedCategories.length === 0 ? "default" : "outline"}
              size="sm"
              onClick={() => {
                clearCategories();
                setOpen(false);
              }}
              className="rounded-full"
            >
              Todos
            </Button>
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category);
              const count = categoryCounts[category] || 0;
              const config = categoryConfig[category] || categoryConfig.Fruits;
              const Icon = config.icon;
              return (
                <Button
                  key={category}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    toggleCategory(category);
                    setOpen(false);
                  }}
                  className="rounded-full gap-1.5"
                >
                  {!isSelected && (
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full ${config.bgColor}`}>
                      <Icon className={`h-2.5 w-2.5 ${config.color}`} />
                    </span>
                  )}
                  {getCategoryLabel(category)}
                  <span className="ml-1 rounded-full bg-background/20 px-1.5 text-[10px]">
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
