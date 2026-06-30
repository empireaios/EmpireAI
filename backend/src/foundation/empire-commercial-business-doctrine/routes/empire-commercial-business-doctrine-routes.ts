import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { listCommercialBusinessDoctrines } from "../catalog/cbd-catalog.js";
import {
  buildCommercialComplianceReport,
  buildCommercialBusinessDoctrineDashboard,
} from "../services/empire-commercial-business-doctrine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerEmpireCommercialBusinessDoctrineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/empire-commercial-business-doctrine/catalog", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({
      immutable: true,
      version: "1.0.0",
      doctrineCount: 20,
      doctrines: listCommercialBusinessDoctrines(),
    });
  });

  app.get("/empire-commercial-business-doctrine/integrity-review", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    const report = buildCommercialComplianceReport(user.workspaceId, query.companyId);
    return reply.send({ commercialIntegrityReview: report.commercialIntegrityReview });
  });

  app.get("/empire-commercial-business-doctrine/compliance", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ report: buildCommercialComplianceReport(user.workspaceId, query.companyId) });
  });

  app.get("/empire-commercial-business-doctrine/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildCommercialBusinessDoctrineDashboard(user.workspaceId, query.companyId) });
  });

  app.get("/health/empire-commercial-business-doctrine", async (_req, reply) => {
    const d = buildCommercialBusinessDoctrineDashboard("ws_empire_1", "co-grand-king");
    return reply.send({
      status: d.compliance.reviewPassed ? "HEALTHY" : "FAILED",
      reviewPassed: d.compliance.reviewPassed,
      coveragePercent: d.compliance.coveragePercent,
      violations: d.compliance.violationCount,
    });
  });
}
