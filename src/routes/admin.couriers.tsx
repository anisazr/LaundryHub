import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { couriers, deliveries, formatTime } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Truck, Phone } from "lucide-react";

export const Route = createFileRoute("/admin/couriers")({
  head: () => ({ meta: [{ title: "Kurir & Pengiriman — Admin" }] }),
  component: CouriersPage,
});

function CouriersPage() {
  return (
    <AppShell role="admin">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold">Daftar Kurir</h2>
          {couriers.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-accent/30 text-accent-foreground flex items-center justify-center font-semibold">
                  {c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</div>
                  <div className="text-xs text-muted-foreground">{c.area}</div>
                </div>
                <Badge variant="secondary">{c.activeTasks} tugas</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Jadwal Pengiriman Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tugas</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Kurir</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Jadwal</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.id}</TableCell>
                    <TableCell>{d.orderId}</TableCell>
                    <TableCell>{d.courier}</TableCell>
                    <TableCell><Badge variant={d.type === "Jemput" ? "outline" : "secondary"}>{d.type}</Badge></TableCell>
                    <TableCell className="text-sm">{d.address}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatTime(d.scheduledAt)}</TableCell>
                    <TableCell>
                      <Badge className={d.status === "Selesai" ? "bg-success text-success-foreground" : d.status === "Berjalan" ? "bg-info text-info-foreground" : ""} variant={d.status === "Terjadwal" ? "outline" : "default"}>
                        {d.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
