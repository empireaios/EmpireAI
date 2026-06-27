import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { z } from "zod";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { createBrain, type EmpireBrain } from "./brain/index.js";
import { registerAuthRoutes } from "./auth/routes.js";
import { registerProductIntelligenceRoutes } from "./intelligence/product-intelligence-engine/routes.js";
import { registerRevenueLoopRoutes } from "./revenue/minimum-live-revenue-loop/routes/revenue-loop-routes.js";
import { registerProductionDeploymentRoutes } from "./execution/production-store-deployment/routes/production-deployment-routes.js";
import { registerLivePaymentRoutes } from "./revenue/live-payment-engine/routes/live-payment-routes.js";
import { registerCustomerOrderPipelineRoutes } from "./revenue/customer-order-pipeline/routes/customer-order-pipeline-routes.js";
import { registerLiveCjFulfillmentRoutes } from "./execution/live-cj-fulfillment/routes/live-cj-fulfillment-routes.js";
import { registerAnalyticsConversionRoutes } from "./execution/analytics-conversion-engine/routes/analytics-conversion-routes.js";
import { registerMetaAdsConnectorRoutes } from "./execution/meta-ads-connector/routes/meta-ads-connector-routes.js";
import { registerProductPublishingRoutes } from "./execution/product-publishing-engine/routes/product-publishing-routes.js";
import { registerGrandKingsRevenueRoutes } from "./revenue/grand-kings-revenue-engine/routes/grand-kings-revenue-routes.js";
import { registerFirstRevenueValidationRoutes } from "./revenue/first-revenue-validation/routes/first-revenue-validation-routes.js";
import { registerSoulFileRoutes } from "./foundation/soul-file/routes/soul-file-routes.js";
import { registerSoulRuntimeRoutes } from "./foundation/soul-runtime/routes/soul-runtime-routes.js";
import { registerGovernanceRoutes } from "./foundation/empire-governance/routes/governance-routes.js";
import { registerIdentityRegistryRoutes } from "./foundation/identity-registry/routes/identity-registry-routes.js";
import { registerDoctrineRoutes } from "./foundation/doctrine-engine/routes/doctrine-routes.js";
import { registerPolicyRoutes } from "./foundation/policy-engine/routes/policy-routes.js";
import { registerPromiseRegisterRoutes } from "./foundation/promise-register/routes/promise-register-routes.js";
import { registerKpiEngineRoutes } from "./foundation/kpi-engine/routes/kpi-engine-routes.js";
import { registerDecisionRegistryRoutes } from "./foundation/decision-registry/routes/decision-registry-routes.js";
import { registerStrategicMemoryRoutes } from "./foundation/strategic-memory-engine/routes/strategic-memory-routes.js";
import { registerEcommerceOsRoutes } from "./orchestration/ecommerce-os-orchestrator/routes/ecommerce-os-routes.js";
import { registerAccountInfrastructureRoutes } from "./orchestration/account-infrastructure-engine/routes/account-infrastructure-routes.js";
import { registerMarketplaceConnectionRoutes } from "./orchestration/marketplace-connection-engine/routes/marketplace-connection-routes.js";
import { registerCommerceReadinessRoutes } from "./orchestration/commerce-readiness-engine/routes/commerce-readiness-routes.js";
import { registerProductDiscoveryRoutes } from "./orchestration/product-discovery-opportunity-engine/routes/product-discovery-routes.js";
import { registerBusinessOpportunityWorkspaceRoutes } from "./orchestration/business-opportunity-workspace/routes/business-opportunity-workspace-routes.js";
import { registerMarketDominationStrategyRoutes } from "./orchestration/market-domination-strategy-engine/routes/market-domination-strategy-routes.js";
import { registerBusinessBuildRoutes } from "./orchestration/business-build-engine/routes/business-build-routes.js";
import { registerBusinessSimulationRoutes } from "./orchestration/business-simulation-engine/routes/business-simulation-routes.js";
import { registerExecutionLayerRoutes } from "./orchestration/execution-layer/routes/execution-layer-routes.js";
import { registerRealityIntegrationRoutes } from "./orchestration/reality-integration/routes/reality-integration-routes.js";
import { registerEyeSeriesRoutes } from "./orchestration/eye-series/routes/eye-series-routes.js";
import { registerOperationFirstDollarRoutes } from "./operation-first-dollar/routes/operation-first-dollar-routes.js";
import { registerEsisRoutes } from "./orchestration/empire-self-inspection/routes/esis-routes.js";
import { registerCommerceRuntimeRoutes } from "./runtime/commerce-runtime/routes/commerce-runtime-routes.js";
import { registerGlobalCommerceRoutes } from "./runtime/global-commerce/routes/global-commerce-routes.js";
import { registerGlobalCommerceIntelligenceRoutes } from "./runtime/global-commerce-intelligence/routes/global-commerce-intelligence-routes.js";
import { registerEmpireKnowledgeRoutes } from "./runtime/empire-knowledge/routes/empire-knowledge-routes.js";
import { registerGlobalCommerceInfrastructureRoutes } from "./runtime/global-commerce-infrastructure/routes/global-commerce-infrastructure-routes.js";
import { registerFounderAutomationRoutes } from "./runtime/founder-automation/routes/founder-automation-routes.js";
import { registerAmazonGlobalSellerRoutes } from "./runtime/amazon-global-seller/routes/amazon-global-seller-routes.js";
import { registerCommerceIntelligenceStudioRoutes } from "./runtime/commerce-intelligence-studio/routes/commerce-intelligence-studio-routes.js";
import { registerExecutiveCouncilRoutes } from "./executive-council/routes/executive-council-routes.js";
import { registerExecutiveSurveillanceRoutes } from "./executive-surveillance/routes/executive-surveillance-routes.js";
import { registerGrandKingRoutes } from "./grand-king/routes/grand-king-routes.js";
import { registerGrandKingRevenuePipelineRoutes } from "./grand-king-revenue-pipeline/routes/grand-king-revenue-pipeline-routes.js";
import { seedGrandKingAccount } from "./grand-king/services/grand-king-seed-service.js";
import { GovernanceBlockedError } from "./foundation/empire-governance/services/governance-engine.js";
import { seedDefaultUsers } from "./auth/seed-users.js";
import { createAuthMiddleware } from "./auth/middleware.js";
import { canAccessModule } from "./auth/permissions.js";
import { EventStreamHub } from "./brain/events/event-stream.js";
import { GuardianBlockedError } from "./guardian/guardian-engine.js";
import { seedDomainData } from "./domain/seed.js";
import { bootstrapFoundation } from "./foundation/index.js";
import { getObservabilitySnapshot, recordRequest } from "./observability/metrics.js";

const dispatchSchema = z.object({
  module: z.string().min(1),
  action: z.string().min(1),
  workspaceId: z.string().min(1).optional(),
  companyId: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
  correlationId: z.string().optional(),
});

export type BuildAppOptions = {
  startWorkers?: boolean;
  startScheduler?: boolean;
};

export type EmpireApp = {
  app: FastifyInstance;
  brain: EmpireBrain;
  shutdown: () => Promise<void>;
};

export async function buildApp(options: BuildAppOptions = {}): Promise<EmpireApp> {
  const startWorkers = options.startWorkers ?? false;
  const startScheduler = options.startScheduler ?? false;

  const brain = await createBrain({ startWorkers, startScheduler });
  await seedDefaultUsers();
  seedDomainData();
  seedGrandKingAccount();
  bootstrapFoundation("ws_empire_1");

  const sessionStore = brain.sessionStore;
  const authenticate = createAuthMiddleware(sessionStore);
  const eventStream = new EventStreamHub(brain.eventBus);
  eventStream.start();

  const app = Fastify({ logger: false });

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(cookie, {
    secret: env.SESSION_SECRET,
  });

  app.addHook("onRequest", async (request) => {
    (request as typeof request & { startTime: number }).startTime = Date.now();
  });

  app.addHook("onResponse", async (request, reply) => {
    const startTime = (request as typeof request & { startTime?: number }).startTime;
    recordRequest({
      path: request.url,
      method: request.method,
      statusCode: reply.statusCode,
      durationMs: startTime ? Date.now() - startTime : 0,
    });
  });

  app.setErrorHandler((error, request, reply) => {
    const err = error instanceof Error ? error : new Error(String(error));
    const statusFromError =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof (error as { statusCode?: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : undefined;

    logger.error(
      {
        error: err.message,
        stack: err.stack,
        path: request.url,
        method: request.method,
      },
      "Request failed",
    );

    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: "Validation failed",
        details: error.flatten(),
      });
    }

    if (error instanceof GuardianBlockedError) {
      return reply.code(403).send({
        error: error.message,
        guardian: error.verdict,
      });
    }

    if (error instanceof GovernanceBlockedError) {
      return reply.code(403).send({
        error: error.message,
        governance: error.verdict,
        blocked: true,
      });
    }

    const statusCode = statusFromError ?? 500;

    return reply.code(statusCode).send({
      error: err.message || "Internal server error",
    });
  });

  app.get("/health", async () => {
    let guardianReport: Record<string, unknown> = { overall: "unknown" };
    try {
      guardianReport = (await brain.guardian.checkHealth(brain, {
        recordRisks: false,
      })) as unknown as Record<string, unknown>;
    } catch (error) {
      guardianReport = {
        overall: "failed",
        summary: error instanceof Error ? error.message : "Health check failed",
      };
    }

    let queueStats: Record<string, number> | { error: string } = {};
    try {
      queueStats = await brain.taskQueue.getStats();
    } catch (error) {
      queueStats = {
        error: error instanceof Error ? error.message : "Queue unavailable",
      };
    }

    return {
      status: "ok",
      brain: "online",
      redisMode: brain.redisMode,
      observability: getObservabilitySnapshot(),
      guardian: {
        overall: guardianReport.overall,
        summary: guardianReport.summary,
        openRisks: guardianReport.openRisks,
      },
      llmProviders: brain.llmRouter.listAvailable(),
      queue: queueStats,
    };
  });

  app.get(
    "/guardian/health",
    { preHandler: authenticate },
    async () => brain.guardian.checkHealth(brain),
  );

  app.get(
    "/guardian/risks",
    { preHandler: authenticate },
    async (request, reply) => {
      if (request.user!.role !== "admin") {
        return reply.code(403).send({ error: "Admin access required" });
      }
      return {
        risks: brain.guardian.listOpenRisks(),
        lastHealth: brain.guardian.getLastHealthReport(),
      };
    },
  );

  app.post(
    "/guardian/risks/:riskId/resolve",
    { preHandler: authenticate },
    async (request, reply) => {
      if (request.user!.role !== "admin") {
        return reply.code(403).send({ error: "Admin access required" });
      }
      const params = z.object({ riskId: z.string() }).parse(request.params);
      const resolved = brain.guardian.resolveRisk(params.riskId);
      if (!resolved) {
        return reply.code(404).send({ error: "Risk not found or already resolved" });
      }
      return { ok: true, riskId: params.riskId };
    },
  );

  app.get(
    "/metrics",
    { preHandler: authenticate },
    async (request, reply) => {
      if (request.user!.role !== "admin") {
        return reply.code(403).send({ error: "Admin access required" });
      }
      return getObservabilitySnapshot();
    },
  );

  await registerAuthRoutes(app, {
    sessionStore,
    auditLogger: brain.auditLogger,
  });

  await registerProductIntelligenceRoutes(app, { authenticate });

  await registerRevenueLoopRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerProductionDeploymentRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerLivePaymentRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerCustomerOrderPipelineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerLiveCjFulfillmentRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerAnalyticsConversionRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerMetaAdsConnectorRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerProductPublishingRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerGrandKingsRevenueRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerFirstRevenueValidationRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerSoulFileRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerSoulRuntimeRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerGovernanceRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerIdentityRegistryRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerDoctrineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerPolicyRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerPromiseRegisterRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerKpiEngineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerDecisionRegistryRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerStrategicMemoryRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerEcommerceOsRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerAccountInfrastructureRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerMarketplaceConnectionRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerCommerceReadinessRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerProductDiscoveryRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerBusinessOpportunityWorkspaceRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerMarketDominationStrategyRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerBusinessBuildRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerBusinessSimulationRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerExecutionLayerRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerRealityIntegrationRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerEyeSeriesRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerOperationFirstDollarRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerEsisRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerCommerceRuntimeRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerGlobalCommerceRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerGlobalCommerceIntelligenceRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerEmpireKnowledgeRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerGlobalCommerceInfrastructureRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerFounderAutomationRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerAmazonGlobalSellerRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerCommerceIntelligenceStudioRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerExecutiveCouncilRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerExecutiveSurveillanceRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerGrandKingRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerGrandKingRevenuePipelineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  app.get(
    "/brain/events/stream",
    { preHandler: authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId;
      eventStream.attach(request, reply, workspaceId);
      return reply;
    },
  );

  app.post(
    "/brain/dispatch",
    { preHandler: authenticate },
    async (request, reply) => {
      const body = dispatchSchema.parse(request.body);
      const user = request.user!;

      if (!canAccessModule(user.role, body.module)) {
        return reply.code(403).send({
          error: `Access denied for module: ${body.module}`,
        });
      }

      const workspaceId = user.workspaceId;
      if (body.workspaceId && body.workspaceId !== workspaceId) {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      const payload = { ...body.payload };
      const isFounderApproval =
        body.module === "ai-ceo" &&
        (body.action === "approve" || body.action === "approve_all") &&
        (user.role === "founder" || user.role === "admin");

      if (isFounderApproval) {
        payload.founderApproved = true;
      }

      const result = await brain.orchestrator.dispatch({
        module: body.module,
        action: body.action,
        workspaceId,
        companyId: body.companyId,
        payload,
        correlationId: body.correlationId,
      });

      return reply.send(result);
    },
  );

  app.get(
    "/brain/agents",
    { preHandler: authenticate },
    async (request, reply) => {
      if (request.user!.role !== "admin") {
        return reply.code(403).send({ error: "Admin access required" });
      }
      return reply.send({ agents: brain.agentManager.list() });
    },
  );

  app.get(
    "/brain/tools",
    { preHandler: authenticate },
    async (request, reply) => {
      if (request.user!.role !== "admin") {
        return reply.code(403).send({ error: "Admin access required" });
      }
      return reply.send({ tools: brain.toolRegistry.list() });
    },
  );

  app.get(
    "/brain/audit",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z
        .object({
          workspaceId: z.string().optional(),
          correlationId: z.string().optional(),
          limit: z.coerce.number().optional(),
        })
        .parse(request.query);

      const workspaceId = query.workspaceId ?? user.workspaceId;
      if (workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace access denied" });
      }

      return reply.send(
        brain.auditLogger.query({
          workspaceId,
          correlationId: query.correlationId,
          limit: query.limit,
        }),
      );
    },
  );

  app.get(
    "/brain/memory",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z
        .object({
          scope: z.enum(["session", "workspace", "company", "agent"]),
          workspaceId: z.string().optional(),
          companyId: z.string().optional(),
          agentId: z.string().optional(),
          prefix: z.string().optional(),
        })
        .parse(request.query);

      const workspaceId = query.workspaceId ?? user.workspaceId;
      if (workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace access denied" });
      }

      return reply.send(
        brain.memoryStore.list({ ...query, workspaceId }),
      );
    },
  );

  const shutdown = async () => {
    eventStream.stop();
    await app.close();
    await brain.shutdown();
  };

  return { app, brain, shutdown };
}

let appPromise: Promise<FastifyInstance> | null = null;

/** Cached Fastify instance for Vercel serverless invocations. */
export async function getApp(): Promise<FastifyInstance> {
  if (!appPromise) {
    appPromise = buildApp({
      startWorkers: false,
      startScheduler: false,
    }).then(async ({ app }) => {
      await app.ready();
      return app;
    });
  }
  return appPromise;
}
