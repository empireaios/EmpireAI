import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { listAuthorityMatrix, listGovernanceDoctrines } from "../catalog/gvd-catalog.js";
import {
  buildGovernanceComplianceReport,
  buildGovernanceDoctrineDashboard,
} from "../services/empire-governance-doctrine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerEmpireGovernanceDoctrineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/empire-governance-doctrine/catalog", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({
      immutable: true,
      version: "1.0.0",
      doctrineCount: 30,
      doctrines: listGovernanceDoctrines(),
    });
  });

  app.get("/empire-governance-doctrine/authority-matrix", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ authorityMatrix: listAuthorityMatrix() });
  });

  app.get("/empire-governance-doctrine/compliance", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ report: buildGovernanceComplianceReport(user.workspaceId, query.companyId) });
  });

  app.get("/empire-governance-doctrine/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildGovernanceDoctrineDashboard(user.workspaceId, query.companyId) });
  });

  app.get("/health/empire-governance-doctrine", async (_req, reply) => {
    const d = buildGovernanceDoctrineDashboard("ws_empire_1", "co-grand-king");
    return reply.send({
      status: d.compliance.reviewPassed ? "HEALTHY" : "FAILED",
      reviewPassed: d.compliance.reviewPassed,
      coveragePercent: d.compliance.coveragePercent,
      violations: d.compliance.violationCount,
    });
  });
}
