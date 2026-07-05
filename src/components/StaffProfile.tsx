import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Camera, Landmark, LockKeyhole, Plus, Save, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AppShell } from "@/components/AppShell";
import { updateEmployeeProfile, upsertBankAccount, useLaundryData } from "@/lib/laundry-store";
import { toast } from "sonner";

export function StaffProfile({ role }: { role: "admin" | "kasir" }) {
  const { data, update } = useLaundryData();
  const roleLabel = role === "admin" ? "Admin" : "Kasir";
  const employee = useMemo(
    () => data.employees.find((item) => item.role === roleLabel) ?? data.employees[0],
    [data.employees, roleLabel],
  );
  const [name, setName] = useState(employee?.name ?? "");
  const [email, setEmail] = useState(employee?.email ?? (role === "admin" ? "admin@gmail.com" : "kasir@gmail.com"));
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(employee?.avatar ?? "");
  const [ownerCode, setOwnerCode] = useState("");
  const [bank, setBank] = useState("BCA");
  const [accountNo, setAccountNo] = useState("");
  const [accountName, setAccountName] = useState(data.settings.qrisMerchant);
  const [active, setActive] = useState(true);

  function isVerified() {
    if (ownerCode.trim() !== data.settings.ownerVerificationCode) {
      toast.error("Kode owner tidak sesuai.", {
        description: "Perubahan email, sandi, profil staff, dan rekening harus diverifikasi owner.",
      });
      return false;
    }
    return true;
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isVerified()) return;
    update((current) =>
      updateEmployeeProfile(current, roleLabel, {
        name,
        email,
        password,
        avatar,
      }),
    );
    toast.success(`Profil ${roleLabel} diperbarui.`);
  }

  function saveBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isVerified()) return;
    if (!bank.trim() || !accountNo.trim() || !accountName.trim()) {
      toast.error("Data rekening belum lengkap.");
      return;
    }
    update((current) =>
      upsertBankAccount(current, {
        bank,
        accountNo,
        accountName,
        active,
      }),
    );
    setAccountNo("");
    toast.success("Rekening perusahaan disimpan.");
  }

  return (
    <AppShell role={role}>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Profil {roleLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={saveProfile}>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatar} />
                  <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold">{name}</div>
                  <div className="text-sm text-muted-foreground">{email}</div>
                </div>
                <Camera className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nama">
                  <Input value={name} onChange={(event) => setName(event.target.value)} required />
                </Field>
                <Field label="Email">
                  <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </Field>
                <Field label="Password Baru">
                  <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Opsional" />
                </Field>
                <Field label="URL Foto Profil">
                  <Input value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="https://..." />
                </Field>
              </div>

              <OwnerCode value={ownerCode} onChange={setOwnerCode} />
              <Button type="submit">
                <Save className="h-4 w-4" />
                Simpan Profil
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-warning" />
              Verifikasi Owner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Kode demo owner: <span className="font-semibold text-foreground">{data.settings.ownerVerificationCode}</span></p>
            <p>Kasir dan admin tidak bisa mengubah email, password, atau rekening tanpa kode ini.</p>
          </CardContent>
        </Card>

        {role === "admin" && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                Rekening Perusahaan
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
              <form className="space-y-4" onSubmit={saveBank}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Bank">
                    <Input value={bank} onChange={(event) => setBank(event.target.value)} required />
                  </Field>
                  <Field label="Nomor Rekening">
                    <Input value={accountNo} onChange={(event) => setAccountNo(event.target.value)} required />
                  </Field>
                </div>
                <Field label="Nama Rekening">
                  <Input value={accountName} onChange={(event) => setAccountName(event.target.value)} required />
                </Field>
                <div className="flex items-center gap-3 rounded-md border p-3">
                  <Switch checked={active} onCheckedChange={setActive} />
                  <div>
                    <div className="text-sm font-medium">Aktif untuk pembayaran customer</div>
                    <div className="text-xs text-muted-foreground">Uang customer diarahkan ke rekening perusahaan ini.</div>
                  </div>
                </div>
                <OwnerCode value={ownerCode} onChange={setOwnerCode} />
                <Button type="submit" variant="secondary">
                  <Plus className="h-4 w-4" />
                  Tambah Rekening
                </Button>
              </form>

              <div className="grid gap-3 md:grid-cols-2">
                {data.settings.bankAccounts.map((account) => (
                  <div key={account.id} className="rounded-md border bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">{account.bank}</div>
                      <span className={account.active ? "text-xs font-semibold text-success" : "text-xs text-muted-foreground"}>
                        {account.active ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <div className="mt-2 text-lg font-bold">{account.accountNo}</div>
                    <div className="text-sm text-muted-foreground">{account.accountName}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="block space-y-1.5">
      <span>{label}</span>
      {children}
    </Label>
  );
}

function OwnerCode({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Field label="Kode Verifikasi Owner">
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="OWNER-2026" required />
    </Field>
  );
}
