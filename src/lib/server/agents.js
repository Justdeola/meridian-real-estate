import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getAgencyBySlug,
  getAgentBySlug,
  listAgencies,
  listAgents,
  listReviews,
} from "@/lib/services/agent";
import { listProperties } from "@/lib/services/property";
export const fetchAgents = createServerFn({ method: "GET" }).handler(async () => listAgents());
export const fetchAgencies = createServerFn({ method: "GET" }).handler(async () => listAgencies());
export const fetchAgentPage = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const agent = await getAgentBySlug(data.slug);
    if (!agent) return { agent: null, listings: { items: [], meta: null }, reviews: [] };
    const [listings, reviews] = await Promise.all([
      listProperties({ agent: agent.id, limit: 24 }),
      listReviews({ agentId: agent.id }),
    ]);
    return { agent, listings, reviews };
  });
export const fetchAgencyPage = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const agency = await getAgencyBySlug(data.slug);
    if (!agency) return { agency: null, listings: { items: [], meta: null }, reviews: [] };
    const sqlListings = await listProperties({ limit: 24, q: agency.city ?? undefined });
    const listings = {
      ...sqlListings,
      items: sqlListings.items.filter(
        (p) => p.agentName && agency.agents.some((a) => a.name === p.agentName),
      ),
    };
    const reviews = await listReviews({ agencyId: agency.id });
    return { agency, listings, reviews };
  });
