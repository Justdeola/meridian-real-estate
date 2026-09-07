import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell, StatCard } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { formatPrice, statusLabel } from "@/lib/format";
import {
  fetchDashboard,
  fetchMyAppointments,
  fetchMyInquiries,
  mutateAppointment,
  replyInquiry,
} from "@/lib/server/me";
import { changePropertyStatus, fetchMyListings, removeProperty } from "@/lib/server/properties";
import { PROPERTY_STATUSES } from "@/lib/constants";
export const Route = createFileRoute("/dashboard/agent")({
  component: AgentDash,
  head: () => ({ meta: [{ title: "Agent dashboard · Meridian" }] }),
});
function AgentDash() {
  const dash = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });
  const listings = useQuery({ queryKey: ["my-listings"], queryFn: () => fetchMyListings() });
  const inquiries = useQuery({ queryKey: ["inquiries"], queryFn: () => fetchMyInquiries() });
  const appts = useQuery({ queryKey: ["appointments"], queryFn: () => fetchMyAppointments() });
  const qc = useQueryClient();
  const me = dash.data?.me;
  const stats = dash.data?.agent;
  return (
    <DashboardShell role={me?.role} allowed={["AGENT", "AGENCY_ADMIN", "ADMIN"]}>
      {me?.role === "CLIENT" ? (
        <p className="text-sm text-muted">
          Register as an agent from the client workspace to list property.
        </p>
      ) : (
        <>
          <div className="mb-6 flex justify-end">
            <Link to="/dashboard/listings/new">
              <Button>Add property</Button>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Listings" value={stats?.total ?? 0} />
            <StatCard label="Active" value={stats?.active ?? 0} />
            <StatCard label="Enquiries" value={stats?.inquiries ?? 0} />
            <StatCard label="Views" value={stats?.views ?? 0} />
            <StatCard label="Sold" value={stats?.sold ?? 0} />
            <StatCard label="Let" value={stats?.rented ?? 0} />
            <StatCard label="Pending viewings" value={stats?.pending_appts ?? 0} />
            <StatCard label="Saves received" value={stats?.favorites ?? 0} />
          </div>
          <section className="mt-10 overflow-x-auto">
            <h2 className="mb-4 font-display text-2xl">Listings</h2>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="py-2">Property</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Views</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {listings.data?.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="py-3">
                      <Link
                        to="/properties/$slug"
                        params={{ slug: p.slug }}
                        className="font-medium hover:underline"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-muted">
                        {p.city} · {p.propertyType}
                      </p>
                    </td>
                    <td>
                      <select
                        className="h-9 rounded-[8px] border border-line bg-surface px-2 text-xs"
                        value={p.status}
                        onChange={(e) =>
                          changePropertyStatus({ data: { id: p.id, status: e.target.value } }).then(
                            () => qc.invalidateQueries({ queryKey: ["my-listings"] }),
                          )
                        }
                      >
                        {PROPERTY_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {statusLabel(s)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="tabular-nums">{formatPrice(p.price, p.currency)}</td>
                    <td className="tabular-nums">{p.views}</td>
                    <td className="text-right">
                      <Link
                        to="/dashboard/listings/$id"
                        params={{ id: p.id }}
                        className="mr-3 text-xs underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="text-xs text-danger"
                        onClick={() => {
                          if (!confirm("Remove this listing?")) return;
                          void removeProperty({ data: { id: p.id } }).then(() =>
                            qc.invalidateQueries({ queryKey: ["my-listings"] }),
                          );
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="mt-10 grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 font-display text-2xl">Enquiries</h2>
              <div className="space-y-3">
                {inquiries.data?.map((i) => (
                  <InquiryRow
                    key={i.id}
                    inquiry={i}
                    onDone={() => qc.invalidateQueries({ queryKey: ["inquiries"] })}
                  />
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-4 font-display text-2xl">Viewings</h2>
              <div className="space-y-3">
                {appts.data?.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-[16px] bg-surface p-4 shadow-[var(--shadow-border)]"
                  >
                    <p className="font-medium">{a.propertyTitle}</p>
                    <p className="text-sm text-muted">
                      {a.preferredDate} {a.preferredTime} · {statusLabel(a.status)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["CONFIRMED", "REJECTED", "COMPLETED", "CANCELLED"].map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            mutateAppointment({ data: { id: a.id, status: s } }).then(() =>
                              qc.invalidateQueries({ queryKey: ["appointments"] }),
                            )
                          }
                        >
                          {statusLabel(s)}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </DashboardShell>
  );
}
function InquiryRow({ inquiry, onDone }) {
  const [response, setResponse] = useState("");
  const mutation = useMutation({
    mutationFn: () => replyInquiry({ data: { id: inquiry.id, response } }),
    onSuccess: () => {
      toast.success("Reply sent.");
      onDone();
    },
  });
  return (
    <div className="rounded-[16px] bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="font-medium">{inquiry.propertyTitle}</p>
      <p className="text-xs text-muted">{inquiry.name}</p>
      <p className="mt-2 text-sm">{inquiry.message}</p>
      {inquiry.agentResponse ? (
        <p className="mt-2 text-sm text-muted">You: {inquiry.agentResponse}</p>
      ) : null}
      <form
        className="mt-3 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <Textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Reply"
        />
        <Button size="sm" type="submit" loading={mutation.isPending}>
          Respond
        </Button>
      </form>
    </div>
  );
}
