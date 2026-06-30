import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildCommercialSimulationEngine } from "../services/commercial-simulation-engine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerCommercialSimulationEngineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/commercial-simulation-engine/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildCommercialSimulationEngine(user.workspaceId, query.companyId) });
  });
  app.get("/health/commercial-simulation-engine", async (_req, reply) => {
    const d = buildCommercialSimulationEngine("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", scenarioCount: d.scenarios.length });
  });
}
