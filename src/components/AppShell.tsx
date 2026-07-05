import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingBag, Package, Boxes, Truck, FileBarChart, ShieldAlert, Receipt, QrCode, MessageSquare, UserCog, Wallet, UserCircle } from "lucide-react";
import { LaundryHubLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NavItem { to: string; label: string; icon: ReactNode; }

const adminNav: NavItem[] = [
  { to: "/admin", label: "Dasbor", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/admin/orders", label: "Order & SLA", icon: <ShoppingBag className="h-4 w-4" /> },
  { to: "/admin/inventory", label: "Inventori", icon: <Boxes className="h-4 w-4" /> },
  { to: "/admin/reports", label: "Pembukuan", icon: <FileBarChart className="h-4 w-4" /> },
  { to: "/admin/audit", label: "Log Audit", icon: <ShieldAlert className="h-4 w-4" /> },
];

const kasirNav: NavItem[] = [
  { to: "/kasir", label: "Ringkasan", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/kasir/new-order", label: "Order Baru", icon: <ShoppingBag className="h-4 w-4" /> },
  { to: "/kasir/packages", label: "Paket & Harga", icon: <Package className="h-4 w-4" /> },
  { to: "/kasir/couriers", label: "Kurir & Tugas", icon: <Truck className="h-4 w-4" /> },
  { to: "/kasir/scan", label: "Cari & Scan QR", icon: <QrCode className="h-4 w-4" /> },
  { to: "/kasir/payment", label: "Pembayaran", icon: <Wallet className="h-4 w-4" /> },
  { to: "/kasir/handover", label: "Serah Terima", icon: <Receipt className="h-4 w-4" /> },
  { to: "/kasir/complaints", label: "Komplain", icon: <MessageSquare className="h-4 w-4" /> },
  { to: "/kasir/chats", label: "Chat Customer", icon: <MessageSquare className="h-4 w-4" /> },
];

export function AppShell({ role, children }: { role: "admin" | "kasir"; children: ReactNode }) {
  const navigate = useNavigate();
  const nav = role === "admin" ? adminNav : kasirNav;
  const location = useLocation();
  const roleLabel = role === "admin" ? "Admin" : "Kasir";
  const profilePath = role === "admin" ? "/admin/profile" : "/kasir/profile";
  const targetRole = role === "admin" ? "Kasir" : "Admin";
  const targetPath = role === "admin" ? "/kasir" : "/admin";
  const targetEmail = role === "admin" ? "kasir@gmail.com" : "admin@gmail.com";
  const targetPassword = role === "admin" ? "kasirlaundry" : "adminlaundry";
  const [switchOpen, setSwitchOpen] = useState(false);
  const [switchEmail, setSwitchEmail] = useState("");
  const [switchPassword, setSwitchPassword] = useState("");
  const [switchError, setSwitchError] = useState("");

  function handleSwitchRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valid =
      switchEmail.trim().toLowerCase() === targetEmail &&
      switchPassword === targetPassword;

    if (!valid) {
      setSwitchError(`Email atau password ${targetRole.toLowerCase()} tidak sesuai.`);
      return;
    }

    setSwitchOpen(false);
    setSwitchEmail("");
    setSwitchPassword("");
    setSwitchError("");
    navigate({ to: targetPath });
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-5 py-5 flex items-center border-b border-sidebar-border">
          <LaundryHubLogo
            className="text-sidebar-foreground"
            markClassName="h-9 w-12"
            textClassName="text-sidebar-foreground"
          />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => {
            const active = location.pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                {n.icon}
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-sidebar-border p-3">
          <Link
            to={profilePath}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              location.pathname === profilePath
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "bg-sidebar-accent/20 hover:bg-sidebar-accent/50",
            )}
          >
            <UserCircle className="h-4 w-4" />
            {role === "admin" ? "Profil & Rekening" : "Profil Kasir"}
          </Link>
          <button
            type="button"
            onClick={() => {
              setSwitchOpen(true);
              setSwitchError("");
            }}
            className="flex w-full items-center gap-2 rounded-md bg-sidebar-accent/40 px-3 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent"
          >
            <UserCog className="h-4 w-4" />
            Beralih ke {targetRole}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card/60 backdrop-blur flex items-center justify-between px-6">
          <div>
            <div className="text-xs text-muted-foreground">Mode</div>
            <h1 className="text-lg font-semibold tracking-tight">{roleLabel} Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-right">
              <div className="font-medium">{role === "admin" ? "Admin LaundryHub" : "Kasir LaundryHub"}</div>
              <div className="text-xs text-muted-foreground">{role === "admin" ? "admin@gmail.com" : "kasir@gmail.com"}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              {role === "admin" ? "P" : "K"}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
      <Dialog open={switchOpen} onOpenChange={setSwitchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login {targetRole}</DialogTitle>
            <DialogDescription>
              Masukkan email dan password {targetRole.toLowerCase()} untuk beralih panel.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSwitchRole}>
            <Label className="block space-y-1.5">
              <span>Email</span>
              <Input
                type="email"
                value={switchEmail}
                onChange={(event) => setSwitchEmail(event.target.value)}
                placeholder={targetEmail}
                required
              />
            </Label>
            <Label className="block space-y-1.5">
              <span>Password</span>
              <Input
                type="password"
                value={switchPassword}
                onChange={(event) => setSwitchPassword(event.target.value)}
                required
              />
            </Label>
            {switchError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {switchError}
              </div>
            )}
            <Button className="w-full" type="submit">
              Masuk ke {targetRole}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
