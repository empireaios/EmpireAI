import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  BusinessBuildBlockedError,
  BusinessBuildNotFoundError,
  buildBusinessBuildSummary,
  getBusinessBuildPackage,
  getBusinessBuildStatus,
  startBusinessBuild,
  validateBusinessBuild,
} from "../services/business-build-engine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerBusinessBuildRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.post("/business-build/start", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ businessOpportunityId: z.string().min(1) }).parse(request.body);

    try {
      const build = startBusinessBuild(body.businessOpportunityId, user.email);
      auditLogger.write({
        action: "business_build.started",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { buildId: build.buildId, status: build.status },
      });
      return reply.code(201).send({ build });
    } catch (error) {
      if (error instanceof BusinessBuildBlockedError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/business-build/:buildId/status", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ buildId: z.string().min(1) }).parse(request.params);
    const build = getBusinessBuildStatus(params.buildId);
    if (!build) {
      return reply.code(404).send({ error: "Build not found" });
    }
    return reply.send({ build });
  });

  app.get("/business-build/:buildId/package", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ buildId: z.string().min(1) }).parse(request.params);
    const build = getBusinessBuildPackage(params.buildId);
    if (!build) {
      return reply.code(404).send({ error: "Build not found" });
    }
    return reply.send({ build });
  });

  app.post("/business-build/:buildId/validate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ buildId: z.string().min(1) }).parse(request.params);

    try {
      const validation = validateBusinessBuild(params.buildId);
      auditLogger.write({
        action: "business_build.validated",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { buildId: params.buildId, valid: validation.valid },
      });
      return reply.send({ validation });
    } catch (error) {
      if (error instanceof BusinessBuildNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/business-build/summary", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const summary = buildBusinessBuildSummary(user.workspaceId, query.companyId);
    return reply.send({ summary });
  });
}
