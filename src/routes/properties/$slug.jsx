import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bath, BedDouble, Car, Check, Mail, MapPin, Maximize2, Phone } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { InquiryForm, ViewingForm } from "@/components/properties/contact-forms";
import { FavoriteButton } from "@/components/properties/favorite-button";
import { PropertyGallery } from "@/components/properties/gallery";
import { PropertyGrid } from "@/components/properties/property-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_STALE } from "@/lib/constants";
import {
  formatLocation,
  formatPriceWithTenure,
  formatSize,
  listingTypeLabel,
  statusLabel,
} from "@/lib/format";
import { fetchProperty, trackPropertyView } from "@/lib/server/properties";
import { isNewListing } from "@/lib/utils";
export const Route = createFileRoute("/properties/$slug")({
  component: PropertyPage,
  head: ({ params }) => ({
    meta: [
      {
        title: `${params.slug.replace(/-/g, " ")} · Meridian`,
      },
    ],
  }),
});
function PropertyPage() {
  const { slug } = Route.useParams();
  const query = useQuery({
    queryKey: ["property", slug],
    queryFn: () => fetchProperty({ data: { slug } }),
    staleTime: QUERY_STALE.property,
  });
  const property = query.data?.property;
  useEffect(() => {
    if (property?.id) void trackPropertyView({ data: { id: property.id } });
  }, [property?.id]);
  if (query.isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <Skeleton className="aspect-[16/10] rounded-[24px]" />
          <Skeleton className="mt-6 h-10 w-2/3" />
        </div>
      </AppShell>
    );
  }
  if (!property) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-24">
          <EmptyState title="Property not found" body="It may have been withdrawn from the book." />
        </div>
      </AppShell>
    );
  }
  const available = ["PUBLISHED", "AVAILABLE", "UNDER_OFFER"].includes(property.status);
  return (
    <AppShell>
      <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <PropertyGallery images={property.images} title={property.title} />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="muted">{listingTypeLabel(property.listingType)}</Badge>
              <Badge tone="muted">{property.propertyType}</Badge>
              {property.isFeatured ? <Badge>Featured</Badge> : null}
              {property.isVerified ? <Badge tone="good">Verified</Badge> : null}
              {isNewListing(property.publishedAt, 14) ? <Badge tone="muted">New</Badge> : null}
              {!available ? <Badge tone="warn">{statusLabel(property.status)}</Badge> : null}
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl sm:text-5xl">{property.title}</h1>
                <p className="mt-2 flex items-center gap-1 text-muted">
                  <MapPin className="size-4" />
                  {formatLocation([property.address, property.area, property.city, property.state])}
                </p>
              </div>
              <FavoriteButton propertyId={property.id} favorited={Boolean(property.isFavorited)} />
            </div>
            <p className="mt-5 text-2xl font-medium tabular-nums">
              {formatPriceWithTenure(property.price, property.listingType, property.currency)}
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat
                label="Beds"
                value={property.bedrooms}
                icon={<BedDouble className="size-4" />}
              />
              <Stat label="Baths" value={property.bathrooms} icon={<Bath className="size-4" />} />
              <Stat label="Parking" value={property.parking} icon={<Car className="size-4" />} />
              <Stat
                label="Size"
                value={formatSize(property.sizeSqm)}
                icon={<Maximize2 className="size-4" />}
              />
            </dl>
            <section className="mt-10">
              <h2 className="font-display text-3xl">The house</h2>
              <p className="mt-4 max-w-2xl whitespace-pre-wrap text-base leading-relaxed text-ink/85">
                {property.description}
              </p>
            </section>
            {property.amenities.length ? (
              <section className="mt-10">
                <h2 className="font-display text-3xl">Features</h2>
                <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {property.amenities.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-2 rounded-[12px] bg-surface px-3 py-2 text-sm shadow-[var(--shadow-border)]"
                    >
                      <Check className="size-4 text-accent" />
                      {a.name}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <section className="mt-10">
              <h2 className="font-display text-3xl">Location</h2>
              <p className="mt-2 text-sm text-muted">
                {formatLocation([
                  property.address,
                  property.area,
                  property.city,
                  property.state,
                  property.country,
                ])}
              </p>
              {property.lat != null && property.lng != null ? (
                <iframe
                  title="Map"
                  className="mt-4 h-72 w-full rounded-[20px] border-0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${property.lng - 0.02}%2C${property.lat - 0.02}%2C${property.lng + 0.02}%2C${property.lat + 0.02}&layer=mapnik&marker=${property.lat}%2C${property.lng}`}
                />
              ) : null}
            </section>
            <dl className="mt-8 grid grid-cols-2 gap-3 text-sm text-muted sm:grid-cols-3">
              <div>Property ID · {property.id}</div>
              {property.yearBuilt ? <div>Year built · {property.yearBuilt}</div> : null}
              {property.landSizeSqm ? <div>Land · {formatSize(property.landSizeSqm)}</div> : null}
            </dl>
          </div>
          <aside className="h-fit rounded-[24px] bg-surface p-5 shadow-[var(--shadow-border)] lg:sticky lg:top-24">
            {property.agent ? (
              <div className="mb-6 flex gap-3">
                {property.agent.imageUrl ? (
                  <img
                    src={property.agent.imageUrl}
                    alt=""
                    className="size-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid size-14 place-items-center rounded-full bg-ink/10 font-display text-xl">
                    {property.agent.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium">{property.agent.name}</p>
                  <p className="text-xs text-muted">{property.agent.agencyName}</p>
                  {property.agent.isVerified ? (
                    <Badge tone="good" className="mt-1">
                      Verified
                    </Badge>
                  ) : null}
                  <Link
                    to="/agents/$slug"
                    params={{ slug: property.agent.slug }}
                    className="mt-1 block text-xs text-accent underline-offset-4 hover:underline"
                  >
                    View profile
                  </Link>
                </div>
              </div>
            ) : null}
            {property.agent?.phone ? (
              <p className="mb-1 flex items-center gap-2 text-sm">
                <Phone className="size-3.5" /> {property.agent.phone}
              </p>
            ) : null}
            {property.agent?.email ? (
              <p className="mb-4 flex items-center gap-2 text-sm">
                <Mail className="size-3.5" /> {property.agent.email}
              </p>
            ) : null}
            <InquiryForm property={property} />
            <ViewingForm property={property} />
          </aside>
        </div>
        {query.data?.related.length ? (
          <section className="mt-20">
            <h2 className="mb-6 font-display text-4xl">Similar properties</h2>
            <PropertyGrid items={query.data.related} />
          </section>
        ) : null}
      </article>
    </AppShell>
  );
}
function Stat({ label, value, icon }) {
  if (value == null || value === "") return null;
  return (
    <div className="rounded-[16px] bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-lg tabular-nums">{value}</p>
    </div>
  );
}
