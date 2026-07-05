import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { formatTime } from "@/lib/mock-data";
import { useLaundryData } from "@/lib/laundry-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Log Audit - Admin" }] }),
  component: AuditPage,
});

function AuditPage() {
  const { data } = useLaundryData();

  return (
    <AppShell role="admin">
      <Card>
        <CardHeader>
          <CardTitle>Log Audit Perubahan Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {data.audit.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {item.id}
                </Badge>
                <Badge variant="secondary">{item.module}</Badge>
                <Badge>{item.action}</Badge>
                <div className="flex-1 text-sm">{item.detail}</div>
                <div className="text-xs text-muted-foreground">{item.user}</div>
                <div className="w-32 text-right text-xs text-muted-foreground">{formatTime(item.at)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
