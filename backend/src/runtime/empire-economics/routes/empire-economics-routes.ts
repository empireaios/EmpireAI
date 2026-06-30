import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildEmpireEconomics } from "../services/empire-economics-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerEmpireEconomicsRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/empire-economics/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildEmpireEconomics(user.workspaceId, query.companyId) });
  });
  app.get("/health/empire-economics", async (_req, reply) => {
    const d = buildEmpireEconomics("ws_empire_1", "co-grand-king");
    return reply.send({ status: d.architectureComplete ? "HEALTHY" : "WARNING", netProfitUsd: d.netProfitUsd });
  });
}
