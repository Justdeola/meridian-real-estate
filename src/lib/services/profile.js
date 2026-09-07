import { withDb } from "@/lib/db-ready";
import { notifyAdmins } from "@/lib/services/notification";
import { createId, slugify } from "@/lib/utils";
export async function ensureProfile(userId, fallback) {
  const sql = await withDb();
  const existing = await sql`
    select user_id, role, display_name, phone, avatar_url, agent_id, agency_id
    from profiles where user_id = ${userId}`;
  if (existing[0]) {
    const row = existing[0];
    return {
      userId: String(row.user_id),
      role: row.role,
      displayName: row.display_name == null ? null : String(row.display_name),
      phone: row.phone == null ? null : String(row.phone),
      avatarUrl: row.avatar_url == null ? null : String(row.avatar_url),
      agentId: row.agent_id == null ? null : String(row.agent_id),
      agencyId: row.agency_id == null ? null : String(row.agency_id),
      email: fallback.email ?? null,
    };
  }
  const admins = await sql`select count(*)::int as count from profiles where role = 'ADMIN'`;
  const role = (admins[0]?.count ?? 0) === 0 ? "ADMIN" : "CLIENT";
  const display = fallback.name?.trim() || fallback.email?.split("@")[0] || "Resident";
  await sql`
    insert into profiles (user_id, role, display_name, avatar_url)
    values (${userId}, ${role}, ${display}, ${fallback.image ?? null})
    on conflict (user_id) do nothing`;
  if (role === "ADMIN") {
    await notifyAdmins({
      title: "Platform administrator appointed",
      body: `${display} is the first administrator on Meridian.`,
      type: "system",
    }).catch(() => undefined);
  }
  return ensureProfile(userId, fallback);
}
export async function updateProfile(userId, data) {
  const sql = await withDb();
  await sql`
    update profiles
    set display_name = coalesce(${data.displayName ?? null}, display_name),
        phone = coalesce(${data.phone ?? null}, phone),
        avatar_url = coalesce(${data.avatarUrl ?? null}, avatar_url),
        updated_at = now()
    where user_id = ${userId}`;
  return ensureProfile(userId, {});
}
export async function becomeAgent(userId, data) {
  const sql = await withDb();
  const profile = await ensureProfile(userId, { name: data.name });
  if (profile.agentId) return profile;
  const id = createId("agt");
  let slug = slugify(data.name) || id;
  const clash = await sql`select slug from agents where slug = ${slug}`;
  if (clash[0]) slug = `${slug}-${id.slice(-4)}`;
  await sql`
    insert into agents (id, user_id, slug, name, title, bio, phone, email, is_verified)
    values (
      ${id}, ${userId}, ${slug}, ${data.name}, ${data.title ?? "Independent agent"},
      ${data.bio ?? ""}, ${data.phone ?? null}, null, false
    )`;
  await sql`
    update profiles
    set role = case when role = 'ADMIN' then role else 'AGENT' end,
        agent_id = ${id},
        phone = coalesce(${data.phone ?? null}, phone),
        updated_at = now()
    where user_id = ${userId}`;
  await notifyAdmins({
    title: "New agent registration",
    body: `${data.name} registered as an agent.`,
    type: "agent",
    link: `/agents/${slug}`,
  });
  return ensureProfile(userId, { name: data.name });
}
export async function listUsers() {
  const sql = await withDb();
  return sql`
    select user_id, role, display_name, phone, created_at::text as created_at
    from profiles
    order by created_at desc
    limit 200`;
}
export async function setUserRole(userId, role) {
  const sql = await withDb();
  await sql`update profiles set role = ${role}, updated_at = now() where user_id = ${userId}`;
}
