import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PropertyGrid } from "@/components/properties/property-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { QUERY_STALE } from "@/lib/constants";
import { fetchAgencyPage } from "@/lib/server/agents";
export const Route = createFileRoute("/agencies/$slug")({
  component: AgencyPage,
  head: ({ params }) => ({ meta: [{ title: `${params.slug} · Agency · Meridian` }] }),
});
function AgencyPage() {
  const { slug } = Route.useParams();
  const query = useQuery({
    queryKey: ["agency", slug],
    queryFn: () => fetchAgencyPage({ data: { slug } }),
    staleTime: QUERY_STALE.agencies,
  });
  const agency = query.data?.agency;
  if (!query.isLoading && !agency) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-24">
          <EmptyState title="Agency not found" />
        </div>
      </AppShell>
    );
  }
  if (!agency)
    return (
      <AppShell>
        <div className="h-96" />
      </AppShell>
    );
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {agency.coverUrl ? (
          <img
            src={agency.coverUrl}
            alt=""
            className="mb-8 aspect-[21/8] w-full rounded-[24px] object-cover"
          />
        ) : null}
        <div className="flex items-center gap-3">
          <h1 className="font-display text-5xl">{agency.name}</h1>
          {agency.isVerified ? <Badge tone="good">Verified</Badge> : null}
        </div>
        <p className="mt-4 max-w-2xl text-muted">{agency.description}</p>
        <p className="mt-3 text-sm text-muted">
          {agency.address}, {agency.city} · {agency.phone} · {agency.email}
        </p>
        <section className="mt-12">
          <h2 className="mb-6 font-display text-4xl">Agents</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agency.agents.map((agent) => (
              <Link
                key={agent.id}
                to="/agents/$slug"
                params={{ slug: agent.slug }}
                className="rounded-[20px] bg-surface p-4 shadow-[var(--shadow-border)]"
              >
                <p className="font-medium">{agent.name}</p>
                <p className="text-sm text-muted">{agent.title}</p>
              </Link>
            ))}
          </div>
        </section>
        <section className="mt-12">
          <h2 className="mb-6 font-display text-4xl">Listings</h2>
          <PropertyGrid items={query.data?.listings.items ?? []} />
        </section>
        <section className="mt-12">
          <h2 className="mb-6 font-display text-4xl">Reviews</h2>
          <div className="space-y-4">
            {query.data?.reviews.map((r) => (
              <blockquote
                key={r.id}
                className="rounded-[20px] bg-surface p-5 shadow-[var(--shadow-border)]"
              >
                <p className="text-sm font-medium">
                  {r.authorName} · {r.rating}/5
                </p>
                <p className="mt-2 text-sm text-muted">{r.body}</p>
              </blockquote>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
