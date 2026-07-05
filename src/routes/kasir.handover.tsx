import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useLaundryData } from "@/lib/laundry-store";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/kasir/handover")({
  head: () => ({ meta: [{ title: "Serah Terima - Kasir" }] }),
  component: HandoverPage,
});

function HandoverPage() {
  const { data, update } = useLaundryData();
  const ready = data.orders.filter((order) => ["Siap", "Diantar"].includes(order.status));

  function setStatus(orderId: string, status: "Diantar" | "Selesai") {
    update((current) => ({
      ...current,
      orders: current.orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
    }));
    toast.success(status === "Diantar" ? `${orderId} diserahkan ke kurir` : `${orderId} selesai`);
  }

  return (
    <AppShell role="kasir">
      <Card>
        <CardHeader>
          <CardTitle>Konfirmasi Serah Terima</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ready.map((order) => (
            <div key={order.id} className="flex items-center gap-4 rounded-lg border p-4">
              <div className="flex-1">
                <div className="font-medium">
                  {order.id} - {order.customer}
                </div>
                <div className="text-xs text-muted-foreground">
                  {order.package} - {order.weightKg} kg
                </div>
              </div>
              <StatusBadge status={order.status} />
              <Button variant="outline" onClick={() => setStatus(order.id, "Diantar")}>
                Ke Kurir
              </Button>
              <Button onClick={() => setStatus(order.id, "Selesai")}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Ke Pelanggan
              </Button>
            </div>
          ))}
          {ready.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Belum ada order siap diserahkan.
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
