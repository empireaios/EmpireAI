import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildUnifiedGrandKingHeadquarters } from "../services/unified-grand-king-headquarters-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerUnifiedGrandKingHeadquartersRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/unified-grand-king-headquarters/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildUnifiedGrandKingHeadquarters(user.workspaceId, query.companyId) });
  });
  app.get("/health/unified-grand-king-headquarters", async (_req, reply) => {
    const d = buildUnifiedGrandKingHeadquarters("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", sectionCount: d.sections.length });
  });
}
