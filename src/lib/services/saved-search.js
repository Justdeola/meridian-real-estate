import { withDb } from "@/lib/db-ready";
import { createId, toBool, toIso } from "@/lib/utils";
export async function listSavedSearches(userId) {
  const sql = await withDb();
  const rows =
    await sql`select * from saved_searches where user_id = ${userId} order by created_at desc`;
  return rows.map((r) => {
    const row = r;
    let params = {};
    try {
      params = JSON.parse(String(row.params ?? "{}"));
    } catch {
      params = {};
    }
    return {
      id: String(row.id),
      name: String(row.name),
      params,
      alertsEnabled: toBool(row.alerts_enabled),
      createdAt: toIso(row.created_at) ?? "",
    };
  });
}
export async function saveSearch(userId, name, params) {
  const sql = await withDb();
  const id = createId("src");
  await sql`
    insert into saved_searches (id, user_id, name, params)
    values (${id}, ${userId}, ${name}, ${JSON.stringify(params)})`;
  return id;
}
export async function updateSavedSearch(userId, id, data) {
  const sql = await withDb();
  await sql`
    update saved_searches set
      name = coalesce(${data.name ?? null}, name),
      alerts_enabled = coalesce(${data.alertsEnabled ?? null}, alerts_enabled),
      params = coalesce(${data.params ? JSON.stringify(data.params) : null}, params)
    where id = ${id} and user_id = ${userId}`;
}
export async function deleteSavedSearch(userId, id) {
  const sql = await withDb();
  await sql`delete from saved_searches where id = ${id} and user_id = ${userId}`;
}
