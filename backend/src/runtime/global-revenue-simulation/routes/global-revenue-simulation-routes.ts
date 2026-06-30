import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildGlobalRevenueSimulation } from "../services/global-revenue-simulation-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGlobalRevenueSimulationRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/global-revenue-simulation/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildGlobalRevenueSimulation(user.workspaceId, query.companyId) });
  });
  app.get("/health/global-revenue-simulation", async (_req, reply) => {
    const d = buildGlobalRevenueSimulation("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", scenarios: d.scenarios.length });
  });
}
