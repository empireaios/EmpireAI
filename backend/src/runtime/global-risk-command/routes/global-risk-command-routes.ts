import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildGlobalRiskCommand } from "../services/global-risk-command-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGlobalRiskCommandRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/global-risk-command/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildGlobalRiskCommand(user.workspaceId, query.companyId) });
  });
  app.get("/health/global-risk-command", async (_req, reply) => {
    const d = buildGlobalRiskCommand("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", overallRiskScore: d.overallRiskScore });
  });
}
