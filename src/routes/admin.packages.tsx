import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { formatRupiah, type ServicePackage } from "@/lib/mock-data";
import { upsertPackage, useLaundryData } from "@/lib/laundry-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Plus, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/packages")({
  head: () => ({ meta: [{ title: "Paket & Harga - Admin" }] }),
  component: PackagesPage,
});

type PackageForm = {
  id?: string;
  name: string;
  pricePerKg: string;
  durationHours: string;
  description: string;
  active: boolean;
};

const emptyForm: PackageForm = {
  name: "",
  pricePerKg: "",
  durationHours: "",
  description: "",
  active: true,
};

const formFromPackage = (item: ServicePackage): PackageForm => ({
  id: item.id,
  name: item.name,
  pricePerKg: String(item.pricePerKg),
  durationHours: String(item.durationHours),
  description: item.description,
  active: item.active,
});

function PackagesPage() {
  const { data, update } = useLaundryData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PackageForm>(emptyForm);
  const [error, setError] = useState("");

  function openNewForm() {
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEditForm(item: ServicePackage) {
    setForm(formFromPackage(item));
    setError("");
    setShowForm(true);
  }

  function togglePackage(packageId: string, active: boolean) {
    const item = data.packages.find((pkg) => pkg.id === packageId);
    if (!item) return;

    update((current) =>
      upsertPackage(current, {
        ...item,
        active,
      }),
    );
    toast.success(active ? "Paket diaktifkan" : "Paket dinonaktifkan");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const price = Number(form.pricePerKg);
    const duration = Number(form.durationHours);

    if (!form.name.trim() || !form.description.trim() || price <= 0 || duration <= 0) {
      setError("Nama, harga, durasi SLA, dan deskripsi wajib diisi. Harga dan durasi harus lebih dari 0.");
      return;
    }

    update((current) =>
      upsertPackage(current, {
        id: form.id,
        name: form.name,
        pricePerKg: price,
        durationHours: duration,
        description: form.description,
        active: form.active,
      }),
    );

    toast.success(form.id ? "Paket berhasil diperbarui" : "Paket baru berhasil ditambahkan");
    setShowForm(false);
    setForm(emptyForm);
    setError("");
  }

  return (
    <AppShell role="admin">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Manajemen Paket Layanan</h2>
          <p className="text-sm text-muted-foreground">
            Tambah paket seperti Extra Express, khusus member, promo, atau layanan reguler.
          </p>
        </div>
        <Button onClick={openNewForm}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Paket
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{form.id ? "Edit Paket" : "Tambah Paket Baru"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="name">Nama Paket</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Mis. Extra Express Member"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Harga per Kg</Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  value={form.pricePerKg}
                  onChange={(event) => setForm((current) => ({ ...current, pricePerKg: event.target.value }))}
                  placeholder="25000"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duration">Durasi SLA (jam)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={form.durationHours}
                  onChange={(event) => setForm((current) => ({ ...current, durationHours: event.target.value }))}
                  placeholder="3"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status Aktif</Label>
                <div className="flex h-9 items-center gap-3 rounded-md border px-3">
                  <Switch
                    checked={form.active}
                    onCheckedChange={(checked) => setForm((current) => ({ ...current, active: checked }))}
                  />
                  <span className="text-sm text-muted-foreground">
                    {form.active ? "Bisa dipilih kasir" : "Disembunyikan dari order baru"}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Mis. Layanan khusus member, selesai 3 jam, termasuk pewangi premium."
                  required
                />
              </div>
              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2">
                  {error}
                </div>
              )}
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit">{form.id ? "Simpan Perubahan" : "Simpan Paket"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.packages.map((item) => (
          <Card key={item.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <div className="mt-1 text-xs text-muted-foreground">{item.id}</div>
              </div>
              <Switch checked={item.active} onCheckedChange={(checked) => togglePackage(item.id, checked)} />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold tracking-tight">
                {formatRupiah(item.pricePerKg)}
                <span className="text-sm font-normal text-muted-foreground">/kg</span>
              </div>
              <p className="min-h-10 text-sm text-muted-foreground">{item.description}</p>
              <div className="flex items-center justify-between border-t pt-2">
                <Badge variant="secondary">SLA {item.durationHours} jam</Badge>
                <Button size="sm" variant="ghost" onClick={() => openEditForm(item)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
