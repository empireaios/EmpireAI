import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildSuccess001ReadinessReview } from "../services/success-001-readiness-review-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerSuccess001ReadinessReviewRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/success-001-readiness-review/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildSuccess001ReadinessReview(user.workspaceId, query.companyId) });
  });
  app.get("/health/success-001-readiness-review", async (_req, reply) => {
    const d = buildSuccess001ReadinessReview("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", grandKingReady: d.grandKingReady, readyCount: d.readyCount });
  });
}
