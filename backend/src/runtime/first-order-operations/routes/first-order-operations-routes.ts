import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildFirstOrderOperations } from "../services/first-order-operations-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerFirstOrderOperationsRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/first-order-operations/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildFirstOrderOperations(user.workspaceId, query.companyId) });
  });
  app.get("/health/first-order-operations", async (_req, reply) => {
    const d = buildFirstOrderOperations("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", completedCount: d.completedCount, totalCount: d.totalCount });
  });
}
