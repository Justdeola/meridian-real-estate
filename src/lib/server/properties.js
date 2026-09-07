import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { optionalAuthMiddleware } from "@/lib/auth/optional";
import { ensureProfile } from "@/lib/services/profile";
import {
  createProperty,
  deleteProperty,
  getFeatured,
  getNewListings,
  getPopular,
  getPropertyBySlug,
  getRelated,
  listAllPropertiesAdmin,
  listAgentProperties,
  listProperties,
  moderateProperty,
  recordView,
  updateProperty,
} from "@/lib/services/property";
const filtersSchema = z.object({
  q: z.string().optional(),
  listingType: z.string().optional(),
  propertyType: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  area: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  amenities: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
  availableNow: z.boolean().optional(),
  newListing: z.boolean().optional(),
  agent: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});
export const fetchProperties = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .validator(filtersSchema)
  .handler(async ({ context, data }) => listProperties(data, context.userId));
export const fetchHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const [featured, newest, popular] = await Promise.all([
    getFeatured(),
    getNewListings(),
    getPopular(),
  ]);
  return { featured, newest, popular };
});
export const fetchProperty = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ context, data }) => {
    const property = await getPropertyBySlug(data.slug, context.userId);
    if (!property) return { property: null, related: [] };
    const related = await getRelated(property.id, property.city, property.propertyTypeSlug);
    return { property, related };
  });
export const trackPropertyView = createServerFn({ method: "POST" })
  .middleware([optionalAuthMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    await recordView(data.id, context.userId);
    return { ok: true };
  });
const propertyInput = z.object({
  title: z.string().min(4),
  description: z.string().min(20),
  listingType: z.string(),
  propertyTypeSlug: z.string(),
  price: z.number().positive(),
  currency: z.string().optional(),
  bedrooms: z.number().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  toilets: z.number().nullable().optional(),
  parking: z.number().nullable().optional(),
  sizeSqm: z.number().nullable().optional(),
  landSizeSqm: z.number().nullable().optional(),
  yearBuilt: z.number().nullable().optional(),
  address: z.string().optional(),
  area: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  amenitySlugs: z.array(z.string()).optional(),
  images: z
    .array(z.object({ url: z.string().min(8), isPrimary: z.boolean().optional() }))
    .optional(),
  status: z.string().optional(),
});
export const saveProperty = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(propertyInput.extend({ id: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId, {});
    const actor = {
      userId: context.userId,
      role: profile.role,
      agentId: profile.agentId,
      agencyId: profile.agencyId,
    };
    const input = data;
    if (data.id) {
      await updateProperty(actor, data.id, input);
      return { id: data.id };
    }
    return createProperty(actor, input);
  });
export const removeProperty = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId, {});
    await deleteProperty(
      {
        userId: context.userId,
        role: profile.role,
        agentId: profile.agentId,
        agencyId: profile.agencyId,
      },
      data.id,
    );
    return { ok: true };
  });
export const fetchMyListings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await ensureProfile(context.userId, {});
    if (profile.role === "ADMIN") return listAllPropertiesAdmin();
    if (!profile.agentId) return [];
    return listAgentProperties(profile.agentId);
  });
export const fetchAdminProperties = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ status: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId, {});
    if (profile.role !== "ADMIN" && profile.role !== "AGENCY_ADMIN") throw new Error("Forbidden");
    return listAllPropertiesAdmin(data.status);
  });
export const moderateListing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.string(),
      action: z.enum(["approve", "reject", "feature", "unfeature"]),
      reason: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId, {});
    if (profile.role !== "ADMIN") throw new Error("Forbidden");
    await moderateProperty(context.userId, data.id, data.action, data.reason);
    return { ok: true };
  });
export const changePropertyStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string(), status: z.string() }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId, {});
    await updateProperty(
      {
        userId: context.userId,
        role: profile.role,
        agentId: profile.agentId,
        agencyId: profile.agencyId,
      },
      data.id,
      { status: data.status },
    );
    return { ok: true };
  });
