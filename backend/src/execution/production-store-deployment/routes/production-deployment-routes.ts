import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  applyDeploymentApproval,
  executeProductionDeployment,
  getDeploymentLogs,
  prepareProductionDeployment,
  ProductionDeploymentBlockedError,
  rollbackProductionDeployment,
} from "../services/production-deploy-service.js";
import { getProductionDeploymentRepository } from "../repositories/sqlite-production-deployment-repository.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

const prepareSchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  projectName: z.string().min(1),
  sourcePath: z.string().optional(),
  customDomain: z.string().optional(),
  environmentVariables: z.record(z.string()).optional(),
});

const approvalSchema = z.object({
  deploymentId: z.string().min(1),
  approvalToken: z.string().min(1),
  approvedBy: z.string().min(1),
  approvedAt: z.string().datetime({ offset: true }),
});

function requireFounder(role: string, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) {
  if (role !== "founder" && role !== "admin") {
    reply.code(403).send({ error: "Grand King approval required for production deployment" });
    return false;
  }
  return true;
}

export async function registerProductionDeploymentRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.post(
    "/production-deploy/prepare",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (!requireFounder(user.role, reply)) return;

      const body = prepareSchema.parse(request.body);
      if (body.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      const record = prepareProductionDeployment(body);
      auditLogger.write({
        action: "production_deploy.prepared",
        actor: user.email,
        workspaceId: body.workspaceId,
        companyId: body.companyId,
        correlationId: record.deploymentId,
        metadata: { projectName: body.projectName, status: record.status },
      });

      return reply.send({ deployment: record });
    },
  );

  app.post(
    "/production-deploy/approve",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (!requireFounder(user.role, reply)) return;

      const body = approvalSchema.parse(request.body);
      const record = applyDeploymentApproval(body);

      auditLogger.write({
        action: "production_deploy.approved",
        actor: user.email,
        workspaceId: record.workspaceId,
        companyId: record.companyId,
        correlationId: record.deploymentId,
        metadata: { approvedBy: body.approvedBy },
      });

      return reply.send({ deployment: record });
    },
  );

  app.post(
    "/production-deploy/execute",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (!requireFounder(user.role, reply)) return;

      const body = z.object({ deploymentId: z.string().min(1) }).parse(request.body);

      try {
        const record = await executeProductionDeployment(body.deploymentId);
        auditLogger.write({
          action: "production_deploy.executed",
          actor: user.email,
          workspaceId: record.workspaceId,
          companyId: record.companyId,
          correlationId: record.deploymentId,
          metadata: { productionUrl: record.productionUrl, sslEnabled: record.sslEnabled },
        });
        return reply.send({ deployment: record });
      } catch (error) {
        if (error instanceof ProductionDeploymentBlockedError) {
          return reply.code(403).send({ error: error.message, protectTheEmpire: true });
        }
        throw error;
      }
    },
  );

  app.post(
    "/production-deploy/rollback",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (!requireFounder(user.role, reply)) return;

      const body = z.object({ deploymentId: z.string().min(1) }).parse(request.body);
      const record = await rollbackProductionDeployment(body.deploymentId);

      auditLogger.write({
        action: "production_deploy.rolled_back",
        actor: user.email,
        workspaceId: record.workspaceId,
        companyId: record.companyId,
        correlationId: record.deploymentId,
        metadata: { productionUrl: record.productionUrl },
      });

      return reply.send({ deployment: record });
    },
  );

  app.get(
    "/production-deploy/:deploymentId/logs",
    { preHandler: authenticate },
    async (request, reply) => {
      const params = z.object({ deploymentId: z.string().min(1) }).parse(request.params);
      const logs = getDeploymentLogs(params.deploymentId);
      return reply.send({ logs });
    },
  );

  app.get(
    "/production-deploy",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ storeId: z.string().optional() }).parse(request.query);
      const deployments = getProductionDeploymentRepository().listDeployments(
        user.workspaceId,
        query.storeId,
      );
      return reply.send({ deployments });
    },
  );
}
