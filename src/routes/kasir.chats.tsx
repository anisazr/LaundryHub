import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Send } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { addCustomerMessage, useLaundryData } from "@/lib/laundry-store";
import { formatTime } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/kasir/chats")({
  head: () => ({ meta: [{ title: "Chat Customer - Kasir" }] }),
  component: KasirChatsPage,
});

function KasirChatsPage() {
  const { data, update } = useLaundryData();
  const [selectedCustomerId, setSelectedCustomerId] = useState(data.customers[0]?.id ?? "");
  const [reply, setReply] = useState("");

  const conversations = useMemo(
    () =>
      data.customers
        .map((customer) => {
          const messages = data.conversations
            .filter((message) => message.customerId === customer.id)
            .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
          const lastMessage = messages[messages.length - 1];
          const orders = data.orders.filter((order) => order.customerId === customer.id || order.phone === customer.phone);
          return { customer, messages, lastMessage, orders };
        })
        .filter((item) => item.messages.length > 0 || item.orders.length > 0),
    [data.conversations, data.customers, data.orders],
  );

  const active =
    conversations.find((item) => item.customer.id === selectedCustomerId) ?? conversations[0];
  const activeMessages = active?.messages ?? [];

  function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active || !reply.trim()) return;
    update((current) => addCustomerMessage(current, active.customer.id, reply, "Kasir"));
    setReply("");
    toast.success("Balasan terkirim ke customer.");
  }

  return (
    <AppShell role="kasir">
      <div className="grid min-h-[calc(100vh-8rem)] gap-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <MessageCircle className="h-5 w-5 text-primary" />
              Chat Customer
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Balas chat customer dari halaman aktivitas.</p>
          </div>
          <div className="max-h-[calc(100vh-14rem)] overflow-auto p-3">
            {conversations.length === 0 ? (
              <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">Belum ada chat atau order customer.</div>
            ) : (
              conversations.map((item) => (
                <button
                  key={item.customer.id}
                  onClick={() => setSelectedCustomerId(item.customer.id)}
                  className={cn(
                    "mb-2 w-full rounded-md border p-3 text-left transition-colors",
                    active?.customer.id === item.customer.id ? "border-primary bg-primary/5" : "hover:bg-muted",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{item.customer.name}</div>
                    <Badge variant="secondary">{item.messages.length}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.customer.phone}</div>
                  <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {item.lastMessage?.body ?? `${item.orders.length} order aktif`}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-lg border bg-card">
          {active ? (
            <>
              <div className="border-b p-4">
                <div className="font-semibold">{active.customer.name}</div>
                <div className="text-sm text-muted-foreground">
                  {active.customer.phone} - {active.orders.length} order tercatat
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-auto p-4">
                {activeMessages.length === 0 ? (
                  <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                    Customer belum mengirim chat. Kamu tetap bisa kirim pesan awal.
                  </div>
                ) : (
                  activeMessages.map((message) => (
                    <div key={message.id} className={cn("flex", message.sender === "Customer" ? "justify-start" : "justify-end")}>
                      <div
                        className={cn(
                          "max-w-[78%] rounded-lg px-4 py-3 text-sm",
                          message.sender === "Customer"
                            ? "bg-muted text-foreground"
                            : "bg-primary text-primary-foreground",
                        )}
                      >
                        <div className="text-xs font-semibold opacity-70">{message.sender}</div>
                        <div className="mt-1">{message.body}</div>
                        <div className="mt-1 text-[10px] opacity-70">{formatTime(message.at)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form className="flex gap-2 border-t p-4" onSubmit={sendReply}>
                <Input
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Balas customer..."
                />
                <Button type="submit">
                  <Send className="h-4 w-4" />
                  Kirim
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
              Pilih customer untuk membalas chat.
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
