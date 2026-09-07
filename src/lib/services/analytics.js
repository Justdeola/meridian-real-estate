import { withDb } from "@/lib/db-ready";
import { mapPropertyCard } from "@/lib/services/mappers";
export async function getAdminStats() {
  const sql = await withDb();
  const count = async (table, where = "") => {
    const rows = await sql.query(`select count(*)::int as count from ${table} ${where}`);
    return rows[0]?.count ?? 0;
  };
  const [
    properties,
    published,
    pending,
    sold,
    rented,
    users,
    agents,
    agencies,
    inquiries,
    appointments,
  ] = await Promise.all([
    count("properties"),
    count("properties", "where status in ('PUBLISHED','AVAILABLE','UNDER_OFFER')"),
    count("properties", "where status = 'PENDING_REVIEW'"),
    count("properties", "where status = 'SOLD'"),
    count("properties", "where status = 'RENTED'"),
    count("profiles"),
    count("agents"),
    count("agencies"),
    count("inquiries"),
    count("appointments"),
  ]);
  const recentListings =
    await sql.query(`select p.id, p.slug, p.title, p.listing_type, p.status, p.price, p.currency,
            p.bedrooms, p.bathrooms, p.parking, p.size_sqm, p.area, p.city, p.state,
            p.is_featured, p.is_verified, p.published_at, p.created_at, p.views,
            t.name as property_type, t.slug as property_type_slug, ag.name as agent_name,
            (select url from property_images i where i.property_id = p.id order by i.is_primary desc, i.sort_order limit 1) as image,
            (select count(*)::int from favorites f where f.property_id = p.id) as favorite_count
     from properties p
     join property_types t on t.id = p.property_type_id
     left join agents ag on ag.id = p.agent_id
     order by p.created_at desc
     limit 6`);
  const popular =
    await sql.query(`select p.id, p.slug, p.title, p.listing_type, p.status, p.price, p.currency,
            p.bedrooms, p.bathrooms, p.parking, p.size_sqm, p.area, p.city, p.state,
            p.is_featured, p.is_verified, p.published_at, p.created_at, p.views,
            t.name as property_type, t.slug as property_type_slug, ag.name as agent_name,
            (select url from property_images i where i.property_id = p.id order by i.is_primary desc, i.sort_order limit 1) as image,
            (select count(*)::int from favorites f where f.property_id = p.id) as favorite_count
     from properties p
     join property_types t on t.id = p.property_type_id
     left join agents ag on ag.id = p.agent_id
     order by p.views desc
     limit 5`);
  const listingByType = await sql.query(`select t.name, count(*)::int as count
     from properties p join property_types t on t.id = p.property_type_id
     group by t.name order by count desc`);
  return {
    totals: {
      properties,
      published,
      pending,
      sold,
      rented,
      users,
      agents,
      agencies,
      inquiries,
      appointments,
    },
    recentListings: recentListings.map((r) => mapPropertyCard(r)),
    popular: popular.map((r) => mapPropertyCard(r)),
    listingByType,
  };
}
export async function getAgentStats(agentId) {
  const sql = await withDb();
  const rows = await sql.query(
    `select
       (select count(*)::int from properties where agent_id = $1) as total,
       (select count(*)::int from properties where agent_id = $1 and status in ('PUBLISHED','AVAILABLE','UNDER_OFFER')) as active,
       (select count(*)::int from properties where agent_id = $1 and status = 'SOLD') as sold,
       (select count(*)::int from properties where agent_id = $1 and status = 'RENTED') as rented,
       (select count(*)::int from inquiries where agent_id = $1) as inquiries,
       (select count(*)::int from appointments where agent_id = $1 and status in ('PENDING','CONFIRMED','RESCHEDULED')) as pending_appts,
       (select coalesce(sum(views),0)::int from properties where agent_id = $1) as views,
       (select count(*)::int from favorites f join properties p on p.id = f.property_id where p.agent_id = $1) as favorites`,
    [agentId],
  );
  return (
    rows[0] ?? {
      total: 0,
      active: 0,
      sold: 0,
      rented: 0,
      inquiries: 0,
      pending_appts: 0,
      views: 0,
      favorites: 0,
    }
  );
}
