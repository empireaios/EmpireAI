import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildAutonomousAnalysisEngine } from "../services/autonomous-analysis-engine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerAutonomousAnalysisEngineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/autonomous-analysis-engine/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildAutonomousAnalysisEngine(user.workspaceId, query.companyId) });
  });
  app.get("/health/autonomous-analysis-engine", async (_req, reply) => {
    const d = buildAutonomousAnalysisEngine("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", insightCount: d.insightCount });
  });
}
