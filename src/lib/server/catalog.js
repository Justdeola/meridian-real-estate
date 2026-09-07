import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  getAmenities,
  getNewListingDays,
  getPropertyTypes,
  setNewListingDays,
} from "@/lib/services/catalog";
import { ensureProfile } from "@/lib/services/profile";
export const fetchCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const [types, amenities, newListingDays] = await Promise.all([
    getPropertyTypes(),
    getAmenities(),
    getNewListingDays(),
  ]);
  return { types, amenities, newListingDays };
});
export const updateNewListingDays = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ days: z.number() }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId, {});
    if (profile.role !== "ADMIN") throw new Error("Forbidden");
    return setNewListingDays(data.days);
  });
