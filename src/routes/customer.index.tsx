import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronRight,
  Home,
  MessageCircle,
  PackageCheck,
  Percent,
  Send,
  Settings,
  ShoppingBag,
  User,
  Wallet,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addCustomerMessage,
  createOrder,
  getAvailabilityPlan,
  updateCustomer,
  useLaundryData,
  type CustomerAccount,
} from "@/lib/laundry-store";
import { formatRupiah, formatTime } from "@/lib/mock-data";
import { LaundryHubLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CUSTOMER_SESSION_KEY = "laundryhub-customer-session";
const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "activity", label: "Aktivitas", icon: PackageCheck },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "profile", label: "Profil", icon: User },
] as const;

type TabId = (typeof navItems)[number]["id"];

export const Route = createFileRoute("/customer/")({
  head: () => ({ meta: [{ title: "Customer App - LaundryHub" }] }),
  component: CustomerApp,
});

function CustomerApp() {
  const navigate = useNavigate();
  const { data, update } = useLaundryData();
  const [tab, setTab] = useState<TabId>("home");
  const sessionId =
    typeof window === "undefined" ? "CUS-0001" : window.localStorage.getItem(CUSTOMER_SESSION_KEY) ?? "CUS-0001";
  const customer = data.customers.find((item) => item.id === sessionId) ?? data.customers[0];
  const activePackages = data.packages.filter((item) => item.active);

  if (!customer) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Button onClick={() => navigate({ to: "/" })}>Kembali ke Login</Button>
      </div>
    );
  }

  const customerOrders = data.orders.filter((order) => order.customerId === customer.id || order.phone === customer.phone);

  return (
    <div className="min-h-screen bg-[#f5f7f8] text-foreground">
      <div className="mx-auto min-h-screen w-full max-w-md bg-background shadow-2xl shadow-slate-200/80">
        <header className="sticky top-0 z-20 border-b bg-card/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Halo, {customer.name.split(" ")[0]}</div>
              <LaundryHubLogo markClassName="h-8 w-11" textClassName="text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full">
                <Bell className="h-4 w-4" />
              </Button>
              <button onClick={() => setTab("profile")} className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={customer.avatar} />
                  <AvatarFallback>{customer.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
              </button>
            </div>
          </div>
        </header>

        <main className="pb-24">
          {tab === "home" && <HomeTab customer={customer} packages={activePackages} />}
          {tab === "activity" && <ActivityTab orders={customerOrders} />}
          {tab === "chat" && <ChatTab customer={customer} />}
          {tab === "profile" && <ProfileTab customer={customer} />}
        </main>

        <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-md -translate-x-1/2 grid-cols-4 border-t bg-card px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md px-2 py-2 text-[11px] font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );

  function HomeTab({ customer, packages }: { customer: CustomerAccount; packages: typeof activePackages }) {
    const firstPickup = new Date();
    firstPickup.setHours(firstPickup.getHours() + 1, 0, 0, 0);
    const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
    const [weight, setWeight] = useState("5");
    const [pickupAt, setPickupAt] = useState(toDatetimeLocal(firstPickup));
    const [address, setAddress] = useState(customer.address);
    const [paymentMethod, setPaymentMethod] = useState<"QRIS" | "Transfer Bank">("QRIS");
    const weightValue = Number(weight);
    const plan = getAvailabilityPlan(data, packageId, Number.isFinite(weightValue) ? weightValue : 0, pickupAt);
    const total = plan.service && Number.isFinite(weightValue) ? plan.service.pricePerKg * weightValue : 0;

    function submitOrder(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!plan.service || !weightValue || weightValue <= 0 || !address.trim()) {
        toast.error("Lengkapi paket, berat, dan alamat jemput.");
        return;
      }

      update((current) =>
        createOrder(current, {
          customer: customer.name,
          phone: customer.phone,
          address,
          packageId,
          weightKg: weightValue,
          pickupAt,
          customerId: customer.id,
          source: "Online",
          paymentMethod,
          paid: true,
          deliveryAt: plan.canPickupToday ? plan.dueAt : plan.alternativeDeliveryAt,
        }),
      );
      toast.success("Order online masuk ke kasir", {
        description: "Kasir akan mengirim jadwal penjemputan via WhatsApp.",
      });
      setTab("activity");
    }

    return (
      <div className="space-y-5 p-4">
        <section className="overflow-hidden rounded-md bg-primary text-primary-foreground">
          <div className="p-5">
            <Badge className="mb-4 bg-accent text-accent-foreground">Promo Minggu Ini</Badge>
            <h1 className="text-2xl font-bold tracking-tight">Cuci setrika hemat 15%</h1>
            <p className="mt-2 text-sm text-primary-foreground/80">
              Pickup cepat, bayar QRIS atau transfer, status bisa dipantau dari aktivitas.
            </p>
          </div>
          <div className="grid grid-cols-3 border-t border-white/15 text-center text-xs">
            <div className="p-3">
              <div className="font-bold">{plan.capacity.queueCount}</div>
              Antrian
            </div>
            <div className="border-x border-white/15 p-3">
              <div className="font-bold">{plan.capacity.usedKg} kg</div>
              Terpakai
            </div>
            <div className="p-3">
              <div className="font-bold">{plan.capacity.remainingKg} kg</div>
              Sisa
            </div>
          </div>
        </section>

        <form className="space-y-4" onSubmit={submitOrder}>
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Mau laundry apa hari ini?</h2>
                  <p className="text-xs text-muted-foreground">Pilih paket, kiloan, dan cek estimasi.</p>
                </div>
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div className="grid gap-3">
                <Field label="Paket">
                  <Select value={packageId} onValueChange={setPackageId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih paket" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - {formatRupiah(item.pricePerKg)}/kg
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Berat">
                    <Input min="0.1" step="0.1" type="number" value={weight} onChange={(event) => setWeight(event.target.value)} />
                  </Field>
                  <Field label="Jemput">
                    <Input type="datetime-local" value={pickupAt} onChange={(event) => setPickupAt(event.target.value)} />
                  </Field>
                </div>
                <Field label="Alamat Jemput">
                  <Textarea rows={2} value={address} onChange={(event) => setAddress(event.target.value)} />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card className={plan.canPickupToday ? "border-success/40" : "border-warning/50"}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                {plan.canPickupToday ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
                ) : (
                  <CalendarClock className="mt-0.5 h-5 w-5 text-warning" />
                )}
                <div>
                  <div className="font-semibold">{plan.canPickupToday ? "Bisa diproses hari ini" : "Express penuh hari ini"}</div>
                  <p className="text-sm text-muted-foreground">{plan.message}</p>
                </div>
              </div>
              <div className="rounded-md bg-muted p-3 text-sm">
                Estimasi selesai:{" "}
                <span className="font-semibold">
                  {formatTime(plan.canPickupToday ? plan.dueAt : plan.alternativeDeliveryAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2 font-semibold">
                <Wallet className="h-4 w-4 text-primary" />
                Pembayaran
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["QRIS", "Transfer Bank"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      "rounded-md border px-3 py-3 text-sm font-semibold",
                      paymentMethod === method ? "border-primary bg-primary text-primary-foreground" : "bg-background",
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
              {paymentMethod === "QRIS" ? (
                <div className="rounded-md border bg-background p-3 text-center">
                  <div className="mx-auto grid h-28 w-28 grid-cols-5 gap-1 rounded-md bg-white p-2">
                    {Array.from({ length: 25 }).map((_, index) => (
                      <span key={index} className={cn("rounded-sm", index % 3 === 0 || index % 7 === 0 ? "bg-foreground" : "bg-muted")} />
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{data.settings.qrisMerchant}</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.settings.bankAccounts.filter((account) => account.active).map((account) => (
                    <div key={account.id} className="rounded-md border bg-background p-3 text-sm">
                      <div className="font-semibold">{account.bank}</div>
                      <div>{account.accountNo}</div>
                      <div className="text-xs text-muted-foreground">{account.accountName}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-primary">{formatRupiah(total || 0)}</span>
              </div>
              <Button className="h-12 w-full" size="lg" type="submit">
                Pesan Sekarang
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    );
  }

  function ActivityTab({ orders }: { orders: typeof data.orders }) {
    return (
      <div className="space-y-4 p-4">
        <h2 className="text-xl font-semibold">Aktivitas</h2>
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">Belum ada order customer.</CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{order.package}</div>
                    <div className="text-xs text-muted-foreground">{order.id} - {formatTime(order.createdAt)}</div>
                  </div>
                  <Badge variant={order.paid ? "default" : "secondary"}>{order.paid ? "Lunas" : "Belum bayar"}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {["Diterima", "Dicuci", "Selesai"].map((step) => (
                    <div key={step} className={cn("rounded-md px-2 py-2", order.status === step ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      {step}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>{order.weightKg} kg</span>
                  <span className="font-semibold">{formatRupiah(order.total)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  }

  function ChatTab({ customer }: { customer: CustomerAccount }) {
    const [message, setMessage] = useState("");
    const messages = data.conversations
      .filter((item) => item.customerId === customer.id)
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    function sendMessage(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!message.trim()) return;
      update((current) => addCustomerMessage(current, customer.id, message));
      setMessage("");
      toast.success("Pesan terkirim ke admin.");
    }

    return (
      <div className="flex min-h-[calc(100vh-145px)] flex-col p-4">
        <h2 className="mb-4 text-xl font-semibold">Chat Admin</h2>
        <div className="flex-1 space-y-3">
          {messages.map((item) => (
            <div key={item.id} className={cn("flex", item.sender === "Customer" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[78%] rounded-md px-3 py-2 text-sm", item.sender === "Customer" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                <div>{item.body}</div>
                <div className="mt-1 text-[10px] opacity-70">{formatTime(item.at)}</div>
              </div>
            </div>
          ))}
        </div>
        <form className="mt-4 flex gap-2" onSubmit={sendMessage}>
          <Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tulis pesan..." />
          <Button size="icon" type="submit">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    );
  }

  function ProfileTab({ customer }: { customer: CustomerAccount }) {
    const [profile, setProfile] = useState(customer);

    function saveProfile(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      update((current) => updateCustomer(current, profile));
      toast.success("Profil customer diperbarui.");
    }

    return (
      <form className="space-y-4 p-4" onSubmit={saveProfile}>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar} />
            <AvatarFallback>{profile.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Profil</h2>
            <p className="text-sm text-muted-foreground">Edit data diri seperti aplikasi mobile.</p>
          </div>
          <Camera className="h-5 w-5 text-muted-foreground" />
        </div>
        <Field label="URL Foto Profil">
          <Input value={profile.avatar ?? ""} onChange={(event) => setProfile({ ...profile, avatar: event.target.value })} placeholder="https://..." />
        </Field>
        <Field label="Nama">
          <Input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} />
        </Field>
        <Field label="Email">
          <Input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} />
        </Field>
        <Field label="Password">
          <Input type="password" value={profile.password} onChange={(event) => setProfile({ ...profile, password: event.target.value })} />
        </Field>
        <Field label="WhatsApp">
          <Input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
        </Field>
        <Field label="Alamat">
          <Textarea rows={3} value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} />
        </Field>
        <Button className="h-11 w-full" type="submit">
          <Settings className="h-4 w-4" />
          Simpan Profil
        </Button>
        <Button
          className="w-full"
          type="button"
          variant="outline"
          onClick={() => {
            window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
            navigate({ to: "/" });
          }}
        >
          Keluar
        </Button>
      </form>
    );
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="block space-y-1.5 text-sm">
      <span>{label}</span>
      {children}
    </Label>
  );
}

function toDatetimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
