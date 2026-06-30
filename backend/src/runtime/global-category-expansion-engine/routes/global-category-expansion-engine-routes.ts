import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildGlobalCategoryExpansionEngine } from "../services/global-category-expansion-engine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGlobalCategoryExpansionEngineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/global-category-expansion-engine/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildGlobalCategoryExpansionEngine(user.workspaceId, query.companyId) });
  });
  app.get("/health/global-category-expansion-engine", async (_req, reply) => {
    const d = buildGlobalCategoryExpansionEngine("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", categories: d.categories.length });
  });
}
