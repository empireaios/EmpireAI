import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildEsisDashboard } from "../services/esis-dashboard-service.js";
import { generateReviewPackageOnly, runEsisInspection } from "../services/esis-engine.js";
import { REVIEW_PACKAGE_PATH } from "../services/repo-scanner.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerEsisRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/empire-self-inspection/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1).default("co-grand-king") }).parse(request.query);
    const dashboard = buildEsisDashboard(user.workspaceId, query.companyId);
    return reply.send({ dashboard });
  });

  app.get("/empire-self-inspection/report", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        companyId: z.string().min(1).default("co-grand-king"),
        runValidation: z.coerce.boolean().default(false),
      })
      .parse(request.query);

    const report = runEsisInspection({
      workspaceId: user.workspaceId,
      companyId: query.companyId,
      runValidation: query.runValidation,
      writePackage: false,
    });

    return reply.send({ report });
  });

  app.post("/empire-self-inspection/generate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        companyId: z.string().min(1).default("co-grand-king"),
        runValidation: z.boolean().default(false),
        skipSlowTests: z.boolean().default(true),
      })
      .parse(request.body ?? {});

    const { path, report } = generateReviewPackageOnly({
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      runValidation: body.runValidation,
      skipSlowTests: body.skipSlowTests,
    });

    auditLogger.write({
      action: "empire_self_inspection.generate",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { reportId: report.reportId, path, hash: report.deterministicHash },
    });

    return reply.send({ path: REVIEW_PACKAGE_PATH, reportId: report.reportId, deterministicHash: report.deterministicHash });
  });

  app.get("/health/esis", async (_request, reply) => {
    const dashboard = buildEsisDashboard("ws_empire_1", "co-grand-king");
    return reply.send({
      status: dashboard.systemHealth.state,
      score: dashboard.systemHealth.score,
      summary: dashboard.summary,
    });
  });
}
