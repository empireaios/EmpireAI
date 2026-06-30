import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildCustomerPsychologyEngine } from "../services/customer-psychology-engine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerCustomerPsychologyEngineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/customer-psychology-engine/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildCustomerPsychologyEngine(user.workspaceId, query.companyId) });
  });
  app.get("/health/customer-psychology-engine", async (_req, reply) => {
    const d = buildCustomerPsychologyEngine("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", avgPurchaseScore: d.avgPurchaseScore });
  });
}
