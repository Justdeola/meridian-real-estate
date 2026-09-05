import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PropertyGrid } from "@/components/properties/property-card";
import { EmptyState } from "@/components/ui/empty";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { fetchFavorites } from "@/lib/server/me";
export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
  head: () => ({ meta: [{ title: "Saved · Meridian" }] }),
});
function FavoritesPage() {
  const { user, isPending } = useCurrentUserState();
  const query = useQuery({
    queryKey: ["favorites"],
    queryFn: () => fetchFavorites(),
    enabled: Boolean(user),
  });
  if (isPending)
    return (
      <AppShell>
        <div className="h-96" />
      </AppShell>
    );
  if (!user) return <RedirectToSignIn />;
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-5xl">Saved properties</h1>
        <div className="mt-10">
          {query.data?.length ? (
            <PropertyGrid items={query.data} />
          ) : (
            <EmptyState title="Nothing saved yet" body="Tap the heart on a listing to keep it here." />
          )}
        </div>
      </div>
    </AppShell>
  );
}
