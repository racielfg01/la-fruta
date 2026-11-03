"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Copy, Share2, Users, Coins, Check, MessageCircle } from "lucide-react";
import { getMyReferralData } from "@/app/actions/referrals";
import { buildShareLink } from "@/lib/referral";

interface ProfileReferralsProps {
  token: string | null;
}

export default function ProfileReferrals({ token }: ProfileReferralsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await getMyReferralData(token);
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error("Error loading referrals:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!data?.code) return;
    await navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = async () => {
    if (!data?.code) return;
    const link = buildShareLink(data.code);
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!data?.code) return;
    const link = buildShareLink(data.code);
    const message = `Únete a MercaToma con mi código de referido ${data.code} y gana puntos!\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-lg" />
            <div className="h-20 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Programa de Referidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-5 w-5 text-primary" />
                <p className="font-semibold">Mis Puntos</p>
              </div>
              <p className="text-3xl font-bold text-primary">{data?.points || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Puntos disponibles</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5" />
                <p className="font-semibold">Invitados</p>
              </div>
              <p className="text-3xl font-bold">{data?.invitesCount || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Amigos invitados</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-semibold">Mi código de referido</p>
            <div className="flex gap-2">
              <Input value={data?.code || ""} readOnly className="font-mono text-lg" />
              <Button onClick={copyCode} variant="outline" size="icon">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={copyLink} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copiar enlace
              </Button>
              <Button onClick={shareWhatsApp} size="sm" className="bg-[#25D366] hover:bg-[#20BA5A]">
                <MessageCircle className="h-4 w-4 mr-2" />
                Compartir por WhatsApp
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Gana 10 puntos por cada amigo que se registre con tu código. Tu amigo también gana 10 puntos.
            </p>
          </div>
        </CardContent>
      </Card>

      {data?.history && data.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historial de puntos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.history.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`font-semibold ${item.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                    {item.amount > 0 ? "+" : ""}{item.amount}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data?.referrals && data.referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mis invitados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.referrals.map((ref: any) => (
                <div key={ref.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <p className="text-sm">{ref.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ref.created).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
