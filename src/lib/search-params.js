function str(v) {
  return typeof v === "string" && v.length ? v : undefined;
}
function num(v) {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}
function bool(v) {
  if (v === true || v === "true" || v === "1") return true;
  return undefined;
}
export function parsePropertySearch(s) {
  return {
    q: str(s.q),
    listingType: str(s.listingType),
    propertyType: str(s.propertyType),
    city: str(s.city),
    state: str(s.state),
    area: str(s.area),
    minPrice: num(s.minPrice),
    maxPrice: num(s.maxPrice),
    bedrooms: num(s.bedrooms),
    bathrooms: num(s.bathrooms),
    amenities: str(s.amenities),
    featured: bool(s.featured),
    verified: bool(s.verified),
    availableNow: bool(s.availableNow),
    newListing: bool(s.newListing),
    sort: str(s.sort),
    page: num(s.page),
    agent: str(s.agent),
  };
}
export function toFilters(search) {
  return {
    ...search,
    amenities: search.amenities ? search.amenities.split(",").filter(Boolean) : undefined,
  };
}
