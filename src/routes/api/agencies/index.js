import { createFileRoute } from "@tanstack/react-router";
import { listAgencies } from "@/lib/services/agent";
export const Route = createFileRoute("/api/agencies/")({
  server: {
    handlers: {
      GET: async () => Response.json(await listAgencies()),
    },
  },
});
