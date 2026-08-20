"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth-context";
import { useSettingsStore } from "@/lib/settings-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Palette } from "lucide-react";
import { getSettingsAction, updateSettingsAction } from "@/app/actions/admin-extras";
import { ImageUpload } from "@/components/upload-button";
import { toast } from "sonner";

export default function ConfiguracionPage() {
  const token = useAuthStore((s) => s.token);
  const setSettings = useSettingsStore((s) => s.setSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    storeName: "",
    storeDescription: "",
    logo: "",
    theme: "system",
    font: "poppins",
  });

  useEffect(() => {
    if (!token) return;
    getSettingsAction(token)
      .then((s) =>
        setForm({
          storeName: s.storeName,
          storeDescription: s.storeDescription,
          logo: s.logo,
          theme: (s.theme as any) || "system",
          font: (s.font as any) || "poppins",
        })
      )
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await updateSettingsAction(form, token);
      setSettings({
        storeName: form.storeName,
        storeDescription: form.storeDescription,
        logo: form.logo,
        theme: form.theme as "light" | "dark" | "system",
        font: form.font,
      });
      toast.success("Configuración guardada correctamente");
    } catch (e) {
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración General</h2>
        <p className="text-muted-foreground">
          Nombre de la tienda, logo, tema claro/oscuro y tipografía
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Información de la tienda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Nombre de la tienda</Label>
                <Input
                  id="storeName"
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  placeholder="MercaToma"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeDescription">Descripción</Label>
                <Input
                  id="storeDescription"
                  value={form.storeDescription}
                  onChange={(e) => setForm({ ...form, storeDescription: e.target.value })}
                  placeholder="Del campo a tu mesa"
                />
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-3">
                  {form.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.logo} alt="Logo" className="h-12 w-12 rounded-full object-cover border" />
                  )}
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={form.logo}
                      onChange={(e) => setForm({ ...form, logo: e.target.value })}
                      placeholder="URL del logo o súbelo"
                      className="flex-1"
                    />
                    <ImageUpload
                      endpoint="categoryImage"
                      onUploadComplete={(url) => setForm({ ...form, logo: url })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Apariencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tema por defecto</Label>
                <Select value={form.theme} onValueChange={(v) => setForm({ ...form, theme: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  El cliente puede cambiarlo desde el selector del encabezado.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Tipografía</Label>
                <Select value={form.font} onValueChange={(v) => setForm({ ...form, font: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipografía" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="poppins">Poppins (moderna)</SelectItem>
                    <SelectItem value="playfair">Playfair Display (elegante)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar configuración
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}