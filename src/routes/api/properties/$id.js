import { createFileRoute } from "@tanstack/react-router";
import { getPropertyBySlug } from "@/lib/services/property";
export const Route = createFileRoute("/api/properties/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const property = await getPropertyBySlug(params.id);
        if (!property) return Response.json({ error: "Not found" }, { status: 404 });
        return Response.json(property);
      },
    },
  },
});
