import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardShell, StatCard } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice, statusLabel } from "@/lib/format";
import { changeUserRole, fetchAdminUsers, fetchDashboard } from "@/lib/server/me";
import { fetchAdminProperties, moderateListing } from "@/lib/server/properties";
import { updateNewListingDays } from "@/lib/server/catalog";
import { ROLES } from "@/lib/constants";
export const Route = createFileRoute("/dashboard/admin")({
  component: AdminDash,
  head: () => ({ meta: [{ title: "Admin · Meridian" }] }),
});
function AdminDash() {
  const dash = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });
  const properties = useQuery({
    queryKey: ["admin-properties"],
    queryFn: () => fetchAdminProperties({ data: {} }),
  });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => fetchAdminUsers() });
  const qc = useQueryClient();
  const totals = dash.data?.admin?.totals;
  const me = dash.data?.me;
  return (
    <DashboardShell role={me?.role} allowed={["ADMIN"]}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Properties" value={totals?.properties ?? 0} />
        <StatCard label="Live" value={totals?.published ?? 0} />
        <StatCard label="Pending" value={totals?.pending ?? 0} />
        <StatCard label="Users" value={totals?.users ?? 0} />
        <StatCard label="Agents" value={totals?.agents ?? 0} />
        <StatCard label="Agencies" value={totals?.agencies ?? 0} />
        <StatCard label="Sold" value={totals?.sold ?? 0} />
        <StatCard label="Let" value={totals?.rented ?? 0} />
        <StatCard label="Enquiries" value={totals?.inquiries ?? 0} />
        <StatCard label="Viewings" value={totals?.appointments ?? 0} />
      </div>

      <section className="mt-10 rounded-[24px] bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="mb-4 font-display text-2xl">Listings by type</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dash.data?.admin?.listingByType ?? []}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2f4a3c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl">Moderation</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="py-2">Property</th>
                <th>Status</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {properties.data?.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="py-3">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted">
                      {p.city} · {p.agentName}
                    </p>
                  </td>
                  <td>{statusLabel(p.status)}</td>
                  <td className="tabular-nums">{formatPrice(p.price)}</td>
                  <td className="space-x-2 text-right">
                    {p.status === "PENDING_REVIEW" ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            moderateListing({ data: { id: p.id, action: "approve" } }).then(() =>
                              qc.invalidateQueries({ queryKey: ["admin-properties"] }),
                            )
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            moderateListing({
                              data: {
                                id: p.id,
                                action: "reject",
                                reason: "Does not meet listing standards",
                              },
                            }).then(() => qc.invalidateQueries({ queryKey: ["admin-properties"] }))
                          }
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          moderateListing({
                            data: { id: p.id, action: p.isFeatured ? "unfeature" : "feature" },
                          }).then(() => qc.invalidateQueries({ queryKey: ["admin-properties"] }))
                        }
                      >
                        {p.isFeatured ? "Unfeature" : "Feature"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl">Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="py-2">Name</th>
                <th>Role</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {users.data?.map((u) => (
                <tr key={u.user_id} className="border-t border-line">
                  <td className="py-3">{u.display_name}</td>
                  <td>
                    <select
                      className="h-9 rounded-[8px] border border-line bg-surface px-2 text-xs"
                      value={u.role}
                      onChange={(e) =>
                        changeUserRole({ data: { userId: u.user_id, role: e.target.value } }).then(
                          () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
                        )
                      }
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{u.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 max-w-sm">
        <h2 className="mb-3 font-display text-2xl">New listing window</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const days = Number(new FormData(e.currentTarget).get("days"));
            void updateNewListingDays({ data: { days } });
          }}
        >
          <Input name="days" type="number" min={1} max={90} defaultValue={14} />
          <Button type="submit">Save</Button>
        </form>
        <p className="mt-2 text-xs text-muted">
          Days a listing keeps the NEW badge after publication.
        </p>
      </section>
    </DashboardShell>
  );
}
