import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildLiveCommercialInvestigations } from "../services/live-commercial-investigations-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerLiveCommercialInvestigationsRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/live-commercial-investigations/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildLiveCommercialInvestigations(user.workspaceId, query.companyId) });
  });
  app.get("/health/live-commercial-investigations", async (_req, reply) => {
    const d = buildLiveCommercialInvestigations("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", openCount: d.openCount });
  });
}
