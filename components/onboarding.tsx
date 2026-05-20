// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import {
//   Leaf,
//   Truck,
//   MapPin,
//   ShieldCheck,
//   ChevronRight,
//   ChevronLeft,
//   Sparkles,
//   Heart,
//   Clock,
//   Star,
//   Search,
//   Filter,
//   Package,
//   CreditCard,
//   Bell,
// } from "lucide-react";
// import Image from "next/image";

// interface OnboardingProps {
//   onComplete: () => void;
// }

// const steps = [
//   {
//     id: 1,
//     title: "Bienvenido a La Fruta",
//     subtitle: "Tu mercado de productos frescos",
//     description:
//       "Descubre la mejor seleccion de frutas y productos agricolas frescos, directamente del campo a tu mesa. Calidad garantizada en cada entrega.",
//     icon: Leaf,
//     color: "bg-emerald-500",
//     image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&h=600&fit=crop",
//     features: [
//       { icon: Sparkles, text: "Productos 100% organicos y certificados", color: "text-emerald-600" },
//       { icon: Heart, text: "Seleccionados con amor por expertos", color: "text-rose-500" },
//       { icon: Star, text: "Mas de 10,000 clientes satisfechos", color: "text-amber-500" },
//     ],
//     tip: "Desliza para continuar o usa las flechas",
//   },
//   {
//     id: 2,
//     title: "Explora y Encuentra",
//     subtitle: "Navegacion intuitiva",
//     description:
//       "Navega por nuestra amplia variedad de frutas, citricos, bayas, productos tropicales y mucho mas. Encuentra exactamente lo que necesitas con nuestras herramientas de busqueda.",
//     icon: Search,
//     color: "bg-blue-500",
//     image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&h=600&fit=crop",
//     features: [
//       { icon: Search, text: "Busqueda inteligente por nombre u origen", color: "text-blue-600" },
//       { icon: Filter, text: "Filtros por categoria, precio y disponibilidad", color: "text-purple-500" },
//       { icon: Package, text: "Vista detallada de cada producto", color: "text-teal-500" },
//     ],
//     tip: "Puedes filtrar por categoria, precio y mas",
//   },
//   {
//     id: 3,
//     title: "Agrega a tu Carrito",
//     subtitle: "Compra facil y rapida",
//     description:
//       "Anade productos a tu carrito con un solo clic. Ajusta cantidades, revisa tu seleccion y procede al pago cuando estes listo.",
//     icon: Package,
//     color: "bg-purple-500",
//     image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop",
//     features: [
//       { icon: Plus, text: "Agrega productos con un solo toque", color: "text-purple-600" },
//       { icon: ShieldCheck, text: "Revisa tu pedido antes de pagar", color: "text-green-500" },
//       { icon: CreditCard, text: "Pago seguro y protegido", color: "text-indigo-500" },
//     ],
//     tip: "Tu carrito se guarda automaticamente",
//   },
//   {
//     id: 4,
//     title: "Entrega a Domicilio",
//     subtitle: "Rapido y conveniente",
//     description:
//       "Selecciona tu ubicacion en el mapa interactivo y recibe tus productos frescos directamente en tu hogar. Seguimiento en tiempo real de tu pedido.",
//     icon: Truck,
//     color: "bg-orange-500",
//     image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop",
//     features: [
//       { icon: MapPin, text: "Mapa interactivo para tu ubicacion exacta", color: "text-orange-600" },
//       { icon: Clock, text: "Entrega el mismo dia disponible", color: "text-cyan-500" },
//       { icon: Bell, text: "Notificaciones del estado de tu pedido", color: "text-pink-500" },
//     ],
//     tip: "Puedes usar tu ubicacion actual o ingresarla manualmente",
//   },
// ];

// // Import Plus icon separately to avoid conflict
// import { Plus } from "lucide-react";

// export function Onboarding({ onComplete }: OnboardingProps) {
//   const [currentStep, setCurrentStep] = useState(0);
//   const [isAnimating, setIsAnimating] = useState(false);
//   const [direction, setDirection] = useState<"next" | "prev">("next");
//   const [touchStart, setTouchStart] = useState<number | null>(null);
//   const [touchEnd, setTouchEnd] = useState<number | null>(null);

//   const step = steps[currentStep];
//   const isLastStep = currentStep === steps.length - 1;
//   const isFirstStep = currentStep === 0;
//   const StepIcon = step.icon;
//   const progress = ((currentStep + 1) / steps.length) * 100;

//   const minSwipeDistance = 50;

//   const handleNext = useCallback(() => {
//     if (isAnimating) return;
    
//     if (isLastStep) {
//       onComplete();
//     } else {
//       setDirection("next");
//       setIsAnimating(true);
//       setTimeout(() => {
//         setCurrentStep((prev) => prev + 1);
//         setIsAnimating(false);
//       }, 300);
//     }
//   }, [isAnimating, isLastStep, onComplete]);

//   const handlePrev = useCallback(() => {
//     if (isAnimating || isFirstStep) return;
//     setDirection("prev");
//     setIsAnimating(true);
//     setTimeout(() => {
//       setCurrentStep((prev) => prev - 1);
//       setIsAnimating(false);
//     }, 300);
//   }, [isAnimating, isFirstStep]);

//   const handleSkip = () => {
//     onComplete();
//   };

//   const goToStep = (index: number) => {
//     if (isAnimating || index === currentStep) return;
//     setDirection(index > currentStep ? "next" : "prev");
//     setIsAnimating(true);
//     setTimeout(() => {
//       setCurrentStep(index);
//       setIsAnimating(false);
//     }, 300);
//   };

//   // Touch handlers for swipe
//   const onTouchStart = (e: React.TouchEvent) => {
//     setTouchEnd(null);
//     setTouchStart(e.targetTouches[0].clientX);
//   };

//   const onTouchMove = (e: React.TouchEvent) => {
//     setTouchEnd(e.targetTouches[0].clientX);
//   };

//   const onTouchEnd = () => {
//     if (!touchStart || !touchEnd) return;
//     const distance = touchStart - touchEnd;
//     const isLeftSwipe = distance > minSwipeDistance;
//     const isRightSwipe = distance < -minSwipeDistance;
    
//     if (isLeftSwipe && !isLastStep) {
//       handleNext();
//     }
//     if (isRightSwipe && !isFirstStep) {
//       handlePrev();
//     }
//   };

//   // Keyboard navigation
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.key === "ArrowRight" || e.key === "Enter") {
//         handleNext();
//       } else if (e.key === "ArrowLeft") {
//         handlePrev();
//       } else if (e.key === "Escape") {
//         handleSkip();
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [handleNext, handlePrev]);

//   const getAnimationClass = () => {
//     if (!isAnimating) return "translate-x-0 opacity-100";
//     return direction === "next" 
//       ? "-translate-x-8 opacity-0" 
//       : "translate-x-8 opacity-0";
//   };

//   return (
//     <div 
//       className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 md:p-6"
//       onTouchStart={onTouchStart}
//       onTouchMove={onTouchMove}
//       onTouchEnd={onTouchEnd}
//     >
//       {/* Background decorations */}
//       <div className="pointer-events-none absolute inset-0 overflow-hidden">
//         <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
//         <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
//         <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/5 blur-3xl" />
//       </div>

//       <Card className="relative w-full max-w-5xl overflow-hidden border-0 bg-card/95 shadow-2xl backdrop-blur-sm">
//         {/* Progress Bar */}
//         <div className="absolute left-0 right-0 top-0 z-10">
//           <Progress value={progress} className="h-1 rounded-none" />
//         </div>

//         <CardContent className="p-0">
//           <div className="grid min-h-[600px] md:grid-cols-2 lg:min-h-[650px]">
//             {/* Image Side */}
//             <div className="relative hidden md:block">
//               <div
//                 className={`absolute inset-0 transition-all duration-500 ease-out ${
//                   isAnimating ? "scale-105 opacity-0" : "scale-100 opacity-100"
//                 }`}
//               >
//                 <Image
//                   src={step.image}
//                   alt={step.title}
//                   fill
//                   className="object-cover"
//                   sizes="(max-width: 768px) 100vw, 50vw"
//                   priority
//                 />
//                 <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
//                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
//               </div>
              
//               {/* Floating badge */}
//               <div className="absolute left-6 top-6">
//                 <Badge className={`${step.color} border-0 px-3 py-1.5 text-white shadow-lg`}>
//                   <StepIcon className="mr-1.5 h-4 w-4" />
//                   Paso {currentStep + 1} de {steps.length}
//                 </Badge>
//               </div>

//               {/* Tip at bottom */}
//               <div className="absolute bottom-6 left-6 right-6">
//                 <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
//                   <p className="flex items-center gap-2 text-sm text-white/90">
//                     <Sparkles className="h-4 w-4 text-amber-400" />
//                     {step.tip}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Content Side */}
//             <div className="flex flex-col justify-between p-6 pt-8 md:p-8 md:pt-10 lg:p-10 lg:pt-12">
//               <div>
//                 {/* Mobile Image */}
//                 <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-2xl md:hidden">
//                   <Image
//                     src={step.image}
//                     alt={step.title}
//                     fill
//                     className="object-cover"
//                     sizes="100vw"
//                     priority
//                   />
//                   <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
//                   <div className="absolute bottom-3 left-3">
//                     <Badge className={`${step.color} border-0 text-white shadow-lg`}>
//                       <StepIcon className="mr-1 h-3 w-3" />
//                       Paso {currentStep + 1}/{steps.length}
//                     </Badge>
//                   </div>
//                 </div>

//                 {/* Logo */}
//                 <div className="mb-6 flex items-center gap-3">
//                   <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
//                     <Leaf className="h-6 w-6 text-primary-foreground" />
//                   </div>
//                   <div>
//                     <span className="font-[family-name:var(--font-playfair)] text-xl font-bold text-foreground">
//                       La Fruta
//                     </span>
//                     <p className="text-xs text-muted-foreground">Del campo a tu mesa</p>
//                   </div>
//                 </div>

//                 {/* Step Content */}
//                 <div
//                   className={`space-y-5 transition-all duration-300 ease-out ${getAnimationClass()}`}
//                 >
//                   <div>
//                     <p className="text-sm font-semibold uppercase tracking-wider text-primary">
//                       {step.subtitle}
//                     </p>
//                     <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold text-foreground md:text-4xl text-balance">
//                       {step.title}
//                     </h2>
//                   </div>

//                   <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
//                     {step.description}
//                   </p>

//                   <div className="space-y-3 pt-2">
//                     {step.features.map((feature, idx) => (
//                       <div 
//                         key={idx} 
//                         className="flex items-center gap-4 rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted"
//                       >
//                         <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-background shadow-sm`}>
//                           <feature.icon className={`h-5 w-5 ${feature.color}`} />
//                         </div>
//                         <span className="text-sm font-medium text-foreground md:text-base">
//                           {feature.text}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               {/* Progress and Navigation */}
//               <div className="mt-8 space-y-6">
//                 {/* Step indicators */}
//                 <div className="flex items-center justify-center gap-3">
//                   {steps.map((s, idx) => (
//                     <button
//                       key={idx}
//                       onClick={() => goToStep(idx)}
//                       className={`group relative flex items-center justify-center transition-all duration-300 ${
//                         idx === currentStep ? "scale-110" : "hover:scale-105"
//                       }`}
//                       aria-label={`Ir al paso ${idx + 1}: ${s.title}`}
//                     >
//                       <div
//                         className={`h-3 rounded-full transition-all duration-300 ${
//                           idx === currentStep
//                             ? `w-10 ${s.color}`
//                             : idx < currentStep
//                               ? "w-3 bg-primary"
//                               : "w-3 bg-muted hover:bg-muted-foreground/30"
//                         }`}
//                       />
//                       {/* Tooltip */}
//                       <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
//                         <div className="whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg">
//                           {s.title}
//                         </div>
//                       </div>
//                     </button>
//                   ))}
//                 </div>

//                 {/* Mobile tip */}
//                 <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground md:hidden">
//                   <Sparkles className="h-3 w-3" />
//                   <span>{step.tip}</span>
//                 </div>

//                 {/* Navigation Buttons */}
//                 <div className="flex items-center justify-between gap-4">
//                   <Button
//                     variant="ghost"
//                     onClick={handleSkip}
//                     className="text-muted-foreground hover:text-foreground"
//                   >
//                     Omitir tutorial
//                   </Button>

//                   <div className="flex gap-3">
//                     {!isFirstStep && (
//                       <Button 
//                         variant="outline" 
//                         size="lg"
//                         onClick={handlePrev} 
//                         disabled={isAnimating}
//                         className="gap-1"
//                       >
//                         <ChevronLeft className="h-4 w-4" />
//                         <span className="hidden sm:inline">Anterior</span>
//                       </Button>
//                     )}
//                     <Button 
//                       size="lg"
//                       onClick={handleNext} 
//                       disabled={isAnimating}
//                       className={`gap-1 shadow-lg ${isLastStep ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
//                     >
//                       {isLastStep ? (
//                         <>
//                           Comenzar a Comprar
//                           <Sparkles className="h-4 w-4" />
//                         </>
//                       ) : (
//                         <>
//                           <span className="hidden sm:inline">Siguiente</span>
//                           <span className="sm:hidden">Continuar</span>
//                           <ChevronRight className="h-4 w-4" />
//                         </>
//                       )}
//                     </Button>
//                   </div>
//                 </div>

//                 {/* Keyboard hint */}
//                 <p className="hidden text-center text-xs text-muted-foreground md:block">
//                   Usa las teclas <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">←</kbd> <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">→</kbd> para navegar
//                 </p>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
"use client";

import { useState, useEffect, useCallback } from "react";
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
    title: "Bienvenido a La Fruta",
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
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const StepIcon = step.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const minSwipeDistance = 50;

  const handleNext = useCallback(() => {
    if (isAnimating) return;
    
    if (isLastStep) {
      onComplete();
    } else {
      setDirection("next");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsAnimating(false);
      }, 300);
    }
  }, [isAnimating, isLastStep, onComplete]);

  const handlePrev = useCallback(() => {
    if (isAnimating || isFirstStep) return;
    setDirection("prev");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, isFirstStep]);

  const handleSkip = () => {
    onComplete();
  };

  const goToStep = (index: number) => {
    if (isAnimating || index === currentStep) return;
    setDirection(index > currentStep ? "next" : "prev");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(index);
      setIsAnimating(false);
    }, 300);
  };

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && !isLastStep) {
      handleNext();
    }
    if (isRightSwipe && !isFirstStep) {
      handlePrev();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  const getAnimationClass = () => {
    if (!isAnimating) return "translate-x-0 opacity-100";
    return direction === "next" 
      ? "-translate-x-8 opacity-0" 
      : "translate-x-8 opacity-0";
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-0 sm:p-4 md:p-6"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background decorations - simplified for mobile */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-64 w-64 sm:h-96 sm:w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-64 w-64 sm:h-96 sm:w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-5xl overflow-hidden border-0 bg-card/95 shadow-2xl backdrop-blur-sm mx-auto h-full sm:h-auto rounded-none sm:rounded-xl">
        {/* Progress Bar */}
        <div className="absolute left-0 right-0 top-0 z-10">
          <Progress value={progress} className="h-1 rounded-none" />
        </div>

        <CardContent className="p-0 h-full">
          <div className="flex flex-col md:grid md:grid-cols-2 h-full">
            {/* Image Side - Hidden on mobile, shown on tablet/desktop */}
            <div className="relative hidden md:block">
              <div
                className={`absolute inset-0 transition-all duration-500 ease-out ${
                  isAnimating ? "scale-105 opacity-0" : "scale-100 opacity-100"
                }`}
              >
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              
              {/* Floating badge */}
              <div className="absolute left-6 top-6">
                <Badge className={`${step.color} border-0 px-3 py-1.5 text-white shadow-lg`}>
                  <StepIcon className="mr-1.5 h-4 w-4" />
                  Paso {currentStep + 1} de {steps.length}
                </Badge>
              </div>

              {/* Tip at bottom */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="flex items-center gap-2 text-sm text-white/90">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    {step.tip}
                  </p>
                </div>
              </div>
            </div>

            {/* Content Side - Optimized for mobile with increased padding */}
            <div className="flex flex-col justify-between h-full">
              {/* Mobile Image Section - Increased spacing */}
              <div className="md:hidden">
                <div className="relative w-full overflow-hidden">
                  <Image
                    src={step.image}
                    alt={step.title}
                    width={500}
                    height={400}
                    className="w-full h-auto object-cover"
                    sizes="100vw"
                    priority
                    style={{ maxHeight: "280px" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <Badge className={`${step.color} border-0 text-white shadow-lg text-sm px-3 py-1.5`}>
                      <StepIcon className="mr-1.5 h-3.5 w-3.5" />
                      Paso {currentStep + 1}/{steps.length}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Main Content - Increased padding for mobile */}
              <div className="flex-1 px-5 pt-8 pb-6 sm:px-6 md:px-8 lg:px-10 overflow-y-auto">
                {/* Logo - Increased margin bottom */}
                <div className="mb-8 flex items-center gap-3">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                    <Leaf className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <span className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-foreground">
                      La Fruta
                    </span>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Del campo a tu mesa</p>
                  </div>
                </div>

                {/* Step Content - Increased spacing */}
                <div
                  className={`space-y-6 transition-all duration-300 ease-out ${getAnimationClass()}`}
                >
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-1">
                      {step.subtitle}
                    </p>
                    <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-foreground text-balance leading-tight">
                      {step.title}
                    </h2>
                  </div>

                  <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>

                  <div className="space-y-4 pt-2">
                    {step.features.map((feature, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-4 rounded-xl bg-muted/50 p-3 sm:p-4 transition-colors hover:bg-muted"
                      >
                        <div className={`flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl bg-background shadow-sm`}>
                          <feature.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${feature.color}`} />
                        </div>
                        <span className="text-sm sm:text-base font-medium text-foreground">
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation Section - Fixed padding and increased spacing */}
              <div className="border-t border-border/50 px-5 py-6 sm:px-6 md:px-8">
                <div className="space-y-5">
                  {/* Step indicators */}
                  <div className="flex items-center justify-center gap-3">
                    {steps.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => goToStep(idx)}
                        className={`group relative flex items-center justify-center transition-all duration-300 ${
                          idx === currentStep ? "scale-110" : "hover:scale-105"
                        }`}
                        aria-label={`Ir al paso ${idx + 1}: ${s.title}`}
                      >
                        <div
                          className={`h-2.5 rounded-full transition-all duration-300 ${
                            idx === currentStep
                              ? `w-10 ${s.color}`
                              : idx < currentStep
                                ? "w-2.5 bg-primary"
                                : "w-2.5 bg-muted hover:bg-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Mobile tip - More visible */}
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground md:hidden bg-muted/30 py-2 px-3 rounded-lg">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-center">{step.tip}</span>
                  </div>

                  {/* Navigation Buttons - Increased size and spacing for mobile */}
                  <div className="flex items-center justify-between gap-4">
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      size="default"
                      className="text-sm font-medium hover:bg-muted px-4 h-11"
                    >
                      Omitir
                    </Button>

                    <div className="flex gap-3">
                      {!isFirstStep && (
                        <Button 
                          variant="outline" 
                          size="default"
                          onClick={handlePrev} 
                          disabled={isAnimating}
                          className="gap-2 h-11 px-5 font-medium"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>Anterior</span>
                        </Button>
                      )}
                      <Button 
                        size="default"
                        onClick={handleNext} 
                        disabled={isAnimating}
                        className={`gap-2 shadow-lg h-11 px-6 font-medium ${
                          isLastStep ? "bg-emerald-600 hover:bg-emerald-700" : ""
                        }`}
                      >
                        {isLastStep ? (
                          <>
                            Comenzar
                            <Sparkles className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Siguiente
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
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