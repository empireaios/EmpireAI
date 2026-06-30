import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { listConstitutionArticles } from "../catalog/ctd-catalog.js";
import { buildConstitutionComplianceReport, buildConstitutionDashboard } from "../services/empire-constitution-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerEmpireConstitutionRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/empire-constitution/catalog", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({
      immutable: true,
      version: "1.0.0",
      articleCount: 40,
      articles: listConstitutionArticles(),
    });
  });

  app.get("/empire-constitution/compliance", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ report: buildConstitutionComplianceReport(user.workspaceId, query.companyId) });
  });

  app.get("/empire-constitution/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildConstitutionDashboard(user.workspaceId, query.companyId) });
  });

  app.get("/health/empire-constitution", async (_req, reply) => {
    const d = buildConstitutionDashboard("ws_empire_1", "co-grand-king");
    return reply.send({
      status: "HEALTHY",
      articleCount: d.catalog.length,
      coveragePercent: d.compliance.coveragePercent,
      violations: d.compliance.violationCount,
    });
  });
}
