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
import { registerCommerceIntelligenceCoreRoutes } from "./intelligence/commerce-intelligence-core/routes/commerce-intelligence-core-routes.js";
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
import { registerEmpireConstitutionRoutes } from "./foundation/empire-constitution/routes/empire-constitution-routes.js";
import { registerEmpireGovernanceDoctrineRoutes } from "./foundation/empire-governance-doctrine/routes/empire-governance-doctrine-routes.js";
import { registerEmpireArchitectureConstraintsRoutes } from "./foundation/empire-architecture-constraints/routes/empire-architecture-constraints-routes.js";
import { registerEmpireUxIdentityDoctrineRoutes } from "./foundation/empire-ux-identity-doctrine/routes/empire-ux-identity-doctrine-routes.js";
import { registerEmpireCommercialBusinessDoctrineRoutes } from "./foundation/empire-commercial-business-doctrine/routes/empire-commercial-business-doctrine-routes.js";
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
import { registerMasterCompletionLedgerRoutes } from "./orchestration/master-completion-ledger/routes/master-completion-ledger-routes.js";
import { registerOperationalAccessRoutes } from "./operational-access/routes/operational-access-routes.js";
import { registerIntegrationsHubRoutes } from "./operational-access/integrations-hub/routes/integrations-hub-routes.js";
import { registerSupplierIntelligenceRoutes } from "./supplier-intelligence/routes/supplier-intelligence-routes.js";
import { registerCommerceRuntimeRoutes } from "./runtime/commerce-runtime/routes/commerce-runtime-routes.js";
import { registerGlobalCommerceRoutes } from "./runtime/global-commerce/routes/global-commerce-routes.js";
import { registerGlobalCommerceIntelligenceRoutes } from "./runtime/global-commerce-intelligence/routes/global-commerce-intelligence-routes.js";
import { registerEmpireKnowledgeRoutes } from "./runtime/empire-knowledge/routes/empire-knowledge-routes.js";
import { registerGlobalCommerceInfrastructureRoutes } from "./runtime/global-commerce-infrastructure/routes/global-commerce-infrastructure-routes.js";
import { registerFounderAutomationRoutes } from "./runtime/founder-automation/routes/founder-automation-routes.js";
import { registerAmazonGlobalSellerRoutes } from "./runtime/amazon-global-seller/routes/amazon-global-seller-routes.js";
import { registerCommerceIntelligenceStudioRoutes } from "./runtime/commerce-intelligence-studio/routes/commerce-intelligence-studio-routes.js";
import { registerMarketplacePublishingRoutes } from "./runtime/marketplace-publishing/routes/marketplace-publishing-routes.js";
import { registerListingIntelligenceRoutes } from "./runtime/listing-intelligence/routes/listing-intelligence-routes.js";
import { registerProductMediaRoutes } from "./runtime/product-media/routes/product-media-routes.js";
import { registerCommerceExecutionPipelineRoutes } from "./runtime/commerce-execution-pipeline/routes/commerce-execution-pipeline-routes.js";
import { registerExecutiveVisualDebateRoutes } from "./runtime/executive-visual-debate/routes/executive-visual-debate-routes.js";
import { registerGlobalMarketplaceOperationsRoutes } from "./runtime/global-marketplace-operations/routes/global-marketplace-operations-routes.js";
import { registerLiveProductIntelligenceRoutes } from "./runtime/live-product-intelligence/routes/live-product-intelligence-routes.js";
import { registerExecutiveProductOptimizationRoutes } from "./runtime/executive-product-optimization/routes/executive-product-optimization-routes.js";
import { registerSupplierIntelligenceLoopRoutes } from "./runtime/supplier-intelligence-loop/routes/supplier-intelligence-loop-routes.js";
import { registerGlobalOpportunityEngineRoutes } from "./runtime/global-opportunity-engine/routes/global-opportunity-engine-routes.js";
import { registerRevenueImprovementEngineRoutes } from "./runtime/revenue-improvement-engine/routes/revenue-improvement-engine-routes.js";
import { registerGlobalCommandCenterRoutes } from "./runtime/global-command-center/routes/global-command-center-routes.js";
import { registerEmpireEconomicsRoutes } from "./runtime/empire-economics/routes/empire-economics-routes.js";
import { registerGrandKingFinancialCommandCenterRoutes } from "./runtime/grand-king-financial-command-center/routes/grand-king-financial-command-center-routes.js";
import { registerFounderPlatformPreparationRoutes } from "./runtime/founder-platform-preparation/routes/founder-platform-preparation-routes.js";
import { registerAiSelfImprovementEngineRoutes } from "./runtime/ai-self-improvement-engine/routes/ai-self-improvement-engine-routes.js";
import { registerVersion2BacklogEngineRoutes } from "./runtime/version-2-backlog-engine/routes/version-2-backlog-engine-routes.js";
import { registerVersion1ReadinessAuditRoutes } from "./runtime/version-1-readiness-audit/routes/version-1-readiness-audit-routes.js";
import { registerVersion1LockdownRoutes } from "./runtime/version-1-lockdown/routes/version-1-lockdown-routes.js";
import { registerCustomerIntelligenceRoutes } from "./runtime/customer-intelligence/routes/customer-intelligence-routes.js";
import { registerCompetitorIntelligenceRoutes } from "./runtime/competitor-intelligence/routes/competitor-intelligence-routes.js";
import { registerCustomerPsychologyEngineRoutes } from "./runtime/customer-psychology-engine/routes/customer-psychology-engine-routes.js";
import { registerGlobalCategoryExpansionEngineRoutes } from "./runtime/global-category-expansion-engine/routes/global-category-expansion-engine-routes.js";
import { registerGlobalRevenueSimulationRoutes } from "./runtime/global-revenue-simulation/routes/global-revenue-simulation-routes.js";
import { registerAiChiefOfCommerceRoutes } from "./runtime/ai-chief-of-commerce/routes/ai-chief-of-commerce-routes.js";
import { registerAiChiefOfGrowthRoutes } from "./runtime/ai-chief-of-growth/routes/ai-chief-of-growth-routes.js";
import { registerAiChiefOfCustomerRoutes } from "./runtime/ai-chief-of-customer/routes/ai-chief-of-customer-routes.js";
import { registerGlobalStrategyEngineRoutes } from "./runtime/global-strategy-engine/routes/global-strategy-engine-routes.js";
import { registerSuccess001CommandCenterRoutes } from "./runtime/success-001-command-center/routes/success-001-command-center-routes.js";
import { registerUnifiedGrandKingHeadquartersRoutes } from "./runtime/unified-grand-king-headquarters/routes/unified-grand-king-headquarters-routes.js";
import { registerWorldOperationsMapRoutes } from "./runtime/world-operations-map/routes/world-operations-map-routes.js";
import { registerGlobalMarketShareEngineRoutes } from "./runtime/global-market-share-engine/routes/global-market-share-engine-routes.js";
import { registerProductPortfolioCommandRoutes } from "./runtime/product-portfolio-command/routes/product-portfolio-command-routes.js";
import { registerExecutiveWarRoomRoutes } from "./runtime/executive-war-room/routes/executive-war-room-routes.js";
import { registerSoulDecisionChamberRoutes } from "./runtime/soul-decision-chamber/routes/soul-decision-chamber-routes.js";
import { registerMissionCommandEngineRoutes } from "./runtime/mission-command-engine/routes/mission-command-engine-routes.js";
import { registerGlobalExecutionTimelineRoutes } from "./runtime/global-execution-timeline/routes/global-execution-timeline-routes.js";
import { registerAutonomousAnalysisEngineRoutes } from "./runtime/autonomous-analysis-engine/routes/autonomous-analysis-engine-routes.js";
import { registerCommercialMemoryEngineRoutes } from "./runtime/commercial-memory-engine/routes/commercial-memory-engine-routes.js";
import { registerGrandKingLiveOperationsModeRoutes } from "./runtime/grand-king-live-operations-mode/routes/grand-king-live-operations-mode-routes.js";
import { registerGlobalOperationalCommandCenterRoutes } from "./runtime/global-operational-command-center/routes/global-operational-command-center-routes.js";
import { registerGlobalAdvertisingIntelligenceRoutes } from "./runtime/global-advertising-intelligence/routes/global-advertising-intelligence-routes.js";
import { registerFirstOrderOperationsRoutes } from "./runtime/first-order-operations/routes/first-order-operations-routes.js";
import { registerGlobalOrderIntelligenceRoutes } from "./runtime/global-order-intelligence/routes/global-order-intelligence-routes.js";
import { registerPostPurchaseIntelligenceRoutes } from "./runtime/post-purchase-intelligence/routes/post-purchase-intelligence-routes.js";
import { registerGlobalKnowledgeEvolutionRoutes } from "./runtime/global-knowledge-evolution/routes/global-knowledge-evolution-routes.js";
import { registerAiStrategicMemoryRoutes } from "./runtime/ai-strategic-memory/routes/ai-strategic-memory-routes.js";
import { registerEmpirePlaybookEngineRoutes } from "./runtime/empire-playbook-engine/routes/empire-playbook-engine-routes.js";
import { registerGlobalRiskCommandRoutes } from "./runtime/global-risk-command/routes/global-risk-command-routes.js";
import { registerFounderPlatformReadinessRoutes } from "./runtime/founder-platform-readiness/routes/founder-platform-readiness-routes.js";
import { registerProductionHardeningRoutes } from "./runtime/production-hardening/routes/production-hardening-routes.js";
import { registerVersion1AcceptanceTestRoutes } from "./runtime/version-1-acceptance-test/routes/version-1-acceptance-test-routes.js";
import { registerGrandKingGoLiveChecklistRoutes } from "./runtime/grand-king-go-live-checklist/routes/grand-king-go-live-checklist-routes.js";
import { registerVersion1GoldMasterRoutes } from "./runtime/version-1-gold-master/routes/version-1-gold-master-routes.js";
import { registerGlobalBusinessHealthEngineRoutes } from "./runtime/global-business-health-engine/routes/global-business-health-engine-routes.js";
import { registerEmpireKpiEngineRoutes } from "./runtime/empire-kpi-engine/routes/empire-kpi-engine-routes.js";
import { registerLiveCommercialInvestigationsRoutes } from "./runtime/live-commercial-investigations/routes/live-commercial-investigations-routes.js";
import { registerCommercialSimulationEngineRoutes } from "./runtime/commercial-simulation-engine/routes/commercial-simulation-engine-routes.js";
import { registerGlobalExpansionCommandRoutes } from "./runtime/global-expansion-command/routes/global-expansion-command-routes.js";
import { registerCommercialExplorerRoutes } from "./runtime/commercial-explorer/routes/commercial-explorer-routes.js";
import { registerEmpireStrategicCenterRoutes } from "./runtime/empire-strategic-center/routes/empire-strategic-center-routes.js";
import { registerVersion1GovernanceReviewRoutes } from "./runtime/version-1-governance-review/routes/version-1-governance-review-routes.js";
import { registerSuccess001ReadinessReviewRoutes } from "./runtime/success-001-readiness-review/routes/success-001-readiness-review-routes.js";
import { registerVersion1ExecutiveSignOffRoutes } from "./runtime/version-1-executive-sign-off/routes/version-1-executive-sign-off-routes.js";
import { registerGlobalSupplierMarketRoutes } from "./runtime/global-supplier-market/routes/global-supplier-market-routes.js";
import { registerGlobalMarketplaceAdapterFrameworkRoutes } from "./runtime/global-marketplace-adapter-framework/routes/global-marketplace-adapter-framework-routes.js";
import { registerMarketplaceDifferenceEngineRoutes } from "./runtime/marketplace-difference-engine/routes/marketplace-difference-engine-routes.js";
import { registerCountryDifferenceEngineRoutes } from "./runtime/country-difference-engine/routes/country-difference-engine-routes.js";
import { registerGlobalPriceIntelligenceRoutes } from "./runtime/global-price-intelligence/routes/global-price-intelligence-routes.js";
import { registerShippingIntelligenceRoutes } from "./runtime/shipping-intelligence/routes/shipping-intelligence-routes.js";
import { registerProductLaunchCommanderRoutes } from "./runtime/product-launch-commander/routes/product-launch-commander-routes.js";
import { registerPostLaunchCommanderRoutes } from "./runtime/post-launch-commander/routes/post-launch-commander-routes.js";
import { registerProductScaleEngineRoutes } from "./runtime/product-scale-engine/routes/product-scale-engine-routes.js";
import { registerProductRetirementEngineRoutes } from "./runtime/product-retirement-engine/routes/product-retirement-engine-routes.js";
import { registerEmpireRevenueForecastRoutes } from "./runtime/empire-revenue-forecast/routes/empire-revenue-forecast-routes.js";
import { registerEmpireCashflowEngineRoutes } from "./runtime/empire-cashflow-engine/routes/empire-cashflow-engine-routes.js";
import { registerEmpireInvestmentEngineRoutes } from "./runtime/empire-investment-engine/routes/empire-investment-engine-routes.js";
import { registerGlobalOpportunityBoardRoutes } from "./runtime/global-opportunity-board/routes/global-opportunity-board-routes.js";
import { registerExecutiveStrategyRoomRoutes } from "./runtime/executive-strategy-room/routes/executive-strategy-room-routes.js";
import { registerKingDecisionHistoryRoutes } from "./runtime/king-decision-history/routes/king-decision-history-routes.js";
import { registerSoulLearningReviewRoutes } from "./runtime/soul-learning-review/routes/soul-learning-review-routes.js";
import { registerEmpirePatternLibraryRoutes } from "./runtime/empire-pattern-library/routes/empire-pattern-library-routes.js";
import { registerGlobalExpansionScoreRoutes } from "./runtime/global-expansion-score/routes/global-expansion-score-routes.js";
import { registerEmpirePriorityEngineRoutes } from "./runtime/empire-priority-engine/routes/empire-priority-engine-routes.js";
import { registerCommandCenterPolishRoutes } from "./runtime/command-center-polish/routes/command-center-polish-routes.js";
import { registerUxReviewPreparationRoutes } from "./runtime/ux-review-preparation/routes/ux-review-preparation-routes.js";
import { registerPerformanceReviewRoutes } from "./runtime/performance-review/routes/performance-review-routes.js";
import { registerSecurityReviewRoutes } from "./runtime/security-review/routes/security-review-routes.js";
import { registerArchitectureReviewRoutes } from "./runtime/architecture-review/routes/architecture-review-routes.js";
import { registerCommercialReviewRoutes } from "./runtime/commercial-review/routes/commercial-review-routes.js";
import { registerVersion1FreezeReviewRoutes } from "./runtime/version-1-freeze-review/routes/version-1-freeze-review-routes.js";
import { registerVersion1ReleaseCandidateRoutes } from "./runtime/version-1-release-candidate/routes/version-1-release-candidate-routes.js";
import { registerVersion1GoLiveApprovalRoutes } from "./runtime/version-1-go-live-approval/routes/version-1-go-live-approval-routes.js";
import { registerVersion1CompletionRoutes } from "./runtime/version-1-completion/routes/version-1-completion-routes.js";
import { registerVersion1ActivationRoutes } from "./orchestration/version-1-activation/routes/version-1-activation-routes.js";
import { registerExecutiveCouncilRoutes } from "./executive-council/routes/executive-council-routes.js";
import { registerExecutiveSurveillanceRoutes } from "./executive-surveillance/routes/executive-surveillance-routes.js";
import { registerGlobalNotificationRoutes } from "./global-notifications/routes/global-notification-routes.js";
import { registerGlobalAssistantRoutes } from "./global-assistant/routes/global-assistant-routes.js";
import { registerGrandKingRoutes } from "./grand-king/routes/grand-king-routes.js";
import { registerGrandKingRevenuePipelineRoutes } from "./grand-king-revenue-pipeline/routes/grand-king-revenue-pipeline-routes.js";
import {
  getPillowHost,
  initializePillowHost,
  registerPillowRoutes,
  shutdownPillowHost,
} from "./orchestration/pillow-host/index.js";
import { registerPillowApprovalRoutes } from "./orchestration/pillow-approval/index.js";
import { registerExecutiveLearningRoutes } from "./orchestration/executive-learning/index.js";
import { registerPillowExecutiveCouncilRoutes } from "./orchestration/pillow-executive-council/index.js";
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
  pillowEnabled?: boolean;
};

export type EmpireApp = {
  app: FastifyInstance;
  brain: EmpireBrain;
  shutdown: () => Promise<void>;
};

export async function buildApp(options: BuildAppOptions = {}): Promise<EmpireApp> {
  const startWorkers = options.startWorkers ?? false;
  const startScheduler = options.startScheduler ?? false;
  const pillowEnabled = options.pillowEnabled ?? true;

  const brain = await createBrain({ startWorkers, startScheduler });
  await seedDefaultUsers();
  seedDomainData();
  seedGrandKingAccount();
  bootstrapFoundation("ws_empire_1");

  let pillowHost = getPillowHost();
  if (pillowEnabled) {
    try {
      pillowHost = await initializePillowHost({
        llmRouter: brain.llmRouter,
        auditLogger: brain.auditLogger,
      });
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        "Pillow host startup failed — backend continues in degraded mode",
      );
      pillowHost = getPillowHost();
    }
  }

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

  await registerCommerceIntelligenceCoreRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

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

  await registerEmpireConstitutionRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerEmpireGovernanceDoctrineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerEmpireArchitectureConstraintsRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerEmpireUxIdentityDoctrineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerEmpireCommercialBusinessDoctrineRoutes(app, {
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

  await registerMasterCompletionLedgerRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerOperationalAccessRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerIntegrationsHubRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerSupplierIntelligenceRoutes(app, {
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

  await registerMarketplacePublishingRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerListingIntelligenceRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerProductMediaRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerCommerceExecutionPipelineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerExecutiveVisualDebateRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerGlobalMarketplaceOperationsRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerLiveProductIntelligenceRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerExecutiveProductOptimizationRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerSupplierIntelligenceLoopRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerGlobalOpportunityEngineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerRevenueImprovementEngineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerGlobalCommandCenterRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerEmpireEconomicsRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerGrandKingFinancialCommandCenterRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerFounderPlatformPreparationRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerAiSelfImprovementEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerVersion2BacklogEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerVersion1ReadinessAuditRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerVersion1LockdownRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerCustomerIntelligenceRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerCompetitorIntelligenceRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerCustomerPsychologyEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerGlobalCategoryExpansionEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerGlobalRevenueSimulationRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerAiChiefOfCommerceRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerAiChiefOfGrowthRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerAiChiefOfCustomerRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerGlobalStrategyEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerSuccess001CommandCenterRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerUnifiedGrandKingHeadquartersRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerWorldOperationsMapRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerGlobalMarketShareEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerProductPortfolioCommandRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerExecutiveWarRoomRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerSoulDecisionChamberRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerMissionCommandEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerGlobalExecutionTimelineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerAutonomousAnalysisEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerCommercialMemoryEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerGrandKingLiveOperationsModeRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerGlobalOperationalCommandCenterRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerGlobalAdvertisingIntelligenceRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerFirstOrderOperationsRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerGlobalOrderIntelligenceRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerPostPurchaseIntelligenceRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerGlobalKnowledgeEvolutionRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerAiStrategicMemoryRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerEmpirePlaybookEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerGlobalRiskCommandRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerFounderPlatformReadinessRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerProductionHardeningRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerVersion1AcceptanceTestRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerGrandKingGoLiveChecklistRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerVersion1GoldMasterRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerGlobalBusinessHealthEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerEmpireKpiEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerLiveCommercialInvestigationsRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerCommercialSimulationEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerGlobalExpansionCommandRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerCommercialExplorerRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerEmpireStrategicCenterRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerVersion1GovernanceReviewRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerSuccess001ReadinessReviewRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await registerVersion1ExecutiveSignOffRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerGlobalSupplierMarketRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerGlobalMarketplaceAdapterFrameworkRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerMarketplaceDifferenceEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerCountryDifferenceEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerGlobalPriceIntelligenceRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerShippingIntelligenceRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerProductLaunchCommanderRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerPostLaunchCommanderRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerProductScaleEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerProductRetirementEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerEmpireRevenueForecastRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerEmpireCashflowEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerEmpireInvestmentEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerGlobalOpportunityBoardRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerExecutiveStrategyRoomRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerKingDecisionHistoryRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerSoulLearningReviewRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerEmpirePatternLibraryRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerGlobalExpansionScoreRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerEmpirePriorityEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerCommandCenterPolishRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerUxReviewPreparationRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerPerformanceReviewRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerSecurityReviewRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerArchitectureReviewRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerCommercialReviewRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerVersion1FreezeReviewRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerVersion1ReleaseCandidateRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerVersion1GoLiveApprovalRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerVersion1ActivationRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerVersion1CompletionRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await registerExecutiveCouncilRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerExecutiveSurveillanceRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerGlobalNotificationRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await registerGlobalAssistantRoutes(app, {
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

  if (pillowEnabled) {
    await registerPillowRoutes(app, {
      authenticate,
      pillowHost,
      auditLogger: brain.auditLogger,
    });
    if (pillowHost.getStatus().lifecycle === "running") {
      await registerPillowApprovalRoutes(app, {
        authenticate,
        pillowHost,
        approvalGate: pillowHost.getApprovalGate(),
        cursorBridge: pillowHost.getCursorBridge(),
        auditLogger: brain.auditLogger,
      });
      await registerExecutiveLearningRoutes(app, {
        authenticate,
        auditLogger: brain.auditLogger,
      });
      await registerPillowExecutiveCouncilRoutes(app, {
        authenticate,
        auditLogger: brain.auditLogger,
      });
    }
  }

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
    if (pillowEnabled) {
      await shutdownPillowHost();
    }
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
