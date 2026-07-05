import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { couriers, formatTime } from "@/lib/mock-data";
import { useLaundryData } from "@/lib/laundry-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Bike, Truck, Route as RouteIcon, UserCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/kasir/couriers")({
  head: () => ({ meta: [{ title: "Kurir & Tugas - Kasir" }] }),
  component: KasirCouriersPage,
});

function vehicleForKg(weightKg: number): "Motor" | "Pick Up" {
  return weightKg >= 15 ? "Pick Up" : "Motor";
}

function KasirCouriersPage() {
  const { data, update } = useLaundryData();
  const pickupOrders = useMemo(
    () =>
      data.orders.filter(
        (order) =>
          order.source === "Online" &&
          order.paid &&
          order.status !== "Selesai" &&
          !order.assignedCourier,
      ),
    [data.orders],
  );
  const assignedOrders = useMemo(
    () => data.orders.filter((order) => order.assignedCourier && order.status !== "Selesai"),
    [data.orders],
  );
  const [selectedOrderId, setSelectedOrderId] = useState(pickupOrders[0]?.id ?? "");
  const selectedOrder = data.orders.find((order) => order.id === selectedOrderId) ?? pickupOrders[0];
  const [courierName, setCourierName] = useState(couriers[0]?.name ?? "");
  const [pickupSchedule, setPickupSchedule] = useState("");

  function assignPickup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const order = selectedOrder;
    if (!order || !courierName || !pickupSchedule) {
      toast.error("Pilih order, kurir, dan jadwal penjemputan.");
      return;
    }

    const vehicle = vehicleForKg(order.weightKg);
    update((current) => ({
      ...current,
      orders: current.orders.map((item) =>
        item.id === order.id
          ? {
              ...item,
              status: "Diterima",
              assignedCourier: courierName,
              pickupVehicle: vehicle,
              pickupScheduledAt: new Date(pickupSchedule).toISOString(),
            }
          : item,
      ),
      audit: [
        {
          id: `LOG-${String(current.audit.length + 1).padStart(4, "0")}`,
          user: "kasir@gmail.com",
          module: "Kurir",
          action: "ASSIGN",
          detail: `Order ${order.id} dijemput ${courierName} dengan ${vehicle}`,
          at: new Date().toISOString(),
        },
        ...current.audit,
      ],
    }));
    toast.success("Kurir ditugaskan", {
      description: `${courierName} - ${vehicle}`,
    });
    setSelectedOrderId("");
    setPickupSchedule("");
  }

  return (
    <AppShell role="kasir">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Kurir & Tugas</h2>
            <p className="text-sm text-muted-foreground">
              Atur penjemputan berdasarkan lokasi customer dan berat cucian.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Tugaskan Penjemputan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={assignPickup}>
                <div className="space-y-1.5">
                  <Label>Order Masuk</Label>
                  <Select value={selectedOrder?.id ?? ""} onValueChange={setSelectedOrderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih order customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {pickupOrders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.id} - {order.customer} - {order.weightKg} kg
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedOrder && (
                  <div className="rounded-md border bg-muted/40 p-4 text-sm">
                    <div className="font-semibold">{selectedOrder.customer}</div>
                    <div className="mt-1 text-muted-foreground">{selectedOrder.address ?? "Alamat belum diisi"}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">{selectedOrder.weightKg} kg</Badge>
                      <Badge variant={vehicleForKg(selectedOrder.weightKg) === "Pick Up" ? "default" : "outline"}>
                        {vehicleForKg(selectedOrder.weightKg) === "Pick Up" ? <Truck className="mr-1 h-3 w-3" /> : <Bike className="mr-1 h-3 w-3" />}
                        {vehicleForKg(selectedOrder.weightKg)}
                      </Badge>
                    </div>
                    {selectedOrder.pickupLocation && (
                      <div className="mt-3 flex items-start gap-2 rounded-md bg-background p-3">
                        <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium">Titik jemput customer</div>
                          <a
                            className="text-xs text-primary underline"
                            href={selectedOrder.pickupLocation}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Buka lokasi
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Kurir</Label>
                    <Select value={courierName} onValueChange={setCourierName}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kurir" />
                      </SelectTrigger>
                      <SelectContent>
                        {couriers.map((courier) => (
                          <SelectItem key={courier.id} value={courier.name}>
                            {courier.name} - {courier.area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Jam Jemput</Label>
                    <Input
                      type="datetime-local"
                      value={pickupSchedule}
                      onChange={(event) => setPickupSchedule(event.target.value)}
                    />
                  </div>
                </div>

                <Button className="w-full" type="submit" disabled={!pickupOrders.length}>
                  Tugaskan Kurir
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RouteIcon className="h-5 w-5" />
                Rekomendasi Titik Searah
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pickupOrders.length === 0 ? (
                <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                  Belum ada order online yang menunggu penjemputan.
                </div>
              ) : (
                pickupOrders.map((order) => (
                  <div key={order.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">{order.customer}</div>
                      <Badge variant="secondary">{order.weightKg} kg</Badge>
                    </div>
                    <div className="mt-1 text-muted-foreground">{order.address ?? "Alamat belum diisi"}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">{vehicleForKg(order.weightKg)}</Badge>
                      <Badge variant="outline">{order.pickupLocation ? "Ada titik lokasi" : "Belum kirim lokasi"}</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tugas Aktif</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[420px] space-y-3 overflow-auto">
              {assignedOrders.length === 0 ? (
                <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">Belum ada tugas aktif.</div>
              ) : (
                assignedOrders.map((order) => (
                  <div key={order.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">{order.id} - {order.customer}</div>
                      <Badge>{order.pickupVehicle}</Badge>
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      {order.assignedCourier} - {order.pickupScheduledAt ? formatTime(order.pickupScheduledAt) : "Belum dijadwalkan"}
                    </div>
                    <div className="mt-1 text-muted-foreground">{order.address}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
