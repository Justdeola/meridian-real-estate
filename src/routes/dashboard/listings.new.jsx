import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/shell";
import { PropertyForm } from "@/components/forms/property-form";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/lib/server/me";
export const Route = createFileRoute("/dashboard/listings/new")({
  component: NewListing,
  head: () => ({ meta: [{ title: "New listing · Meridian" }] }),
});
function NewListing() {
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  return (
    <DashboardShell role={me.data?.role} allowed={["AGENT", "AGENCY_ADMIN", "ADMIN"]}>
      <h2 className="mb-6 font-display text-3xl">New listing</h2>
      <PropertyForm />
    </DashboardShell>
  );
}
