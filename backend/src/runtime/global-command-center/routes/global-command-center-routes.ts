import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildGlobalCommandCenter } from "../services/global-command-center-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGlobalCommandCenterRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/global-command-center/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    const dashboard = buildGlobalCommandCenter(user.workspaceId, query.companyId);
    return reply.send({ dashboard });
  });

  app.get("/health/global-command-center", async (_request, reply) => {
    const dashboard = buildGlobalCommandCenter("ws_empire_1", "co-grand-king");
    return reply.send({
      status: dashboard.architectureComplete ? "HEALTHY" : "WARNING",
      architecturePercent: dashboard.architecturePercent,
      liveProducts: dashboard.productWinners.length + dashboard.productsAtRisk.length,
    });
  });
}
