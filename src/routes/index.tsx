import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock3,
  LogIn,
  MapPin,
  PackageCheck,
  QrCode,
  Sparkles,
  Star,
  Truck,
  UserPlus,
  Wallet,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { LaundryHubLogo } from "@/components/BrandLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createOrder,
  getAvailabilityPlan,
  registerCustomer,
  useLaundryData,
} from "@/lib/laundry-store";
import { formatRupiah, formatTime } from "@/lib/mock-data";

const staffAccounts = [
  { email: "admin@gmail.com", password: "adminlaundry", path: "/admin" },
  { email: "kasir@gmail.com", password: "kasirlaundry", path: "/kasir" },
] as const;

const CUSTOMER_SESSION_KEY = "laundryhub-customer-session";
const CUSTOMER_LAST_LOGIN_KEY = "laundryhub-customer-last-login";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const photos = {
  hero: "/laundry-photos/pickup-delivery.jpg",
  dryClean: "/laundry-photos/dry-cleaning-cost.jpg",
  garmentRack: "/laundry-photos/laundry-service-nyc.jpg",
  rapidClean: "/laundry-photos/rapid-dry-cleaning.jpg",
  suitCare: "/laundry-photos/dry-cleaning-suit.jpg",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LaundryHub - Laundry Delivery Service" },
      { name: "description", content: "LaundryHub website customer untuk pesan laundry antar jemput." },
    ],
  }),
  component: CustomerHomepage,
});

function CustomerHomepage() {
  const navigate = useNavigate();
  const { data, update } = useLaundryData();
  const packages = data.packages.filter((item) => item.active);

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [customerEmail, setCustomerEmail] = useState("dina@mail.com");
  const [customerPassword, setCustomerPassword] = useState("customer123");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerAddress, setRegisterAddress] = useState("");
  const [error, setError] = useState("");

  const [packageId, setPackageId] = useState("");
  const [weight, setWeight] = useState("");
  const [pickupAt, setPickupAt] = useState("");
  const [address, setAddress] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"QRIS" | "Transfer Bank">("QRIS");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [qrisScanned, setQrisScanned] = useState(false);
  const [bankPaid, setBankPaid] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState(data.settings.bankAccounts.find((account) => account.active)?.id ?? "");

  useEffect(() => {
    const savedId = window.localStorage.getItem(CUSTOMER_SESSION_KEY);
    const lastLogin = Number(window.localStorage.getItem(CUSTOMER_LAST_LOGIN_KEY) ?? 0);
    if (!savedId) return;
    if (!lastLogin || Date.now() - lastLogin > SEVEN_DAYS_MS) {
      window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
      window.localStorage.removeItem(CUSTOMER_LAST_LOGIN_KEY);
      return;
    }
    window.localStorage.setItem(CUSTOMER_LAST_LOGIN_KEY, String(Date.now()));
    setCustomerId(savedId);
  }, []);

  const customer = data.customers.find((item) => item.id === customerId);
  const weightValue = Number(weight);
  const plan = getAvailabilityPlan(data, packageId, Number.isFinite(weightValue) ? weightValue : 0, pickupAt);
  const total = plan.service && Number.isFinite(weightValue) ? plan.service.pricePerKg * weightValue : 0;

  function setSession(nextCustomerId: string) {
    window.localStorage.setItem(CUSTOMER_SESSION_KEY, nextCustomerId);
    window.localStorage.setItem(CUSTOMER_LAST_LOGIN_KEY, String(Date.now()));
    setCustomerId(nextCustomerId);
  }

  function requireCustomer(nextTab = "login") {
    if (customer) return true;
    setAuthTab(nextTab);
    setError("");
    setAuthOpen(true);
    return false;
  }

  function handleCustomerLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const staffAccount = staffAccounts.find(
      (item) =>
        item.email === customerEmail.trim().toLowerCase() &&
        item.password === customerPassword,
    );
    if (staffAccount) {
      setAuthOpen(false);
      setError("");
      navigate({ to: staffAccount.path });
      return;
    }

    const found = data.customers.find(
      (item) => item.email.toLowerCase() === customerEmail.trim().toLowerCase() && item.password === customerPassword,
    );
    if (!found) {
      setError("Email atau password belum sesuai. Silakan cek kembali atau registrasi.");
      return;
    }
    setSession(found.id);
    setAddress(found.address);
    setAuthOpen(false);
    toast.success("Login berhasil. Session aktif 7 hari.");
  }

  function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (data.customers.some((item) => item.email.toLowerCase() === registerEmail.trim().toLowerCase())) {
      setError("Email ini sudah terdaftar. Silakan login.");
      return;
    }
    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim() || !registerPhone.trim()) {
      setError("Nama, email, password, dan WhatsApp wajib diisi.");
      return;
    }
    const nextNumber =
      data.customers.reduce((max, item) => {
        const value = Number(item.id.replace(/\D/g, ""));
        return Number.isFinite(value) ? Math.max(max, value) : max;
      }, 0) + 1;
    const nextCustomerId = `CUS-${String(nextNumber).padStart(4, "0")}`;
    update((current) =>
      registerCustomer(current, {
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        phone: registerPhone,
        address: registerAddress,
      }),
    );
    setSession(nextCustomerId);
    setAddress(registerAddress);
    setAuthOpen(false);
    toast.success("Registrasi berhasil. Sekarang kamu bisa pesan laundry.");
  }

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireCustomer("login")) return;
    if (!customer || !plan.service || !weightValue || weightValue <= 0 || !packageId || !pickupAt) {
      toast.error("Lengkapi paket, berat cucian, dan jadwal jemput.");
      return;
    }
    if (!address.trim()) {
      toast.error("Alamat jemput wajib diisi.");
      return;
    }
    setQrisScanned(false);
    setBankPaid(false);
    setPaymentOpen(true);
  }

  function resetBookingForm() {
    setPackageId("");
    setWeight("");
    setPickupAt("");
    setAddress("");
    setPickupLocation("");
    setPaymentMethod("QRIS");
    setQrisScanned(false);
    setBankPaid(false);
  }

  function completePayment() {
    if (!customer || !plan.service || !weightValue || weightValue <= 0 || !packageId || !pickupAt || !address.trim()) {
      toast.error("Data order belum lengkap.");
      setPaymentOpen(false);
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
        pickupLocation,
      }),
    );
    setPaymentOpen(false);
    resetBookingForm();
    toast.success("Pembayaran berhasil. Order masuk ke kasir.", {
      description: "Lanjut pantau status di halaman Aktivitas.",
    });
    window.setTimeout(() => navigate({ to: "/activity" }), 250);
  }

  function captureCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung lokasi. Isi alamat jemput secara manual.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setPickupLocation(url);
        toast.success("Titik lokasi berhasil ditambahkan.");
      },
      () => {
        toast.error("Lokasi gagal diambil. Pastikan izin lokasi aktif.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#eef9ff] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <LaundryHubLogo markClassName="h-9 w-13 bg-[#07a7d8]" textClassName="text-[#064b75]" />
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-500 lg:flex">
            <a href="#home" className="text-[#0898c9]">Home</a>
            <a href="#services" className="hover:text-[#0898c9]">Services</a>
            <a href="#pricing" className="hover:text-[#0898c9]">Pricing</a>
            <a href="#process" className="hover:text-[#0898c9]">How it works</a>
            <button
              onClick={() => {
                if (requireCustomer("login")) navigate({ to: "/activity" });
              }}
              className="hover:text-[#0898c9]"
            >
              Activity
            </button>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden text-[#064b75] sm:inline-flex" onClick={() => requireCustomer("login")}>
              {customer ? customer.name.split(" ")[0] : "Sign in"}
            </Button>
            <Button
              className="rounded-full bg-[#06a9d8] px-5 text-white shadow-lg shadow-cyan-300/30 hover:bg-[#078fc2]"
              onClick={() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" })}
            >
              Book now
            </Button>
          </div>
        </div>
      </header>

      <main id="home">
        <section className="relative">
          <div className="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-[#98e5f6]/60 blur-3xl" />
          <div className="absolute right-[-80px] top-28 h-80 w-80 rounded-full bg-[#f8d478]/50 blur-3xl" />
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[1fr_0.92fr] lg:px-8 lg:py-20">
            <div className="relative z-10 flex flex-col justify-center">
              <Badge className="mb-5 w-fit rounded-full bg-white px-4 py-2 text-[#0588b6] shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Free pickup for first order
              </Badge>
              <h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-tight text-[#073c60] sm:text-6xl lg:text-7xl">
                Laundry delivery service in one tap.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 md:text-lg">
                LaundryHub bantu customer cek paket, kiloan, kapasitas harian, estimasi selesai,
                dan pembayaran online sebelum cucian dijemput.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-12 rounded-full bg-[#06a9d8] px-7 text-white shadow-xl shadow-cyan-300/30 hover:bg-[#078fc2]"
                  onClick={() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Schedule Pickup
                </Button>
                <Button size="lg" variant="outline" className="h-12 rounded-full border-white bg-white/80 px-7 text-[#064b75]">
                  <Star className="h-4 w-4 fill-[#ffb12a] text-[#ffb12a]" />
                  4.9 Rating
                </Button>
              </div>
              <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
                <MiniStat value="876" label="Happy clients" />
                <MiniStat value="223" label="Laundry pros" />
                <MiniStat value="7862" label="Orders done" />
              </div>
            </div>

            <div className="relative z-10 min-h-[500px] lg:min-h-[620px]">
              <div className="absolute inset-x-4 bottom-8 top-8 rounded-[46px] bg-gradient-to-br from-[#18bbe5] via-[#0c8fd3] to-[#064f9a] shadow-2xl shadow-cyan-400/30" />
              <div className="absolute left-8 right-8 top-12 overflow-hidden rounded-[38px] shadow-2xl md:left-16 md:right-10">
                <img
                  src={photos.hero}
                  alt="Laundry pickup service"
                  className="h-[330px] w-full object-cover md:h-[420px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#073c60]/45 via-transparent to-transparent" />
              </div>
              <div className="laundry-float absolute bottom-16 left-2 hidden w-52 overflow-hidden rounded-[30px] bg-white p-3 shadow-xl md:block">
                <img src={photos.dryClean} alt="Dry cleaning service" className="h-32 w-full rounded-3xl object-cover object-center" />
                <div className="mt-3 text-sm font-bold text-[#073c60]">Dry clean ready</div>
                <div className="text-xs text-slate-500">Rapi, bersih, aman.</div>
              </div>
              <div className="laundry-float-slow absolute right-0 top-16 hidden w-44 overflow-hidden rounded-[30px] bg-white p-3 shadow-xl md:block">
                <img src={photos.suitCare} alt="Suit care service" className="h-28 w-full rounded-3xl object-cover object-center" />
                <div className="mt-3 text-sm font-bold text-[#073c60]">Premium care</div>
                <div className="text-xs text-slate-500">Detail setiap bahan.</div>
              </div>
              <div className="laundry-rise absolute bottom-9 right-7 rounded-[28px] bg-white/95 p-5 shadow-2xl backdrop-blur md:right-16">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#05a7d8]">Today capacity</div>
                <div className="mt-2 text-3xl font-black text-[#073c60]">{plan.capacity.remainingKg} kg</div>
                <div className="mt-1 text-xs text-slate-500">available for pickup</div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="bg-white py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="text-sm font-bold uppercase tracking-[0.22em] text-[#05a7d8]">Monthly subscription laundry service app</div>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-[#073c60] md:text-4xl">Choose how you want your laundry done</h2>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {packages.slice(0, 4).map((item, index) => (
                <Card key={item.id} className="group overflow-hidden border-[#dff4fb] bg-white shadow-lg shadow-cyan-100/60 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-200/60">
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={servicePhotos[index % servicePhotos.length]}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#073c60]/55 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[#073c60]">
                      {item.durationHours} jam
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-black text-[#073c60]">{item.name}</h3>
                    <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">{item.description}</p>
                    <div className="mt-5 flex items-end justify-between">
                      <div className="text-xl font-black text-[#05a7d8]">{formatRupiah(item.pricePerKg)}</div>
                      <div className="rounded-full bg-[#eef9ff] px-3 py-1 text-xs font-bold text-[#087aa5]">per kg</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="booking" className="relative bg-[#eaf8ff] py-12 md:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="flex flex-col justify-center">
              <div className="text-sm font-bold uppercase tracking-[0.22em] text-[#05a7d8]">Book online</div>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-[#073c60]">Cek kapasitas dulu, baru pesan.</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Kalau kamu minta 100 kg selesai hari ini tapi kapasitas tinggal 20 kg, sistem langsung kasih tahu
                dan menawarkan estimasi pengantaran alternatif.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <InfoPill icon={Clock3} title={`${plan.capacity.usedKg} kg`} body="Terpakai hari ini" />
                <InfoPill icon={Truck} title={`${plan.capacity.remainingKg} kg`} body="Sisa kapasitas" />
                <InfoPill icon={PackageCheck} title={`${plan.capacity.queueCount}`} body="Antrian aktif" />
              </div>
            </div>
            <form onSubmit={submitOrder} className="rounded-[32px] border border-white bg-white p-5 shadow-2xl shadow-cyan-200/50 md:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-[#073c60]">Schedule a pickup</h3>
                  <p className="text-sm text-slate-500">Login popup hanya muncul saat kamu mau pesan.</p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#05a7d8] text-white">
                  <Truck className="h-6 w-6" />
                </div>
              </div>
              <div className="grid gap-4">
                <Field label="Paket laundry">
                  <Select value={packageId} onValueChange={setPackageId}>
                    <SelectTrigger className="h-12 rounded-2xl border-[#d8edf5]">
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
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Berat cucian">
                    <Input className="h-12 rounded-2xl border-[#d8edf5]" min="0.1" step="0.1" type="number" value={weight} onChange={(event) => setWeight(event.target.value)} />
                  </Field>
                  <Field label="Jadwal jemput">
                    <Input className="h-12 rounded-2xl border-[#d8edf5]" type="datetime-local" value={pickupAt} onChange={(event) => setPickupAt(event.target.value)} />
                  </Field>
                </div>
                <Field label="Alamat jemput">
                  <Textarea className="rounded-2xl border-[#d8edf5]" rows={3} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Isi alamat penjemputan" />
                </Field>
                <div className="rounded-3xl border border-[#d8edf5] bg-[#f8fdff] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-black text-[#073c60]">Titik lokasi jemput</div>
                      <div className="text-xs text-slate-500">
                        Kirim lokasi saat ini agar kasir bisa atur rute kurir yang searah.
                      </div>
                    </div>
                    <Button type="button" variant="outline" className="rounded-2xl" onClick={captureCurrentLocation}>
                      <MapPin className="h-4 w-4" />
                      Kirim lokasi saya
                    </Button>
                  </div>
                  {pickupLocation && (
                    <a
                      className="mt-3 inline-flex text-xs font-semibold text-[#05a7d8] underline"
                      href={pickupLocation}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Lokasi berhasil tersimpan
                    </a>
                  )}
                </div>
                <div className={cn("rounded-3xl border p-4", plan.canPickupToday ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
                  <div className="flex gap-3">
                    {plan.canPickupToday ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <CalendarClock className="h-5 w-5 text-amber-600" />}
                    <div>
                      <div className="font-black text-[#073c60]">{plan.canPickupToday ? "Bisa diproses" : "Kapasitas penuh"}</div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{plan.message}</p>
                      <div className="mt-2 text-sm font-bold text-[#073c60]">
                        Estimasi: {formatTime(plan.canPickupToday ? plan.dueAt : plan.alternativeDeliveryAt)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["QRIS", "Transfer Bank"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={cn(
                        "flex h-12 items-center justify-center gap-2 rounded-2xl border text-sm font-black",
                        paymentMethod === method ? "border-[#05a7d8] bg-[#05a7d8] text-white" : "border-[#d8edf5] bg-white text-[#073c60]",
                      )}
                    >
                      {method === "QRIS" ? <Wallet className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                      {method}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-[#073c60] p-4 text-white">
                  <span className="text-sm opacity-80">Total estimasi</span>
                  <span className="text-2xl font-black">{formatRupiah(total || 0)}</span>
                </div>
                <Button className="h-12 rounded-2xl bg-[#ffb12a] text-base font-black text-[#073c60] hover:bg-[#f5a313]" size="lg" type="submit">
                  {customer ? "Lanjut Pembayaran" : "Login / Registrasi untuk Pesan"}
                </Button>
              </div>
            </form>
          </div>
        </section>

        <section id="process" className="bg-white py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <div className="text-sm font-bold uppercase tracking-[0.22em] text-[#05a7d8]">About LaundryHub</div>
                <h2 className="mt-3 text-4xl font-black tracking-tight text-[#073c60]">We provide every laundry solution</h2>
                <p className="mt-4 leading-8 text-slate-600">
                  Dari pickup, pencucian, setrika, pembayaran, sampai notifikasi WhatsApp kasir.
                  Semuanya dibuat supaya customer merasa mudah dan admin tetap rapi pembukuannya.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <ProcessCard step="01" image={photos.rapidClean} title="You Schedule" body="Customer pilih paket, kiloan, dan jadwal jemput." />
                <ProcessCard step="02" image={photos.hero} title="We Pick Up" body="Kasir konfirmasi jam penjemputan via WhatsApp." />
                <ProcessCard step="03" image={photos.dryClean} title="We Deliver" body="Order diproses, selesai, lalu diantar kembali." />
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-[#073c60] py-12 text-white md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <div className="text-sm font-bold uppercase tracking-[0.22em] text-[#65daf7]">Affordable laundry service</div>
                <h2 className="mt-3 text-3xl font-black md:text-4xl">Transparent package pricing</h2>
              </div>
              <Button className="w-fit rounded-full bg-white text-[#073c60] hover:bg-cyan-50" onClick={() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" })}>
                Get Started
              </Button>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {packages.slice(0, 3).map((item, index) => (
                <div key={item.id} className={cn("rounded-[30px] p-6", index === 1 ? "bg-[#05a7d8]" : "bg-white/10")}>
                  <div className="text-sm font-semibold opacity-80">{item.name}</div>
                  <div className="mt-3 text-3xl font-black">{formatRupiah(item.pricePerKg)}</div>
                  <div className="mt-1 text-sm opacity-75">per kilogram</div>
                  <div className="mt-6 space-y-3 text-sm">
                    <Feature>Pickup terjadwal</Feature>
                    <Feature>Notifikasi WhatsApp</Feature>
                    <Feature>Pembayaran online</Feature>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white px-4 py-8 text-center text-sm text-slate-500">
        <div className="font-black text-[#073c60]">LaundryHub</div>
        <div className="mt-1">from dataNova</div>
      </footer>

      {renderAuthDialog()}
      {renderPaymentDialog()}
    </div>
  );

  function renderPaymentDialog() {
    const selectedBank = data.settings.bankAccounts.find((account) => account.id === selectedBankId) ??
      data.settings.bankAccounts.find((account) => account.active);
    const canPay = paymentMethod === "QRIS" ? qrisScanned : bankPaid;

    return (
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] border-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Pembayaran {paymentMethod}</DialogTitle>
            <DialogDescription>
              Pesanan baru masuk ke kasir setelah pembayaran dummy ini berhasil.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-3xl bg-[#eef9ff] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-[#073c60]">{plan.service?.name ?? "Paket laundry"}</div>
                <div className="text-xs text-slate-500">{weight || 0} kg - {paymentMethod}</div>
              </div>
              <div className="text-xl font-black text-[#073c60]">{formatRupiah(total || 0)}</div>
            </div>
          </div>

          {paymentMethod === "QRIS" ? (
            <div className="space-y-4">
              <div className="rounded-[28px] border border-[#d8edf5] bg-white p-5 text-center">
                <div className="mx-auto grid h-48 w-48 grid-cols-7 gap-1 rounded-3xl bg-white p-4 shadow-inner">
                  {Array.from({ length: 49 }).map((_, index) => (
                    <span
                      key={index}
                      className={cn("rounded-[3px]", index % 2 === 0 || index % 5 === 0 || index % 11 === 0 ? "bg-[#073c60]" : "bg-[#eaf8ff]")}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-[#073c60]">
                  <QrCode className="h-4 w-4 text-[#05a7d8]" />
                  Scan QRIS dari HP kamu
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Dummy: setelah QRIS discan, klik tombol konfirmasi scan di bawah.
                </p>
              </div>
              <Button
                type="button"
                variant={qrisScanned ? "secondary" : "outline"}
                className="h-11 w-full rounded-2xl"
                onClick={() => setQrisScanned(true)}
              >
                {qrisScanned ? "QRIS sudah discan" : "Saya sudah scan QRIS di HP"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3">
                {data.settings.bankAccounts.filter((account) => account.active).map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setSelectedBankId(account.id)}
                    className={cn(
                      "rounded-3xl border p-4 text-left transition",
                      selectedBankId === account.id ? "border-[#05a7d8] bg-[#eef9ff]" : "border-[#d8edf5] bg-white",
                    )}
                  >
                    <div className="font-black text-[#073c60]">{account.bank}</div>
                    <div className="mt-1 text-lg font-black text-[#05a7d8]">{account.accountNo}</div>
                    <div className="text-xs text-slate-500">{account.accountName}</div>
                  </button>
                ))}
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                Transfer dummy ke {selectedBank?.bank ?? "rekening perusahaan"} sebesar{" "}
                <span className="font-black text-[#073c60]">{formatRupiah(total || 0)}</span>, lalu klik konfirmasi.
              </div>
              <Button
                type="button"
                variant={bankPaid ? "secondary" : "outline"}
                className="h-11 w-full rounded-2xl"
                onClick={() => setBankPaid(true)}
              >
                {bankPaid ? "Transfer berhasil dikonfirmasi" : "Saya sudah transfer"}
              </Button>
            </div>
          )}

          <Button
            type="button"
            disabled={!canPay}
            className="h-12 rounded-2xl bg-[#05a7d8] text-base font-black text-white hover:bg-[#078fc2]"
            onClick={completePayment}
          >
            Bayar dan Kirim Pesanan ke Kasir
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  function renderAuthDialog() {
    return (
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] border-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Akses LaundryHub</DialogTitle>
            <DialogDescription>Login hanya saat dibutuhkan. Jika tidak aktif lebih dari 7 hari, session customer otomatis logout.</DialogDescription>
          </DialogHeader>
          <Tabs value={authTab} onValueChange={(value) => { setAuthTab(value); setError(""); }}>
            <TabsList className="grid w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Registrasi</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <form className="space-y-4" onSubmit={handleCustomerLogin}>
                <Field label="Email">
                  <Input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} required />
                </Field>
                <Field label="Password">
                  <Input type="password" value={customerPassword} onChange={(event) => setCustomerPassword(event.target.value)} required />
                </Field>
                <ErrorText value={error} />
                <Button className="h-11 w-full rounded-2xl bg-[#05a7d8]" type="submit">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register" className="mt-4">
              <form className="space-y-3" onSubmit={handleRegister}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nama">
                    <Input value={registerName} onChange={(event) => setRegisterName(event.target.value)} required />
                  </Field>
                  <Field label="WhatsApp">
                    <Input value={registerPhone} onChange={(event) => setRegisterPhone(event.target.value)} required />
                  </Field>
                </div>
                <Field label="Email">
                  <Input type="email" value={registerEmail} onChange={(event) => setRegisterEmail(event.target.value)} required />
                </Field>
                <Field label="Password">
                  <Input type="password" value={registerPassword} onChange={(event) => setRegisterPassword(event.target.value)} required />
                </Field>
                <Field label="Alamat">
                  <Textarea value={registerAddress} onChange={(event) => setRegisterAddress(event.target.value)} rows={2} />
                </Field>
                <ErrorText value={error} />
                <Button className="h-11 w-full rounded-2xl bg-[#05a7d8]" type="submit">
                  <UserPlus className="h-4 w-4" />
                  Registrasi Customer
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  }
}

const servicePhotos = [photos.dryClean, photos.hero, photos.garmentRack, photos.suitCare, photos.rapidClean];

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl bg-white/80 p-4 shadow-sm">
      <div className="text-2xl font-black text-[#073c60]">{value}</div>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
    </div>
  );
}

function InfoPill({ icon: Icon, title, body }: { icon: typeof Clock3; title: string; body: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <Icon className="mb-2 h-5 w-5 text-[#05a7d8]" />
      <div className="font-black text-[#073c60]">{title}</div>
      <div className="text-xs text-slate-500">{body}</div>
    </div>
  );
}

function ProcessCard({ step, image, title, body }: { step: string; image: string; title: string; body: string }) {
  return (
    <div className="group overflow-hidden rounded-[30px] bg-[#eaf8ff] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-44 overflow-hidden">
        <img src={image} alt={title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#073c60]/60 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-sm font-black text-[#05a7d8]">{step}</div>
      </div>
      <div className="p-5">
        <div className="font-black text-[#073c60]">{title}</div>
        <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
      </div>
    </div>
  );
}

function Feature({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 text-[#ffb12a]" />
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="block space-y-1.5 text-sm font-bold text-[#073c60]">
      <span>{label}</span>
      {children}
    </Label>
  );
}

function ErrorText({ value }: { value: string }) {
  if (!value) return null;
  return <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{value}</div>;
}
