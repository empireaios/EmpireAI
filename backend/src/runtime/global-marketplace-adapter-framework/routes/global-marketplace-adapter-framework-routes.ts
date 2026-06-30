import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildGlobalMarketplaceAdapterFramework } from "../services/global-marketplace-adapter-framework-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGlobalMarketplaceAdapterFrameworkRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/global-marketplace-adapter-framework/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildGlobalMarketplaceAdapterFramework(user.workspaceId, query.companyId) });
  });
  app.get("/health/global-marketplace-adapter-framework", async (_req, reply) => {
    const d = buildGlobalMarketplaceAdapterFramework("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", missionId: d.missionId, itemCount: d.items.length });
  });
}
