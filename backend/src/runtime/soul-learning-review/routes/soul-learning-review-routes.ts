import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildSoulLearningReview } from "../services/soul-learning-review-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerSoulLearningReviewRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/soul-learning-review/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildSoulLearningReview(user.workspaceId, query.companyId) });
  });
  app.get("/health/soul-learning-review", async (_req, reply) => {
    const d = buildSoulLearningReview("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", missionId: d.missionId, itemCount: d.items.length });
  });
}
