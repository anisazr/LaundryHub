import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/mock-data";

const map: Record<OrderStatus, string> = {
  Diterima: "bg-info/15 text-info border-info/30",
  Dicuci: "bg-primary/15 text-primary border-primary/30",
  Disetrika: "bg-accent/20 text-accent-foreground border-accent/40",
  Siap: "bg-warning/20 text-warning-foreground border-warning/40",
  Diantar: "bg-info/15 text-info border-info/30",
  Selesai: "bg-success/15 text-success border-success/30",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", map[status])}>
      {status}
    </span>
  );
}
