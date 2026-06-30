import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { DebateContextInputSchema } from "../../../executive-council/models/executive-core.js";
import {
  buildExecutiveVisualDebate,
  recordGrandKingDecision,
} from "../services/executive-visual-debate-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerExecutiveVisualDebateRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/executive-visual-debate/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    const debate = buildExecutiveVisualDebate(user.workspaceId, query.companyId, {
      topic: "Global commerce execution — USD 100K net profit path",
      subjectType: "marketplace",
      summary: "REAL-007 visual executive debate for governed commerce execution",
    });
    return reply.send({ debate });
  });

  app.post("/executive-visual-debate/build", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().default("co-grand-king") })
      .merge(DebateContextInputSchema)
      .parse(request.body);
    const { companyId, ...context } = body;
    const debate = buildExecutiveVisualDebate(user.workspaceId, companyId, context);
    return reply.code(201).send({ debate });
  });

  app.post("/executive-visual-debate/king-decision", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      companyId: z.string().default("co-grand-king"),
      debate: z.record(z.unknown()),
      decision: z.enum(["APPROVE", "REJECT", "REQUEST_FURTHER_INVESTIGATION"]),
      rationale: z.string().optional(),
    }).parse(request.body);
    const debate = recordGrandKingDecision(
      body.debate as Parameters<typeof recordGrandKingDecision>[0],
      body.decision,
      body.rationale,
    );
    auditLogger.write({
      action: "executive_council.debate",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { decision: body.decision, topic: debate.topic },
    });
    return reply.send({ debate });
  });

  app.get("/health/executive-visual-debate", async (_request, reply) => {
    return reply.send({ status: "HEALTHY", chiefCount: 12, visualMode: true });
  });
}
