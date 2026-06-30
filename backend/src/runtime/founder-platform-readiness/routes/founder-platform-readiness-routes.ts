import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildFounderPlatformReadiness } from "../services/founder-platform-readiness-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerFounderPlatformReadinessRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/founder-platform-readiness/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildFounderPlatformReadiness(user.workspaceId, query.companyId) });
  });
  app.get("/health/founder-platform-readiness", async (_req, reply) => {
    const d = buildFounderPlatformReadiness("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", readinessScore: d.readinessScore });
  });
}
