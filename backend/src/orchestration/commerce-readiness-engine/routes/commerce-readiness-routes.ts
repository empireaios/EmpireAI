import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  getCommerceLaunchDecision,
  getCommerceReadinessBlockers,
  getCommerceReadinessEvaluation,
  getCommerceReadinessSummary,
} from "../services/commerce-readiness-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerCommerceReadinessRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/commerce-readiness/evaluate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        companyId: z.string().min(1),
        accountType: z.enum(["grand_king", "founder"]).optional(),
      })
      .parse(request.query);

    const evaluation = getCommerceReadinessEvaluation({
      workspaceId: user.workspaceId,
      companyId: query.companyId,
      accountType: query.accountType ?? "grand_king",
    });

    auditLogger.write({
      action: "commerce_readiness.evaluated",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: {
        companyId: query.companyId,
        launchDecision: evaluation.launchDecision,
        overallReadinessScore: evaluation.overallReadinessScore,
      },
    });

    return reply.send({ evaluation });
  });

  app.get("/commerce-readiness/summary", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        companyId: z.string().min(1),
        accountType: z.enum(["grand_king", "founder"]).optional(),
      })
      .parse(request.query);

    const summary = getCommerceReadinessSummary({
      workspaceId: user.workspaceId,
      companyId: query.companyId,
      accountType: query.accountType ?? "grand_king",
    });
    return reply.send({ summary });
  });

  app.get("/commerce-readiness/blockers", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        companyId: z.string().min(1),
        accountType: z.enum(["grand_king", "founder"]).optional(),
      })
      .parse(request.query);

    const blockers = getCommerceReadinessBlockers({
      workspaceId: user.workspaceId,
      companyId: query.companyId,
      accountType: query.accountType ?? "grand_king",
    });
    return reply.send({ blockers, total: blockers.length });
  });

  app.get("/commerce-readiness/launch-decision", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        companyId: z.string().min(1),
        accountType: z.enum(["grand_king", "founder"]).optional(),
      })
      .parse(request.query);

    const decision = getCommerceLaunchDecision({
      workspaceId: user.workspaceId,
      companyId: query.companyId,
      accountType: query.accountType ?? "grand_king",
    });
    return reply.send({ decision });
  });
}
