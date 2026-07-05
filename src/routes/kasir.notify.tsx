import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { buildWhatsappUrl, useLaundryData } from "@/lib/laundry-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Send, MessageCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/kasir/notify")({
  head: () => ({ meta: [{ title: "Notifikasi - Kasir" }] }),
  component: NotifyPage,
});

const templates = [
  {
    id: "ready",
    label: "Cucian Siap Diambil",
    body: "Halo {nama}, cucian Anda dengan ID {order} sudah siap diambil. Terima kasih telah menggunakan layanan LaundryHub.",
  },
  {
    id: "delivery",
    label: "Kurir Berangkat",
    body: "Halo {nama}, kurir kami sedang dalam perjalanan mengantar order {order}. Mohon ditunggu.",
  },
  {
    id: "reminder",
    label: "Pengingat Pembayaran",
    body: "Halo {nama}, mohon konfirmasi pembayaran untuk order {order}. Terima kasih.",
  },
];

function NotifyPage() {
  const { data } = useLaundryData();
  const [tpl, setTpl] = useState(templates[0]);
  const [selected, setSelected] = useState<string[]>(data.orders[0] ? [data.orders[0].id] : []);
  const [error, setError] = useState("");

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const messageFor = (orderId: string) => {
    const order = data.orders.find((item) => item.id === orderId);
    if (!order) return "";
    return tpl.body.replaceAll("{nama}", order.customer).replaceAll("{order}", order.id);
  };

  function handleSend() {
    const recipients = data.orders.filter((order) => selected.includes(order.id));
    if (!tpl.body.trim() || recipients.length === 0) {
      setError("Pesan dan penerima wajib diisi sebelum WhatsApp dibuka.");
      return;
    }

    recipients.forEach((order, index) => {
      const url = buildWhatsappUrl(order.phone, messageFor(order.id));
      window.setTimeout(() => window.open(url, "_blank", "noopener,noreferrer"), index * 250);
    });

    setError("");
    toast.success(`WhatsApp dibuka untuk ${recipients.length} pelanggan`);
  }

  return (
    <AppShell role="kasir">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Template Pesan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setTpl(template)}
                className={`w-full rounded-md border p-3 text-left text-sm ${
                  tpl.id === template.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                }`}
              >
                {template.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Kirim Notifikasi WhatsApp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="message">Pesan</Label>
              <Textarea
                id="message"
                rows={4}
                value={tpl.body}
                onChange={(event) => setTpl({ ...tpl, body: event.target.value })}
                required
              />
              <div className="text-xs text-muted-foreground">Variabel tersedia: {"{nama}, {order}"}</div>
            </div>
            <div>
              <Label className="mb-2 block">Pilih Penerima ({selected.length})</Label>
              <div className="max-h-72 overflow-auto rounded-md border">
                {data.orders.map((order) => (
                  <label key={order.id} className="flex cursor-pointer items-center gap-3 border-b p-3 last:border-b-0 hover:bg-muted">
                    <Checkbox checked={selected.includes(order.id)} onCheckedChange={() => toggle(order.id)} />
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{order.customer}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.id} - {order.phone}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.preventDefault();
                        if (!tpl.body.trim()) {
                          setError("Pesan wajib diisi sebelum WhatsApp dibuka.");
                          return;
                        }
                        window.open(
                          buildWhatsappUrl(order.phone, messageFor(order.id)),
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }}
                    >
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      WA
                    </Button>
                  </label>
                ))}
              </div>
            </div>
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button size="lg" className="w-full" onClick={handleSend}>
              <Send className="mr-2 h-4 w-4" />
              Kirim Notifikasi
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
