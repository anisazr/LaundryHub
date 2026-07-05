import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { LaundryHubLogo } from "@/components/BrandLogo";
import { formatRupiah, type Order } from "@/lib/mock-data";
import { payOrder, useLaundryData } from "@/lib/laundry-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, CreditCard, Banknote, Smartphone, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/kasir/payment")({
  head: () => ({ meta: [{ title: "Pembayaran - Kasir" }] }),
  component: PaymentPage,
});

const barcodePattern = [
  1, 1, 1, 0, 1, 0, 1, 1, 1,
  1, 0, 1, 0, 0, 1, 1, 0, 1,
  1, 1, 1, 1, 0, 1, 1, 1, 1,
  0, 1, 0, 1, 1, 0, 1, 0, 0,
  1, 0, 1, 1, 0, 1, 0, 1, 1,
  0, 1, 1, 0, 1, 0, 1, 1, 0,
  1, 1, 0, 1, 1, 1, 0, 1, 1,
  1, 0, 1, 0, 1, 0, 1, 0, 1,
  1, 1, 1, 0, 1, 1, 1, 1, 1,
];

const receiptLogoSvg = `
  <svg viewBox="0 0 96 72" aria-hidden="true" style="width: 74px; height: 54px; color: #1e5f74; display: block; margin: 0 auto 6px;" fill="none">
    <path d="M35 19a13 13 0 0 1 26 0" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
    <path d="M48 31v9" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
    <path d="M48 39 16 58c-5 3-3 10 3 10h58c6 0 8-7 3-10L48 39Z" stroke="currentColor" stroke-width="8" stroke-linejoin="round" />
    <path d="M18 67h60" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
  </svg>
`;

const escapeHtml = (value: string | number) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

function openReceiptPdfPreview(order: Order, method: string) {
  const popup = window.open("", "_blank", "width=420,height=720");

  if (!popup) {
    toast.error("Popup diblokir", {
      description: "Izinkan popup untuk membuka preview PDF struk.",
    });
    return false;
  }

  const printedAt = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  popup.document.write(`
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Struk ${escapeHtml(order.id)} - Laundry Hub</title>
        <style>
          @page { size: 80mm auto; margin: 8mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #f4f7f8;
            color: #12313d;
            font-family: "Courier New", monospace;
          }
          .page {
            width: 80mm;
            min-height: 100vh;
            margin: 0 auto;
            background: #fff;
            padding: 16px;
          }
          .brand { text-align: center; color: #1e5f74; }
          .brand-name { font-family: Arial, sans-serif; font-size: 26px; font-weight: 900; letter-spacing: 0; line-height: 1; text-transform: uppercase; }
          .brand-sub { font-family: Arial, sans-serif; font-size: 18px; font-weight: 900; letter-spacing: 0; line-height: 1.2; text-transform: uppercase; }
          .address { margin-top: 8px; font-size: 11px; color: #637780; line-height: 1.4; }
          .rule { margin: 14px 0; border-top: 1px dashed #9aadb4; }
          .row { display: flex; justify-content: space-between; gap: 16px; margin: 7px 0; font-size: 12px; }
          .row span:last-child { text-align: right; font-weight: 700; }
          .total { font-size: 16px; font-weight: 900; }
          .badge { display: inline-block; border: 1px solid #dce6e8; border-radius: 4px; padding: 2px 7px; font-family: Arial, sans-serif; font-size: 11px; font-weight: 700; color: #1e5f74; }
          .barcode { margin: 14px auto 6px; display: grid; grid-template-columns: repeat(9, 1fr); gap: 2px; width: 42mm; height: 42mm; padding: 5px; border: 1px solid #dce6e8; }
          .barcode span { background: #fff; border-radius: 1px; }
          .barcode .on { background: #1e5f74; }
          .footer { margin-top: 14px; text-align: center; font-size: 10px; color: #637780; line-height: 1.5; }
          .actions { margin: 14px auto 0; display: flex; gap: 8px; justify-content: center; font-family: Arial, sans-serif; }
          button { border: 0; border-radius: 6px; background: #1e5f74; color: #fff; cursor: pointer; padding: 9px 12px; font-weight: 700; }
          @media print {
            body { background: #fff; }
            .page { width: auto; min-height: 0; margin: 0; padding: 0; }
            .actions { display: none; }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <section class="brand">
            ${receiptLogoSvg}
            <div class="brand-name">Laundry</div>
            <div class="brand-sub">Hub</div>
            <div class="address">Jl. Mawar No. 17 - 0811-LAUNDRY<br />${escapeHtml(printedAt)}</div>
          </section>
          <div class="rule"></div>
          <section>
            <div class="row"><span>No. Order</span><span>${escapeHtml(order.id)}</span></div>
            <div class="row"><span>Pelanggan</span><span>${escapeHtml(order.customer)}</span></div>
            <div class="row"><span>Paket</span><span>${escapeHtml(order.package)}</span></div>
            <div class="row"><span>Berat</span><span>${escapeHtml(order.weightKg)} kg</span></div>
          </section>
          <div class="rule"></div>
          <div class="row total"><span>TOTAL</span><span>${escapeHtml(formatRupiah(order.total))}</span></div>
          <div class="row"><span>Metode</span><span><span class="badge">${escapeHtml(method)}</span></span></div>
          <div class="barcode">
            ${barcodePattern
              .map((filled) => `<span class="${filled ? "on" : ""}"></span>`)
              .join("")}
          </div>
          <div class="footer">
            ${escapeHtml(order.id)} - ${escapeHtml(formatRupiah(order.total))}<br />
            Terima kasih telah mempercayakan cucian Anda kepada Laundry Hub.
          </div>
          <div class="actions">
            <button onclick="window.print()">Cetak / Simpan PDF</button>
            <button onclick="window.close()">Tutup</button>
          </div>
        </main>
        <script>
          window.addEventListener("load", () => setTimeout(() => window.print(), 250));
        </script>
      </body>
    </html>
  `);
  popup.document.close();
  return true;
}

function DummyPaymentBarcode({ orderId, total }: { orderId: string; total: number }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Barcode Pembayaran</div>
          <div className="text-xs text-muted-foreground">Dummy QRIS LaundryHub</div>
        </div>
        <Badge variant="secondary">Dummy</Badge>
      </div>
      <div className="mx-auto grid h-40 w-40 grid-cols-9 gap-1 rounded-md bg-white p-2 shadow-inner">
        {barcodePattern.map((filled, index) => (
          <span
            key={`${orderId}-${index}`}
            className={filled ? "rounded-sm bg-primary" : "rounded-sm bg-white"}
          />
        ))}
      </div>
      <div className="mt-3 text-center text-xs text-muted-foreground">
        {orderId} - {formatRupiah(total)}
      </div>
    </div>
  );
}

function PaymentPage() {
  const { data, update } = useLaundryData();
  const unpaid = data.orders.filter((o) => !o.paid);
  const [selected, setSelected] = useState<string | undefined>(unpaid[0]?.id);
  const [method, setMethod] = useState<"Tunai" | "Kartu" | "QRIS">("Tunai");
  const order = data.orders.find((o) => o.id === selected && !o.paid) ?? unpaid[0];

  function handlePayment() {
    if (!order) {
      return;
    }

    const previewOpened = openReceiptPdfPreview(order, method);
    if (!previewOpened) {
      return;
    }

    update((current) => payOrder(current, order.id, method));
    toast.success("Pembayaran berhasil dicatat", {
      description: `${order.id} - struk PDF dibuka`,
    });
    setSelected(undefined);
  }

  function handlePreviewReceipt() {
    if (!order) {
      return;
    }

    openReceiptPdfPreview(order, method);
  }

  return (
    <AppShell role="kasir">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Order Belum Dibayar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unpaid.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelected(o.id)}
                className={`w-full rounded-md border p-3 text-left transition-colors ${
                  selected === o.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{o.id}</span>
                  <span className="font-semibold">{formatRupiah(o.total)}</span>
                </div>
                <div className="text-xs text-muted-foreground">{o.customer} - {o.package}</div>
              </button>
            ))}
            {unpaid.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Tidak ada tagihan terbuka.
              </div>
            )}
          </CardContent>
        </Card>

        {order && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Struk Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-card p-6 font-mono text-sm">
                <div className="mb-4 text-center">
                  <LaundryHubLogo
                    layout="stacked"
                    className="mx-auto text-primary"
                    markClassName="h-12 w-20"
                    textClassName="font-sans"
                  />
                  <div className="text-xs text-muted-foreground">
                    Jl. Mawar No. 17 - 0811-LAUNDRY
                  </div>
                </div>
                <div className="space-y-1 border-t border-dashed pt-3 text-xs">
                  <div className="flex justify-between gap-3">
                    <span>No. Order</span>
                    <span>{order.id}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Pelanggan</span>
                    <span>{order.customer}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Paket</span>
                    <span>{order.package}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Berat</span>
                    <span>{order.weightKg} kg</span>
                  </div>
                </div>
                <div className="mt-3 flex justify-between gap-3 border-t border-dashed pt-3 text-base font-bold">
                  <span>TOTAL</span>
                  <span>{formatRupiah(order.total)}</span>
                </div>
                <div className="mt-3 flex justify-between gap-3 border-t border-dashed pt-3 text-xs">
                  <span>Metode</span>
                  <Badge variant="secondary">{method}</Badge>
                </div>
                <div className="mt-4">
                  <DummyPaymentBarcode orderId={order.id} total={order.total} />
                </div>
                <div className="mt-4 text-center text-[10px] text-muted-foreground">
                  Terima kasih telah mempercayakan cucian Anda kepada LaundryHub.
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <Button
                  variant={method === "Tunai" ? "default" : "outline"}
                  onClick={() => setMethod("Tunai")}
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Tunai
                </Button>
                <Button
                  variant={method === "Kartu" ? "default" : "outline"}
                  onClick={() => setMethod("Kartu")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Kartu
                </Button>
                <Button
                  variant={method === "QRIS" ? "default" : "outline"}
                  onClick={() => setMethod("QRIS")}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  QRIS
                </Button>
              </div>
              <Button className="mt-3 w-full" variant="outline" size="lg" onClick={handlePreviewReceipt}>
                <FileText className="mr-2 h-4 w-4" />
                Preview PDF Struk
              </Button>
              <Button className="mt-3 w-full" size="lg" onClick={handlePayment}>
                <Printer className="mr-2 h-4 w-4" />
                Bayar & Cetak PDF
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
