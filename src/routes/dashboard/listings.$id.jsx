import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/shell";
import { PropertyForm } from "@/components/forms/property-form";
import { fetchMe } from "@/lib/server/me";
import { fetchProperty } from "@/lib/server/properties";
export const Route = createFileRoute("/dashboard/listings/$id")({
  component: EditListing,
  head: () => ({ meta: [{ title: "Edit listing · Meridian" }] }),
});
function EditListing() {
  const { id } = Route.useParams();
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  const prop = useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchProperty({ data: { slug: id } }),
  });
  return (
    <DashboardShell role={me.data?.role} allowed={["AGENT", "AGENCY_ADMIN", "ADMIN"]}>
      <h2 className="mb-6 font-display text-3xl">Edit listing</h2>
      {prop.data?.property ? (
        <PropertyForm existing={prop.data.property} />
      ) : (
        <p className="text-sm text-muted">Loading…</p>
      )}
    </DashboardShell>
  );
}
