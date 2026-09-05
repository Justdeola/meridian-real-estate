import { Link } from "@tanstack/react-router";
import { Bath, BedDouble, MapPin, Maximize2 } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { formatLocation, formatPriceWithTenure, formatSize, listingTypeLabel } from "@/lib/format";
import { isNewListing } from "@/lib/utils";
import { FavoriteButton } from "./favorite-button";
export function PropertyCard({ property, newListingDays = 14 }) {
  const isNew = isNewListing(property.publishedAt, newListingDays);
  const sold = property.status === "SOLD" || property.status === "RENTED";
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="group overflow-hidden rounded-[24px] bg-surface shadow-[var(--shadow-border)]"
    >
      <Link to="/properties/$slug" params={{ slug: property.slug }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          {property.image ? (
            <img src={property.image} alt={property.title} className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
          ) : (
            <div className="size-full bg-ink/10" />
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {property.isFeatured ? <Badge>Featured</Badge> : null}
            {property.isVerified ? <Badge tone="good">Verified</Badge> : null}
            {isNew ? <Badge tone="muted">New</Badge> : null}
            {sold ? <Badge tone="warn">{property.status === "SOLD" ? "Sold" : "Let"}</Badge> : null}
          </div>
          <span className="absolute bottom-3 left-3 rounded-full bg-surface/95 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-ink">
            {listingTypeLabel(property.listingType)}
          </span>
        </div>
      </Link>
      <div className="relative p-4 pb-5">
        <div className="absolute right-3 top-3">
          <FavoriteButton propertyId={property.id} favorited={Boolean(property.isFavorited)} />
        </div>
        <p className="pr-10 text-xs uppercase tracking-[0.14em] text-muted">{property.propertyType}</p>
        <Link to="/properties/$slug" params={{ slug: property.slug }}>
          <h3 className="mt-1 font-display text-2xl leading-tight">{property.title}</h3>
        </Link>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted">
          <MapPin className="size-3.5" />
          {formatLocation([property.area, property.city])}
        </p>
        <p className="mt-3 font-medium tabular-nums">
          {formatPriceWithTenure(property.price, property.listingType, property.currency)}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
          {property.bedrooms != null ? (
            <span className="inline-flex items-center gap-1"><BedDouble className="size-3.5" /> {property.bedrooms} Beds</span>
          ) : null}
          {property.bathrooms != null ? (
            <span className="inline-flex items-center gap-1"><Bath className="size-3.5" /> {property.bathrooms} Baths</span>
          ) : null}
          {formatSize(property.sizeSqm) ? (
            <span className="inline-flex items-center gap-1"><Maximize2 className="size-3.5" /> {formatSize(property.sizeSqm)}</span>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
export function PropertyGrid({ items, newListingDays }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((p) => (
        <PropertyCard key={p.id} property={p} newListingDays={newListingDays} />
      ))}
    </div>
  );
}
