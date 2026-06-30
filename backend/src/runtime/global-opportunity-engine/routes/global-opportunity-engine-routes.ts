import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildGlobalOpportunityEngine } from "../services/global-opportunity-engine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGlobalOpportunityEngineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/global-opportunity-engine/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    const dashboard = buildGlobalOpportunityEngine(user.workspaceId, query.companyId);
    return reply.send({ dashboard });
  });

  app.get("/health/global-opportunity-engine", async (_request, reply) => {
    const dashboard = buildGlobalOpportunityEngine("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", opportunities: dashboard.opportunityQueue.length });
  });
}
