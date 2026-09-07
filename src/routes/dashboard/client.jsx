import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { PropertyGrid } from "@/components/properties/property-card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty";
import {
  fetchDashboard,
  fetchFavorites,
  fetchMyAppointments,
  fetchMyInquiries,
  fetchNotifications,
  fetchSavedSearches,
  mutateAppointment,
  mutateSavedSearch,
  readNotification,
  registerAsAgent,
  saveMyProfile,
} from "@/lib/server/me";
import { relativeTime, statusLabel } from "@/lib/format";
export const Route = createFileRoute("/dashboard/client")({
  component: ClientDash,
  head: () => ({ meta: [{ title: "Client dashboard · Meridian" }] }),
});
function ClientDash() {
  const dash = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });
  const favs = useQuery({ queryKey: ["favorites"], queryFn: () => fetchFavorites() });
  const inquiries = useQuery({ queryKey: ["inquiries"], queryFn: () => fetchMyInquiries() });
  const appts = useQuery({ queryKey: ["appointments"], queryFn: () => fetchMyAppointments() });
  const searches = useQuery({ queryKey: ["saved-searches"], queryFn: () => fetchSavedSearches() });
  const notes = useQuery({ queryKey: ["notifications"], queryFn: () => fetchNotifications() });
  const qc = useQueryClient();
  const me = dash.data?.me;
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentBio, setAgentBio] = useState("");
  const save = useMutation({
    mutationFn: () => saveMyProfile({ data: { phone, displayName } }),
    onSuccess: () => {
      toast.success("Profile updated.");
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  const become = useMutation({
    mutationFn: () =>
      registerAsAgent({
        data: { name: agentName || me?.displayName || "Agent", bio: agentBio, phone },
      }),
    onSuccess: () => {
      toast.success("You are now listed as an agent.");
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      void qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => toast.error(err.message),
  });
  return (
    <DashboardShell role={me?.role} allowed={["CLIENT", "AGENT", "AGENCY_ADMIN", "ADMIN"]}>
      <div className="grid gap-8 lg:grid-cols-3">
        <section className="rounded-[24px] bg-surface p-5 shadow-[var(--shadow-border)] lg:col-span-1">
          <h2 className="font-display text-2xl">Profile</h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div>
              <Label>Name</Label>
              <Input
                defaultValue={me?.displayName ?? ""}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input defaultValue={me?.phone ?? ""} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button type="submit" loading={save.isPending}>
              Save
            </Button>
          </form>
          {me?.role === "CLIENT" ? (
            <form
              className="mt-8 space-y-3 border-t border-line pt-6"
              onSubmit={(e) => {
                e.preventDefault();
                become.mutate();
              }}
            >
              <h3 className="font-display text-xl">Become an agent</h3>
              <Input
                placeholder="Professional name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
              <Textarea
                placeholder="Short bio"
                value={agentBio}
                onChange={(e) => setAgentBio(e.target.value)}
              />
              <Button type="submit" variant="secondary" loading={become.isPending}>
                Register as agent
              </Button>
            </form>
          ) : null}
        </section>
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="mb-4 font-display text-2xl">Saved properties</h2>
            {favs.data?.length ? (
              <PropertyGrid items={favs.data.slice(0, 4)} />
            ) : (
              <EmptyState title="No saved homes yet" />
            )}
          </section>
          <section>
            <h2 className="mb-4 font-display text-2xl">Saved searches</h2>
            <div className="space-y-2">
              {searches.data?.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-[16px] bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
                >
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted">
                      {s.alertsEnabled ? "Alerts on" : "Alerts off"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        mutateSavedSearch({
                          data: { id: s.id, alertsEnabled: !s.alertsEnabled },
                        }).then(() => qc.invalidateQueries({ queryKey: ["saved-searches"] }))
                      }
                    >
                      {s.alertsEnabled ? "Mute" : "Alert"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        mutateSavedSearch({ data: { id: s.id, delete: true } }).then(() =>
                          qc.invalidateQueries({ queryKey: ["saved-searches"] }),
                        )
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-4 font-display text-2xl">Enquiries</h2>
            <div className="space-y-3">
              {inquiries.data?.map((i) => (
                <div
                  key={i.id}
                  className="rounded-[16px] bg-surface p-4 shadow-[var(--shadow-border)]"
                >
                  <p className="font-medium">{i.propertyTitle}</p>
                  <p className="text-sm text-muted">{i.message}</p>
                  {i.agentResponse ? (
                    <p className="mt-2 text-sm">Reply: {i.agentResponse}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-subtle">
                    {statusLabel(i.status)} · {relativeTime(i.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-4 font-display text-2xl">Viewings</h2>
            <div className="space-y-3">
              {appts.data?.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col gap-2 rounded-[16px] bg-surface p-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{a.propertyTitle}</p>
                    <p className="text-sm text-muted">
                      {a.preferredDate} · {a.preferredTime} · {statusLabel(a.status)}
                    </p>
                  </div>
                  {a.status === "PENDING" || a.status === "CONFIRMED" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        mutateAppointment({ data: { id: a.id, status: "CANCELLED" } }).then(() =>
                          qc.invalidateQueries({ queryKey: ["appointments"] }),
                        )
                      }
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl">Notifications</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  readNotification({ data: { all: true } }).then(() =>
                    qc.invalidateQueries({ queryKey: ["notifications"] }),
                  )
                }
              >
                Mark all read
              </Button>
            </div>
            <div className="space-y-2">
              {notes.data?.items.map((n) => (
                <Link
                  key={n.id}
                  to={n.link || "/dashboard/client"}
                  className="block rounded-[16px] bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
                  onClick={() => readNotification({ data: { id: n.id } })}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted">{n.body}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
