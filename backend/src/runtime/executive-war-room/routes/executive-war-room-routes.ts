import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { DebateContextInputSchema } from "../../../executive-council/models/executive-core.js";
import { buildExecutiveWarRoom } from "../services/executive-war-room-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerExecutiveWarRoomRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/executive-war-room/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildExecutiveWarRoom(user.workspaceId, query.companyId) });
  });
  app.post("/executive-war-room/debate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().default("co-grand-king") })
      .merge(DebateContextInputSchema)
      .parse(request.body);
    const { companyId, ...context } = body;
    return reply.send({ dashboard: buildExecutiveWarRoom(user.workspaceId, companyId, context) });
  });
  app.get("/health/executive-war-room", async (_req, reply) => {
    const d = buildExecutiveWarRoom("ws_empire_1", "co-grand-king");
    return reply.send({ status: "HEALTHY", chiefCount: d.chiefCards.length, autoExecuteBlocked: d.autoExecuteBlocked });
  });
}
