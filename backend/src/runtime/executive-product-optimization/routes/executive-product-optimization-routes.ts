import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildExecutiveProductOptimization } from "../services/executive-product-optimization-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerExecutiveProductOptimizationRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/executive-product-optimization/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    const dashboard = buildExecutiveProductOptimization(user.workspaceId, query.companyId);
    return reply.send({ dashboard });
  });

  app.get("/health/executive-product-optimization", async (_request, reply) => {
    const dashboard = buildExecutiveProductOptimization("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", recommendations: dashboard.recommendations.length });
  });
}
