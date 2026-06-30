import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  listMarketplaceConnections,
  getMarketplaceConnection,
  startMarketplaceConnection,
  completeMarketplaceConnection,
  getMarketplaceConnectionGuide,
} from "../../marketplace-infrastructure-engine/index.js";
import { MARKETPLACE_IDS } from "../../marketplace-infrastructure-engine/models/marketplace-connection.js";
import {
  approveLaunchProducts,
  EcommerceOsWorkflowBlockedError,
  EcommerceOsWorkflowNotFoundError,
  getGrandKingsLaunchDashboard,
  getLaunchReadiness,
  getMarketplacePublishingReadinessForLaunch,
  getLaunchWorkflow,
  listLaunchWorkflows,
  prepareGrandKingsLaunch,
  researchLaunchOpportunities,
  runGrandKingsResearchPhase,
  startGrandKingsLaunchWorkflow,
} from "../services/ecommerce-os-orchestrator-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerEcommerceOsRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/ecommerce-os/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const dashboard = getGrandKingsLaunchDashboard(user.workspaceId, query.companyId);
    return reply.send({ dashboard });
  });

  app.get("/ecommerce-os/marketplace-readiness", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ accountType: z.enum(["GRAND_KING", "FOUNDER"]).optional() }).parse(request.query);
    const readiness = getMarketplacePublishingReadinessForLaunch(
      user.workspaceId,
      query.accountType ?? "GRAND_KING",
    );
    return reply.send({ readiness });
  });

  app.get("/ecommerce-os/workflows", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().optional() }).parse(request.query);
    const workflows = listLaunchWorkflows(user.workspaceId, query.companyId);
    return reply.send({ workflows, total: workflows.length });
  });

  app.get("/ecommerce-os/workflows/:workflowId", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ workflowId: z.string().min(1) }).parse(request.params);
    const workflow = getLaunchWorkflow(params.workflowId);
    if (!workflow) {
      return reply.code(404).send({ error: "Workflow not found" });
    }
    return reply.send({ workflow });
  });

  app.post("/ecommerce-os/workflows/start", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        companyId: z.string().min(1),
        brandChoice: z.string().min(1),
        category: z.string().min(1),
      })
      .parse(request.body);

    const workflow = startGrandKingsLaunchWorkflow({
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      brandChoice: body.brandChoice,
      category: body.category,
      actor: user.email,
      correlationId: request.id,
    });

    auditLogger.write({
      action: "ecommerce_os.workflow_started",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { workflowId: workflow.workflowId, category: body.category },
    });

    return reply.code(201).send({ workflow });
  });

  app.post("/ecommerce-os/workflows/:workflowId/research", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ workflowId: z.string().min(1) }).parse(request.params);

    try {
      const workflow = runGrandKingsResearchPhase(params.workflowId);
      auditLogger.write({
        action: "ecommerce_os.research_completed",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { workflowId: params.workflowId, count: workflow.recommendations.length },
      });
      return reply.send({ workflow });
    } catch (error) {
      if (error instanceof EcommerceOsWorkflowNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/ecommerce-os/workflows/:workflowId/approve", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ workflowId: z.string().min(1) }).parse(request.params);
    const body = z.object({ productIds: z.array(z.string().min(1)).min(1) }).parse(request.body);

    try {
      const workflow = approveLaunchProducts({
        workflowId: params.workflowId,
        productIds: body.productIds,
        actor: user.email,
      });
      auditLogger.write({
        action: "ecommerce_os.products_approved",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { workflowId: params.workflowId, productIds: body.productIds },
      });
      return reply.send({ workflow });
    } catch (error) {
      if (error instanceof EcommerceOsWorkflowNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof EcommerceOsWorkflowBlockedError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/ecommerce-os/workflows/:workflowId/prepare", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ workflowId: z.string().min(1) }).parse(request.params);

    try {
      const workflow = await prepareGrandKingsLaunch(params.workflowId);
      auditLogger.write({
        action: "ecommerce_os.launch_prepared",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: {
          workflowId: params.workflowId,
          launchStatus: workflow.launchStatus,
        },
      });
      return reply.send({ workflow, readiness: getLaunchReadiness(params.workflowId) });
    } catch (error) {
      if (error instanceof EcommerceOsWorkflowNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof EcommerceOsWorkflowBlockedError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/ecommerce-os/workflows/:workflowId/readiness", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ workflowId: z.string().min(1) }).parse(request.params);
    try {
      return reply.send({ readiness: getLaunchReadiness(params.workflowId) });
    } catch (error) {
      if (error instanceof EcommerceOsWorkflowNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/marketplace-infrastructure/connections", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const connections = listMarketplaceConnections(user.workspaceId);
    return reply.send({ connections });
  });

  app.get("/marketplace-infrastructure/:marketplaceId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ marketplaceId: z.enum(MARKETPLACE_IDS) }).parse(request.params);
    const connection = getMarketplaceConnection(user.workspaceId, params.marketplaceId);
    const guide = getMarketplaceConnectionGuide(params.marketplaceId);
    return reply.send({ connection, guide });
  });

  app.post("/marketplace-infrastructure/:marketplaceId/connect", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ marketplaceId: z.enum(MARKETPLACE_IDS) }).parse(request.params);
    const connection = startMarketplaceConnection(user.workspaceId, params.marketplaceId, user.email);
    auditLogger.write({
      action: "marketplace_infrastructure.connect_started",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { marketplaceId: params.marketplaceId },
    });
    return reply.send({ connection });
  });

  app.post("/marketplace-infrastructure/:marketplaceId/complete", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ marketplaceId: z.enum(MARKETPLACE_IDS) }).parse(request.params);
    const body = z.object({ credentialsRef: z.string().min(1) }).parse(request.body);
    const connection = completeMarketplaceConnection(user.workspaceId, params.marketplaceId, {
      credentialsRef: body.credentialsRef,
      actor: user.email,
    });
    auditLogger.write({
      action: "marketplace_infrastructure.connect_completed",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { marketplaceId: params.marketplaceId },
    });
    return reply.send({ connection });
  });
}

// Export research for direct use in tests
export { researchLaunchOpportunities };
