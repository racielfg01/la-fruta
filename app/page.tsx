"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store";
import { Onboarding } from "@/components/onboarding";
import { StoreView } from "@/components/store-view";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const onboardingComplete = useCartStore((state) => state.onboardingComplete);
  const setOnboardingComplete = useCartStore((state) => state.setOnboardingComplete);

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

  // Show store view after onboarding is complete
  return <StoreView />;
}
