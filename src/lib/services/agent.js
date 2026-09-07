import { cacheGet, cacheKeys, cacheSet } from "@/lib/cache";
import { CACHE_TTL, PUBLIC_STATUSES } from "@/lib/constants";
import { withDb } from "@/lib/db-ready";
import { mapAgency, mapAgent } from "@/lib/services/mappers";
import { toIso, toNumber } from "@/lib/utils";
const publicIn = PUBLIC_STATUSES.map((s) => `'${s}'`).join(",");
const AGENT_SELECT = `
  a.id, a.slug, a.name, a.title, a.bio, a.image_url, a.email, a.phone,
  a.years_experience, a.is_verified, a.specializations,
  ag.name as agency_name, ag.slug as agency_slug,
  (select count(*)::int from properties p where p.agent_id = a.id and p.status in (${publicIn})) as listing_count,
  (select avg(rating)::float from reviews r where r.agent_id = a.id) as rating,
  (select count(*)::int from reviews r where r.agent_id = a.id) as review_count
`;
export async function listAgents() {
  const cached = await cacheGet(cacheKeys.agents);
  if (cached) return cached;
  const sql = await withDb();
  const rows = await sql.query(`select ${AGENT_SELECT}
     from agents a
     left join agencies ag on ag.id = a.agency_id
     order by a.is_verified desc, listing_count desc`);
  const data = rows.map((r) => mapAgent(r));
  await cacheSet(cacheKeys.agents, data, CACHE_TTL.agents);
  return data;
}
export async function getAgentBySlug(slug) {
  const cached = await cacheGet(cacheKeys.agent(slug));
  if (cached) return cached;
  const sql = await withDb();
  const rows = await sql.query(
    `select ${AGENT_SELECT}
     from agents a
     left join agencies ag on ag.id = a.agency_id
     where a.slug = $1 or a.id = $1`,
    [slug],
  );
  if (!rows[0]) return null;
  const data = mapAgent(rows[0]);
  await cacheSet(cacheKeys.agent(slug), data, CACHE_TTL.agents);
  return data;
}
const AGENCY_SELECT = `
  g.id, g.slug, g.name, g.description, g.logo_url, g.cover_url, g.email, g.phone,
  g.website, g.address, g.city, g.state, g.is_verified,
  (select count(*)::int from agents a where a.agency_id = g.id) as agent_count,
  (select count(*)::int from properties p where p.agency_id = g.id and p.status in (${publicIn})) as listing_count,
  (select avg(rating)::float from reviews r where r.agency_id = g.id) as rating,
  (select count(*)::int from reviews r where r.agency_id = g.id) as review_count
`;
export async function listAgencies() {
  const cached = await cacheGet(cacheKeys.agencies);
  if (cached) return cached;
  const sql = await withDb();
  const rows = await sql.query(
    `select ${AGENCY_SELECT} from agencies g order by g.is_verified desc, g.name`,
  );
  const data = rows.map((r) => mapAgency(r));
  await cacheSet(cacheKeys.agencies, data, CACHE_TTL.agencies);
  return data;
}
export async function getAgencyBySlug(slug) {
  const cached = await cacheGet(cacheKeys.agency(slug));
  if (cached) return cached;
  const sql = await withDb();
  const rows = await sql.query(
    `select ${AGENCY_SELECT} from agencies g where g.slug = $1 or g.id = $1`,
    [slug],
  );
  if (!rows[0]) return null;
  const agency = mapAgency(rows[0]);
  const agents = await sql.query(
    `select ${AGENT_SELECT} from agents a left join agencies ag on ag.id = a.agency_id where a.agency_id = $1`,
    [agency.id],
  );
  const data = { ...agency, agents: agents.map((r) => mapAgent(r)) };
  await cacheSet(cacheKeys.agency(slug), data, CACHE_TTL.agencies);
  return data;
}
export async function listReviews(opts) {
  const sql = await withDb();
  const rows = opts.agentId
    ? await sql`
        select r.id, r.user_id, r.rating, r.body, r.created_at, p.display_name as author_name
        from reviews r
        left join profiles p on p.user_id = r.user_id
        where r.agent_id = ${opts.agentId}
        order by r.created_at desc`
    : await sql`
        select r.id, r.user_id, r.rating, r.body, r.created_at, p.display_name as author_name
        from reviews r
        left join profiles p on p.user_id = r.user_id
        where r.agency_id = ${opts.agencyId ?? ""}
        order by r.created_at desc`;
  return rows.map((r) => ({
    id: String(r.id),
    userId: String(r.user_id),
    authorName: r.author_name ?? "Resident",
    rating: toNumber(r.rating),
    body: r.body ?? null,
    createdAt: toIso(r.created_at) ?? "",
  }));
}
export async function createReview(input) {
  if (!input.agentId && !input.agencyId) throw new Error("Choose an agent or agency");
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const sql = await withDb();
  const { createId } = await import("@/lib/utils");
  const id = createId("rev");
  try {
    await sql`
      insert into reviews (id, user_id, agent_id, agency_id, rating, body)
      values (${id}, ${input.userId}, ${input.agentId ?? null}, ${input.agencyId ?? null}, ${rating}, ${input.body ?? null})`;
  } catch {
    throw new Error("You have already reviewed this profile");
  }
  const { invalidateAgentsCache, invalidateAgenciesCache } = await import("@/lib/cache");
  await invalidateAgentsCache();
  await invalidateAgenciesCache();
  return id;
}
