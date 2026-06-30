import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { DebateContextInputSchema } from "../../../executive-council/models/executive-core.js";
import { buildSoulDecisionChamber } from "../services/soul-decision-chamber-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerSoulDecisionChamberRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/soul-decision-chamber/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({
      dashboard: buildSoulDecisionChamber(user.workspaceId, query.companyId, {
        topic: "Soul decision chamber — governed recommendation",
        subjectType: "general",
        summary: "REAL-056 Soul unified recommendation — never executes",
      }),
    });
  });
  app.post("/soul-decision-chamber/decide", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().default("co-grand-king") })
      .merge(DebateContextInputSchema)
      .parse(request.body);
    const { companyId, ...context } = body;
    return reply.send({ dashboard: buildSoulDecisionChamber(user.workspaceId, companyId, context) });
  });
  app.get("/health/soul-decision-chamber", async (_req, reply) => {
    return reply.send({ status: "HEALTHY", neverExecute: true });
  });
}
