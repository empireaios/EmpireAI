import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildVersion1GoldMaster } from "../services/version-1-gold-master-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerVersion1GoldMasterRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/version-1-gold-master/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildVersion1GoldMaster(user.workspaceId, query.companyId) });
  });
  app.get("/health/version-1-gold-master", async (_req, reply) => {
    const d = buildVersion1GoldMaster("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", version: d.version, acceptanceScore: d.acceptanceScore });
  });
}
