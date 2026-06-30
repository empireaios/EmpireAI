import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { listArchitectureConstraints } from "../catalog/acd-catalog.js";
import {
  buildArchitectureComplianceReport,
  buildArchitectureConstraintsDashboard,
} from "../services/empire-architecture-constraints-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerEmpireArchitectureConstraintsRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/empire-architecture-constraints/catalog", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({
      immutable: true,
      version: "1.0.0",
      constraintCount: 30,
      constraints: listArchitectureConstraints(),
    });
  });

  app.get("/empire-architecture-constraints/dependency-review", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    const report = buildArchitectureComplianceReport(user.workspaceId, query.companyId);
    return reply.send({ dependencyReview: report.dependencyReview });
  });

  app.get("/empire-architecture-constraints/compliance", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ report: buildArchitectureComplianceReport(user.workspaceId, query.companyId) });
  });

  app.get("/empire-architecture-constraints/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildArchitectureConstraintsDashboard(user.workspaceId, query.companyId) });
  });

  app.get("/health/empire-architecture-constraints", async (_req, reply) => {
    const d = buildArchitectureConstraintsDashboard("ws_empire_1", "co-grand-king");
    return reply.send({
      status: d.compliance.reviewPassed ? "HEALTHY" : "FAILED",
      reviewPassed: d.compliance.reviewPassed,
      coveragePercent: d.compliance.coveragePercent,
      violations: d.compliance.violationCount,
    });
  });
}
