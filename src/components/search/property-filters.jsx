import { useNavigate } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BATHROOM_OPTIONS, BEDROOM_OPTIONS, LISTING_TYPES, SORT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
export function PropertyFilters({ search, types, amenities }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const selectedAmenities = new Set((search.amenities ?? "").split(",").filter(Boolean));
  function patch(next) {
    void navigate({
      to: "/properties",
      search: { ...search, ...next, page: 1 },
    });
  }
  const body = (
    <div className="space-y-6">
      <Field label="Listing">
        <div className="flex flex-wrap gap-1.5">
          {LISTING_TYPES.map((t) => (
            <Chip
              key={t.value}
              active={search.listingType === t.value}
              onClick={() =>
                patch({ listingType: search.listingType === t.value ? undefined : t.value })
              }
            >
              {t.label}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Type">
        <div className="flex flex-wrap gap-1.5">
          {types.map((t) => (
            <Chip
              key={t.slug}
              active={search.propertyType === t.slug}
              onClick={() =>
                patch({ propertyType: search.propertyType === t.slug ? undefined : t.slug })
              }
            >
              {t.name}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Price (₦)">
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min"
            defaultValue={search.minPrice ?? ""}
            onBlur={(e) => patch({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
          />
          <Input
            type="number"
            placeholder="Max"
            defaultValue={search.maxPrice ?? ""}
            onBlur={(e) => patch({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </Field>
      <Field label="Bedrooms">
        <div className="flex flex-wrap gap-1.5">
          {BEDROOM_OPTIONS.map((n) => (
            <Chip
              key={n}
              active={search.bedrooms === n}
              onClick={() => patch({ bedrooms: search.bedrooms === n ? undefined : n })}
            >
              {n}+
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Bathrooms">
        <div className="flex flex-wrap gap-1.5">
          {BATHROOM_OPTIONS.map((n) => (
            <Chip
              key={n}
              active={search.bathrooms === n}
              onClick={() => patch({ bathrooms: search.bathrooms === n ? undefined : n })}
            >
              {n}+
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Features">
        <div className="flex flex-wrap gap-1.5">
          {amenities.map((a) => {
            const on = selectedAmenities.has(a.slug);
            return (
              <Chip
                key={a.slug}
                active={on}
                onClick={() => {
                  const next = new Set(selectedAmenities);
                  if (on) next.delete(a.slug);
                  else next.add(a.slug);
                  patch({ amenities: [...next].join(",") || undefined });
                }}
              >
                {a.name}
              </Chip>
            );
          })}
        </div>
      </Field>
      <Field label="Also">
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={Boolean(search.featured)}
            onClick={() => patch({ featured: search.featured ? undefined : true })}
          >
            Featured
          </Chip>
          <Chip
            active={Boolean(search.verified)}
            onClick={() => patch({ verified: search.verified ? undefined : true })}
          >
            Verified
          </Chip>
          <Chip
            active={Boolean(search.newListing)}
            onClick={() => patch({ newListing: search.newListing ? undefined : true })}
          >
            New listing
          </Chip>
          <Chip
            active={Boolean(search.availableNow)}
            onClick={() => patch({ availableNow: search.availableNow ? undefined : true })}
          >
            Available now
          </Chip>
        </div>
      </Field>
    </div>
  );
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          <SlidersHorizontal className="size-4" />
          Filters
        </Button>
        <SortSelect value={search.sort} onChange={(sort) => patch({ sort })} />
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 bg-ink/40 lg:hidden" onClick={() => setOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[24px] bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl">Filters</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted">
                Close
              </button>
            </div>
            {body}
          </div>
        </div>
      ) : null}
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-24 rounded-[24px] bg-surface p-5 shadow-[var(--shadow-border)]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl">Filters</h2>
            <SortSelect value={search.sort} onChange={(sort) => patch({ sort })} />
          </div>
          {body}
        </div>
      </aside>
    </>
  );
}
function Field({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      {children}
    </div>
  );
}
function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs transition-colors",
        active ? "bg-ink text-accent-fg" : "bg-bg text-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
function SortSelect({ value, onChange }) {
  return (
    <select
      className="h-9 rounded-[8px] border border-line bg-surface px-2 text-xs"
      value={value ?? "newest"}
      onChange={(e) => onChange(e.target.value)}
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
