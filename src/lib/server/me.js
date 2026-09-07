import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { withDb } from "@/lib/db-ready";
import { getAdminStats, getAgentStats } from "@/lib/services/analytics";
import {
  listAgentAppointments,
  listMyAppointments,
  updateAppointmentStatus,
  createAppointment,
} from "@/lib/services/appointment";
import { favoriteIds, listFavorites, toggleFavorite } from "@/lib/services/favorite";
import {
  createInquiry,
  listAgentInquiries,
  listMyInquiries,
  respondToInquiry,
} from "@/lib/services/inquiry";
import {
  listNotifications,
  markAllRead,
  markNotificationRead,
  unreadCount,
} from "@/lib/services/notification";
import {
  becomeAgent,
  ensureProfile,
  listUsers,
  setUserRole,
  updateProfile,
} from "@/lib/services/profile";
import {
  deleteSavedSearch,
  listSavedSearches,
  saveSearch,
  updateSavedSearch,
} from "@/lib/services/saved-search";
import { createReview } from "@/lib/services/agent";
async function actor(userId) {
  const sql = await withDb();
  const users = await sql`
    select name, email, image from "user" where id = ${userId}`;
  const u = users[0];
  const profile = await ensureProfile(userId, {
    name: u?.name,
    email: u?.email,
    image: u?.image,
  });
  return { ...profile, email: u?.email ?? null, name: u?.name ?? profile.displayName };
}
export const fetchMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => actor(context.userId));
export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      displayName: z.string().optional(),
      phone: z.string().optional(),
      avatarUrl: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => updateProfile(context.userId, data));
export const registerAsAgent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      name: z.string().min(2),
      phone: z.string().optional(),
      bio: z.string().optional(),
      title: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => becomeAgent(context.userId, data));
export const fetchFavorites = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => listFavorites(context.userId));
export const toggleFav = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ propertyId: z.string() }))
  .handler(async ({ context, data }) => toggleFavorite(context.userId, data.propertyId));
export const fetchFavoriteIds = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => favoriteIds(context.userId));
export const sendInquiry = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      propertyId: z.string(),
      name: z.string().min(2),
      email: z.string().min(3),
      phone: z.string().optional(),
      message: z.string().min(8),
      contactMethod: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await createInquiry({ ...data, userId: context.userId });
    return { ok: true };
  });
export const fetchMyInquiries = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const me = await actor(context.userId);
    if (me.agentId && (me.role === "AGENT" || me.role === "AGENCY_ADMIN" || me.role === "ADMIN")) {
      return listAgentInquiries(me.agentId);
    }
    return listMyInquiries(context.userId);
  });
export const replyInquiry = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string(), response: z.string().min(2) }))
  .handler(async ({ context, data }) => {
    const me = await actor(context.userId);
    if (!me.agentId) throw new Error("Agents only");
    await respondToInquiry(me.agentId, data.id, data.response);
    return { ok: true };
  });
export const requestViewing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      propertyId: z.string(),
      preferredDate: z.string(),
      preferredTime: z.string(),
      message: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await createAppointment({ ...data, userId: context.userId });
    return { ok: true };
  });
export const fetchMyAppointments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const me = await actor(context.userId);
    if (me.agentId && me.role !== "CLIENT") return listAgentAppointments(me.agentId);
    return listMyAppointments(context.userId);
  });
export const mutateAppointment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.string(),
      status: z.string(),
      note: z.string().optional(),
      date: z.string().optional(),
      time: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const me = await actor(context.userId);
    await updateAppointmentStatus(
      { userId: context.userId, agentId: me.agentId, role: me.role },
      data.id,
      data.status,
      data.note,
      data.date && data.time ? { date: data.date, time: data.time } : undefined,
    );
    return { ok: true };
  });
export const fetchNotifications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const [items, unread] = await Promise.all([
      listNotifications(context.userId),
      unreadCount(context.userId),
    ]);
    return { items, unread };
  });
export const readNotification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().optional(), all: z.boolean().optional() }))
  .handler(async ({ context, data }) => {
    if (data.all) await markAllRead(context.userId);
    else if (data.id) await markNotificationRead(context.userId, data.id);
    return { ok: true };
  });
export const fetchSavedSearches = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => listSavedSearches(context.userId));
export const persistSavedSearch = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      name: z.string().min(2),
      params: z.any(),
    }),
  )
  .handler(async ({ context, data }) => {
    await saveSearch(context.userId, data.name, data.params);
    return { ok: true };
  });
export const mutateSavedSearch = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.string(),
      delete: z.boolean().optional(),
      name: z.string().optional(),
      alertsEnabled: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    if (data.delete) await deleteSavedSearch(context.userId, data.id);
    else await updateSavedSearch(context.userId, data.id, data);
    return { ok: true };
  });
export const submitReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      agentId: z.string().optional(),
      agencyId: z.string().optional(),
      rating: z.number().min(1).max(5),
      body: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await createReview({ userId: context.userId, ...data });
    return { ok: true };
  });
export const fetchDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const me = await actor(context.userId);
    if (me.role === "ADMIN") {
      return { me, admin: await getAdminStats(), agent: null };
    }
    if (me.agentId) {
      return { me, admin: null, agent: await getAgentStats(me.agentId) };
    }
    return { me, admin: null, agent: null };
  });
export const fetchAdminUsers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const me = await actor(context.userId);
    if (me.role !== "ADMIN") throw new Error("Forbidden");
    return listUsers();
  });
export const changeUserRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({ userId: z.string(), role: z.enum(["CLIENT", "AGENT", "AGENCY_ADMIN", "ADMIN"]) }),
  )
  .handler(async ({ context, data }) => {
    const me = await actor(context.userId);
    if (me.role !== "ADMIN") throw new Error("Forbidden");
    await setUserRole(data.userId, data.role);
    return { ok: true };
  });
