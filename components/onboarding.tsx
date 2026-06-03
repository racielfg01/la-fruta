"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Leaf,
  Truck,
  MapPin,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Heart,
  Clock,
  Star,
  Search,
  Filter,
  Package,
  CreditCard,
  Bell,
  Plus,
} from "lucide-react";
import Image from "next/image";

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    id: 1,
    title: "Bienvenido a MercaToma",
    subtitle: "Tu mercado de productos frescos",
    description:
      "Descubre la mejor selección de frutas y productos agrícoles frescos, directamente del campo a tu mesa. Calidad garantizada en cada entrega.",
    icon: Leaf,
    color: "bg-emerald-500",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&h=600&fit=crop",
    features: [
      { icon: Sparkles, text: "Productos 100% orgánicos y certificados", color: "text-emerald-600" },
      { icon: Heart, text: "Seleccionados con amor por expertos", color: "text-rose-500" },
      { icon: Star, text: "Más de 10,000 clientes satisfechos", color: "text-amber-500" },
    ],
    tip: "Desliza para continuar o usa las flechas",
  },
  {
    id: 2,
    title: "Explora y Encuentra",
    subtitle: "Navegación intuitiva",
    description:
      "Navega por nuestra amplia variedad de frutas, cítricos, bayas, productos tropicales y mucho más. Encuentra exactamente lo que necesitas con nuestras herramientas de búsqueda.",
    icon: Search,
    color: "bg-blue-500",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&h=600&fit=crop",
    features: [
      { icon: Search, text: "Búsqueda inteligente por nombre u origen", color: "text-blue-600" },
      { icon: Filter, text: "Filtros por categoría, precio y disponibilidad", color: "text-purple-500" },
      { icon: Package, text: "Vista detallada de cada producto", color: "text-teal-500" },
    ],
    tip: "Puedes filtrar por categoría, precio y más",
  },
  {
    id: 3,
    title: "Agrega a tu Carrito",
    subtitle: "Compra fácil y rápida",
    description:
      "Añade productos a tu carrito con un solo clic. Ajusta cantidades, revisa tu selección y procede al pago cuando estés listo.",
    icon: Package,
    color: "bg-purple-500",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop",
    features: [
      { icon: Plus, text: "Agrega productos con un solo toque", color: "text-purple-600" },
      { icon: ShieldCheck, text: "Revisa tu pedido antes de pagar", color: "text-green-500" },
      { icon: CreditCard, text: "Pago seguro y protegido", color: "text-indigo-500" },
    ],
    tip: "Tu carrito se guarda automáticamente",
  },
  {
    id: 4,
    title: "Entrega a Domicilio",
    subtitle: "Rápido y conveniente",
    description:
      "Selecciona tu ubicación en el mapa interactivo y recibe tus productos frescos directamente en tu hogar. Seguimiento en tiempo real de tu pedido.",
    icon: Truck,
    color: "bg-orange-500",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop",
    features: [
      { icon: MapPin, text: "Mapa interactivo para tu ubicación exacta", color: "text-orange-600" },
      { icon: Clock, text: "Entrega el mismo día disponible", color: "text-cyan-500" },
      { icon: Bell, text: "Notificaciones del estado de tu pedido", color: "text-pink-500" },
    ],
    tip: "Puedes usar tu ubicación actual o ingresarla manualmente",
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const direction = useRef<"next" | "prev">("next");
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const transitioning = useRef(false);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const StepIcon = step.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const goTo = useCallback((index: number) => {
    if (transitioning.current || index < 0 || index >= steps.length) return;
    transitioning.current = true;
    setCurrentStep(index);
    setTimeout(() => { transitioning.current = false; }, 350);
  }, []);

  const handleNext = useCallback(() => {
    if (isLastStep) { onComplete(); return; }
    direction.current = "next";
    goTo(currentStep + 1);
  }, [isLastStep, onComplete, goTo, currentStep]);

  const handlePrev = useCallback(() => {
    if (isFirstStep) return;
    direction.current = "prev";
    goTo(currentStep - 1);
  }, [isFirstStep, goTo, currentStep]);

  const handleSkip = useCallback(() => onComplete(), [onComplete]);

  const goToStep = useCallback((index: number) => {
    if (index === currentStep) return;
    direction.current = index > currentStep ? "next" : "prev";
    goTo(index);
  }, [currentStep, goTo]);

  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (touchStart.current === null || touchEnd.current === null) return;
    const distance = touchStart.current - touchEnd.current;
    if (distance > minSwipeDistance && !isLastStep) handleNext();
    else if (distance < -minSwipeDistance && !isFirstStep) handlePrev();
  }, [isLastStep, isFirstStep, handleNext, handlePrev]);

  const isRTL = direction.current === "next"
    ? "-translate-x-6 opacity-0"
    : "translate-x-6 opacity-0";

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "Escape") handleSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNext, handlePrev, handleSkip]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-0 sm:p-4 md:p-6"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-64 w-64 sm:h-96 sm:w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-64 w-64 sm:h-96 sm:w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-5xl overflow-hidden border-0 bg-card/95 shadow-2xl backdrop-blur-sm mx-auto max-h-dvh sm:max-h-[90vh] rounded-t-2xl sm:rounded-xl">
        <div className="absolute left-0 right-0 top-0 z-10">
          <Progress value={progress} className="h-1 rounded-none" />
        </div>

        <CardContent className="p-0 flex flex-col h-full max-h-dvh sm:max-h-[90vh]">
          <div className="flex flex-col md:grid md:grid-cols-2 flex-1 min-h-0">
            {/* Image Side - Desktop */}
            <div className="relative hidden md:block min-h-0">
              <div className="absolute inset-0 motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out">
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  className="object-cover"
                  sizes="50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="absolute left-6 top-6">
                <Badge className={`${step.color} border-0 px-3 py-1.5 text-white shadow-lg`}>
                  <StepIcon className="mr-1.5 h-4 w-4" />
                  Paso {currentStep + 1} de {steps.length}
                </Badge>
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="flex items-center gap-2 text-sm text-white/90">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    {step.tip}
                  </p>
                </div>
              </div>
            </div>

            {/* Content Side */}
            <div className="flex flex-col flex-1 min-h-0">
              {/* Mobile Image */}
              <div className="md:hidden relative shrink-0">
                <div className="relative w-full" style={{ aspectRatio: "16/9", maxHeight: "33vh" }}>
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <Badge className={`${step.color} border-0 text-white shadow-lg text-xs px-2.5 py-1`}>
                      <StepIcon className="mr-1 h-3 w-3" />
                      {currentStep + 1}/{steps.length}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4 sm:px-6 md:px-8 lg:px-10">
                <div className="mb-6 flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                    <Leaf className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <span className="font-[family-name:var(--font-playfair)] text-lg font-bold text-foreground">
                      <span className="text-primary">Merca</span><span className="text-destructive">Toma</span>
                    </span>
                    <p className="text-xs text-muted-foreground">Del campo a tu mesa</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-0.5">
                      {step.subtitle}
                    </p>
                    <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl md:text-4xl font-bold text-foreground text-balance leading-tight">
                      {step.title}
                    </h2>
                  </div>

                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>

                  <div className="space-y-3">
                    {step.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm">
                          <feature.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${feature.color}`} />
                        </div>
                        <span className="text-sm font-medium text-foreground">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="shrink-0 border-t border-border/50 px-5 py-4 sm:px-6 md:px-8">
                <div className="flex items-center justify-center gap-2.5 mb-4">
                  {steps.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToStep(idx)}
                      className="flex items-center justify-center min-h-[28px] min-w-[28px]"
                      aria-label={`Ir al paso ${idx + 1}: ${s.title}`}
                    >
                      <div
                        className={`rounded-full transition-all duration-300 ${
                          idx === currentStep
                            ? `h-2.5 w-8 ${s.color}`
                            : idx < currentStep
                              ? "h-2.5 w-2.5 bg-primary"
                              : "h-2.5 w-2.5 bg-muted-foreground/20"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground md:hidden bg-muted/30 py-2 px-3 rounded-lg mb-4">
                  <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                  <span className="text-center">{step.tip}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-sm font-medium hover:bg-muted h-10 px-3"
                  >
                    Omitir
                  </Button>

                  <div className="flex gap-2">
                    {!isFirstStep && (
                      <Button
                        variant="outline"
                        onClick={handlePrev}
                        className="gap-1.5 h-10 px-4 text-sm font-medium"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Anterior</span>
                      </Button>
                    )}
                    <Button
                      onClick={handleNext}
                      className={`gap-1.5 shadow-lg h-10 px-5 text-sm font-medium ${
                        isLastStep ? "bg-emerald-600 hover:bg-emerald-700" : ""
                      }`}
                    >
                      {isLastStep ? (
                        <><Sparkles className="h-4 w-4" />Comenzar</>
                      ) : (
                        <><span>Siguiente</span><ChevronRight className="h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}