import { Link, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";
export function DashboardShell({ children, role, allowed }) {
  const { user, isPending } = useCurrentUserState();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (isPending) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="h-40 animate-pulse rounded-[24px] bg-ink/8" />
        </div>
      </AppShell>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (role && !allowed.includes(role) && role !== "ADMIN") {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-display text-4xl">This desk is closed</h1>
          <p className="mt-3 text-sm text-muted">
            Your account does not have access to this workspace.
          </p>
          <Link to="/dashboard" className="mt-6 inline-block text-sm underline">
            Go to your dashboard
          </Link>
        </div>
      </AppShell>
    );
  }
  const links = [
    { to: "/dashboard/client", label: "Client", show: true },
    {
      to: "/dashboard/agent",
      label: "Agent",
      show: role === "AGENT" || role === "AGENCY_ADMIN" || role === "ADMIN",
    },
    { to: "/dashboard/admin", label: "Admin", show: role === "ADMIN" },
  ];
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Workspace</p>
            <h1 className="font-display text-4xl">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex gap-1 rounded-[14px] bg-surface p-1 shadow-[var(--shadow-border)]">
              {links
                .filter((l) => l.show)
                .map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={cn(
                      "rounded-[10px] px-3 py-2 text-sm",
                      path.startsWith(l.to) ? "bg-ink text-accent-fg" : "text-muted hover:text-ink",
                    )}
                  >
                    {l.label}
                  </Link>
                ))}
            </nav>
            <UserButton />
          </div>
        </div>
        {children}
      </div>
    </AppShell>
  );
}
export function StatCard({ label, value }) {
  return (
    <div className="rounded-[20px] bg-surface p-5 shadow-[var(--shadow-border)]">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 font-display text-4xl tabular-nums">{value}</p>
    </div>
  );
}
