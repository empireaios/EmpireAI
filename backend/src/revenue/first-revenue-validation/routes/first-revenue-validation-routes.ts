import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  FirstRevenueValidationBlockedError,
  getFirstRevenueValidationById,
  getLatestFirstRevenueValidation,
  getProductionReadinessAssessment,
  listFirstRevenueValidations,
  runFirstRevenueValidation,
} from "../services/first-revenue-validation-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerFirstRevenueValidationRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.post(
    "/first-revenue-validation/run",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z
        .object({
          companyId: z.string().min(1),
          correlationId: z.string().optional(),
          brandId: z.string().optional(),
        })
        .parse(request.body);

      try {
        const validation = await runFirstRevenueValidation({
          workspaceId: user.workspaceId,
          companyId: body.companyId,
          correlationId: body.correlationId ?? request.id,
          brandId: body.brandId,
        });

        auditLogger.write({
          action: "first_revenue_validation.completed",
          actor: user.email,
          workspaceId: user.workspaceId,
          companyId: body.companyId,
          correlationId: validation.correlationId,
          metadata: {
            validationId: validation.validationId,
            allStagesPassed: validation.allStagesPassed,
            productionReady: validation.productionReady,
          },
        });

        return reply.send({ validation });
      } catch (error) {
        if (error instanceof FirstRevenueValidationBlockedError) {
          return reply.code(403).send({ error: error.message, blocked: true });
        }
        throw error;
      }
    },
  );

  app.get(
    "/first-revenue-validation/production-readiness",
    { preHandler: authenticate },
    async (_request, reply) => {
      const assessment = getProductionReadinessAssessment();
      return reply.send({ assessment });
    },
  );

  app.get(
    "/first-revenue-validation/runs",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().optional() }).parse(request.query);
      const validations = listFirstRevenueValidations(user.workspaceId, query.companyId);
      return reply.send({ validations });
    },
  );

  app.get(
    "/first-revenue-validation/runs/latest",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().optional() }).parse(request.query);
      const validation = getLatestFirstRevenueValidation(user.workspaceId, query.companyId);
      if (!validation) {
        return reply.code(404).send({ error: "No validation run recorded yet" });
      }
      return reply.send({ validation });
    },
  );

  app.get(
    "/first-revenue-validation/runs/:validationId",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const params = z.object({ validationId: z.string().min(1) }).parse(request.params);
      const validation = getFirstRevenueValidationById(params.validationId);
      if (!validation) {
        return reply.code(404).send({ error: "Validation run not found" });
      }
      if (validation.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }
      return reply.send({ validation });
    },
  );
}
