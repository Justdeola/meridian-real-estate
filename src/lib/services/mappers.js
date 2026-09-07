import { toBool, toIso, toNumber } from "@/lib/utils";
export function mapType(row) {
  return {
    id: toNumber(row.id),
    slug: String(row.slug),
    name: String(row.name),
    category: String(row.category),
  };
}
export function mapAmenity(row) {
  return {
    id: toNumber(row.id),
    slug: String(row.slug),
    name: String(row.name),
    icon: String(row.icon ?? "Check"),
  };
}
export function mapImage(row) {
  return {
    id: toNumber(row.id),
    url: String(row.url),
    alt: row.alt == null ? null : String(row.alt),
    sortOrder: toNumber(row.sort_order),
    isPrimary: toBool(row.is_primary),
  };
}
export function mapPropertyCard(row) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    listingType: String(row.listing_type),
    status: String(row.status),
    price: toNumber(row.price),
    currency: String(row.currency ?? "NGN"),
    bedrooms: row.bedrooms == null ? null : toNumber(row.bedrooms),
    bathrooms: row.bathrooms == null ? null : toNumber(row.bathrooms),
    parking: row.parking == null ? null : toNumber(row.parking),
    sizeSqm: row.size_sqm == null ? null : toNumber(row.size_sqm),
    area: row.area == null ? null : String(row.area),
    city: row.city == null ? null : String(row.city),
    state: row.state == null ? null : String(row.state),
    image: row.image == null ? null : String(row.image),
    propertyType: String(row.property_type ?? ""),
    propertyTypeSlug: String(row.property_type_slug ?? ""),
    isFeatured: toBool(row.is_featured),
    isVerified: toBool(row.is_verified),
    publishedAt: toIso(row.published_at),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    views: toNumber(row.views),
    favoriteCount: toNumber(row.favorite_count),
    isFavorited: row.is_favorited == null ? undefined : toBool(row.is_favorited),
    agentName: row.agent_name == null ? null : String(row.agent_name),
  };
}
export function mapAgent(row) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    title: row.title == null ? null : String(row.title),
    bio: String(row.bio ?? ""),
    imageUrl: row.image_url == null ? null : String(row.image_url),
    email: row.email == null ? null : String(row.email),
    phone: row.phone == null ? null : String(row.phone),
    yearsExperience: toNumber(row.years_experience),
    isVerified: toBool(row.is_verified),
    specializations: String(row.specializations ?? ""),
    listingCount: toNumber(row.listing_count),
    rating: row.rating == null ? null : toNumber(row.rating),
    reviewCount: toNumber(row.review_count),
    agencyName: row.agency_name == null ? null : String(row.agency_name),
    agencySlug: row.agency_slug == null ? null : String(row.agency_slug),
  };
}
export function mapAgency(row) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ""),
    logoUrl: row.logo_url == null ? null : String(row.logo_url),
    coverUrl: row.cover_url == null ? null : String(row.cover_url),
    email: row.email == null ? null : String(row.email),
    phone: row.phone == null ? null : String(row.phone),
    website: row.website == null ? null : String(row.website),
    address: row.address == null ? null : String(row.address),
    city: row.city == null ? null : String(row.city),
    state: row.state == null ? null : String(row.state),
    isVerified: toBool(row.is_verified),
    agentCount: toNumber(row.agent_count),
    listingCount: toNumber(row.listing_count),
    rating: row.rating == null ? null : toNumber(row.rating),
    reviewCount: toNumber(row.review_count),
  };
}
