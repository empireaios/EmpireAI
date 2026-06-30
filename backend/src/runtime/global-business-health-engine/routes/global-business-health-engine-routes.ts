import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildGlobalBusinessHealthEngine } from "../services/global-business-health-engine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGlobalBusinessHealthEngineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/global-business-health-engine/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildGlobalBusinessHealthEngine(user.workspaceId, query.companyId) });
  });
  app.get("/health/global-business-health-engine", async (_req, reply) => {
    const d = buildGlobalBusinessHealthEngine("ws_empire_1", "co-grand-king");
    return reply.send({ status: d.architectureComplete ? "HEALTHY" : "WARNING", overallHealthScore: d.overallHealthScore });
  });
}
