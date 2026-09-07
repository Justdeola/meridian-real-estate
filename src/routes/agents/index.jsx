import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_STALE } from "@/lib/constants";
import { fetchAgents } from "@/lib/server/agents";
export const Route = createFileRoute("/agents/")({
  component: AgentsPage,
  head: () => ({ meta: [{ title: "Agents · Meridian" }] }),
});
function AgentsPage() {
  const query = useQuery({
    queryKey: ["agents"],
    queryFn: () => fetchAgents(),
    staleTime: QUERY_STALE.agents,
  });
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">The practice</p>
        <h1 className="mt-2 font-display text-5xl">Agents</h1>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {query.isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-[24px]" />
              ))
            : query.data?.map((agent) => (
                <Link
                  key={agent.id}
                  to="/agents/$slug"
                  params={{ slug: agent.slug }}
                  className="rounded-[24px] bg-surface p-5 shadow-[var(--shadow-border)] transition-transform duration-200 hover:-translate-y-1"
                >
                  <div className="flex gap-4">
                    {agent.imageUrl ? (
                      <img
                        src={agent.imageUrl}
                        alt=""
                        className="size-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="grid size-16 place-items-center rounded-full bg-ink/10 font-display text-2xl">
                        {agent.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-muted">{agent.title}</p>
                      {agent.isVerified ? (
                        <Badge tone="good" className="mt-1">
                          Verified
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm text-muted">{agent.bio}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.14em] text-subtle">
                    {agent.listingCount} listings
                    {agent.rating ? ` · ${agent.rating.toFixed(1)}` : ""}
                  </p>
                </Link>
              ))}
        </div>
      </div>
    </AppShell>
  );
}
