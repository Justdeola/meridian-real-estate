import { cacheGet, cacheKeys, cacheSet, invalidateCatalogCache } from "@/lib/cache";
import { CACHE_TTL, DEFAULT_NEW_LISTING_DAYS } from "@/lib/constants";
import { withDb } from "@/lib/db-ready";
import { mapAmenity, mapType } from "@/lib/services/mappers";
export async function getPropertyTypes() {
  const cached = await cacheGet(cacheKeys.types);
  if (cached) return cached;
  const sql = await withDb();
  const rows = await sql`select id, slug, name, category from property_types order by sort_order`;
  const data = rows.map((r) => mapType(r));
  await cacheSet(cacheKeys.types, data, CACHE_TTL.categories);
  return data;
}
export async function getAmenities() {
  const cached = await cacheGet(cacheKeys.amenities);
  if (cached) return cached;
  const sql = await withDb();
  const rows = await sql`select id, slug, name, icon from amenities order by sort_order`;
  const data = rows.map((r) => mapAmenity(r));
  await cacheSet(cacheKeys.amenities, data, CACHE_TTL.categories);
  return data;
}
export async function getNewListingDays() {
  const cached = await cacheGet(cacheKeys.settings);
  if (typeof cached === "number") return cached;
  const sql = await withDb();
  const rows = await sql`select value from settings where key = 'new_listing_days'`;
  const days = Number(rows[0]?.value ?? DEFAULT_NEW_LISTING_DAYS);
  await cacheSet(cacheKeys.settings, days, CACHE_TTL.categories);
  return Number.isFinite(days) ? days : DEFAULT_NEW_LISTING_DAYS;
}
export async function setNewListingDays(days) {
  const sql = await withDb();
  const value = String(Math.max(1, Math.min(90, Math.round(days))));
  await sql`
    insert into settings (key, value) values ('new_listing_days', ${value})
    on conflict (key) do update set value = excluded.value`;
  await invalidateCatalogCache();
  return Number(value);
}
