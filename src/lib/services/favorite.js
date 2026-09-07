import { withDb } from "@/lib/db-ready";
import { mapPropertyCard } from "@/lib/services/mappers";
import { PUBLIC_STATUSES } from "@/lib/constants";
const publicIn = PUBLIC_STATUSES.map((s) => `'${s}'`).join(",");
export async function listFavorites(userId) {
  const sql = await withDb();
  const rows = await sql.query(
    `select p.id, p.slug, p.title, p.listing_type, p.status, p.price, p.currency,
            p.bedrooms, p.bathrooms, p.parking, p.size_sqm, p.area, p.city, p.state,
            p.is_featured, p.is_verified, p.published_at, p.created_at, p.views,
            t.name as property_type, t.slug as property_type_slug, ag.name as agent_name,
            (select url from property_images i where i.property_id = p.id order by i.is_primary desc, i.sort_order limit 1) as image,
            (select count(*)::int from favorites f2 where f2.property_id = p.id) as favorite_count
     from favorites f
     join properties p on p.id = f.property_id
     join property_types t on t.id = p.property_type_id
     left join agents ag on ag.id = p.agent_id
     where f.user_id = $1 and p.status in (${publicIn})
     order by f.created_at desc`,
    [userId],
  );
  return rows.map((r) => ({ ...mapPropertyCard(r), isFavorited: true }));
}
export async function toggleFavorite(userId, propertyId) {
  const sql = await withDb();
  const existing = await sql`
    select 1 from favorites where user_id = ${userId} and property_id = ${propertyId}`;
  if (existing[0]) {
    await sql`delete from favorites where user_id = ${userId} and property_id = ${propertyId}`;
    return { favorited: false };
  }
  await sql`insert into favorites (user_id, property_id) values (${userId}, ${propertyId})`;
  return { favorited: true };
}
export async function favoriteIds(userId) {
  const sql = await withDb();
  const rows = await sql`select property_id from favorites where user_id = ${userId}`;
  return rows.map((r) => r.property_id);
}
