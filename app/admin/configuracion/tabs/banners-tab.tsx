"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BannersSubtab from "./banners-subtab";
import StoriesSubtab from "./stories-subtab";

export default function BannersTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Banners e historias</h2>
        <p className="text-muted-foreground">
          Administra los banners de la portada y las historias que se muestran al inicio.
        </p>
      </div>

      <Tabs defaultValue="banners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="historias">Historias</TabsTrigger>
        </TabsList>
        <TabsContent value="banners" className="mt-0 space-y-4">
          <BannersSubtab />
        </TabsContent>
        <TabsContent value="historias" className="mt-0 space-y-4">
          <StoriesSubtab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
