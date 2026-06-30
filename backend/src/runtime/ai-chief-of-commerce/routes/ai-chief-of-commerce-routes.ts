import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildAiChiefOfCommerce } from "../services/ai-chief-of-commerce-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerAiChiefOfCommerceRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/ai-chief-of-commerce/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildAiChiefOfCommerce(user.workspaceId, query.companyId) });
  });
  app.get("/health/ai-chief-of-commerce", async (_req, reply) => {
    return reply.send({ status: "HEALTHY", recommendOnly: true });
  });
}
