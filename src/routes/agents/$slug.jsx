import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PropertyGrid } from "@/components/properties/property-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty";
import { Textarea } from "@/components/ui/input";
import { QUERY_STALE } from "@/lib/constants";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { fetchAgentPage } from "@/lib/server/agents";
import { submitReview } from "@/lib/server/me";
export const Route = createFileRoute("/agents/$slug")({
  component: AgentPage,
  head: ({ params }) => ({ meta: [{ title: `${params.slug} · Agent · Meridian` }] }),
});
function AgentPage() {
  const { slug } = Route.useParams();
  const query = useQuery({
    queryKey: ["agent", slug],
    queryFn: () => fetchAgentPage({ data: { slug } }),
    staleTime: QUERY_STALE.agents,
  });
  const agent = query.data?.agent;
  if (!query.isLoading && !agent) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-24">
          <EmptyState title="Agent not found" />
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {agent ? (
          <>
            <div className="flex flex-col gap-6 sm:flex-row">
              {agent.imageUrl ? (
                <img src={agent.imageUrl} alt="" className="size-28 rounded-full object-cover" />
              ) : null}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-5xl">{agent.name}</h1>
                  {agent.isVerified ? <Badge tone="good">Verified</Badge> : null}
                </div>
                <p className="mt-1 text-muted">
                  {agent.title}
                  {agent.agencyName ? ` · ${agent.agencyName}` : ""}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {agent.yearsExperience} years · {agent.listingCount} listings
                  {agent.rating ? ` · ${agent.rating.toFixed(1)} (${agent.reviewCount})` : ""}
                </p>
                <p className="mt-5 max-w-2xl text-base leading-relaxed">{agent.bio}</p>
                <p className="mt-3 text-sm text-muted">{agent.specializations}</p>
              </div>
            </div>
            <section className="mt-14">
              <h2 className="mb-6 font-display text-4xl">Current listings</h2>
              <PropertyGrid items={query.data?.listings.items ?? []} />
            </section>
            <section className="mt-14">
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
              <ReviewBox agentId={agent.id} onDone={() => query.refetch()} />
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
function ReviewBox({ agentId, onDone }) {
  const user = useCurrentUser();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => submitReview({ data: { agentId, rating, body } }),
    onSuccess: () => {
      toast.success("Review published.");
      setBody("");
      void qc.invalidateQueries({ queryKey: ["agent"] });
      onDone();
    },
    onError: (err) => toast.error(err.message),
  });
  if (!user) return <p className="mt-6 text-sm text-muted">Sign in to leave a review.</p>;
  return (
    <form
      className="mt-6 max-w-lg space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <select
        className="h-11 rounded-[10px] border border-line bg-surface px-3 text-sm"
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
      >
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} star{n > 1 ? "s" : ""}
          </option>
        ))}
      </select>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="A considered note"
      />
      <Button type="submit" loading={mutation.isPending}>
        Submit review
      </Button>
    </form>
  );
}
