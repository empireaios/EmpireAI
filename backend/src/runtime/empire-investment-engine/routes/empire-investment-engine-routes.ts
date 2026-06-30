import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildEmpireInvestmentEngine } from "../services/empire-investment-engine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerEmpireInvestmentEngineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/empire-investment-engine/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildEmpireInvestmentEngine(user.workspaceId, query.companyId) });
  });
  app.get("/health/empire-investment-engine", async (_req, reply) => {
    const d = buildEmpireInvestmentEngine("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", missionId: d.missionId, itemCount: d.items.length });
  });
}
