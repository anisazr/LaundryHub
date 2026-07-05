import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileSpreadsheet, FileText, Plus, Trash2, Wallet } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/mock-data";
import {
  getBookPeriod,
  getBookkeepingSummary,
  deleteEmployee,
  postMonthlyPayroll,
  upsertEmployee,
  useLaundryData,
  type Employee,
  type LedgerEntry,
  type LaundryData,
} from "@/lib/laundry-store";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Pembukuan - Admin" }] }),
  component: ReportsPage,
});

type ChartRange = "Minggu" | "Bulan" | "Tahun";

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getEntryExpense = (entry: LedgerEntry) =>
  entry.type === "Pembelian" || entry.type === "Gaji" ? entry.amount : 0;

const getEntryRevenue = (entry: LedgerEntry) => (entry.type === "Pendapatan" ? entry.amount : 0);

const makeBucketKey = (date: Date, range: ChartRange) => {
  if (range === "Minggu") {
    return date.toLocaleDateString("id-ID", { weekday: "short", day: "2-digit" });
  }

  if (range === "Bulan") {
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  }

  return date.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
};

const getChartStart = (range: ChartRange) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (range === "Minggu") {
    start.setDate(start.getDate() - 6);
  } else if (range === "Bulan") {
    start.setDate(1);
  } else {
    start.setMonth(0, 1);
  }

  return start;
};

const buildChartData = (entries: LedgerEntry[], range: ChartRange) => {
  const start = getChartStart(range);
  const buckets = new Map<string, { label: string; pemasukan: number; pengeluaran: number }>();

  entries
    .filter((entry) => new Date(entry.at).getTime() >= start.getTime())
    .forEach((entry) => {
      const label = makeBucketKey(new Date(entry.at), range);
      const current = buckets.get(label) ?? { label, pemasukan: 0, pengeluaran: 0 };
      current.pemasukan += getEntryRevenue(entry);
      current.pengeluaran += getEntryExpense(entry);
      buckets.set(label, current);
    });

  return Array.from(buckets.values());
};

const downloadFile = (filename: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const escapeHtml = (value: string | number) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function exportExcel(data: LaundryData, entries: LedgerEntry[], periodLabel: string) {
  const rows = [
    ["Periode", periodLabel],
    [],
    ["ID", "Tanggal", "Tipe", "Metode", "Detail", "Pemasukan", "Pengeluaran"],
    ...entries.map((entry) => [
      entry.id,
      formatDate(entry.at),
      entry.type,
      entry.method ?? "-",
      entry.detail,
      getEntryRevenue(entry),
      getEntryExpense(entry),
    ]),
    [],
    ["Karyawan", "Role", "Gaji", "Status"],
    ...data.employees.map((employee) => [
      employee.name,
      employee.role,
      employee.salary,
      employee.active ? "Aktif" : "Nonaktif",
    ]),
  ];

  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  downloadFile(`pembukuan-${periodLabel.replace(/\s|-/g, "_")}.csv`, csv, "text/csv;charset=utf-8");
}

function exportPdf(entries: LedgerEntry[], summary: ReturnType<typeof getBookkeepingSummary>, periodLabel: string) {
  const popup = window.open("", "_blank", "width=920,height=720");

  if (!popup) {
    toast.error("Popup diblokir", { description: "Izinkan popup untuk membuka export PDF pembukuan." });
    return;
  }

  popup.document.write(`
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Pembukuan Laundry Hub</title>
        <style>
          @page { size: A4; margin: 14mm; }
          body { font-family: Arial, sans-serif; color: #12313d; }
          h1 { margin: 0 0 4px; font-size: 24px; }
          .muted { color: #637780; font-size: 12px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 18px 0; }
          .box { border: 1px solid #dce6e8; padding: 10px; border-radius: 6px; }
          .box span { display: block; color: #637780; font-size: 11px; margin-bottom: 5px; }
          .box strong { font-size: 15px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border-bottom: 1px solid #dce6e8; padding: 7px; text-align: left; }
          th { background: #eef3f4; }
          td:last-child, td:nth-last-child(2) { text-align: right; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <button onclick="window.print()">Cetak / Simpan PDF</button>
        <h1>Pembukuan Laundry Hub</h1>
        <div class="muted">Periode tutup buku: ${escapeHtml(periodLabel)}</div>
        <section class="summary">
          <div class="box"><span>Pemasukan</span><strong>${escapeHtml(formatRupiah(summary.revenue))}</strong></div>
          <div class="box"><span>Pengeluaran</span><strong>${escapeHtml(formatRupiah(summary.expenses))}</strong></div>
          <div class="box"><span>Laba Bersih</span><strong>${escapeHtml(formatRupiah(summary.profit))}</strong></div>
          <div class="box"><span>Saldo Periode</span><strong>${escapeHtml(formatRupiah(summary.periodBalance))}</strong></div>
          <div class="box"><span>Tunai</span><strong>${escapeHtml(formatRupiah(summary.cash))}</strong></div>
          <div class="box"><span>QRIS</span><strong>${escapeHtml(formatRupiah(summary.qris))}</strong></div>
          <div class="box"><span>Kartu</span><strong>${escapeHtml(formatRupiah(summary.card))}</strong></div>
          <div class="box"><span>Gaji</span><strong>${escapeHtml(formatRupiah(summary.payrollExpenses))}</strong></div>
        </section>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tanggal</th>
              <th>Tipe</th>
              <th>Metode</th>
              <th>Detail</th>
              <th>Pemasukan</th>
              <th>Pengeluaran</th>
            </tr>
          </thead>
          <tbody>
            ${entries
              .map(
                (entry) => `
                  <tr>
                    <td>${escapeHtml(entry.id)}</td>
                    <td>${escapeHtml(formatDate(entry.at))}</td>
                    <td>${escapeHtml(entry.type)}</td>
                    <td>${escapeHtml(entry.method ?? "-")}</td>
                    <td>${escapeHtml(entry.detail)}</td>
                    <td>${escapeHtml(getEntryRevenue(entry) ? formatRupiah(getEntryRevenue(entry)) : "-")}</td>
                    <td>${escapeHtml(getEntryExpense(entry) ? formatRupiah(getEntryExpense(entry)) : "-")}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
        <script>window.addEventListener("load", () => setTimeout(() => window.print(), 250));</script>
      </body>
    </html>
  `);
  popup.document.close();
}

function ReportsPage() {
  const { data, update } = useLaundryData();
  const [chartRange, setChartRange] = useState<ChartRange>("Bulan");
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    role: "Staff" as Employee["role"],
    salary: 1700000,
    active: true,
  });

  const period = getBookPeriod();
  const summary = getBookkeepingSummary(data, period.start, period.end);
  const chartData = useMemo(() => buildChartData(data.ledger, chartRange), [data.ledger, chartRange]);
  const payrollPosted = data.ledger.some(
    (entry) => entry.type === "Gaji" && getBookPeriod(new Date(entry.at)).key === period.key,
  );
  const payrollTotal = data.employees
    .filter((employee) => employee.active)
    .reduce((sum, employee) => sum + employee.salary, 0);

  function handleEmployeeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!employeeForm.name.trim() || employeeForm.salary <= 0) {
      toast.error("Data karyawan belum lengkap");
      return;
    }

    update((current) => upsertEmployee(current, employeeForm));
    setEmployeeForm({ name: "", role: "Staff", salary: 1700000, active: true });
    toast.success("Data karyawan disimpan");
  }

  function handlePayrollPost() {
    const before = data.ledger.length;
    update((current) => postMonthlyPayroll(current));

    if (payrollPosted || before === postMonthlyPayroll(data).ledger.length) {
      toast.info("Gaji periode ini sudah diposting");
      return;
    }

    toast.success("Gaji karyawan masuk ke pembukuan", {
      description: `${period.label} - ${formatRupiah(payrollTotal)}`,
    });
  }

  function handleDeleteEmployee(employee: Employee) {
    const confirmed = window.confirm(`Hapus karyawan ${employee.name}?`);

    if (!confirmed) {
      return;
    }

    update((current) => deleteEmployee(current, employee.id));
    toast.success("Karyawan dihapus", {
      description: employee.name,
    });
  }

  return (
    <AppShell role="admin">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Periode Buku Aktif</div>
          <h2 className="text-2xl font-semibold tracking-tight">{period.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tutup buku otomatis setiap tanggal 25. Tanggal 26 membuka periode baru dengan saldo periode mulai dari nol.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportPdf(summary.entries, summary, period.label)}>
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => exportExcel(data, summary.entries, period.label)}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button onClick={handlePayrollPost} disabled={payrollPosted}>
            <Download className="h-4 w-4" />
            {payrollPosted ? "Gaji Sudah Diposting" : "Posting Gaji Bulanan"}
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Pemasukan Periode</div>
            <div className="text-2xl font-semibold text-success">{formatRupiah(summary.revenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Pengeluaran Periode</div>
            <div className="text-2xl font-semibold text-destructive">{formatRupiah(summary.expenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Laba Bersih</div>
            <div className="text-2xl font-semibold">{formatRupiah(summary.profit)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Saldo Buku Baru</div>
            <div className="text-2xl font-semibold text-primary">{formatRupiah(summary.periodBalance)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Cash / Tunai</div>
            <div className="text-xl font-semibold">{formatRupiah(summary.cash)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">QRIS</div>
            <div className="text-xl font-semibold">{formatRupiah(summary.qris)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Kartu</div>
            <div className="text-xl font-semibold">{formatRupiah(summary.card)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Gaji Bulanan</div>
            <div className="text-xl font-semibold">{formatRupiah(payrollTotal)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Grafik Pembukuan</CardTitle>
            <div className="inline-flex rounded-md border bg-background p-1">
              {(["Minggu", "Bulan", "Tahun"] as ChartRange[]).map((range) => (
                <button
                  key={range}
                  className={`rounded px-3 py-1.5 text-sm font-medium ${chartRange === range ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setChartRange(range)}
                  type="button"
                >
                  {range}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} />
                  <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                  <Bar dataKey="pemasukan" fill="#1e5f74" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pengeluaran" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Karyawan & Gaji</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={handleEmployeeSubmit}>
              <input
                className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                placeholder="Nama karyawan"
                value={employeeForm.name}
                onChange={(event) => setEmployeeForm((form) => ({ ...form, name: event.target.value }))}
              />
              <div className="grid grid-cols-[1fr_1.2fr] gap-2">
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                  value={employeeForm.role}
                  onChange={(event) =>
                    setEmployeeForm((form) => ({ ...form, role: event.target.value as Employee["role"] }))
                  }
                >
                  <option>Admin</option>
                  <option>Kasir</option>
                  <option>Kurir</option>
                  <option>Staff</option>
                </select>
                <input
                  className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                  min={0}
                  type="number"
                  value={employeeForm.salary}
                  onChange={(event) =>
                    setEmployeeForm((form) => ({ ...form, salary: Number(event.target.value) }))
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={employeeForm.active}
                  onChange={(event) => setEmployeeForm((form) => ({ ...form, active: event.target.checked }))}
                  type="checkbox"
                />
                Aktif dihitung payroll
              </label>
              <Button type="submit">
                <Plus className="h-4 w-4" />
                Tambah Karyawan
              </Button>
            </form>

            <div className="mt-5 divide-y">
              {data.employees.map((employee) => (
                <div key={employee.id} className="flex items-center gap-3 py-3 text-sm">
                  <Wallet className="h-4 w-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{employee.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {employee.role} - {employee.active ? "Aktif" : "Nonaktif"}
                    </div>
                  </div>
                  <div className="font-semibold">{formatRupiah(employee.salary)}</div>
                  <Button
                    aria-label={`Hapus ${employee.name}`}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteEmployee(employee)}
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Detail Pengeluaran Bulan Ini</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-4">
            <div className="text-sm text-muted-foreground">Inventori & Operasional</div>
            <div className="mt-1 text-2xl font-semibold text-destructive">
              {formatRupiah(summary.inventoryExpenses)}
            </div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-sm text-muted-foreground">Gaji Staff, Admin, Kasir, Kurir</div>
            <div className="mt-1 text-2xl font-semibold text-destructive">
              {formatRupiah(summary.payrollExpenses)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Riwayat Pembukuan Periode Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[520px] overflow-auto rounded-md border">
            <div className="divide-y">
              {summary.entries.map((entry) => (
                <div key={entry.id} className="grid gap-2 px-3 py-3 text-sm md:grid-cols-[96px_120px_120px_1fr_150px] md:items-center">
                  <div className="font-mono text-xs text-muted-foreground">{entry.id}</div>
                  <div className="font-medium">{entry.type}</div>
                  <div className="text-muted-foreground">{entry.method ?? formatDate(entry.at)}</div>
                  <div>{entry.detail}</div>
                  <div
                    className={
                      getEntryExpense(entry)
                        ? "font-semibold text-destructive md:text-right"
                        : "font-semibold text-success md:text-right"
                    }
                  >
                    {getEntryExpense(entry) ? "-" : "+"}
                    {formatRupiah(getEntryExpense(entry) || getEntryRevenue(entry))}
                  </div>
                </div>
              ))}
              {summary.entries.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Periode buku baru belum memiliki transaksi.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
