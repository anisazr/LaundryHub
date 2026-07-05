import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { createOrder, useLaundryData } from "@/lib/laundry-store";
import { formatRupiah } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/kasir/new-order")({
  head: () => ({ meta: [{ title: "Order Baru - Kasir" }] }),
  component: NewOrderPage,
});

function NewOrderPage() {
  const navigate = useNavigate();
  const { data, update } = useLaundryData();
  const activePackages = data.packages.filter((item) => item.active);
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pkgId, setPkgId] = useState(activePackages[0]?.id ?? "");
  const [weight, setWeight] = useState("");
  const [pickupAt, setPickupAt] = useState("");
  const [error, setError] = useState("");

  const pkg = useMemo(
    () => activePackages.find((item) => item.id === pkgId) ?? activePackages[0],
    [activePackages, pkgId],
  );
  const weightValue = Number(weight);
  const total = pkg && Number.isFinite(weightValue) ? weightValue * pkg.pricePerKg : 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requiredFilled = customer.trim() && phone.trim() && address.trim() && pkgId && pickupAt;
    const validWeight = Number.isFinite(weightValue) && weightValue > 0;

    if (!requiredFilled || !validWeight) {
      setError("Semua data wajib diisi. Berat harus lebih dari 0 kg.");
      return;
    }

    update((current) =>
      createOrder(current, {
        customer,
        phone,
        address,
        packageId: pkgId,
        weightKg: weightValue,
        pickupAt,
      }),
    );

    setError("");
    toast.success("Order berhasil dibuat", {
      description: "Order masuk ke daftar dan stok operasional otomatis berkurang.",
    });
    navigate({ to: "/kasir" });
  }

  return (
    <AppShell role="kasir">
      <form className="grid gap-6 lg:grid-cols-3" onSubmit={handleSubmit}>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pencatatan Order Baru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="customer">Nama Pelanggan</Label>
                <Input
                  id="customer"
                  value={customer}
                  onChange={(event) => setCustomer(event.target.value)}
                  placeholder="Mis. Budi Santoso"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">No. WhatsApp</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Alamat Jemput</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Jl. ..."
                rows={2}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Paket Layanan</Label>
                <Select value={pkgId} onValueChange={setPkgId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih paket" />
                  </SelectTrigger>
                  <SelectContent>
                    {activePackages.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} - {formatRupiah(item.pricePerKg)}/kg
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weight">Berat (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pickupAt">Jadwal Jemput</Label>
                <Input
                  id="pickupAt"
                  type="datetime-local"
                  value={pickupAt}
                  onChange={(event) => setPickupAt(event.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Paket</span>
              <span className="font-medium">{pkg?.name ?? "-"}</span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Harga/kg</span>
              <span>{pkg ? formatRupiah(pkg.pricePerKg) : "-"}</span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Berat</span>
              <span>{weight || 0} kg</span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Estimasi selesai</span>
              <span>{pkg?.durationHours ?? 0} jam</span>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t pt-3">
              <span className="text-sm">Total</span>
              <span className="text-2xl font-bold text-primary">{formatRupiah(total || 0)}</span>
            </div>
            <Button className="w-full" size="lg" type="submit">
              Buat Order
            </Button>
          </CardContent>
        </Card>
      </form>
    </AppShell>
  );
}
