import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildSuccess001CommandCenter } from "../services/success-001-command-center-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerSuccess001CommandCenterRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/success-001-command-center/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildSuccess001CommandCenter(user.workspaceId, query.companyId) });
  });
  app.get("/health/success-001-command-center", async (_req, reply) => {
    const d = buildSuccess001CommandCenter("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", progressPercent: d.progressPercent });
  });
}
