import { withDb } from "@/lib/db-ready";
import { createNotification, notifyAgentUser } from "@/lib/services/notification";
import { createId, toIso } from "@/lib/utils";
function mapInquiry(row) {
  return {
    id: String(row.id),
    propertyId: String(row.property_id),
    propertyTitle: String(row.property_title ?? ""),
    agentId: row.agent_id == null ? null : String(row.agent_id),
    name: String(row.name),
    email: String(row.email),
    phone: row.phone == null ? null : String(row.phone),
    message: String(row.message),
    contactMethod: String(row.contact_method),
    status: String(row.status),
    agentResponse: row.agent_response == null ? null : String(row.agent_response),
    createdAt: toIso(row.created_at) ?? "",
  };
}
export async function createInquiry(input) {
  const sql = await withDb();
  const props = await sql`
    select id, title, slug, agent_id, status from properties where id = ${input.propertyId}`;
  const property = props[0];
  if (!property) throw new Error("Property not found");
  const status = String(property.status);
  if (["SOLD", "RENTED", "ARCHIVED", "UNAVAILABLE"].includes(status)) {
    throw new Error("This property is no longer available");
  }
  const id = createId("inq");
  const agentId = property.agent_id == null ? null : String(property.agent_id);
  await sql`
    insert into inquiries (id, user_id, property_id, agent_id, name, email, phone, message, contact_method)
    values (
      ${id}, ${input.userId}, ${input.propertyId}, ${agentId},
      ${input.name}, ${input.email}, ${input.phone ?? null}, ${input.message},
      ${input.contactMethod ?? "EMAIL"}
    )`;
  if (agentId) {
    await notifyAgentUser(agentId, {
      title: "New property enquiry",
      body: `${input.name} asked about ${String(property.title)}`,
      type: "inquiry",
      link: "/dashboard/agent",
    });
  }
  return id;
}
export async function listMyInquiries(userId) {
  const sql = await withDb();
  const rows = await sql`
    select i.*, p.title as property_title
    from inquiries i
    join properties p on p.id = i.property_id
    where i.user_id = ${userId}
    order by i.created_at desc`;
  return rows.map((r) => mapInquiry(r));
}
export async function listAgentInquiries(agentId) {
  const sql = await withDb();
  const rows = await sql`
    select i.*, p.title as property_title
    from inquiries i
    join properties p on p.id = i.property_id
    where i.agent_id = ${agentId}
    order by i.created_at desc`;
  return rows.map((r) => mapInquiry(r));
}
export async function respondToInquiry(agentId, inquiryId, response) {
  const sql = await withDb();
  const rows = await sql`
    select * from inquiries where id = ${inquiryId} and agent_id = ${agentId}`;
  if (!rows[0]) throw new Error("Enquiry not found");
  await sql`
    update inquiries set status = 'RESPONDED', agent_response = ${response}
    where id = ${inquiryId}`;
  if (rows[0].user_id) {
    await createNotification({
      userId: String(rows[0].user_id),
      title: "Your enquiry received a reply",
      body: response.slice(0, 180),
      type: "inquiry",
      link: "/dashboard/client",
    });
  }
}
