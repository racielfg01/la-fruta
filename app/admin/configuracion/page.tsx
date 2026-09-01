"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneralTab from "./tabs/general-tab";
import UbicacionesTab from "./tabs/ubicaciones-tab";
import MonedasTab from "./tabs/monedas-tab";
import PaisesTab from "./tabs/paises-tab";
import BancosTab from "./tabs/bancos-tab";
import RolesTab from "./tabs/roles-tab";

const TABS = [
  { value: "general", label: "General" },
  { value: "ubicaciones", label: "Ubicaciones" },
  { value: "monedas", label: "Monedas" },
  { value: "paises", label: "Países" },
  { value: "bancos", label: "Bancos" },
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
      <TabsContent value="ubicaciones">
        <UbicacionesTab />
      </TabsContent>
      <TabsContent value="monedas">
        <MonedasTab />
      </TabsContent>
      <TabsContent value="paises">
        <PaisesTab />
      </TabsContent>
      <TabsContent value="bancos">
        <BancosTab />
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