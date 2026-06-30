import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildFounderPlatformPreparation } from "../services/founder-platform-preparation-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerFounderPlatformPreparationRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/founder-platform-preparation/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildFounderPlatformPreparation(user.workspaceId, query.companyId) });
  });
}
