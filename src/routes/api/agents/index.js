import { createFileRoute } from "@tanstack/react-router";
import { listAgents } from "@/lib/services/agent";
export const Route = createFileRoute("/api/agents/")({
  server: {
    handlers: {
      GET: async () => Response.json(await listAgents()),
    },
  },
});
