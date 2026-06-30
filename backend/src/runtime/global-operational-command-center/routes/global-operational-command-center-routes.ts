import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildGlobalOperationalCommandCenter } from "../services/global-operational-command-center-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGlobalOperationalCommandCenterRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/global-operational-command-center/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildGlobalOperationalCommandCenter(user.workspaceId, query.companyId) });
  });
  app.get("/health/global-operational-command-center", async (_req, reply) => {
    const d = buildGlobalOperationalCommandCenter("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", alerts: d.alerts.length });
  });
}
