import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRupiah, formatTime } from "@/lib/mock-data";
import { useLaundryData } from "@/lib/laundry-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BellRing, Plus, QrCode, Wallet, Receipt } from "lucide-react";

export const Route = createFileRoute("/kasir/")({
  head: () => ({ meta: [{ title: "Panel Kasir - LaundryHub" }] }),
  component: KasirHome,
});

function KasirHome() {
  const { data } = useLaundryData();
  const todayCount = data.orders.length;
  const unpaid = data.orders.filter((order) => !order.paid).length;
  const ready = data.orders.filter((order) => order.status === "Siap").length;
  const onlineOrders = data.orders.filter((order) => order.source === "Online" && order.status === "Diterima");

  return (
    <AppShell role="kasir">
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Order Hari Ini</div>
            <div className="text-3xl font-semibold">{todayCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Belum Dibayar</div>
            <div className="text-3xl font-semibold text-warning-foreground">{unpaid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Siap Diambil</div>
            <div className="text-3xl font-semibold text-success">{ready}</div>
          </CardContent>
        </Card>
      </div>

      {onlineOrders.length > 0 && (
        <Card className="mb-6 border-accent/50 bg-accent/10">
          <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-accent p-2 text-accent-foreground">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">Notifikasi order online baru</div>
                <div className="text-sm text-muted-foreground">
                  {onlineOrders.length} order menunggu konfirmasi WhatsApp dan jadwal penjemputan.
                </div>
              </div>
            </div>
            <Button asChild>
              <Link to="/kasir/notify">Kirim Pesan Customer</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <Button asChild size="lg" className="h-20 text-base">
          <Link to="/kasir/new-order">
            <Plus className="mr-2 h-5 w-5" />
            Order Baru
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="h-20 text-base">
          <Link to="/kasir/scan">
            <QrCode className="mr-2 h-5 w-5" />
            Scan QR
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="h-20 text-base">
          <Link to="/kasir/payment">
            <Wallet className="mr-2 h-5 w-5" />
            Pembayaran
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="h-20 text-base">
          <Link to="/kasir/handover">
            <Receipt className="mr-2 h-5 w-5" />
            Serah Terima
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {data.orders.slice(0, 6).map((order) => (
            <div key={order.id} className="flex items-center gap-3 py-3 text-sm">
              <div className="w-24 font-medium">{order.id}</div>
              <div className="flex-1">
                <div>{order.customer}</div>
                <div className="text-xs text-muted-foreground">
                  {order.package} - {formatTime(order.createdAt)}
                </div>
              </div>
              <StatusBadge status={order.status} />
              <div className="w-28 text-right font-semibold">{formatRupiah(order.total)}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
