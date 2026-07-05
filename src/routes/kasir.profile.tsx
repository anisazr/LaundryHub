import { createFileRoute } from "@tanstack/react-router";
import { StaffProfile } from "@/components/StaffProfile";

export const Route = createFileRoute("/kasir/profile")({
  head: () => ({ meta: [{ title: "Profil Kasir - LaundryHub" }] }),
  component: () => <StaffProfile role="kasir" />,
});
