import { withDb } from "@/lib/db-ready";
import { createNotification, notifyAgentUser } from "@/lib/services/notification";
import { createId, toIso } from "@/lib/utils";
function mapAppt(row) {
  return {
    id: String(row.id),
    propertyId: String(row.property_id),
    propertyTitle: String(row.property_title ?? ""),
    agentId: row.agent_id == null ? null : String(row.agent_id),
    preferredDate: String(row.preferred_date).slice(0, 10),
    preferredTime: String(row.preferred_time),
    scheduledAt: toIso(row.scheduled_at),
    message: row.message == null ? null : String(row.message),
    status: String(row.status),
    agentNote: row.agent_note == null ? null : String(row.agent_note),
    createdAt: toIso(row.created_at) ?? "",
  };
}
export async function createAppointment(input) {
  const date = new Date(`${input.preferredDate}T${normalizeTime(input.preferredTime)}`);
  if (Number.isNaN(date.getTime())) throw new Error("Choose a valid date and time");
  if (date.getTime() < Date.now() - 60_000) throw new Error("Viewings cannot be in the past");
  const hour = date.getHours();
  if (hour < 8 || hour > 18) throw new Error("Viewings are available between 8:00 and 18:00");
  const sql = await withDb();
  const props = await sql`
    select id, title, slug, agent_id, status from properties where id = ${input.propertyId}`;
  const property = props[0];
  if (!property) throw new Error("Property not found");
  if (
    ["SOLD", "RENTED", "ARCHIVED", "UNAVAILABLE", "DRAFT", "REJECTED"].includes(
      String(property.status),
    )
  ) {
    throw new Error("This property cannot be viewed");
  }
  const clash = await sql`
    select 1 from appointments
    where property_id = ${input.propertyId}
      and preferred_date = ${input.preferredDate}
      and preferred_time = ${input.preferredTime}
      and status in ('PENDING','CONFIRMED','RESCHEDULED')`;
  if (clash[0]) throw new Error("That slot is already requested. Please choose another time.");
  const id = createId("apt");
  const agentId = property.agent_id == null ? null : String(property.agent_id);
  await sql`
    insert into appointments (id, user_id, property_id, agent_id, preferred_date, preferred_time, message)
    values (
      ${id}, ${input.userId}, ${input.propertyId}, ${agentId},
      ${input.preferredDate}, ${input.preferredTime}, ${input.message ?? null}
    )`;
  if (agentId) {
    await notifyAgentUser(agentId, {
      title: "New viewing request",
      body: `${String(property.title)} · ${input.preferredDate} ${input.preferredTime}`,
      type: "appointment",
      link: "/dashboard/agent",
    });
  }
  return id;
}
function normalizeTime(t) {
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  return t;
}
export async function listMyAppointments(userId) {
  const sql = await withDb();
  const rows = await sql`
    select a.*, p.title as property_title
    from appointments a
    join properties p on p.id = a.property_id
    where a.user_id = ${userId}
    order by a.preferred_date desc, a.created_at desc`;
  return rows.map((r) => mapAppt(r));
}
export async function listAgentAppointments(agentId) {
  const sql = await withDb();
  const rows = await sql`
    select a.*, p.title as property_title
    from appointments a
    join properties p on p.id = a.property_id
    where a.agent_id = ${agentId}
    order by a.preferred_date asc, a.preferred_time asc`;
  return rows.map((r) => mapAppt(r));
}
export async function updateAppointmentStatus(actor, appointmentId, status, note, reschedule) {
  const allowed = ["PENDING", "CONFIRMED", "RESCHEDULED", "COMPLETED", "CANCELLED", "REJECTED"];
  if (!allowed.includes(status)) throw new Error("Invalid status");
  const sql = await withDb();
  const rows = await sql`select * from appointments where id = ${appointmentId}`;
  const appt = rows[0];
  if (!appt) throw new Error("Appointment not found");
  const isOwner = appt.user_id === actor.userId;
  const isAgent = actor.agentId && appt.agent_id === actor.agentId;
  const isAdmin = actor.role === "ADMIN";
  if (!isOwner && !isAgent && !isAdmin) throw new Error("Forbidden");
  if (isOwner && !["CANCELLED"].includes(status) && !isAdmin)
    throw new Error("Clients may only cancel");
  const scheduled =
    reschedule && status === "RESCHEDULED"
      ? `${reschedule.date}T${normalizeTime(reschedule.time)}`
      : appt.scheduled_at;
  await sql`
    update appointments set
      status = ${status},
      agent_note = coalesce(${note ?? null}, agent_note),
      preferred_date = coalesce(${reschedule?.date ?? null}, preferred_date),
      preferred_time = coalesce(${reschedule?.time ?? null}, preferred_time),
      scheduled_at = coalesce(${scheduled ?? null}, scheduled_at)
    where id = ${appointmentId}`;
  if (appt.user_id) {
    const titles = {
      CONFIRMED: "Viewing confirmed",
      RESCHEDULED: "Viewing rescheduled",
      CANCELLED: "Viewing cancelled",
      REJECTED: "Viewing declined",
      COMPLETED: "Viewing completed",
    };
    if (titles[status]) {
      await createNotification({
        userId: String(appt.user_id),
        title: titles[status],
        body: note,
        type: "appointment",
        link: "/dashboard/client",
      });
    }
  }
}
