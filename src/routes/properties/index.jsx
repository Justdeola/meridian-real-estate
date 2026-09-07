import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PropertyGrid } from "@/components/properties/property-card";
import { PropertyFilters } from "@/components/search/property-filters";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { PropertyCardSkeleton } from "@/components/ui/skeleton";
import { QUERY_STALE } from "@/lib/constants";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { fetchCatalog } from "@/lib/server/catalog";
import { persistSavedSearch } from "@/lib/server/me";
import { fetchProperties } from "@/lib/server/properties";
import { parsePropertySearch, toFilters } from "@/lib/search-params";
import { formatNumber } from "@/lib/format";
export const Route = createFileRoute("/properties/")({
  validateSearch: (s) => parsePropertySearch(s),
  component: PropertiesPage,
  head: () => ({ meta: [{ title: "Properties · Meridian" }] }),
});
function PropertiesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [q, setQ] = useState(search.q ?? "");
  useEffect(() => {
    setQ(search.q ?? "");
  }, [search.q]);
  useEffect(() => {
    const t = setTimeout(() => {
      if ((q || undefined) !== search.q) {
        void navigate({ to: "/properties", search: { ...search, q: q || undefined, page: 1 } });
      }
    }, 320);
    return () => clearTimeout(t);
  }, [q, navigate, search]);
  const catalog = useQuery({
    queryKey: ["catalog"],
    queryFn: () => fetchCatalog(),
    staleTime: QUERY_STALE.categories,
  });
  const list = useQuery({
    queryKey: ["properties", search],
    queryFn: () => fetchProperties({ data: toFilters(search) }),
    staleTime: QUERY_STALE.properties,
    placeholderData: keepPreviousData,
  });
  const save = useMutation({
    mutationFn: () =>
      persistSavedSearch({
        data: {
          name: search.q || search.city || search.propertyType || "Saved search",
          params: toFilters(search),
        },
      }),
    onSuccess: () => toast.success("Search saved."),
    onError: () => toast.error("Sign in to save this search."),
  });
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">The book</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-display text-5xl">Properties</h1>
          <p className="text-sm text-muted">
            {list.data ? `${formatNumber(list.data.meta.total)} listings` : "Searching…"}
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by area, city, agent or property name"
            className="sm:max-w-md"
          />
          {user ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => save.mutate()}
              loading={save.isPending}
            >
              Save search
            </Button>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          <PropertyFilters
            search={search}
            types={catalog.data?.types ?? []}
            amenities={catalog.data?.amenities ?? []}
          />
          <div className="min-w-0 flex-1">
            {list.isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </div>
            ) : list.isError ? (
              <EmptyState
                title="Listings could not be loaded"
                body="Please try again in a moment."
                action={
                  <Button variant="secondary" onClick={() => list.refetch()}>
                    Retry
                  </Button>
                }
              />
            ) : !list.data?.items.length ? (
              <EmptyState
                title="No properties match"
                body="Widen the filters or try another city."
              />
            ) : (
              <>
                <PropertyGrid items={list.data.items} newListingDays={list.data.newListingDays} />
                <Pagination meta={list.data.meta} search={search} />
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
