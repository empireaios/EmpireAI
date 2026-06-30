import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  ExecutionPackageNotFoundError,
  ExecutionPipelineBlockedError,
  analyzeCustomerLifetime,
  buildCommerceOperationsDashboard,
  buildExecutiveCommandCenter,
  buildExecutionLayerDashboard,
  evaluateBusinessHealth,
  generateFullExecutionPipeline,
  generateFulfillmentPackageForBuild,
  generateGrowthOptimizationForOpportunity,
  generateMarketingCampaignForBuild,
  generatePublicationPackageForBuild,
  generateRevenueActivationForBuild,
  getBusinessHealthRecord,
  getCustomerLifetimeRecord,
  getFulfillmentPackage,
  getGrowthOptimizationRecord,
  getMarketingCampaignPackage,
  getPipelineValidation,
  getPublicationPackage,
  getRevenueActivationPackage,
  runPipelineValidation,
  validatePublicationPackage,
} from "../services/execution-layer-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerExecutionLayerRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.post("/execution-layer/publication/generate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ buildId: z.string().min(1) }).parse(request.body);
    try {
      const pkg = generatePublicationPackageForBuild(body.buildId, user.email);
      auditLogger.write({
        action: "publication_package.generate",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { packageId: pkg.packageId, buildId: body.buildId },
      });
      return reply.code(201).send({ package: pkg });
    } catch (error) {
      if (error instanceof ExecutionPipelineBlockedError) {
        return reply.code(422).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/execution-layer/publication/:packageId", { preHandler: authenticate }, async (request, reply) => {
    const { packageId } = z.object({ packageId: z.string().min(1) }).parse(request.params);
    const pkg = getPublicationPackage(packageId);
    if (!pkg) return reply.code(404).send({ error: "Publication package not found" });
    return reply.send({ package: pkg });
  });

  app.post("/execution-layer/publication/:packageId/validate", { preHandler: authenticate }, async (request, reply) => {
    const { packageId } = z.object({ packageId: z.string().min(1) }).parse(request.params);
    try {
      return reply.send(validatePublicationPackage(packageId));
    } catch (error) {
      if (error instanceof ExecutionPackageNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/execution-layer/marketing/generate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ buildId: z.string().min(1) }).parse(request.body);
    try {
      const pkg = generateMarketingCampaignForBuild(body.buildId, user.email);
      auditLogger.write({ action: "marketing_campaign.generate", actor: user.email, workspaceId: user.workspaceId, correlationId: request.id, metadata: { packageId: pkg.packageId } });
      return reply.code(201).send({ package: pkg });
    } catch (error) {
      if (error instanceof ExecutionPipelineBlockedError) return reply.code(422).send({ error: (error as Error).message });
      throw error;
    }
  });

  app.get("/execution-layer/marketing/:packageId", { preHandler: authenticate }, async (request, reply) => {
    const { packageId } = z.object({ packageId: z.string().min(1) }).parse(request.params);
    const pkg = getMarketingCampaignPackage(packageId);
    if (!pkg) return reply.code(404).send({ error: "Marketing package not found" });
    return reply.send({ package: pkg });
  });

  app.post("/execution-layer/fulfillment/generate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ buildId: z.string().min(1) }).parse(request.body);
    try {
      const pkg = generateFulfillmentPackageForBuild(body.buildId, user.email);
      auditLogger.write({ action: "fulfillment_package.generate", actor: user.email, workspaceId: user.workspaceId, correlationId: request.id, metadata: { packageId: pkg.packageId } });
      return reply.code(201).send({ package: pkg });
    } catch (error) {
      if (error instanceof ExecutionPipelineBlockedError) return reply.code(422).send({ error: (error as Error).message });
      throw error;
    }
  });

  app.get("/execution-layer/fulfillment/:packageId", { preHandler: authenticate }, async (request, reply) => {
    const { packageId } = z.object({ packageId: z.string().min(1) }).parse(request.params);
    const pkg = getFulfillmentPackage(packageId);
    if (!pkg) return reply.code(404).send({ error: "Fulfillment package not found" });
    return reply.send({ package: pkg });
  });

  app.post("/execution-layer/revenue/generate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ buildId: z.string().min(1) }).parse(request.body);
    try {
      const pkg = generateRevenueActivationForBuild(body.buildId, user.email);
      auditLogger.write({ action: "revenue_activation.generate", actor: user.email, workspaceId: user.workspaceId, correlationId: request.id, metadata: { packageId: pkg.packageId } });
      return reply.code(201).send({ package: pkg });
    } catch (error) {
      if (error instanceof ExecutionPipelineBlockedError) return reply.code(422).send({ error: (error as Error).message });
      throw error;
    }
  });

  app.get("/execution-layer/revenue/:packageId", { preHandler: authenticate }, async (request, reply) => {
    const { packageId } = z.object({ packageId: z.string().min(1) }).parse(request.params);
    const pkg = getRevenueActivationPackage(packageId);
    if (!pkg) return reply.code(404).send({ error: "Revenue package not found" });
    return reply.send({ package: pkg });
  });

  app.get("/execution-layer/commerce-operations", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send(buildCommerceOperationsDashboard(user.workspaceId, query.companyId));
  });

  app.post("/execution-layer/business-health/evaluate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ businessOpportunityId: z.string().min(1) }).parse(request.body);
    try {
      const record = evaluateBusinessHealth(body.businessOpportunityId, user.email);
      auditLogger.write({ action: "business_health.evaluate", actor: user.email, workspaceId: user.workspaceId, correlationId: request.id, metadata: { healthId: record.healthId } });
      return reply.code(201).send({ health: record });
    } catch (error) {
      if (error instanceof ExecutionPipelineBlockedError) return reply.code(422).send({ error: (error as Error).message });
      throw error;
    }
  });

  app.get("/execution-layer/business-health/:healthId", { preHandler: authenticate }, async (request, reply) => {
    const { healthId } = z.object({ healthId: z.string().min(1) }).parse(request.params);
    const record = getBusinessHealthRecord(healthId);
    if (!record) return reply.code(404).send({ error: "Business health record not found" });
    return reply.send({ health: record });
  });

  app.post("/execution-layer/growth-optimization/recommend", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ businessOpportunityId: z.string().min(1) }).parse(request.body);
    try {
      const record = generateGrowthOptimizationForOpportunity(body.businessOpportunityId, user.email);
      auditLogger.write({ action: "growth_optimization.recommend", actor: user.email, workspaceId: user.workspaceId, correlationId: request.id, metadata: { optimizationId: record.optimizationId } });
      return reply.code(201).send({ optimization: record });
    } catch (error) {
      if (error instanceof ExecutionPipelineBlockedError) return reply.code(422).send({ error: (error as Error).message });
      throw error;
    }
  });

  app.get("/execution-layer/growth-optimization/:optimizationId", { preHandler: authenticate }, async (request, reply) => {
    const { optimizationId } = z.object({ optimizationId: z.string().min(1) }).parse(request.params);
    const record = getGrowthOptimizationRecord(optimizationId);
    if (!record) return reply.code(404).send({ error: "Growth optimization not found" });
    return reply.send({ optimization: record });
  });

  app.post("/execution-layer/customer-lifetime/analyze", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ businessOpportunityId: z.string().min(1) }).parse(request.body);
    try {
      const record = analyzeCustomerLifetime(body.businessOpportunityId, user.email);
      auditLogger.write({ action: "customer_lifetime.analyze", actor: user.email, workspaceId: user.workspaceId, correlationId: request.id, metadata: { recordId: record.recordId } });
      return reply.code(201).send({ customerLifetime: record });
    } catch (error) {
      if (error instanceof ExecutionPipelineBlockedError) return reply.code(422).send({ error: (error as Error).message });
      throw error;
    }
  });

  app.get("/execution-layer/customer-lifetime/:recordId", { preHandler: authenticate }, async (request, reply) => {
    const { recordId } = z.object({ recordId: z.string().min(1) }).parse(request.params);
    const record = getCustomerLifetimeRecord(recordId);
    if (!record) return reply.code(404).send({ error: "Customer lifetime record not found" });
    return reply.send({ customerLifetime: record });
  });

  app.get("/execution-layer/executive-command", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send(buildExecutiveCommandCenter(user.workspaceId, query.companyId));
  });

  app.post("/execution-layer/pipeline-validation/run", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ businessOpportunityId: z.string().min(1), companyId: z.string().min(1) }).parse(request.body);
    const result = runPipelineValidation(body.businessOpportunityId, user.workspaceId, body.companyId);
    auditLogger.write({ action: "pipeline_validation.run", actor: user.email, workspaceId: user.workspaceId, correlationId: request.id, metadata: { validationId: result.validationId, valid: result.valid } });
    return reply.code(201).send({ validation: result });
  });

  app.get("/execution-layer/pipeline-validation/:validationId", { preHandler: authenticate }, async (request, reply) => {
    const { validationId } = z.object({ validationId: z.string().min(1) }).parse(request.params);
    const result = getPipelineValidation(validationId);
    if (!result) return reply.code(404).send({ error: "Pipeline validation not found" });
    return reply.send({ validation: result });
  });

  app.post("/execution-layer/full-pipeline", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ buildId: z.string().min(1) }).parse(request.body);
    try {
      const result = generateFullExecutionPipeline(body.buildId, user.email);
      auditLogger.write({ action: "execution_layer.full_pipeline", actor: user.email, workspaceId: user.workspaceId, correlationId: request.id, metadata: { buildId: body.buildId } });
      return reply.code(201).send(result);
    } catch (error) {
      if (error instanceof ExecutionPipelineBlockedError) return reply.code(422).send({ error: (error as Error).message });
      throw error;
    }
  });

  app.get("/execution-layer/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send(buildExecutionLayerDashboard(user.workspaceId, query.companyId));
  });
}
