import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { complaints as initialComplaints, formatTime, type Complaint } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/kasir/complaints")({
  head: () => ({ meta: [{ title: "Komplain - Kasir" }] }),
  component: ComplaintsPage,
});

function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [orderId, setOrderId] = useState("");
  const [customer, setCustomer] = useState("");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!orderId.trim() || !customer.trim() || !subject.trim()) {
      setError("Semua data komplain wajib diisi sebelum tiket disimpan.");
      return;
    }

    const next: Complaint = {
      id: `CMP-${String(complaints.length + 1).padStart(2, "0")}`,
      orderId: orderId.trim(),
      customer: customer.trim(),
      subject: subject.trim(),
      status: "Baru",
      createdAt: new Date().toISOString(),
    };

    setComplaints((current) => [next, ...current]);
    setOrderId("");
    setCustomer("");
    setSubject("");
    setError("");
    toast.success("Tiket komplain dibuat", { description: "Diteruskan ke supervisor" });
  }

  return (
    <AppShell role="kasir">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tiket Komplain Baru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="orderId">ID Order</Label>
                <Input
                  id="orderId"
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  placeholder="ORD-xxxx"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customer">Nama Pelanggan</Label>
                <Input
                  id="customer"
                  value={customer}
                  onChange={(event) => setCustomer(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Keluhan</Label>
                <Textarea
                  id="subject"
                  rows={4}
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Tulis ringkas keluhan pelanggan..."
                  required
                />
              </div>
              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button className="w-full" type="submit">
                Simpan Tiket
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tiket Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {complaints.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {item.id}
                </Badge>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.subject}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.orderId} - {item.customer} - {formatTime(item.createdAt)}
                  </div>
                </div>
                <Badge
                  variant={item.status === "Selesai" ? "secondary" : "default"}
                  className={item.status === "Selesai" ? "bg-success text-success-foreground" : ""}
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
