import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildCommercialMemoryEngine } from "../services/commercial-memory-engine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerCommercialMemoryEngineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/commercial-memory-engine/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildCommercialMemoryEngine(user.workspaceId, query.companyId) });
  });
  app.get("/health/commercial-memory-engine", async (_req, reply) => {
    const d = buildCommercialMemoryEngine("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", totalMemories: d.summary.totalMemories });
  });
}
