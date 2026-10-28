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
import { useCartStore, Product, availableStock } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { useCurrencyStore, useSelectedCurrency } from "@/lib/currency-store";
import { optimizedImageUrl } from "@/lib/image";
import { effectiveCupPrice, displayProductCupPrice } from "@/lib/price-margin";
import { useMarginConfig } from "@/lib/use-price-margin";
import { WHATSAPP_DISPLAY } from "@/lib/seo";
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
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getPublicProducts } from "@/app/actions/public-products";
import { getPublicBanners } from "@/app/actions/public";
import { BannerCarousel, type Banner } from "@/components/banner-carousel";
import { LocationSelector } from "@/components/location-selector";
import { SiteFooter } from "@/components/site-footer";
import { SupportWhatsAppButton } from "@/components/support-whatsapp-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

const SORT_LABELS: Record<SortOption, string> = {
  default: "Destacados",
  "price-asc": "Precio: menor a mayor",
  "price-desc": "Precio: mayor a menor",
  name: "Nombre A-Z",
};

interface StoreViewProps {
  /** Catálogo ya resuelto en el servidor: llega en el HTML de la portada. */
  initialProducts?: Product[];
  initialCategories?: string[];
  initialBanners?: Banner[];
  /** En la primera visita manda la bienvenida: no abrir el diálogo de zona debajo. */
  locationPromptEnabled?: boolean;
}

export function StoreView({
  initialProducts,
  initialCategories,
  initialBanners,
  locationPromptEnabled = true,
}: StoreViewProps = {}) {
  const hasServerProducts = (initialProducts?.length ?? 0) > 0;
  const [products, setProducts] = useState<Product[]>(initialProducts ?? []);
  const [banners, setBanners] = useState<Banner[]>(initialBanners ?? []);
  const [categories, setCategories] = useState<string[]>(
    initialCategories ?? []
  );
  const [loading, setLoading] = useState(!hasServerProducts);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0,
    1_000_000,
  ]);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const { currencies, defaultCurrency, convertPrice } = useCurrency();
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const selectedCurrency = useSelectedCurrency();
  const cupCurrency = currencies.find((c) => c.code === "CUP");
  const marginCfg = useMarginConfig();
  const toUSD = (cupPrice: number) => {
    if (!cupCurrency || !defaultCurrency) {
      return displayProductCupPrice(cupPrice, marginCfg, defaultCurrency?.code);
    }
    return convertPrice(
      displayProductCupPrice(cupPrice, marginCfg, defaultCurrency.code),
      cupCurrency,
      defaultCurrency
    );
  };
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [viewMode, setViewMode] = useState<"masonry" | "grid">("masonry");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const userLocation = useCartStore((state) => state.userLocation);
  const setUserLocation = useCartStore((state) => state.setUserLocation);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  useEffect(() => {
    if (!locationPromptEnabled) return;
    if (!userLocation) setLocationDialogOpen(true);
  }, [userLocation, locationPromptEnabled]);

  useEffect(() => {
    // La portada llega con el catálogo resuelto en el servidor; solo se pide
    // al cliente cuando no vino nada (o falló en el servidor).
    if (hasServerProducts) return;
    const loadData = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [{ products: prods, categories: cats }, bannersData] =
          await Promise.all([getPublicProducts(), getPublicBanners()]);
        const prodsWithNumberPrice = prods.map((p) => ({
          ...p,
          price: Number(p.price),
        })) as Product[];
        setProducts(prodsWithNumberPrice);
        setBanners(bannersData);
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
  }, [hasServerProducts]);

  const maxPrice = useMemo(() => {
    if (products.length === 0) return 10;
    return Math.max(...products.map((p) => toUSD(p.price)));
  }, [products, cupCurrency, defaultCurrency]);

  // Sin filtro por defecto: el rango sigue a maxPrice (carga de productos o cambio de moneda).
  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

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

      const productPriceUSD = toUSD(product.price);
      const matchesPrice =
        productPriceUSD >= priceRange[0] && productPriceUSD <= priceRange[1];

      const hasLocStock = !!(product.productLocations?.length && userLocation);
      const locStock = availableStock(userLocation, product);
      const matchesStock = true; // Mostrar productos agotados, pero no permitir agregarlos al carrito

      const matchesZone =
        !userLocation?.municipality ||
        (product.availableMunicipalities || []).length === 0 ||
        (product.availableMunicipalities || []).includes(
          userLocation.municipality,
        );

      const matchesLocationStock = true; // Mostrar productos agotados

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPrice &&
        matchesStock &&
        matchesZone &&
        matchesLocationStock
      );
    });

    switch (sortBy) {
      case "price-asc":
        filtered = [...filtered].sort((a, b) => toUSD(a.price) - toUSD(b.price));
        break;
      case "price-desc":
        filtered = [...filtered].sort((a, b) => toUSD(b.price) - toUSD(a.price));
        break;
      case "name":
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return filtered;
  }, [
    products,
    searchQuery,
    selectedCategories,
    priceRange,
    sortBy,
    showOnlyInStock,
    cupCurrency,
    defaultCurrency,
    userLocation,
  ]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

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
        : [...prev, category],
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        {loadError && (
          <div className="max-w-md text-center">
            <p className="text-sm font-medium text-destructive">{loadError}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Reintentando conexión…
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background">
        <Header />
        <SupportWhatsAppButton />

        {/* El hero solo aparece sin banners: con banners, el carrusel ocupa su lugar. */}
        {banners.length === 0 && (
          <section className="border-b bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background">
            <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                    Verduras y viandas a domicilio en Santiago de Cuba
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground sm:text-base lg:text-lg">
                    Frutas, verduras y viandas frescas del campo, con entrega por
                    zona y pago en efectivo.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Leaf className="h-4 w-4 text-emerald-600" />
                    {products.length} productos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-blue-600" />
                    Entregas máx. en 48h
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-amber-600" />
                    Garantía de frescura
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Sin hero visible, la página conserva su encabezado para lectores de pantalla y buscadores. */}
        {banners.length > 0 && (
          <h1 className="sr-only">
            Verduras y viandas a domicilio en Santiago de Cuba
          </h1>
        )}

        <BannerCarousel
          banners={banners}
          validProductIds={products.map((p) => p.id)}
        />

        {/* Toolbar sticky: 2 filas limpias */}
        {/* <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"> */}
        <div className="sticky top-16 z-40 border-b  bg-gradient-to-br from-primary/10 to-accent/10  backdrop-blur">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Fila 1: búsqueda + orden + vista + filtros */}
            <div className="flex items-center gap-2 py-3">
              <div className="relative min-w-0 flex-1" suppressHydrationWarning>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar productos, origen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-xl border-2 border-primary bg-background pl-10 pr-10 text-base shadow-[0_0_0_4px_hsl(var(--primary)/0.08)] ring-0 transition-all focus-visible:border-primary focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/0.12)] focus-visible:ring-0"
                  suppressHydrationWarning
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Orden (desktop) */}
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger className="hidden h-11 w-[180px] shrink-0 md:flex">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {SORT_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Vista (desktop lg) */}
              <div className="hidden items-center rounded-lg border bg-background p-0.5 lg:flex">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setViewMode("masonry")}
                      className={`rounded-md p-2.5 transition-colors ${
                        viewMode === "masonry"
                          ? "bg-primary text-primary-foreground"
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
                          ? "bg-primary text-primary-foreground"
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

              {/* Filtros */}
              <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="relative h-11 shrink-0 gap-2"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Filtros</span>
                    {activeFiltersCount > 0 && (
                      <Badge className="absolute -right-1.5 -top-1.5 h-5 min-w-5 rounded-full px-1.5 text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="flex w-full max-w-sm flex-col p-0"
                >
                  <SheetHeader className="border-b p-5">
                    <SheetTitle className="flex items-center justify-between">
                      Filtros
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-8 text-xs text-muted-foreground"
                        >
                          Limpiar
                        </Button>
                      )}
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto p-5">
                    <div className="mb-6">
                      <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Ordenar por
                      </h4>
                      <Select
                        value={sortBy}
                        onValueChange={(v) => setSortBy(v as SortOption)}
                      >
                        <SelectTrigger className="h-11 w-full">
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(SORT_LABELS) as SortOption[]).map(
                            (key) => (
                              <SelectItem key={key} value={key}>
                                {SORT_LABELS[key]}
                              </SelectItem>
                            ),
                          )}
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
                  </div>

                  <div className="border-t p-4">
                    <SheetClose asChild>
                      <Button className="w-full" size="lg">
                        Ver {filteredProducts.length} producto
                        {filteredProducts.length !== 1 ? "s" : ""}
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Fila 2: categorías + zona */}
            <div className="flex items-center gap-2 pb-3">
              <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 pr-2">
                  <Button
                    variant={selectedCategories.length === 0 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategories([])}
                    className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Todos
                  </Button>

                  {categories.map((category) => {
                    const isSelected = selectedCategories.includes(category);
                    const count = categoryCounts[category] || 0;
                    return (
                      <Button
                        key={category}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCategory(category)}
                        className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs"
                      >
                        {getCategoryLabel(category)}
                        <span
                          className={`rounded-full px-1.5 text-[10px] font-semibold ${
                            isSelected
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {count}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

             

            </div>
             {/* Zona + moneda */}
              <div className="flex shrink-0 items-center gap-2 pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocationDialogOpen(true)}
                  className="h-8 gap-1.5 rounded-full border-dashed px-3 text-xs"
                  title={userLocation ? "Cambiar zona de entrega" : "Elegir zona"}
                >
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span className="max-w-[110px] truncate">
                    {userLocation?.municipalityName ||
                      userLocation?.provinceName ||
                      "Zona"}
                  </span>
                </Button>
                {currencies.length > 0 && (
                  <Select
                    value={selectedCurrency?.id}
                    onValueChange={setCurrency}
                  >
                    <SelectTrigger size="sm" className="h-8 gap-1.5 rounded-full border-primary bg-primary text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-primary/40 dark:bg-primary dark:hover:bg-primary/90 [&_svg:not([class*='text-'])]:text-primary-foreground">
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {currencies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {/* {c.symbol}  */}
                          {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="container mx-auto px-4 py-6 sm:px-6 md:py-8 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
            {/* Sidebar filtros (desktop) */}
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-40 space-y-4">
                <Card className="border shadow-none">
                  <CardContent className="p-5">
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Filtros</h3>
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Limpiar
                        </Button>
                      )}
                    </div>

                    <div className="mb-6">
                      <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Ordenar por
                      </h4>
                      <Select
                        value={sortBy}
                        onValueChange={(v) => setSortBy(v as SortOption)}
                      >
                        <SelectTrigger className="h-10 w-full">
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(SORT_LABELS) as SortOption[]).map(
                            (key) => (
                              <SelectItem key={key} value={key}>
                                {SORT_LABELS[key]}
                              </SelectItem>
                            ),
                          )}
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
                  </CardContent>
                </Card>

                <div className="rounded-xl border bg-gradient-to-br from-primary/10 to-accent/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary">
                      <Truck className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Envío por zona</p>
                      <p className="text-xs text-muted-foreground">
                        El costo se calcula en el checkout
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Productos */}
            <div id="products" className="min-w-0 flex-1">
              {/* Header de resultados */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {filteredProducts.length}
                  </span>{" "}
                  producto{filteredProducts.length !== 1 ? "s" : ""}
                  {hasActiveFilters && " · filtrados"}
                </p>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              {/* Chips de filtros activos */}
              {hasActiveFilters && (
                <div className="mb-5 flex flex-wrap gap-2">
                  {sortBy !== "default" && (
                    <ActiveChip
                      label={SORT_LABELS[sortBy]}
                      onRemove={() => setSortBy("default")}
                    />
                  )}
                  {selectedCategories.map((cat) => (
                    <ActiveChip
                      key={cat}
                      label={getCategoryLabel(cat)}
                      onRemove={() => toggleCategory(cat)}
                    />
                  ))}
                  {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
                    <ActiveChip
                      label={`$${priceRange[0].toFixed(2)} – $${priceRange[1].toFixed(2)}`}
                      onRemove={() => setPriceRange([0, maxPrice])}
                    />
                  )}
                  {showOnlyInStock && (
                    <ActiveChip
                      label="Solo en stock"
                      onRemove={() => setShowOnlyInStock(false)}
                    />
                  )}
                </div>
              )}

              {/* Grid de productos */}
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {filteredProducts.map((product, productIndex) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        addItem={addItem}
                        isInCart={isInCart(product.id)}
                        cartQuantity={getCartQuantity(product.id)}
                        isHovered={hoveredProduct === product.id}
                        onHover={setHoveredProduct}
                        priority={productIndex < 3}
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

        {/* Contenido local: responde a la búsqueda y enlaza las páginas de confianza. */}
        <section
          aria-labelledby="entrega-local"
          className="border-t bg-muted/30 py-10"
        >
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2
              id="entrega-local"
              className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground"
            >
              Entrega de verduras y viandas a domicilio en Santiago de Cuba
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              MercaToma lleva productos frescos del campo a tu casa en Santiago de
              Cuba: verduras, viandas, frutas, tubérculos, legumbres y condimentos.
              Cada ficha indica la unidad de venta, el origen y la disponibilidad
              del momento.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Para pedir, elige tus productos y añádelos al carrito. El costo del
              envío se calcula en el checkout según tu zona, y el pago es en
              efectivo al recibir. Si tienes dudas sobre una entrega, escríbenos por{" "}
              <Link href="/contacto" className="font-medium text-primary hover:underline">
                WhatsApp
              </Link>
              . Consulta también las{" "}
              <Link href="/terminos" className="font-medium text-primary hover:underline">
                condiciones de entrega y pago
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Footer */}
        <SiteFooter />
      </div>

      {/* Diálogo de zona */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="pr-8">
              {userLocation
                ? "Cambiar zona de entrega"
                : "¿Dónde entregamos tu pedido?"}
            </DialogTitle>
            <DialogDescription>
              {userLocation
                ? "Elige otra provincia o municipio para ver otra disponibilidad."
                : "Selecciona tu provincia y municipio para ver los productos disponibles en tu zona."}
            </DialogDescription>
          </DialogHeader>
          <LocationSelector
            initial={userLocation || undefined}
            onComplete={(loc) => {
              setUserLocation(loc);
              setLocationDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

// -------------------------------
// Chip de filtro activo
// -------------------------------
function ActiveChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="group inline-flex items-center gap-1.5 rounded-full border bg-muted/50 py-1 pl-2.5 pr-1.5 text-xs text-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/5"
    >
      <span>{label}</span>
      <X className="h-3 w-3 text-muted-foreground transition-colors group-hover:text-destructive" />
    </button>
  );
}

// -------------------------------
// Filtros (contenido reutilizable)
// -------------------------------
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
    <div className="space-y-6">
      <div>
        <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Categorías
        </h4>
        <div className="space-y-0.5">
          {categories.map((category) => {
            const config = categoryConfig[category] || categoryConfig.Fruits;
            const count = categoryCounts[category] || 0;
            const isSelected = selectedCategories.includes(category);

            return (
              <label
                key={category}
                className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors ${
                  isSelected ? "bg-primary/10" : "hover:bg-muted"
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleCategory(category)}
                />
                <span className={`flex h-5 w-5 items-center justify-center rounded ${config.bgColor}`}>
                  <Leaf className={`h-3 w-3 ${config.color}`} />
                </span>
                <span className="flex-1 font-medium">
                  {getCategoryLabel(category)}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Rango de precio
        </h4>
        <div className="space-y-3">
          <Slider
            value={[priceRange[0], priceRange[1]]}
            onValueChange={(value) => setPriceRange([value[0], value[1]])}
            max={Math.ceil(maxPrice)}
            step={0.5}
          />
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                value={priceRange[0]}
                onChange={(e) =>
                  setPriceRange([Number(e.target.value), priceRange[1]])
                }
                className="h-9 pl-6 text-sm"
                min={0}
                max={priceRange[1]}
              />
            </div>
            <span className="text-muted-foreground">–</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([priceRange[0], Number(e.target.value)])
                }
                className="h-9 pl-6 text-sm"
                min={priceRange[0]}
                max={maxPrice}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Disponibilidad
        </h4>
        <label
          className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors ${
            showOnlyInStock ? "bg-primary/10" : "hover:bg-muted"
          }`}
        >
          <Checkbox
            checked={showOnlyInStock}
            onCheckedChange={(checked) =>
              setShowOnlyInStock(checked as boolean)
            }
          />
          <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-50">
            <Check className="h-3 w-3 text-emerald-600" />
          </span>
          <span className="font-medium">Solo en stock</span>
        </label>
      </div>
    </div>
  );
}

// -------------------------------
// Masonry Grid
// -------------------------------
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
                priority={columnIndex === 0 && productIndex < 2}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// -------------------------------
// Masonry Card
// -------------------------------
function MasonryCard({
  product,
  addItem,
  isInCart,
  cartQuantity,
  heightVariant,
  isHovered,
  onHover,
  priority = false,
}: {
  product: Product;
  addItem: (product: Product) => void;
  isInCart: boolean;
  cartQuantity: number;
  heightVariant: number;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  priority?: boolean;
}) {
  const mobileHeights = ["h-44", "h-52", "h-48", "h-60"];
  const desktopHeights = ["h-48", "h-60", "h-52", "h-64"];
  const [imageHeight, setImageHeight] = useState(desktopHeights[heightVariant]);
  const { defaultCurrency, currencies, formatPrice, convertPrice } =
    useCurrency();
  const cupCurrency = currencies.find((c) => c.code === "CUP");
  const marginCfg = useMarginConfig(product);

  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    setImageHeight(
      isMobile ? mobileHeights[heightVariant] : desktopHeights[heightVariant],
    );
  }, [heightVariant]);

  const config = categoryConfig[product.category] || categoryConfig.Fruits;

  return (
    <Card
      className={`group overflow-hidden border bg-card pt-0 shadow-none transition-all duration-300 ${
        isHovered ? "shadow-md ring-1 ring-primary/20" : ""
      }`}
      onMouseEnter={() => onHover(product.id)}
      onMouseLeave={() => onHover(null)}
    >
      <Link href={`/product/${product.id}`}>
        <div className={`relative ${imageHeight} overflow-hidden bg-muted`}>
          <Image
            src={optimizedImageUrl(product.image || '/placeholder.svg', 640)}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-500 ${
              isHovered ? "scale-105" : ""
            }`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
          />

          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
              <Badge variant="destructive" className="text-sm font-medium">
                Agotado
              </Badge>
            </div>
          )}

          <div className="absolute left-2.5 top-2.5">
            <Badge
              className={`${config.bgColor} ${config.color} border-0 shadow-sm text-xs`}
            >
              {getCategoryLabel(product.category)}
            </Badge>
          </div>

          <button
            type="button"
            aria-label="Agregar a favoritos"
            onClick={(e) => e.preventDefault()}
            className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md backdrop-blur transition-all duration-300 hover:bg-white hover:text-rose-500 ${
              isHovered
                ? "translate-x-0 opacity-100"
                : "translate-x-3 opacity-0"
            }`}
          >
            <Heart className="h-4 w-4" />
          </button>

          {isInCart && (
            <div className="absolute bottom-2.5 right-2.5">
              <Badge className="bg-primary text-primary-foreground shadow-md">
                <ShoppingCart className="mr-1 h-3 w-3" />
                {cartQuantity}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="px-2 pb-1.5 pt-0.5">
        <Link href={`/product/${product.id}`}>
          <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-foreground transition-colors hover:text-primary">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-center justify-between gap-1.5">
          <div className="min-w-0">
            <span className="text-sm font-semibold text-foreground sm:text-base">
              {cupCurrency && defaultCurrency
                ? formatPrice(
                    defaultCurrency.code === "CUP"
                      ? effectiveCupPrice(product.price, marginCfg)
                      : convertPrice(product.price, cupCurrency, defaultCurrency),
                    defaultCurrency,
                  )
                : formatPrice(
                    displayProductCupPrice(
                      product.price,
                      marginCfg,
                      defaultCurrency?.code,
                    ),
                    defaultCurrency,
                  )}
            </span>
            <span className="ml-1 text-[11px] text-muted-foreground">
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
            className={`h-7 shrink-0 gap-1 px-1.5 text-xs transition-colors ${
              isInCart ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""
            }`}
          >
            {isInCart ? (
              <>
                <Check className="h-3 w-3" />
                <span className="hidden sm:inline">Agregado</span>
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" />
                <span className="hidden sm:inline">Agregar</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// -------------------------------
// Product Card (grid)
// -------------------------------
function ProductCard({
  product,
  addItem,
  isInCart,
  cartQuantity,
  isHovered,
  onHover,
  priority = false,
}: {
  product: Product;
  addItem: (product: Product) => void;
  isInCart: boolean;
  cartQuantity: number;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  priority?: boolean;
}) {
  const config = categoryConfig[product.category] || categoryConfig.Fruits;
  const { defaultCurrency, currencies, formatPrice, convertPrice } =
    useCurrency();
  const cupCurrency = currencies.find((c) => c.code === "CUP");
  const marginCfg = useMarginConfig(product);

  return (
    <Card
      className={`group overflow-hidden border bg-card pt-0 shadow-none transition-all duration-300 ${
        isHovered ? "shadow-md ring-1 ring-primary/20" : ""
      }`}
      onMouseEnter={() => onHover(product.id)}
      onMouseLeave={() => onHover(null)}
    >
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={optimizedImageUrl(product.image || '/placeholder.svg', 640)}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-500 ${
              isHovered ? "scale-105" : ""
            }`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
          />

          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
              <Badge variant="destructive" className="text-sm font-medium">
                Agotado
              </Badge>
            </div>
          )}

          <div className="absolute left-2.5 top-2.5">
            <Badge
              className={`${config.bgColor} ${config.color} border-0 shadow-sm text-xs`}
            >
              {getCategoryLabel(product.category)}
            </Badge>
          </div>

          <button
            type="button"
            aria-label="Agregar a favoritos"
            onClick={(e) => e.preventDefault()}
            className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md backdrop-blur transition-all duration-300 hover:bg-white hover:text-rose-500 ${
              isHovered
                ? "translate-x-0 opacity-100"
                : "translate-x-3 opacity-0"
            }`}
          >
            <Heart className="h-4 w-4" />
          </button>

          {isInCart && (
            <div className="absolute bottom-2.5 right-2.5">
              <Badge className="bg-primary text-primary-foreground shadow-md">
                <ShoppingCart className="mr-1 h-3 w-3" />
                {cartQuantity}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="px-2 pb-1.5 pt-0.5">
        <Link href={`/product/${product.id}`}>
          <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-foreground transition-colors hover:text-primary">
            {product.name}
          </h3>
        </Link>

        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">{product.origin}</span>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-1.5">
          <div className="min-w-0">
            <span className="text-sm font-semibold text-foreground sm:text-base">
              {cupCurrency && defaultCurrency
                ? formatPrice(
                    defaultCurrency.code === "CUP"
                      ? effectiveCupPrice(product.price, marginCfg)
                      : convertPrice(product.price, cupCurrency, defaultCurrency),
                    defaultCurrency,
                  )
                : formatPrice(
                    displayProductCupPrice(
                      product.price,
                      marginCfg,
                      defaultCurrency?.code,
                    ),
                    defaultCurrency,
                  )}
            </span>
            <span className="ml-1 text-[11px] text-muted-foreground">
              / {product.unit}
            </span>
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              if (!product.inStock) return;
              addItem(product);
            }}
            disabled={!product.inStock}
            aria-disabled={!product.inStock}
            className={`h-7 shrink-0 gap-1 px-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isInCart ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""
            }`}
          >
            {isInCart ? (
              <>
                <Check className="h-3 w-3" />
                <span className="hidden sm:inline">Agregado</span>
              </>
            ) : product.inStock ? (
              <>
                <Plus className="h-3 w-3" />
                <span className="hidden sm:inline">Agregar</span>
              </>
            ) : (
              <span className="text-[10px] sm:text-xs">Agotado</span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// -------------------------------
// Empty State
// -------------------------------
function EmptyState({
  onClear,
  searchQuery,
}: {
  onClear: () => void;
  searchQuery: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center sm:py-20">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1.5 text-lg font-semibold text-foreground sm:text-xl">
        No se encontraron productos
      </h3>
      <p className="mb-6 max-w-md px-4 text-sm text-muted-foreground">
        {searchQuery
          ? `Sin resultados para "${searchQuery}". Prueba con otros términos o ajusta los filtros.`
          : "Ajusta los filtros para encontrar lo que buscas."}
      </p>
      <Button variant="outline" onClick={onClear}>
        Limpiar filtros
      </Button>
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