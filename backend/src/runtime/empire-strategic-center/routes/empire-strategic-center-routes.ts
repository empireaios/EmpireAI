import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildEmpireStrategicCenter } from "../services/empire-strategic-center-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerEmpireStrategicCenterRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/empire-strategic-center/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildEmpireStrategicCenter(user.workspaceId, query.companyId) });
  });
  app.get("/health/empire-strategic-center", async (_req, reply) => {
    const d = buildEmpireStrategicCenter("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", roadmapCount: d.roadmaps.length });
  });
}
