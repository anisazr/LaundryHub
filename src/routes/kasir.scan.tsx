import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { type OrderStatus } from "@/lib/mock-data";
import { useLaundryData } from "@/lib/laundry-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { UIEvent } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/kasir/scan")({
  head: () => ({ meta: [{ title: "Scan QR - Kasir" }] }),
  component: ScanPage,
});

const statuses: OrderStatus[] = ["Diterima", "Dicuci", "Disetrika", "Siap", "Diantar", "Selesai"];

function ScanPage() {
  const { data, update } = useLaundryData();
  const [q, setQ] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const list = useMemo(
    () =>
      data.orders.filter(
        (order) =>
          order.id.toLowerCase().includes(q.toLowerCase()) ||
          order.customer.toLowerCase().includes(q.toLowerCase()),
      ),
    [data.orders, q],
  );
  const visibleList = list.slice(0, visibleCount);

  function handleListScroll(event: UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 24;
    if (nearBottom && visibleCount < list.length) {
      setVisibleCount((current) => Math.min(current + 10, list.length));
    }
  }

  function updateStatus(orderId: string, status: OrderStatus) {
    update((current) => ({
      ...current,
      orders: current.orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
    }));
    toast.success(`Status ${orderId} diperbarui ke ${status}`);
  }

  return (
    <AppShell role="kasir">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan QR Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center">
              <QrCode className="mb-3 h-16 w-16 text-primary/60" />
              <div className="text-sm font-medium">Arahkan QR ke kamera</div>
              <div className="mt-1 text-xs text-muted-foreground">atau ketik ID order di kanan</div>
            </div>
            <Button className="mt-4 w-full" onClick={() => toast.info("Demo kamera belum terhubung")}>
              Aktifkan Kamera
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Cari & Update Status</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="w-64 pl-8"
                placeholder="ID order / nama"
                value={q}
                onChange={(event) => {
                  setQ(event.target.value);
                  setVisibleCount(10);
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-3 text-xs text-muted-foreground">
              Menampilkan {Math.min(visibleCount, list.length)} dari {list.length} data. Scroll daftar untuk memuat 10 data berikutnya.
            </div>
            <div className="max-h-[560px] overflow-y-auto rounded-md border" onScroll={handleListScroll}>
            {visibleList.map((order) => (
              <div key={order.id} className="flex items-center gap-3 border-b px-3 py-3 last:border-b-0">
                <div className="flex-1">
                  <div className="font-medium">
                    {order.id} - {order.customer}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {order.package} - {order.weightKg} kg
                  </div>
                </div>
                <StatusBadge status={order.status} />
                <Select value={order.status} onValueChange={(value) => updateStatus(order.id, value as OrderStatus)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            {visibleList.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Tidak ada order yang cocok.
              </div>
            )}
            {visibleCount < list.length && (
              <div className="border-t p-3 text-center text-xs text-muted-foreground">
                Scroll ke bawah untuk memuat data berikutnya.
              </div>
            )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
