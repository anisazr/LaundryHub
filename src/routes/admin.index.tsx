import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRupiah, formatTime, hoursUntil } from "@/lib/mock-data";
import { getFinancialSummary, useLaundryData } from "@/lib/laundry-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingBag, AlertTriangle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dasbor Admin - LaundryHub" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data } = useLaundryData();
  const todayOrders = data.orders.length;
  const { revenue } = getFinancialSummary(data);
  const late = data.orders.filter((order) => hoursUntil(order.dueAt) < 0 && order.status !== "Selesai").length;
  const onProcess = data.orders.filter((order) => ["Dicuci", "Disetrika"].includes(order.status)).length;

  const stats = [
    { label: "Order Hari Ini", value: todayOrders, icon: ShoppingBag, tone: "text-primary bg-primary/10" },
    { label: "Pendapatan", value: formatRupiah(revenue), icon: TrendingUp, tone: "text-success bg-success/10" },
    { label: "Order Terlambat", value: late, icon: AlertTriangle, tone: "text-destructive bg-destructive/10" },
    { label: "Dalam Proses", value: onProcess, icon: Clock, tone: "text-info bg-info/10" },
  ];

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.tone}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                  <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Timer SLA Order Aktif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.orders
                .filter((order) => order.status !== "Selesai")
                .slice(0, 6)
                .map((order) => {
                  const remaining = hoursUntil(order.dueAt);
                  const pct = Math.max(0, Math.min(100, 100 - (remaining / 48) * 100));
                  const isLate = remaining < 0;
                  return (
                    <div key={order.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{order.id}</span>
                          <span className="text-muted-foreground">{order.customer}</span>
                          <StatusBadge status={order.status} />
                        </div>
                        <span className={isLate ? "font-semibold text-destructive" : "text-muted-foreground"}>
                          {isLate
                            ? `Telat ${Math.abs(remaining).toFixed(1)} jam`
                            : `Sisa ${remaining.toFixed(1)} jam`}
                        </span>
                      </div>
                      <Progress value={pct} className={isLate ? "[&>div]:bg-destructive" : ""} />
                    </div>
                  );
                })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Terkini</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.orders.slice(0, 6).map((order) => (
                <div key={order.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <div className="font-medium">
                      {order.id} - {order.customer}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(order.createdAt)} - {order.package}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{formatRupiah(order.total)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
