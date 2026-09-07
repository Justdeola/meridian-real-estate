import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { QUERY_STALE } from "@/lib/constants";
import { fetchAgencies } from "@/lib/server/agents";
export const Route = createFileRoute("/agencies/")({
  component: AgenciesPage,
  head: () => ({ meta: [{ title: "Agencies · Meridian" }] }),
});
function AgenciesPage() {
  const query = useQuery({
    queryKey: ["agencies"],
    queryFn: () => fetchAgencies(),
    staleTime: QUERY_STALE.agencies,
  });
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Houses of practice</p>
        <h1 className="mt-2 font-display text-5xl">Agencies</h1>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {query.data?.map((a) => (
            <Link
              key={a.id}
              to="/agencies/$slug"
              params={{ slug: a.slug }}
              className="overflow-hidden rounded-[24px] bg-surface shadow-[var(--shadow-border)]"
            >
              {a.coverUrl ? (
                <img src={a.coverUrl} alt="" className="aspect-[16/9] w-full object-cover" />
              ) : null}
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-3xl">{a.name}</h2>
                  {a.isVerified ? <Badge tone="good">Verified</Badge> : null}
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{a.description}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.14em] text-subtle">
                  {a.city} · {a.agentCount} agents · {a.listingCount} listings
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
