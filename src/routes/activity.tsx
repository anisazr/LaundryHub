import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, PackageCheck, Send, Truck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LaundryHubLogo } from "@/components/BrandLogo";
import { addCustomerMessage, useLaundryData } from "@/lib/laundry-store";
import { formatRupiah, formatTime } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CUSTOMER_SESSION_KEY = "laundryhub-customer-session";
const CUSTOMER_LAST_LOGIN_KEY = "laundryhub-customer-last-login";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "Aktivitas Customer - LaundryHub" }] }),
  component: ActivityPage,
});

function ActivityPage() {
  const navigate = useNavigate();
  const { data, update } = useLaundryData();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedId = window.localStorage.getItem(CUSTOMER_SESSION_KEY);
    const lastLogin = Number(window.localStorage.getItem(CUSTOMER_LAST_LOGIN_KEY) ?? 0);
    if (!savedId || !lastLogin || Date.now() - lastLogin > SEVEN_DAYS_MS) {
      window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
      window.localStorage.removeItem(CUSTOMER_LAST_LOGIN_KEY);
      navigate({ to: "/" });
      return;
    }
    window.localStorage.setItem(CUSTOMER_LAST_LOGIN_KEY, String(Date.now()));
    setCustomerId(savedId);
  }, [navigate]);

  const customer = data.customers.find((item) => item.id === customerId);
  const customerOrders = customer
    ? data.orders.filter((order) => order.customerId === customer.id || order.phone === customer.phone)
    : [];
  const messages = customer
    ? data.conversations
        .filter((item) => item.customerId === customer.id)
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    : [];

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customer || !message.trim()) return;
    update((current) => addCustomerMessage(current, customer.id, message, "Customer"));
    setMessage("");
    toast.success("Pesan terkirim ke kasir.");
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#eef9ff] text-slate-900">
      <header className="border-b border-white/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <LaundryHubLogo markClassName="h-9 w-13 bg-[#07a7d8]" textClassName="text-[#064b75]" />
          <Button asChild variant="outline" className="rounded-full border-[#d8edf5]">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <section>
          <div className="mb-6">
            <div className="text-sm font-bold uppercase tracking-[0.22em] text-[#05a7d8]">Activity</div>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-[#073c60]">Status laundry kamu</h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Semua order yang sudah berhasil dibayar akan muncul di sini.
            </p>
          </div>

          {customerOrders.length === 0 ? (
            <div className="rounded-[30px] border border-[#d8edf5] bg-white p-8 text-center shadow-lg shadow-cyan-100/50">
              <PackageCheck className="mx-auto mb-4 h-10 w-10 text-[#05a7d8]" />
              <div className="text-lg font-black text-[#073c60]">Belum ada pesanan aktif</div>
              <p className="mt-2 text-sm text-slate-500">Order akan tampil di sini setelah pembayaran berhasil.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerOrders.map((order) => (
                <div key={order.id} className="rounded-[30px] border border-[#d8edf5] bg-white p-5 shadow-lg shadow-cyan-100/50">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#05a7d8]">{order.id}</div>
                      <div className="mt-1 text-xl font-black text-[#073c60]">{order.package}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {order.weightKg} kg - {formatRupiah(order.total)} - {formatTime(order.createdAt)}
                      </div>
                    </div>
                    <Badge className="w-fit rounded-full bg-[#eaf8ff] text-[#073c60]">{order.status}</Badge>
                  </div>
                  <div className="mt-5 grid gap-2 sm:grid-cols-4">
                    {[
                      ["Diterima", "Order masuk kasir"],
                      ["Kurir", "Jadwal jemput WA"],
                      ["Proses", "Cucian diproses"],
                      ["Antar", "Diantar kembali"],
                    ].map(([title, body], index) => (
                      <div key={title} className={cn("rounded-2xl p-3", index === 0 ? "bg-[#05a7d8] text-white" : "bg-[#eef9ff] text-[#073c60]")}>
                        <div className="text-sm font-black">{title}</div>
                        <div className={cn("mt-1 text-xs", index === 0 ? "text-white/80" : "text-slate-500")}>{body}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-start gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                    <Truck className="mt-0.5 h-4 w-4 text-[#05a7d8]" />
                    <span>Kasir akan mengirim update: jam penjemputan, kurir sudah di lokasi, sedang diproses, dan jadwal pengantaran.</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-[30px] bg-[#073c60] p-5 text-white shadow-2xl shadow-cyan-200/50">
          <div className="flex items-center gap-2 text-lg font-black">
            <MessageCircle className="h-5 w-5 text-[#ffb12a]" />
            Chat dengan kasir
          </div>
          <div className="mt-4 max-h-[480px] space-y-3 overflow-auto pr-1">
            {messages.length === 0 ? (
              <div className="rounded-2xl bg-white/10 p-3 text-sm text-white/80">
                Belum ada chat. Tulis pesan untuk kasir di bawah.
              </div>
            ) : (
              messages.map((item) => (
                <div key={item.id} className={cn("flex", item.sender === "Customer" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[82%] rounded-2xl p-3 text-sm", item.sender === "Customer" ? "bg-[#ffb12a] text-[#073c60]" : "bg-white text-[#073c60]")}>
                    <div className="text-xs font-black opacity-70">{item.sender}</div>
                    <div className="mt-1">{item.body}</div>
                    <div className="mt-1 text-[10px] opacity-60">{formatTime(item.at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <form className="mt-4 flex gap-2" onSubmit={sendMessage}>
            <Input
              className="rounded-2xl border-white/20 bg-white/10 text-white placeholder:text-white/60"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tulis pesan..."
            />
            <Button className="rounded-2xl bg-[#ffb12a] text-[#073c60] hover:bg-[#f5a313]" type="submit">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </aside>
      </main>
    </div>
  );
}
