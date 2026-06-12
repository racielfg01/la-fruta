"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { useCartStore, Product } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import {
  Search,
  SlidersHorizontal,
  Leaf,
  X,
  Plus,
  Check,
  MapPin,
  ShoppingCart,
  Grid3X3,
  LayoutGrid,
  Heart,
  Truck,
  Shield,
  ArrowUpDown,
  Sparkles,
  ChevronDown,
  Eye,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getPublicProducts } from "@/app/actions/public-products";

type SortOption = "default" | "price-asc" | "price-desc" | "name";

const categoryConfig: Record<
  string,
  { icon: typeof Leaf; color: string; bgColor: string }
> = {
  Fruits: { icon: Leaf, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  Citrus: { icon: Leaf, color: "text-orange-600", bgColor: "bg-orange-50" },
  Berries: { icon: Leaf, color: "text-pink-600", bgColor: "bg-pink-50" },
  Tropical: { icon: Leaf, color: "text-amber-600", bgColor: "bg-amber-50" },
  Melons: { icon: Leaf, color: "text-green-600", bgColor: "bg-green-50" },
};

  export function StoreView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 150]);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [viewMode, setViewMode] = useState<"masonry" | "grid">("masonry");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);

  // En StoreView, modifica la carga de datos:
useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { products: prods, categories: cats } = await getPublicProducts();
      const prodsWithNumberPrice = prods.map(p => ({
        ...p,
        price: Number(p.price)
      })) as Product[];
      setProducts(prodsWithNumberPrice);
      setCategories(cats);
      if (prods.length === 0) setLoadError("No hay productos disponibles");
    } catch (e) {
      setLoadError("Error al cargar productos");
      console.error("StoreView load error:", e);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);

  // Calcular maxPrice (depende de products)
  const maxPrice = useMemo(() => {
    if (products.length === 0) return 100;
    return Math.max(...products.map(p => p.price));
  }, [products]);

  // Calcular filteredProducts (depende de products y filtros)
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.origin.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.category);

      const matchesPrice =
        product.price >= priceRange[0] && product.price <= priceRange[1];

      const matchesStock = !showOnlyInStock || product.inStock;

      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });

    switch (sortBy) {
      case "price-asc":
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return filtered;
  }, [products, searchQuery, selectedCategories, priceRange, sortBy, showOnlyInStock]);

  // Calcular conteo por categorías
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Funciones de filtro (usando maxPrice)
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setPriceRange([0, maxPrice]);
    setSortBy("default");
    setShowOnlyInStock(false);
  };

  const toggleCategory = (category: string) => {
  setSelectedCategories((prev) =>
    prev.includes(category)
      ? prev.filter((c) => c !== category)
      : [...prev, category]
  );
};

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategories.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < maxPrice ||
    showOnlyInStock ||
    sortBy !== "default";

  const activeFiltersCount = [
    searchQuery !== "",
    selectedCategories.length > 0,
    priceRange[0] > 0 || priceRange[1] < maxPrice,
    showOnlyInStock,
    sortBy !== "default",
  ].filter(Boolean).length;

  const isInCart = (productId: string) =>
    items.some((item) => item.product.id === productId);
  const getCartQuantity = (productId: string) => {
    const item = items.find((item) => item.product.id === productId);
    return item?.quantity || 0;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        {loadError && (
          <div className="text-center max-w-md">
            <p className="text-sm text-destructive font-medium">{loadError}</p>
            <p className="text-xs text-muted-foreground mt-1">Reintentando conexión...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Banner */}
        <section className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 py-12 md:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <Badge className="mb-4 gap-1.5 bg-primary/10 text-primary hover:bg-primary/20">
                <Sparkles className="h-3 w-3" />
                Productos frescos del día
              </Badge>
              <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-foreground sm:text-4xl md:text-5xl lg:text-6xl text-balance">
                Nuestra Tienda
              </h1>
              <p className="mt-4 max-w-2xl text-muted-foreground sm:text-lg md:text-xl">
                Explora nuestra selección de frutas frescas y productos
                agrícolas de la más alta calidad
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm sm:gap-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                    <Leaf className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm sm:text-base">
                    {products.length} productos
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <Truck className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm sm:text-base">
                    Envío gratis +$50
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                    <Shield className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-sm sm:text-base">
                    Garantía de frescura
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -left-20 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        </section>

        {/* Search and Filters Bar */}
        {/* Search and Filters Bar - Sticky */}
        <div className="sticky top-16 z-40 border-b bg-card/95 backdrop-blur-lg supports-[backdrop-filter]:bg-card/80">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col gap-4">
              {/* Fila superior: Buscador y botones */}
              <div className="flex items-center gap-2">
                {/* Buscador */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 pl-10 pr-10 text-base w-full"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Botones de acción a la derecha */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Vista toggle - solo visible en desktop */}
                  <div className="hidden sm:flex items-center rounded-lg border bg-background p-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setViewMode("masonry")}
                          className={`rounded-md p-2.5 transition-colors ${
                            viewMode === "masonry"
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                          aria-label="Vista masonry"
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Vista Masonry</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setViewMode("grid")}
                          className={`rounded-md p-2.5 transition-colors ${
                            viewMode === "grid"
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                          aria-label="Vista cuadrícula"
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Vista Cuadrícula</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Botón de filtros */}
                  <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        className="relative h-11 gap-2 flex-shrink-0"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          Filtros y orden
                        </span>
                        <span className="sm:hidden">Filtros</span>
                        {activeFiltersCount > 0 && (
                          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                            {activeFiltersCount}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="w-full max-w-sm overflow-y-auto p-0"
                    >
                      <SheetHeader className="p-6 pb-4 border-b">
                        <SheetTitle className="flex items-center justify-between">
                          Filtros y Orden
                          {hasActiveFilters && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearFilters}
                            >
                              Limpiar todo
                            </Button>
                          )}
                        </SheetTitle>
                      </SheetHeader>
                      <div className="p-6">
                        {/* Selector de ordenamiento dentro del modal */}
                        <div className="mb-6">
                          <h4 className="mb-3 text-sm font-semibold text-foreground">
                            Ordenar por
                          </h4>
                          <Select
                            value={sortBy}
                            onValueChange={(v) => setSortBy(v as SortOption)}
                          >
                            <SelectTrigger className="w-full h-11">
                              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Ordenar por" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">
                                Destacados
                              </SelectItem>
                              <SelectItem value="price-asc">
                                Precio: menor a mayor
                              </SelectItem>
                              <SelectItem value="price-desc">
                                Precio: mayor a menor
                              </SelectItem>
                              <SelectItem value="name">Nombre A-Z</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <FilterContent
                          categories={categories}
                          selectedCategories={selectedCategories}
                          toggleCategory={toggleCategory}
                          priceRange={priceRange}
                          setPriceRange={setPriceRange}
                          maxPrice={maxPrice}
                          showOnlyInStock={showOnlyInStock}
                          setShowOnlyInStock={setShowOnlyInStock}
                          categoryCounts={categoryCounts}
                        />
                        <div className="mt-8">
                          <SheetClose asChild>
                            <Button className="w-full" size="lg">
                              Ver {filteredProducts.length} productos
                            </Button>
                          </SheetClose>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              {/* Category Pills - También sticky, dentro del mismo contenedor */}
              <div className="relative -mx-4 px-4">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
                  <Button
                    variant={
                      selectedCategories.length === 0 ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategories([])}
                    className="flex-shrink-0 rounded-full gap-1.5 snap-start"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Todos
                  </Button>
                  {categories.map((category) => {
                    const config =
                      categoryConfig[category] || categoryConfig.Fruits;
                    const isSelected = selectedCategories.includes(category);
                    const count = products.filter(
                      (p) => p.category === category,
                    ).length;

                    return (
                      <Button
                        key={category}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCategory(category)}
                        className={`flex-shrink-0 rounded-full gap-1.5 snap-start ${
                          !isSelected ? `hover:${config.bgColor}` : ""
                        }`}
                      >
                        <span className={!isSelected ? config.color : ""}>
                          {getCategoryLabel(category)}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`h-5 min-w-5 rounded-full px-1.5 text-xs ${
                            isSelected
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : ""
                          }`}
                        >
                          {count}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-32">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filtros y Orden
                      </h3>
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-8 text-xs"
                        >
                          Limpiar
                        </Button>
                      )}
                    </div>

                    {/* Selector de ordenamiento en desktop sidebar */}
                    <div className="mb-6">
                      <h4 className="mb-3 text-sm font-semibold text-foreground">
                        Ordenar por
                      </h4>
                      <Select
                        value={sortBy}
                        onValueChange={(v) => setSortBy(v as SortOption)}
                      >
                        <SelectTrigger className="w-full">
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Destacados</SelectItem>
                          <SelectItem value="price-asc">
                            Precio: menor a mayor
                          </SelectItem>
                          <SelectItem value="price-desc">
                            Precio: mayor a menor
                          </SelectItem>
                          <SelectItem value="name">Nombre A-Z</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <FilterContent
                      categories={categories}
                      selectedCategories={selectedCategories}
                      toggleCategory={toggleCategory}
                      priceRange={priceRange}
                      setPriceRange={setPriceRange}
                      maxPrice={maxPrice}
                      showOnlyInStock={showOnlyInStock}
                      setShowOnlyInStock={setShowOnlyInStock}
                      categoryCounts={categoryCounts} // ← agregar
                    />
                  </CardContent>
                </Card>

                <Card className="mt-4 overflow-hidden border-0 bg-gradient-to-br from-primary/10 to-accent/10">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                        <Truck className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          Envío Gratis
                        </p>
                        <p className="text-sm text-muted-foreground">
                          En pedidos mayores a $50
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </aside>

            {/* Products Section */}
            <div className="flex-1 min-w-0">
              {/* Results Header */}
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-medium text-foreground">
                    {filteredProducts.length} producto
                    {filteredProducts.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                      ? "con los filtros aplicados"
                      : "disponibles"}
                  </p>
                </div>
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2">
                    {sortBy !== "default" && (
                      <Badge variant="secondary" className="gap-1">
                        {sortBy === "price-asc" && "Precio: menor a mayor"}
                        {sortBy === "price-desc" && "Precio: mayor a menor"}
                        {sortBy === "name" && "Nombre A-Z"}
                        <button onClick={() => setSortBy("default")}>
                          <X className="h-3 w-3 ml-1" />
                        </button>
                      </Badge>
                    )}
                    {selectedCategories.map((cat) => (
                      <Badge
                        key={cat}
                        variant="secondary"
                        className="cursor-pointer gap-1 pr-1 hover:bg-destructive/10"
                        onClick={() => toggleCategory(cat)}
                      >
                        {getCategoryLabel(cat)}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                    {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
                      <Badge variant="secondary" className="gap-1">
                        ${priceRange[0]} - ${priceRange[1]}
                      </Badge>
                    )}
                    {showOnlyInStock && (
                      <Badge variant="secondary" className="gap-1">
                        En stock
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-6 px-2 text-xs text-primary hover:text-primary"
                    >
                      Limpiar todo
                    </Button>
                  </div>
                )}
              </div>

              {/* Product Grid */}
              {filteredProducts.length > 0 ? (
                viewMode === "masonry" ? (
                  <MasonryGrid
                    products={filteredProducts}
                    addItem={addItem}
                    isInCart={isInCart}
                    getCartQuantity={getCartQuantity}
                    hoveredProduct={hoveredProduct}
                    setHoveredProduct={setHoveredProduct}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        addItem={addItem}
                        isInCart={isInCart(product.id)}
                        cartQuantity={getCartQuantity(product.id)}
                        isHovered={hoveredProduct === product.id}
                        onHover={setHoveredProduct}
                      />
                    ))}
                  </div>
                )
              ) : (
                <EmptyState onClear={clearFilters} searchQuery={searchQuery} />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t bg-card py-8 md:py-10 lg:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg shadow-primary/20 overflow-hidden">
        <Image className="object-cover" src={"/icon-512x512.png"} alt="logo" width={40} height={40} priority/>
                </div>
                <div>
                  <span className="font-[family-name:var(--font-playfair)] text-lg font-bold">
                    <span className="text-primary">Merca</span><span className="text-destructive">Toma</span>
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Del campo a tu mesa
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground">
                <Link
                  href="#"
                  className="transition-colors hover:text-foreground"
                >
                  Términos
                </Link>
                <Link
                  href="#"
                  className="transition-colors hover:text-foreground"
                >
                  Privacidad
                </Link>
                <Link
                  href="#"
                  className="transition-colors hover:text-foreground"
                >
                  Contacto
                </Link>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                &copy; {new Date().getFullYear()} MercaToma. Todos los derechos
                reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}

// Filter Content Component
function FilterContent({
  categories,
  selectedCategories,
  toggleCategory,
  priceRange,
  setPriceRange,
  maxPrice,
  showOnlyInStock,
  setShowOnlyInStock,
  categoryCounts,
}: {
  categories: string[];
  selectedCategories: string[];
  toggleCategory: (category: string) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  maxPrice: number;
  showOnlyInStock: boolean;
  setShowOnlyInStock: (value: boolean) => void;
  categoryCounts: Record<string, number>;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h4 className="mb-4 text-sm font-semibold text-foreground">
          Categorías
        </h4>
        <div className="space-y-2">
          {categories.map((category) => {
            const config = categoryConfig[category] || categoryConfig.Fruits;
            // const count = products.filter(
            //   (p) => p.category === category,
            // ).length;
            const count = categoryCounts[category] || 0;
            const isSelected = selectedCategories.includes(category);

            return (
              <label
                key={category}
                className={`flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors ${
                  isSelected ? "bg-primary/10" : "hover:bg-muted"
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleCategory(category)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-md ${config.bgColor}`}
                >
                  <Leaf className={`h-3.5 w-3.5 ${config.color}`} />
                </div>
                <span className="flex-1 text-sm font-medium text-foreground">
                  {getCategoryLabel(category)}
                </span>
                <span className="text-xs text-muted-foreground">{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="mb-4 text-sm font-semibold text-foreground">
          Rango de Precio
        </h4>
        <div className="space-y-4">
          <Slider
            value={[priceRange[0], priceRange[1]]}
            onValueChange={(value) => setPriceRange([value[0], value[1]])}
            max={Math.ceil(maxPrice)}
            step={0.5}
            className="mb-2"
          />
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-muted-foreground">
                Mínimo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([Number(e.target.value), priceRange[1]])
                  }
                  className="h-9 pl-7 text-sm"
                  min={0}
                  max={priceRange[1]}
                />
              </div>
            </div>
            <div className="mt-5 text-muted-foreground">-</div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-muted-foreground">
                Máximo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], Number(e.target.value)])
                  }
                  className="h-9 pl-7 text-sm"
                  min={priceRange[0]}
                  max={maxPrice}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-4 text-sm font-semibold text-foreground">
          Disponibilidad
        </h4>
        <label
          className={`flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors ${
            showOnlyInStock ? "bg-primary/10" : "hover:bg-muted"
          }`}
        >
          <Checkbox
            checked={showOnlyInStock}
            onCheckedChange={(checked) =>
              setShowOnlyInStock(checked as boolean)
            }
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <span className="text-sm font-medium text-foreground">
            Solo en stock
          </span>
        </label>
      </div>
    </div>
  );
}

// Masonry Grid Component
function MasonryGrid({
  products,
  addItem,
  isInCart,
  getCartQuantity,
  hoveredProduct,
  setHoveredProduct,
}: {
  products: Product[];
  addItem: (product: Product) => void;
  isInCart: (id: string) => boolean;
  getCartQuantity: (id: string) => number;
  hoveredProduct: string | null;
  setHoveredProduct: (id: string | null) => void;
}) {
  const [columnCount, setColumnCount] = useState(2);

  useEffect(() => {
    const getColumnCount = () => {
      const width = window.innerWidth;
      if (width < 640) return 2;
      if (width < 1024) return 2;
      if (width < 1280) return 3;
      return 4;
    };

    const handleResize = () => setColumnCount(getColumnCount());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const columns: Product[][] = Array.from({ length: columnCount }, () => []);
  products.forEach((product, index) => {
    columns[index % columnCount].push(product);
  });

  return (
    <div className="flex gap-3 sm:gap-4">
      {columns.map((columnProducts, columnIndex) => (
        <div key={columnIndex} className="flex flex-1 flex-col gap-3 sm:gap-4">
          {columnProducts.map((product, productIndex) => {
            const heightVariant = (columnIndex + productIndex) % 4;
            return (
              <MasonryCard
                key={product.id}
                product={product}
                addItem={addItem}
                isInCart={isInCart(product.id)}
                cartQuantity={getCartQuantity(product.id)}
                heightVariant={heightVariant}
                isHovered={hoveredProduct === product.id}
                onHover={setHoveredProduct}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Masonry Card Component
function MasonryCard({
  product,
  addItem,
  isInCart,
  cartQuantity,
  heightVariant,
  isHovered,
  onHover,
}: {
  product: Product;
  addItem: (product: Product) => void;
  isInCart: boolean;
  cartQuantity: number;
  heightVariant: number;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const mobileHeights = ["h-52", "h-64", "h-56", "h-72"];
  const desktopHeights = ["h-56", "h-72", "h-64", "h-80"];
  const [imageHeight, setImageHeight] = useState(desktopHeights[heightVariant]);
  const { defaultCurrency, currencies, formatPrice, convertPrice } = useCurrency();
  const cupCurrency = currencies.find(c => c.code === 'CUP');

  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    setImageHeight(
      isMobile ? mobileHeights[heightVariant] : desktopHeights[heightVariant],
    );
  }, [heightVariant]);

  const config = categoryConfig[product.category] || categoryConfig.Fruits;

  return (
    <Card
      className={`group overflow-hidden border-0 bg-card shadow-sm transition-all duration-300 ${
        isHovered ? "shadow-xl ring-2 ring-primary/20" : "hover:shadow-lg"
      }`}
      onMouseEnter={() => onHover(product.id)}
      onMouseLeave={() => onHover(null)}
    >
      <Link href={`/product/${product.id}`}>
        <div className={`relative ${imageHeight} overflow-hidden`}>
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-500 ${
              isHovered ? "scale-110" : "group-hover:scale-105"
            }`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          <div
            className={`absolute inset-0 bg-black/0 transition-colors duration-300 ${
              isHovered ? "bg-black/10" : ""
            }`}
          />

          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
              <Badge variant="destructive" className="text-sm font-medium">
                Agotado
              </Badge>
            </div>
          )}

          <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
            <Badge
              className={`${config.bgColor} ${config.color} border-0 shadow-sm text-xs sm:text-sm`}
            >
              {getCategoryLabel(product.category)}
            </Badge>
          </div>

          <div
            className={`absolute right-2 top-2 sm:right-3 sm:top-3 flex flex-col gap-1.5 sm:gap-2 transition-all duration-300 ${
              isHovered
                ? "translate-x-0 opacity-100"
                : "translate-x-8 opacity-0"
            }`}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition-colors hover:bg-white hover:text-rose-500">
                  <Heart className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">Agregar a favoritos</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition-colors hover:bg-white hover:text-primary">
                  <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="left">Ver detalles</TooltipContent>
            </Tooltip>
          </div>

          {isInCart && (
            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
              <Badge className="bg-primary text-primary-foreground shadow-lg text-xs sm:text-sm">
                <ShoppingCart className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {cartQuantity}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-2.5 sm:p-3 md:p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-sm sm:text-base text-foreground transition-colors hover:text-primary line-clamp-1">
            {product.name}
          </h3>
        </Link>
{/* 
        <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
          <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
          <span className="truncate">{product.origin}</span>
        </div> */}

        {/* <p className="mt-1.5 sm:mt-2 line-clamp-2 text-[11px] sm:text-xs md:text-sm text-muted-foreground leading-relaxed">
          {product.description}
        </p> */}

        <div className="mt-2.5 sm:mt-3 md:mt-4 flex items-center justify-between gap-1.5 sm:gap-2">
          <div>
            <span className="text-base sm:text-lg md:text-xl font-bold text-foreground">
              {cupCurrency && defaultCurrency
                ? formatPrice(convertPrice(product.price, cupCurrency, defaultCurrency), defaultCurrency)
                : formatPrice(product.price, defaultCurrency)}
            </span>
            <span className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs text-muted-foreground">
              / {product.unit}
            </span>
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              addItem(product);
            }}
            disabled={!product.inStock}
            className={`gap-1 transition-all h-8 sm:h-9 text-xs sm:text-sm ${
              isInCart ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""
            }`}
          >
            {isInCart ? (
              <>
                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden xs:inline">Agregado</span>
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden xs:inline">Agregar</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Regular Product Card Component
function ProductCard({
  product,
  addItem,
  isInCart,
  cartQuantity,
  isHovered,
  onHover,
}: {
  product: Product;
  addItem: (product: Product) => void;
  isInCart: boolean;
  cartQuantity: number;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const config = categoryConfig[product.category] || categoryConfig.Fruits;
  const { defaultCurrency, currencies, formatPrice, convertPrice } = useCurrency();
  const cupCurrency = currencies.find(c => c.code === 'CUP');

  return (
    <Card
      className={`group overflow-hidden border-0 bg-card shadow-sm transition-all duration-300 ${
        isHovered ? "shadow-xl ring-2 ring-primary/20" : "hover:shadow-lg"
      }`}
      onMouseEnter={() => onHover(product.id)}
      onMouseLeave={() => onHover(null)}
    >
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-500 ${
              isHovered ? "scale-110" : "group-hover:scale-105"
            }`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          <div
            className={`absolute inset-0 bg-black/0 transition-colors duration-300 ${
              isHovered ? "bg-black/10" : ""
            }`}
          />

          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
              <Badge variant="destructive" className="text-sm font-medium">
                Agotado
              </Badge>
            </div>
          )}

          <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
            <Badge
              className={`${config.bgColor} ${config.color} border-0 shadow-sm text-xs sm:text-sm`}
            >
              {getCategoryLabel(product.category)}
            </Badge>
          </div>

          <div
            className={`absolute right-2 top-2 sm:right-3 sm:top-3 transition-all duration-300 ${
              isHovered
                ? "translate-x-0 opacity-100"
                : "translate-x-8 opacity-0"
            }`}
          >
            <button className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition-colors hover:bg-white hover:text-rose-500">
              <Heart className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
            </button>
          </div>

          {isInCart && (
            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
              <Badge className="bg-primary text-primary-foreground shadow-lg text-xs sm:text-sm">
                <ShoppingCart className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {cartQuantity}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-2.5 sm:p-3 md:p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-sm sm:text-base text-foreground transition-colors hover:text-primary line-clamp-1">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
          <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
          <span className="truncate">{product.origin}</span>
        </div>

        <div className="mt-2.5 sm:mt-3 md:mt-4 flex items-center justify-between gap-1.5 sm:gap-2">
          <div>
            <span className="text-base sm:text-lg md:text-xl font-bold text-foreground">
              {cupCurrency && defaultCurrency
                ? formatPrice(convertPrice(product.price, cupCurrency, defaultCurrency), defaultCurrency)
                : formatPrice(product.price, defaultCurrency)}
            </span>
            <span className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs text-muted-foreground">
              / {product.unit}
            </span>
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              addItem(product);
            }}
            disabled={!product.inStock}
            className={`gap-1 transition-all h-8 sm:h-9 text-xs sm:text-sm ${
              isInCart ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""
            }`}
          >
            {isInCart ? (
              <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            ) : (
              <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component

// Empty State Component
function EmptyState({
  onClear,
  searchQuery,
}: {
  onClear: () => void;
  searchQuery: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <Search className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-foreground">
        No se encontraron productos
      </h3>
      <p className="mb-6 max-w-md text-muted-foreground px-4">
        {searchQuery
          ? `No encontramos resultados para "${searchQuery}". Intenta con otros términos o ajusta los filtros.`
          : "Intenta ajustar tus filtros para encontrar lo que buscas."}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onClear}>
          Limpiar filtros
        </Button>
        <Button asChild>
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    Fruits: "Frutas",
    Citrus: "Cítricos",
    Berries: "Bayas",
    Tropical: "Tropicales",
    Melons: "Melones",
  };
  return labels[category] || category;
}
