"use client";

import { useEffect, useState } from "react";
import type { Banner } from "@/components/banner-carousel";
import { Onboarding } from "@/components/onboarding";
import { StoreView } from "@/components/store-view";
import { Product, useCartStore } from "@/lib/store";

interface HomeExperienceProps {
  products: Product[];
  categories: string[];
  banners: Banner[];
}

/**
 * La tienda se renderiza siempre (también en el HTML que lee Google) y la
 * bienvenida de primera visita se monta encima, en lugar de sustituirla.
 */
export function HomeExperience({
  products,
  categories,
  banners,
}: HomeExperienceProps) {
  const [mounted, setMounted] = useState(false);
  const onboardingComplete = useCartStore((state) => state.onboardingComplete);
  const setOnboardingComplete = useCartStore(
    (state) => state.setOnboardingComplete
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const showOnboarding = mounted && !onboardingComplete;

  return (
    <>
      <StoreView
        initialProducts={products}
        initialCategories={categories}
        initialBanners={banners}
        locationPromptEnabled={onboardingComplete}
      />
      {showOnboarding && (
        <Onboarding onComplete={() => setOnboardingComplete(true)} />
      )}
    </>
  );
}
