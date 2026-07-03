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
import { registerCrirReportInputSchema } from "../models/crir-report.js";
import {
  getCrirReportById,
  getCrirReportsForCompany,
  registerCrirReport,
} from "../services/crir-certification-service.js";

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

  app.get("/commerce-readiness/crir", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const reports = getCrirReportsForCompany(user.workspaceId, query.companyId);
    return reply.send({ reports, total: reports.length });
  });

  app.get("/commerce-readiness/crir/:reportId", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ reportId: z.string().min(1) }).parse(request.params);
    const report = getCrirReportById(params.reportId);
    if (!report) {
      return reply.status(404).send({ error: "CRIR not found" });
    }
    return reply.send({ report });
  });

  app.post("/commerce-readiness/crir", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = registerCrirReportInputSchema.parse({
      ...(request.body as Record<string, unknown>),
      workspaceId: user.workspaceId,
    });

    const report = registerCrirReport(body);

    auditLogger.write({
      action: "commerce_readiness.crir_registered",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: {
        reportId: report.reportId,
        companyId: report.companyId,
        certificationStatus: report.certificationStatus,
        survivabilityAssessment: report.survivabilityAssessment,
      },
    });

    return reply.status(201).send({ report });
  });
}
