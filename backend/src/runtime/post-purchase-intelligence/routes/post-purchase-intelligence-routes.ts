import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildPostPurchaseIntelligence } from "../services/post-purchase-intelligence-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerPostPurchaseIntelligenceRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/post-purchase-intelligence/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildPostPurchaseIntelligence(user.workspaceId, query.companyId) });
  });
  app.get("/health/post-purchase-intelligence", async (_req, reply) => {
    const d = buildPostPurchaseIntelligence("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", retentionScore: d.summary.retentionScore });
  });
}
