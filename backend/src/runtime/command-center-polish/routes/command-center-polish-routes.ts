import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildCommandCenterPolish } from "../services/command-center-polish-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerCommandCenterPolishRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/command-center-polish/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildCommandCenterPolish(user.workspaceId, query.companyId) });
  });
  app.get("/health/command-center-polish", async (_req, reply) => {
    const d = buildCommandCenterPolish("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", missionId: d.missionId, itemCount: d.items.length });
  });
}
