"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store";
import { Onboarding } from "@/components/onboarding";
import { StoreView } from "@/components/store-view";
import { LocationSelector } from "@/components/location-selector";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const onboardingComplete = useCartStore((state) => state.onboardingComplete);
  const setOnboardingComplete = useCartStore((state) => state.setOnboardingComplete);
  const userLocation = useCartStore((state) => state.userLocation);
  const setUserLocation = useCartStore((state) => state.setUserLocation);

  useEffect(() => {
    // Small delay to ensure hydration is complete
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleOnboardingComplete = () => {
    setOnboardingComplete(true);
  };

  // Show loading state to prevent hydration mismatch
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if not completed
  if (!onboardingComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Location obligatoria al primer acceso (filtra productos por zona)
  if (!userLocation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <LocationSelector onComplete={(loc) => setUserLocation(loc)} />
      </div>
    );
  }

  // Show store view after onboarding is complete
  return <StoreView />;
}
