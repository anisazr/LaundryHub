import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRupiah, formatTime, hoursUntil } from "@/lib/mock-data";
import { useLaundryData } from "@/lib/laundry-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import type { UIEvent } from "react";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Monitoring Order - Admin" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { data } = useLaundryData();
  const [q, setQ] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const list = useMemo(
    () =>
      data.orders.filter((order) =>
        [order.id, order.customer, order.package].join(" ").toLowerCase().includes(q.toLowerCase()),
      ),
    [data.orders, q],
  );
  const visibleList = list.slice(0, visibleCount);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24 && visibleCount < list.length) {
      setVisibleCount((current) => Math.min(current + 10, list.length));
    }
  }

  return (
    <AppShell role="admin">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Semua Order - Status Real-time</CardTitle>
          <Input
            className="max-w-xs"
            placeholder="Cari ID, nama, paket..."
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setVisibleCount(10);
            }}
          />
        </CardHeader>
        <CardContent>
          <div className="mb-3 text-xs text-muted-foreground">
            Menampilkan {Math.min(visibleCount, list.length)} dari {list.length} order.
          </div>
          <div className="max-h-[620px] overflow-auto rounded-md border" onScroll={handleScroll}>
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Berat</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pembayaran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Masuk</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleList.map((order) => {
                  const remaining = hoursUntil(order.dueAt);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.package}</TableCell>
                      <TableCell>{order.weightKg} kg</TableCell>
                      <TableCell>{formatRupiah(order.total)}</TableCell>
                      <TableCell className={order.paid ? "text-success" : "text-warning-foreground"}>
                        {order.paid ? "Lunas" : "Belum bayar"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatTime(order.createdAt)}</TableCell>
                      <TableCell
                        className={remaining < 0 && order.status !== "Selesai" ? "font-semibold text-destructive" : ""}
                      >
                        {formatTime(order.dueAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {visibleCount < list.length && (
              <div className="border-t p-3 text-center text-xs text-muted-foreground">
                Scroll untuk memuat 10 order berikutnya.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
