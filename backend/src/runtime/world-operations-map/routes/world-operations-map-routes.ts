import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildWorldOperationsMap } from "../services/world-operations-map-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerWorldOperationsMapRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/world-operations-map/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildWorldOperationsMap(user.workspaceId, query.companyId) });
  });
  app.get("/health/world-operations-map", async (_req, reply) => {
    const d = buildWorldOperationsMap("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", countryCount: d.world.countries.length });
  });
}
