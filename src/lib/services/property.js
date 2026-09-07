import {
  cacheGet,
  cacheKeys,
  cacheSet,
  invalidatePropertiesCache,
  invalidatePropertyCache,
  normalizeCacheKey,
} from "@/lib/cache";
import { CACHE_TTL, DEFAULT_PAGE_SIZE, LIVE_STATUSES, PUBLIC_STATUSES } from "@/lib/constants";
import { withDb } from "@/lib/db-ready";
import { getNewListingDays } from "@/lib/services/catalog";
import { mapAmenity, mapAgent, mapAgency, mapImage, mapPropertyCard } from "@/lib/services/mappers";
import { notifyAdmins, notifyAgentUser } from "@/lib/services/notification";
import { createId, slugify, toIso, toNumber } from "@/lib/utils";
const CARD_SELECT = `
  p.id, p.slug, p.title, p.listing_type, p.status, p.price, p.currency,
  p.bedrooms, p.bathrooms, p.parking, p.size_sqm, p.area, p.city, p.state,
  p.is_featured, p.is_verified, p.published_at, p.created_at, p.views,
  t.name as property_type, t.slug as property_type_slug,
  ag.name as agent_name,
  (select url from property_images i where i.property_id = p.id order by i.is_primary desc, i.sort_order asc limit 1) as image,
  (select count(*)::int from favorites f where f.property_id = p.id) as favorite_count
`;
function publicStatusList() {
  return PUBLIC_STATUSES.map((s) => `'${s}'`).join(", ");
}
export async function listProperties(filters, viewerId) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(48, Math.max(1, filters.limit ?? DEFAULT_PAGE_SIZE));
  const key = cacheKeys.list(
    normalizeCacheKey({ ...filters, page, limit, viewer: viewerId ? "auth" : "anon" }),
  );
  const cached = await cacheGet(key);
  if (cached) {
    if (viewerId) await attachFavorites(cached.items, viewerId);
    return cached;
  }
  const sql = await withDb();
  const params = [];
  const where = [`p.status in (${publicStatusList()})`];
  const add = (clause, value) => {
    params.push(value);
    where.push(clause.replace("?", `$${params.length}`));
  };
  if (filters.q?.trim()) {
    const q = `%${filters.q.trim()}%`;
    params.push(q);
    const i = params.length;
    where.push(
      `(p.title ilike $${i} or p.city ilike $${i} or p.state ilike $${i} or p.area ilike $${i} or p.slug ilike $${i} or p.id ilike $${i} or ag.name ilike $${i})`,
    );
  }
  if (filters.listingType) add("p.listing_type = ?", filters.listingType);
  if (filters.propertyType) add("t.slug = ?", filters.propertyType);
  if (filters.city) add("lower(p.city) = lower(?)", filters.city);
  if (filters.state) add("lower(p.state) = lower(?)", filters.state);
  if (filters.area) add("lower(p.area) = lower(?)", filters.area);
  if (filters.minPrice != null) add("p.price >= ?", filters.minPrice);
  if (filters.maxPrice != null) add("p.price <= ?", filters.maxPrice);
  if (filters.bedrooms != null) add("coalesce(p.bedrooms,0) >= ?", filters.bedrooms);
  if (filters.bathrooms != null) add("coalesce(p.bathrooms,0) >= ?", filters.bathrooms);
  if (filters.featured) where.push("p.is_featured = true");
  if (filters.verified) where.push("p.is_verified = true");
  if (filters.availableNow) where.push(`p.status in ('PUBLISHED','AVAILABLE')`);
  if (filters.agent) {
    params.push(filters.agent, filters.agent);
    where.push(`(ag.slug = $${params.length - 1} or p.agent_id = $${params.length})`);
  }
  if (filters.newListing) {
    const days = await getNewListingDays();
    where.push(`p.published_at is not null and p.published_at >= now() - interval '${days} days'`);
  }
  if (filters.amenities?.length) {
    for (const slug of filters.amenities) {
      params.push(slug);
      where.push(
        `exists (select 1 from property_amenities pa join amenities am on am.id = pa.amenity_id where pa.property_id = p.id and am.slug = $${params.length})`,
      );
    }
  }
  const whereSql = where.join(" and ");
  const sort = sortSql(filters.sort);
  const countRows = await sql.query(
    `select count(*)::int as count
     from properties p
     join property_types t on t.id = p.property_type_id
     left join agents ag on ag.id = p.agent_id
     where ${whereSql}`,
    params,
  );
  const total = countRows[0]?.count ?? 0;
  const offset = (page - 1) * limit;
  const rows = await sql.query(
    `select ${CARD_SELECT}
     from properties p
     join property_types t on t.id = p.property_type_id
     left join agents ag on ag.id = p.agent_id
     where ${whereSql}
     ${sort}
     limit ${limit} offset ${offset}`,
    params,
  );
  const items = rows.map((r) => mapPropertyCard(r));
  if (viewerId) await attachFavorites(items, viewerId);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const payload = {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
    },
    newListingDays: await getNewListingDays(),
  };
  await cacheSet(key, payload, CACHE_TTL.listings);
  return payload;
}
function sortSql(sort) {
  switch (sort) {
    case "oldest":
      return "order by coalesce(p.published_at, p.created_at) asc";
    case "price_asc":
      return "order by p.price asc";
    case "price_desc":
      return "order by p.price desc";
    case "most_viewed":
      return "order by p.views desc";
    case "most_favorited":
      return "order by favorite_count desc";
    case "recommended":
      return "order by p.is_featured desc, p.views desc, coalesce(p.published_at, p.created_at) desc";
    default:
      return "order by coalesce(p.published_at, p.created_at) desc";
  }
}
async function attachFavorites(items, userId) {
  if (!items.length) return;
  const sql = await withDb();
  const ids = items.map((i) => i.id);
  const placeholders = ids.map((_, i) => `$${i + 2}`).join(",");
  const rows = await sql.query(
    `select property_id from favorites where user_id = $1 and property_id in (${placeholders})`,
    [userId, ...ids],
  );
  const set = new Set(rows.map((r) => r.property_id));
  for (const item of items) item.isFavorited = set.has(item.id);
}
export async function getFeatured() {
  const cached = await cacheGet(cacheKeys.featured);
  if (cached) return cached;
  const sql = await withDb();
  const rows = await sql.query(`select ${CARD_SELECT}
     from properties p
     join property_types t on t.id = p.property_type_id
     left join agents ag on ag.id = p.agent_id
     where p.is_featured = true and p.status in (${publicStatusList()})
     order by p.published_at desc nulls last
     limit 6`);
  const data = rows.map((r) => mapPropertyCard(r));
  await cacheSet(cacheKeys.featured, data, CACHE_TTL.featured);
  return data;
}
export async function getNewListings() {
  const cached = await cacheGet(cacheKeys.newListings);
  if (cached) return cached;
  const days = await getNewListingDays();
  const sql = await withDb();
  const rows = await sql.query(`select ${CARD_SELECT}
     from properties p
     join property_types t on t.id = p.property_type_id
     left join agents ag on ag.id = p.agent_id
     where p.status in (${LIVE_STATUSES.map((s) => `'${s}'`).join(",")})
       and p.published_at is not null
       and p.published_at >= now() - interval '${days} days'
     order by p.published_at desc
     limit 8`);
  const data = rows.map((r) => mapPropertyCard(r));
  await cacheSet(cacheKeys.newListings, data, CACHE_TTL.featured);
  return data;
}
export async function getPopular() {
  const cached = await cacheGet(cacheKeys.popular);
  if (cached) return cached;
  const sql = await withDb();
  const rows = await sql.query(`select ${CARD_SELECT}
     from properties p
     join property_types t on t.id = p.property_type_id
     left join agents ag on ag.id = p.agent_id
     where p.status in (${LIVE_STATUSES.map((s) => `'${s}'`).join(",")})
     order by p.views desc
     limit 4`);
  const data = rows.map((r) => mapPropertyCard(r));
  await cacheSet(cacheKeys.popular, data, CACHE_TTL.popular);
  return data;
}
export async function getPropertyBySlug(slug, viewerId) {
  const cacheKey = cacheKeys.property(slug);
  const cached = await cacheGet(cacheKey);
  if (cached) {
    if (viewerId) await attachFavorites([cached], viewerId);
    return cached;
  }
  const sql = await withDb();
  const rows = await sql.query(
    `select p.*, t.name as property_type, t.slug as property_type_slug,
            ag.name as agent_name,
            (select url from property_images i where i.property_id = p.id order by i.is_primary desc, i.sort_order asc limit 1) as image,
            (select count(*)::int from favorites f where f.property_id = p.id) as favorite_count
     from properties p
     join property_types t on t.id = p.property_type_id
     left join agents ag on ag.id = p.agent_id
     where p.slug = $1 or p.id = $1`,
    [slug],
  );
  const row = rows[0];
  if (!row) return null;
  const id = String(row.id);
  const images =
    await sql`select id, url, alt, sort_order, is_primary from property_images where property_id = ${id} order by is_primary desc, sort_order`;
  const amenities = await sql`
    select a.id, a.slug, a.name, a.icon
    from amenities a
    join property_amenities pa on pa.amenity_id = a.id
    where pa.property_id = ${id}
    order by a.sort_order`;
  let agent = null;
  if (row.agent_id) {
    const agents = await sql.query(
      `select a.*, ag.name as agency_name, ag.slug as agency_slug,
              (select count(*)::int from properties p2 where p2.agent_id = a.id and p2.status in (${publicStatusList()})) as listing_count,
              (select avg(rating)::float from reviews r where r.agent_id = a.id) as rating,
              (select count(*)::int from reviews r where r.agent_id = a.id) as review_count
       from agents a
       left join agencies ag on ag.id = a.agency_id
       where a.id = $1`,
      [row.agent_id],
    );
    if (agents[0]) agent = mapAgent(agents[0]);
  }
  let agency = null;
  if (row.agency_id) {
    const agencies = await sql.query(
      `select g.*,
              (select count(*)::int from agents a where a.agency_id = g.id) as agent_count,
              (select count(*)::int from properties p2 where p2.agency_id = g.id and p2.status in (${publicStatusList()})) as listing_count,
              (select avg(rating)::float from reviews r where r.agency_id = g.id) as rating,
              (select count(*)::int from reviews r where r.agency_id = g.id) as review_count
       from agencies g where g.id = $1`,
      [row.agency_id],
    );
    if (agencies[0]) agency = mapAgency(agencies[0]);
  }
  const card = mapPropertyCard(row);
  const detail = {
    ...card,
    description: String(row.description ?? ""),
    toilets: row.toilets == null ? null : toNumber(row.toilets),
    landSizeSqm: row.land_size_sqm == null ? null : toNumber(row.land_size_sqm),
    yearBuilt: row.year_built == null ? null : toNumber(row.year_built),
    address: row.address == null ? null : String(row.address),
    country: String(row.country ?? "Nigeria"),
    lat: row.lat == null ? null : toNumber(row.lat),
    lng: row.lng == null ? null : toNumber(row.lng),
    availableFrom: toIso(row.available_from)?.slice(0, 10) ?? null,
    images: images.map((i) => mapImage(i)),
    amenities: amenities.map((a) => mapAmenity(a)),
    agent,
    agency,
  };
  await cacheSet(cacheKey, detail, CACHE_TTL.details);
  await cacheSet(cacheKeys.property(id), detail, CACHE_TTL.details);
  if (viewerId) await attachFavorites([detail], viewerId);
  return detail;
}
export async function getRelated(propertyId, city, typeSlug, limit = 3) {
  const sql = await withDb();
  const rows = await sql.query(
    `select ${CARD_SELECT}
     from properties p
     join property_types t on t.id = p.property_type_id
     left join agents ag on ag.id = p.agent_id
     where p.id <> $1 and p.status in (${LIVE_STATUSES.map((s) => `'${s}'`).join(",")})
       and (lower(p.city) = lower($2) or t.slug = $3)
     order by p.is_featured desc, p.views desc
     limit $4`,
    [propertyId, city ?? "", typeSlug, limit],
  );
  return rows.map((r) => mapPropertyCard(r));
}
export async function recordView(propertyId, userId) {
  const sql = await withDb();
  await sql`update properties set views = views + 1 where id = ${propertyId}`;
  await sql`insert into property_views (property_id, user_id) values (${propertyId}, ${userId ?? null})`;
}
async function resolveTypeId(slug) {
  const sql = await withDb();
  const rows = await sql`select id from property_types where slug = ${slug}`;
  if (!rows[0]) throw new Error("Unknown property type");
  return rows[0].id;
}
export async function createProperty(actor, input) {
  if (actor.role === "CLIENT") throw new Error("Agents only");
  const sql = await withDb();
  const id = createId("prop");
  let slug = slugify(input.title) || id;
  const clash = await sql`select slug from properties where slug = ${slug}`;
  if (clash[0]) slug = `${slug}-${id.slice(-4)}`;
  const typeId = await resolveTypeId(input.propertyTypeSlug);
  const status = input.status === "DRAFT" ? "DRAFT" : "PENDING_REVIEW";
  const agentId = actor.agentId;
  const agencyId = actor.agencyId;
  await sql`
    insert into properties (
      id, slug, title, description, listing_type, property_type_id, status, price, currency,
      bedrooms, bathrooms, toilets, parking, size_sqm, land_size_sqm, year_built,
      address, area, city, state, agent_id, agency_id
    ) values (
      ${id}, ${slug}, ${input.title}, ${input.description}, ${input.listingType}, ${typeId}, ${status},
      ${input.price}, ${input.currency ?? "NGN"}, ${input.bedrooms ?? null}, ${input.bathrooms ?? null},
      ${input.toilets ?? null}, ${input.parking ?? null}, ${input.sizeSqm ?? null}, ${input.landSizeSqm ?? null},
      ${input.yearBuilt ?? null}, ${input.address ?? null}, ${input.area ?? null}, ${input.city ?? null},
      ${input.state ?? null}, ${agentId}, ${agencyId}
    )`;
  await sql`
    insert into property_status_history (property_id, from_status, to_status, changed_by)
    values (${id}, null, ${status}, ${actor.userId})`;
  await saveImages(id, input.images ?? []);
  await saveAmenities(id, input.amenitySlugs ?? []);
  await invalidatePropertiesCache();
  if (status === "PENDING_REVIEW") {
    await notifyAdmins({
      title: "Property awaiting approval",
      body: input.title,
      type: "moderation",
      link: `/dashboard/admin?tab=properties`,
    });
  }
  return { id, slug };
}
export async function updateProperty(actor, propertyId, input) {
  const sql = await withDb();
  const rows = await sql`select * from properties where id = ${propertyId}`;
  const existing = rows[0];
  if (!existing) throw new Error("Property not found");
  assertCanEdit(actor, existing);
  const typeId = input.propertyTypeSlug
    ? await resolveTypeId(input.propertyTypeSlug)
    : toNumber(existing.property_type_id);
  const nextStatus = input.status ?? String(existing.status);
  await sql`
    update properties set
      title = coalesce(${input.title ?? null}, title),
      description = coalesce(${input.description ?? null}, description),
      listing_type = coalesce(${input.listingType ?? null}, listing_type),
      property_type_id = ${typeId},
      status = ${nextStatus},
      price = coalesce(${input.price ?? null}, price),
      currency = coalesce(${input.currency ?? null}, currency),
      bedrooms = coalesce(${input.bedrooms ?? null}, bedrooms),
      bathrooms = coalesce(${input.bathrooms ?? null}, bathrooms),
      toilets = coalesce(${input.toilets ?? null}, toilets),
      parking = coalesce(${input.parking ?? null}, parking),
      size_sqm = coalesce(${input.sizeSqm ?? null}, size_sqm),
      land_size_sqm = coalesce(${input.landSizeSqm ?? null}, land_size_sqm),
      year_built = coalesce(${input.yearBuilt ?? null}, year_built),
      address = coalesce(${input.address ?? null}, address),
      area = coalesce(${input.area ?? null}, area),
      city = coalesce(${input.city ?? null}, city),
      state = coalesce(${input.state ?? null}, state),
      lat = coalesce(${input.lat ?? null}, lat),
      lng = coalesce(${input.lng ?? null}, lng),
      is_featured = coalesce(${input.isFeatured ?? null}, is_featured),
      is_verified = coalesce(${input.isVerified ?? null}, is_verified),
      rejection_reason = coalesce(${input.rejectionReason ?? null}, rejection_reason),
      published_at = case
        when ${nextStatus} in ('PUBLISHED','AVAILABLE','UNDER_OFFER') and published_at is null then now()
        else published_at
      end,
      updated_at = now()
    where id = ${propertyId}`;
  if (nextStatus !== String(existing.status)) {
    await sql`
      insert into property_status_history (property_id, from_status, to_status, changed_by, note)
      values (${propertyId}, ${String(existing.status)}, ${nextStatus}, ${actor.userId}, ${input.rejectionReason ?? null})`;
    if (
      existing.agent_id &&
      (nextStatus === "AVAILABLE" || nextStatus === "REJECTED" || nextStatus === "PUBLISHED")
    ) {
      await notifyAgentUser(String(existing.agent_id), {
        title: nextStatus === "REJECTED" ? "Listing was not approved" : "Listing published",
        body: String(existing.title),
        type: "listing",
        link: `/properties/${String(existing.slug)}`,
      });
    }
  }
  if (input.images) await saveImages(propertyId, input.images, true);
  if (input.amenitySlugs) await saveAmenities(propertyId, input.amenitySlugs, true);
  await invalidatePropertyCache(propertyId, String(existing.slug));
  return getPropertyBySlug(String(existing.slug));
}
export async function deleteProperty(actor, propertyId) {
  const sql = await withDb();
  const rows = await sql`select * from properties where id = ${propertyId}`;
  if (!rows[0]) throw new Error("Property not found");
  assertCanEdit(actor, rows[0]);
  await sql`delete from properties where id = ${propertyId}`;
  await invalidatePropertyCache(propertyId, String(rows[0].slug));
}
function assertCanEdit(actor, property) {
  if (actor.role === "ADMIN") return;
  if (actor.role === "AGENCY_ADMIN" && actor.agencyId && property.agency_id === actor.agencyId)
    return;
  if (actor.agentId && property.agent_id === actor.agentId) return;
  throw new Error("Forbidden");
}
async function saveImages(propertyId, images, replace = false) {
  const sql = await withDb();
  if (replace) await sql`delete from property_images where property_id = ${propertyId}`;
  for (let i = 0; i < images.length; i += 1) {
    const img = images[i];
    if (!img?.url) continue;
    await sql`
      insert into property_images (property_id, url, sort_order, is_primary)
      values (${propertyId}, ${img.url}, ${i}, ${img.isPrimary ?? i === 0})`;
  }
}
async function saveAmenities(propertyId, slugs, replace = false) {
  const sql = await withDb();
  if (replace) await sql`delete from property_amenities where property_id = ${propertyId}`;
  for (const slug of slugs) {
    const rows = await sql`select id from amenities where slug = ${slug}`;
    if (rows[0]) {
      await sql`
        insert into property_amenities (property_id, amenity_id)
        values (${propertyId}, ${rows[0].id})
        on conflict do nothing`;
    }
  }
}
export async function listAgentProperties(agentId) {
  const sql = await withDb();
  const rows = await sql.query(
    `select ${CARD_SELECT}
     from properties p
     join property_types t on t.id = p.property_type_id
     left join agents ag on ag.id = p.agent_id
     where p.agent_id = $1
     order by p.updated_at desc`,
    [agentId],
  );
  return rows.map((r) => mapPropertyCard(r));
}
export async function listAllPropertiesAdmin(status) {
  const sql = await withDb();
  const rows = status
    ? await sql.query(
        `select ${CARD_SELECT}
         from properties p
         join property_types t on t.id = p.property_type_id
         left join agents ag on ag.id = p.agent_id
         where p.status = $1
         order by p.updated_at desc
         limit 200`,
        [status],
      )
    : await sql.query(`select ${CARD_SELECT}
         from properties p
         join property_types t on t.id = p.property_type_id
         left join agents ag on ag.id = p.agent_id
         order by p.updated_at desc
         limit 200`);
  return rows.map((r) => mapPropertyCard(r));
}
export async function moderateProperty(adminId, propertyId, action, reason) {
  const actor = { userId: adminId, role: "ADMIN", agentId: null, agencyId: null };
  if (action === "approve") {
    return updateProperty(actor, propertyId, {
      status: "AVAILABLE",
      isVerified: true,
    });
  }
  if (action === "reject") {
    return updateProperty(actor, propertyId, {
      status: "REJECTED",
      rejectionReason: reason ?? "Does not meet listing standards",
    });
  }
  if (action === "feature") {
    return updateProperty(actor, propertyId, { isFeatured: true });
  }
  return updateProperty(actor, propertyId, { isFeatured: false });
}
