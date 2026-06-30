import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { listUxIdentityDoctrines } from "../catalog/uid-catalog.js";
import {
  buildUxIdentityComplianceReport,
  buildUxIdentityDoctrineDashboard,
} from "../services/empire-ux-identity-doctrine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerEmpireUxIdentityDoctrineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/empire-ux-identity-doctrine/catalog", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({
      immutable: true,
      version: "1.0.0",
      doctrineCount: 20,
      doctrines: listUxIdentityDoctrines(),
    });
  });

  app.get("/empire-ux-identity-doctrine/navigation-review", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    const report = buildUxIdentityComplianceReport(user.workspaceId, query.companyId);
    return reply.send({ navigationReview: report.navigationReview });
  });

  app.get("/empire-ux-identity-doctrine/compliance", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ report: buildUxIdentityComplianceReport(user.workspaceId, query.companyId) });
  });

  app.get("/empire-ux-identity-doctrine/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildUxIdentityDoctrineDashboard(user.workspaceId, query.companyId) });
  });

  app.get("/health/empire-ux-identity-doctrine", async (_req, reply) => {
    const d = buildUxIdentityDoctrineDashboard("ws_empire_1", "co-grand-king");
    return reply.send({
      status: d.compliance.reviewPassed ? "HEALTHY" : "FAILED",
      reviewPassed: d.compliance.reviewPassed,
      coveragePercent: d.compliance.coveragePercent,
      violations: d.compliance.violationCount,
    });
  });
}
