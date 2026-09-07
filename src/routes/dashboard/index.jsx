import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { fetchMe } from "@/lib/server/me";
export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});
function DashboardIndex() {
  const { user, isPending } = useCurrentUserState();
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), enabled: Boolean(user) });
  if (isPending || me.isPending) return null;
  if (!user) return <RedirectToSignIn />;
  if (me.data?.role === "ADMIN") return <Navigate to="/dashboard/admin" />;
  if (me.data?.role === "AGENT" || me.data?.role === "AGENCY_ADMIN")
    return <Navigate to="/dashboard/agent" />;
  return <Navigate to="/dashboard/client" />;
}
