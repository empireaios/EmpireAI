import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildProductionHardening } from "../services/production-hardening-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerProductionHardeningRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/production-hardening/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildProductionHardening(user.workspaceId, query.companyId) });
  });
  app.get("/health/production-hardening", async (_req, reply) => {
    const d = buildProductionHardening("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", moduleCount: d.moduleCount, validationSuiteCount: d.validationSuiteCount });
  });
}
