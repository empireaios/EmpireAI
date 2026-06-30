import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildEmpirePlaybookEngine } from "../services/empire-playbook-engine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerEmpirePlaybookEngineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/empire-playbook-engine/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildEmpirePlaybookEngine(user.workspaceId, query.companyId) });
  });
  app.get("/health/empire-playbook-engine", async (_req, reply) => {
    const d = buildEmpirePlaybookEngine("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", playbookCount: d.playbooks.length, executiveReferenceOnly: d.executiveReferenceOnly });
  });
}
