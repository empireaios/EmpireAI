import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildAiStrategicMemory } from "../services/ai-strategic-memory-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerAiStrategicMemoryRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/ai-strategic-memory/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildAiStrategicMemory(user.workspaceId, query.companyId) });
  });
  app.get("/health/ai-strategic-memory", async (_req, reply) => {
    const d = buildAiStrategicMemory("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", totalMemories: d.summary.totalMemories });
  });
}
