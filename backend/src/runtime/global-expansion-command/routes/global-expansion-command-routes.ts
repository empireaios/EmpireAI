import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildGlobalExpansionCommand } from "../services/global-expansion-command-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGlobalExpansionCommandRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/global-expansion-command/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildGlobalExpansionCommand(user.workspaceId, query.companyId) });
  });
  app.get("/health/global-expansion-command", async (_req, reply) => {
    const d = buildGlobalExpansionCommand("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", targetCount: d.expansionTargets.length });
  });
}
