import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildAiChiefOfGrowth } from "../services/ai-chief-of-growth-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerAiChiefOfGrowthRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/ai-chief-of-growth/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildAiChiefOfGrowth(user.workspaceId, query.companyId) });
  });
  app.get("/health/ai-chief-of-growth", async (_req, reply) => {
    return reply.send({ status: "HEALTHY", recommendOnly: true });
  });
}
