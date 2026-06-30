import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildLiveProductIntelligence } from "../services/live-product-intelligence-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerLiveProductIntelligenceRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/live-product-intelligence/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    const dashboard = buildLiveProductIntelligence(user.workspaceId, query.companyId);
    return reply.send({ dashboard });
  });

  app.get("/health/live-product-intelligence", async (_request, reply) => {
    const dashboard = buildLiveProductIntelligence("ws_empire_1", "co-grand-king");
    return reply.send({
      status: dashboard.architectureComplete ? "HEALTHY" : "WARNING",
      liveProducts: dashboard.liveProducts.length,
    });
  });
}
