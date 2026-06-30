import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildVersion1ReadinessAudit } from "../services/version-1-readiness-audit-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerVersion1ReadinessAuditRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/version-1-readiness-audit/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildVersion1ReadinessAudit(user.workspaceId, query.companyId) });
  });
  app.get("/health/version-1-readiness", async (_req, reply) => {
    const d = buildVersion1ReadinessAudit("ws_empire_1", "co-grand-king");
    return reply.send({ status: d.version1ReadinessScore >= 70 ? "HEALTHY" : "WARNING", score: d.version1ReadinessScore });
  });
}
