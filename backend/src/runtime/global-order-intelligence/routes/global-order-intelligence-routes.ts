import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildGlobalOrderIntelligence } from "../services/global-order-intelligence-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGlobalOrderIntelligenceRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/global-order-intelligence/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildGlobalOrderIntelligence(user.workspaceId, query.companyId) });
  });
  app.get("/health/global-order-intelligence", async (_req, reply) => {
    const d = buildGlobalOrderIntelligence("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", totalOrders: d.summary.totalOrders });
  });
}
