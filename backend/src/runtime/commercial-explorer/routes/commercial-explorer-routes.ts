import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildCommercialExplorer } from "../services/commercial-explorer-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerCommercialExplorerRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/commercial-explorer/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildCommercialExplorer(user.workspaceId, query.companyId) });
  });
  app.get("/health/commercial-explorer", async (_req, reply) => {
    const d = buildCommercialExplorer("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", itemCount: d.items.length });
  });
}
