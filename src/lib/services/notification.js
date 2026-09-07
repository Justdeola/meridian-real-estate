import { withDb } from "@/lib/db-ready";
import { createId, toBool, toIso } from "@/lib/utils";
function mapNote(row) {
  return {
    id: String(row.id),
    title: String(row.title),
    body: row.body == null ? null : String(row.body),
    type: String(row.type),
    link: row.link == null ? null : String(row.link),
    isRead: toBool(row.is_read),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
  };
}
export async function createNotification(input) {
  const sql = await withDb();
  const id = createId("ntf");
  await sql`
    insert into notifications (id, user_id, title, body, type, link)
    values (${id}, ${input.userId}, ${input.title}, ${input.body ?? null}, ${input.type}, ${input.link ?? null})`;
  return id;
}
export async function listNotifications(userId) {
  const sql = await withDb();
  const rows = await sql`
    select id, title, body, type, link, is_read, created_at
    from notifications
    where user_id = ${userId}
    order by created_at desc
    limit 50`;
  return rows.map((r) => mapNote(r));
}
export async function unreadCount(userId) {
  const sql = await withDb();
  const rows = await sql`
    select count(*)::int as count from notifications where user_id = ${userId} and is_read = false`;
  return rows[0]?.count ?? 0;
}
export async function markNotificationRead(userId, id) {
  const sql = await withDb();
  await sql`update notifications set is_read = true where id = ${id} and user_id = ${userId}`;
}
export async function markAllRead(userId) {
  const sql = await withDb();
  await sql`update notifications set is_read = true where user_id = ${userId}`;
}
export async function notifyAdmins(input) {
  const sql = await withDb();
  const admins = await sql`select user_id from profiles where role = 'ADMIN'`;
  for (const admin of admins) {
    await createNotification({ ...input, userId: admin.user_id });
  }
}
export async function notifyAgentUser(agentId, input) {
  const sql = await withDb();
  const rows = await sql`select user_id from agents where id = ${agentId} and user_id is not null`;
  if (rows[0]?.user_id) {
    await createNotification({ ...input, userId: rows[0].user_id });
  }
}
