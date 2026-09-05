import { createFileRoute } from "@tanstack/react-router";
import { listProperties } from "@/lib/services/property";
import { parsePropertySearch, toFilters } from "@/lib/search-params";
export const Route = createFileRoute("/api/properties/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const raw = Object.fromEntries(url.searchParams.entries());
        const data = await listProperties(toFilters(parsePropertySearch(raw)));
        return Response.json(data);
      },
    },
  },
});
