"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneralTab from "./tabs/general-tab";
import BannersTab from "./tabs/banners-tab";
import UbicacionesTab from "./tabs/ubicaciones-tab";
import MonedasTab from "./tabs/monedas-tab";
import PaisesTab from "./tabs/paises-tab";
import UnidadesTab from "./tabs/unidades-tab";
import MetodosPagoTab from "./tabs/metodos-pago-tab";
import RolesTab from "./tabs/roles-tab";

const TABS = [
  { value: "general", label: "General" },
  { value: "banners", label: "Banners" },
  { value: "ubicaciones", label: "Ubicaciones" },
  { value: "monedas", label: "Monedas" },
  { value: "paises", label: "Países" },
  { value: "unidades", label: "Unidades" },
  { value: "metodos", label: "Métodos de pago" },
  { value: "roles", label: "Roles" },
];

function ConfiguracionTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "general";

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => router.replace(`${pathname}?tab=${v}`, { scroll: false })}
    >
      <TabsList className="flex-wrap h-auto">
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="general">
        <GeneralTab />
      </TabsContent>
      <TabsContent value="banners">
        <BannersTab />
      </TabsContent>
      <TabsContent value="ubicaciones">
        <UbicacionesTab />
      </TabsContent>
      <TabsContent value="monedas">
        <MonedasTab />
      </TabsContent>
      <TabsContent value="paises">
        <PaisesTab />
      </TabsContent>
      <TabsContent value="unidades">
        <UnidadesTab />
      </TabsContent>
      <TabsContent value="metodos">
        <MetodosPagoTab />
      </TabsContent>
      <TabsContent value="roles">
        <RolesTab />
      </TabsContent>
    </Tabs>
  );
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={null}>
      <ConfiguracionTabs />
    </Suspense>
  );
}