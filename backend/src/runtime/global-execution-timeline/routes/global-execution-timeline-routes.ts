import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildGlobalExecutionTimeline } from "../services/global-execution-timeline-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGlobalExecutionTimelineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/global-execution-timeline/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildGlobalExecutionTimeline(user.workspaceId, query.companyId) });
  });
  app.get("/health/global-execution-timeline", async (_req, reply) => {
    const d = buildGlobalExecutionTimeline("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", eventCount: d.eventCount });
  });
}
