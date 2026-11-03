"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, Users, Coins, TrendingUp, Search, Copy } from "lucide-react";
import { getReferralStatsForAdmin } from "@/app/actions/referrals";

export default function AdminReferidosPage() {
  const { users } = useAdminStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const result = await getReferralStatsForAdmin();
      if (result.success) {
        setStats(result);
      }
    } catch (error) {
      console.error("Error loading referral stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">Sistema de Referidos</h2>
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Sistema de Referidos</h2>
        <p className="text-muted-foreground">Estadísticas y gestión del programa de referidos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Usuarios con código</p>
              <p className="text-2xl font-bold">{stats?.totalUsersWithCode || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-500/10 p-3">
              <Gift className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Referidos válidos</p>
              <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-500/10 p-3">
              <Coins className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Puntos otorgados</p>
              <p className="text-2xl font-bold">{stats?.totalPointsAwarded || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-orange-500/10 p-3">
              <TrendingUp className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Top referidores</p>
              <p className="text-2xl font-bold">{stats?.topReferrers?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top Referidores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.topReferrers?.map((referrer: any, idx: number) => (
              <div key={referrer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-medium">{referrer.name}</p>
                    <p className="text-xs text-muted-foreground">{referrer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{referrer.invites} invitados</p>
                    <p className="text-xs text-muted-foreground">{referrer.points} puntos</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyCode(referrer.code)}>
                    <Copy className="h-4 w-4 mr-1" />
                    {referrer.code}
                  </Button>
                </div>
              </div>
            ))}
            {(!stats?.topReferrers || stats.topReferrers.length === 0) && (
              <p className="text-center text-muted-foreground py-6">No hay referidores aún</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Historial de Referidos
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-sm font-medium">Referidor</th>
                  <th className="text-left p-2 text-sm font-medium">Código</th>
                  <th className="text-left p-2 text-sm font-medium">Invitado</th>
                  <th className="text-left p-2 text-sm font-medium">Email</th>
                  <th className="text-left p-2 text-sm font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {stats?.referrals?.map((ref: any) => (
                  <tr key={ref.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 text-sm">{ref.referrerName}</td>
                    <td className="p-2">
                      <Badge variant="outline" className="font-mono">{ref.referrerCode}</Badge>
                    </td>
                    <td className="p-2 text-sm">{ref.referredName}</td>
                    <td className="p-2 text-sm text-muted-foreground">{ref.referredEmail}</td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {new Date(ref.created).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!stats?.referrals || stats.referrals.length === 0) && (
              <p className="text-center text-muted-foreground py-6">No hay referidos registrados</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Historial Global de Puntos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-sm font-medium">Usuario</th>
                  <th className="text-left p-2 text-sm font-medium">Email</th>
                  <th className="text-left p-2 text-sm font-medium">Tipo</th>
                  <th className="text-left p-2 text-sm font-medium">Descripción</th>
                  <th className="text-left p-2 text-sm font-medium">Monto</th>
                  <th className="text-left p-2 text-sm font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {stats?.history?.map((item: any) => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 text-sm">{item.userName}</td>
                    <td className="p-2 text-sm text-muted-foreground">{item.userEmail}</td>
                    <td className="p-2">
                      <Badge variant={item.type === "referral_inviter" ? "default" : item.type === "referral_invitee" ? "secondary" : "outline"}>
                        {item.type === "referral_inviter" && "Invitador"}
                        {item.type === "referral_invitee" && "Invitado"}
                        {item.type === "redemption" && "Canje"}
                        {item.type === "adjustment" && "Ajuste"}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm">{item.description}</td>
                    <td className="p-2">
                      <span className={`font-semibold ${item.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                        {item.amount > 0 ? "+" : ""}{item.amount}
                      </span>
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {new Date(item.created).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!stats?.history || stats.history.length === 0) && (
              <p className="text-center text-muted-foreground py-6">No hay historial</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
