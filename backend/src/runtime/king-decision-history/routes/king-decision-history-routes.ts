import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildKingDecisionHistory } from "../services/king-decision-history-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerKingDecisionHistoryRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/king-decision-history/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildKingDecisionHistory(user.workspaceId, query.companyId) });
  });
  app.get("/health/king-decision-history", async (_req, reply) => {
    const d = buildKingDecisionHistory("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", missionId: d.missionId, itemCount: d.items.length });
  });
}
