import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildSupplierIntelligenceLoop } from "../services/supplier-intelligence-loop-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerSupplierIntelligenceLoopRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/supplier-intelligence-loop/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    const dashboard = buildSupplierIntelligenceLoop(user.workspaceId, query.companyId);
    return reply.send({ dashboard });
  });

  app.get("/health/supplier-intelligence-loop", async (_request, reply) => {
    const dashboard = buildSupplierIntelligenceLoop("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", signals: dashboard.signals.length });
  });
}
