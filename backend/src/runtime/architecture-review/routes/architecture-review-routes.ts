import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildArchitectureReview } from "../services/architecture-review-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerArchitectureReviewRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/architecture-review/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildArchitectureReview(user.workspaceId, query.companyId) });
  });
  app.get("/health/architecture-review", async (_req, reply) => {
    const d = buildArchitectureReview("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", missionId: d.missionId, itemCount: d.items.length });
  });
}
