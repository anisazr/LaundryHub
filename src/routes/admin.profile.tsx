import { createFileRoute } from "@tanstack/react-router";
import { StaffProfile } from "@/components/StaffProfile";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({ meta: [{ title: "Profil Admin - LaundryHub" }] }),
  component: () => <StaffProfile role="admin" />,
});
