import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Heart, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { fetchMe, fetchNotifications } from "@/lib/server/me";
import { QUERY_STALE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
const NAV = [
  { to: "/properties", label: "Buy", search: { listingType: "SALE" } },
  { to: "/properties", label: "Rent", search: { listingType: "RENT" } },
  { to: "/properties", label: "Short let", search: { listingType: "SHORT_LET" } },
  { to: "/agents", label: "Agents" },
  { to: "/agencies", label: "Agencies" },
];
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useCurrentUserState();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => fetchMe(),
    enabled: Boolean(user),
    staleTime: QUERY_STALE.me,
  });
  const notes = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(),
    enabled: Boolean(user),
    staleTime: 15_000,
  });
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  const dashboardHref =
    me.data?.role === "ADMIN"
      ? "/dashboard/admin"
      : me.data?.role === "AGENT" || me.data?.role === "AGENCY_ADMIN"
        ? "/dashboard/agent"
        : "/dashboard/client";
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-[0.18em]">MERIDIAN</span>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((item) => (
            <Link key={item.label} to={item.to} search={item.search} className="text-sm text-muted transition-colors hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isPending ? (
            <div className="h-8 w-24 animate-pulse rounded-full bg-ink/10" />
          ) : (
            <>
              <SignedIn>
                <Link to="/favorites" className="relative grid size-11 place-items-center rounded-[10px] hover:bg-ink/5" aria-label="Saved properties">
                  <Heart className="size-4" />
                </Link>
                <Link to={dashboardHref} className="relative grid size-11 place-items-center rounded-[10px] hover:bg-ink/5" aria-label="Notifications">
                  <Bell className="size-4" />
                  {(notes.data?.unread ?? 0) > 0 ? (
                    <span className="absolute right-2 top-2 size-2 rounded-full bg-accent" />
                  ) : null}
                </Link>
                <Link to={dashboardHref} className="hidden sm:block">
                  <Button size="sm" variant="secondary">Dashboard</Button>
                </Link>
              </SignedIn>
              <SignedOut>
                <Link to="/login">
                  <Button size="sm">Sign in</Button>
                </Link>
              </SignedOut>
            </>
          )}
          <button type="button" className="grid size-11 place-items-center rounded-[10px] lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      <div className={cn("overflow-hidden border-t border-line bg-bg transition-[max-height,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden", open ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
        <div className="flex flex-col gap-1 px-4 py-4">
          {NAV.map((item) => (
            <Link key={item.label} to={item.to} search={item.search} className="py-3 text-base">{item.label}</Link>
          ))}
          <Link to="/properties" className="py-3 text-base">All listings</Link>
        </div>
      </div>
    </header>
  );
}
