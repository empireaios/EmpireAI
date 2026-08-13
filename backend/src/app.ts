import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { z } from "zod";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { getRecentEventLoopLagMs } from "./runtime/event-loop-cooperative.js";
import { getAdmissionStats } from "./runtime/production-admission-control.js";
import { getSqlitePersistStats } from "./brain/sqlite-database.js";
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
import { registerCanvaConnectRoutes } from "./execution/canva-connect-connector/routes/canva-connect-routes.js";
import { registerVisualGenerationRoutes } from "./orchestration/visual-generation-layer/routes/visual-generation-routes.js";
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
import { registerObjectiveManagementRoutes } from "./orchestration/objective-management-engine/routes/objective-management-routes.js";
import { registerKpiEngineRoutes } from "./foundation/kpi-engine/routes/kpi-engine-routes.js";
import { registerDecisionRegistryRoutes } from "./foundation/decision-registry/routes/decision-registry-routes.js";
import { registerStrategicMemoryRoutes } from "./foundation/strategic-memory-engine/routes/strategic-memory-routes.js";
import { registerEcommerceOsRoutes } from "./orchestration/ecommerce-os-orchestrator/routes/ecommerce-os-routes.js";
import { registerAccountInfrastructureRoutes } from "./orchestration/account-infrastructure-engine/routes/account-infrastructure-routes.js";
import { registerMarketplaceConnectionRoutes } from "./orchestration/marketplace-connection-engine/routes/marketplace-connection-routes.js";
import { registerMarketplaceIntegrationArchitectureRoutes } from "./orchestration/infrastructure-commerce/marketplace/routes/marketplace-integration-architecture-routes.js";
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
import {
  getPillowCommercePresaleAutomationServer,
  registerPillowCommercePresaleRoutes,
} from "./orchestration/pillow-commerce-presale/index.js";
import { registerPillowCommissioningRoutes } from "./orchestration/pillow-commissioning/index.js";
import { getPillowExecutiveLoopAutomationServer } from "./orchestration/pillow-commissioning/executive-operating-loop/index.js";
import {
  getPresaleApprovalGate,
  syncPresaleApprovalGateWithPillowHost,
} from "./orchestration/pillow-commerce-presale/approval-bridge.js";
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
import { schedulePillowHostBoot } from "./orchestration/pillow-host/pillow-boot.js";
import { registerPillowApprovalRoutes } from "./orchestration/pillow-approval/index.js";
import { wireCanonicalPillowApprovalPipeline } from "./orchestration/pillow-approval/canonical-pillow-approval-pipeline.js";
import {
  registerExecutiveLearningRoutes,
  seedInstitutionalMemoryBootstrap,
} from "./orchestration/executive-learning/index.js";
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

const breathe = () => new Promise<void>((resolve) => setImmediate(resolve));

export type BuildAppOptions = {
  startWorkers?: boolean;
  startScheduler?: boolean;
  pillowEnabled?: boolean;
  /** Production: listen before registering hundreds of REAL module routes. */
  earlyListen?: boolean;
};

export type EmpireApp = {
  app: FastifyInstance;
  brain: EmpireBrain;
  shutdown: () => Promise<void>;
  finishRouteRegistration?: () => Promise<void>;
};

export async function buildApp(options: BuildAppOptions = {}): Promise<EmpireApp> {
  const startWorkers = options.startWorkers ?? false;
  const startScheduler = options.startScheduler ?? false;
  const pillowEnabled = options.pillowEnabled ?? true;
  const earlyListen = options.earlyListen ?? false;

  const brain = await createBrain({ startWorkers, startScheduler });
  await seedDefaultUsers();

  const deferHeavyBootstrap = env.NODE_ENV === "production";
  if (deferHeavyBootstrap) {
    setImmediate(() => {
      try {
        seedDomainData();
        seedGrandKingAccount();
        bootstrapFoundation("ws_empire_1");
        logger.info("Deferred production bootstrap completed");
      } catch (error) {
        logger.error(
          { error: error instanceof Error ? error.message : String(error) },
          "Deferred production bootstrap failed",
        );
      }
    });
  } else {
    seedDomainData();
    seedGrandKingAccount();
    bootstrapFoundation("ws_empire_1");
  }

  const pillowHost = getPillowHost();
  if (pillowEnabled) {
    const bootDelayMs = env.NODE_ENV === "production" ? 15_000 : 5_000;
    const bootPillowHost = () => {
      void schedulePillowHostBoot(pillowHost, brain.llmRouter, brain.auditLogger)
        ?.then(() => {
          syncPresaleApprovalGateWithPillowHost(pillowHost);
        })
        .catch((error) => {
          logger.error(
            {
              error: error instanceof Error ? error.message : String(error),
            },
            "Pillow host startup failed — backend continues in degraded mode",
          );
        });
    };
    setTimeout(bootPillowHost, bootDelayMs);
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

  app.get("/health/live", async () => {
    const started = performance.now();
    const { getVolumeDiskStats } = await import("./runtime/volume-disk-reclaim.js");
    const { env } = await import("./config/env.js");
    const { getTier0ControlPlaneSnapshot, recordTier0Request } = await import(
      "./runtime/tier0-control-plane.js"
    );
    const payload = {
      status: "ok" as const,
      brain: "online" as const,
      eventLoopLagMs: getRecentEventLoopLagMs(),
      sqlite: getSqlitePersistStats(),
      admission: getAdmissionStats(),
      disk: getVolumeDiskStats(env.DATABASE_PATH),
      tier0: getTier0ControlPlaneSnapshot(),
      // Railway injects RAILWAY_GIT_COMMIT_SHA — use for deploy identity proof.
      deploy: {
        gitCommitSha:
          process.env.RAILWAY_GIT_COMMIT_SHA ||
          process.env.RAILWAY_GIT_COMMIT ||
          null,
        serviceName: process.env.RAILWAY_SERVICE_NAME || null,
        environmentName: process.env.RAILWAY_ENVIRONMENT_NAME || null,
        deploymentId: process.env.RAILWAY_DEPLOYMENT_ID || null,
      },
    };
    recordTier0Request({
      route: "health_live",
      durationMs: performance.now() - started,
      ok: true,
    });
    return payload;
  });

  // Process alive ≠ Grand King auth ready. Ops/probes use this; Railway stays on /health/live.
  app.get("/health/ready", async (_request, reply) => {
    const { assessAuthReadiness } = await import("./auth/auth-readiness.js");
    const report = assessAuthReadiness({ sessionStore });
    const payload = {
      ...report,
      brain: "online" as const,
      process: "running" as const,
    };
    if (!report.ready) {
      return reply.code(503).send(payload);
    }
    return payload;
  });

  app.get("/health/executive-continuity", async () => {
    const { getExecutiveContinuityHealth } = await import(
      "./runtime/executive-continuity-watchdog.js"
    );
    const continuity = getExecutiveContinuityHealth();
    return {
      status: continuity.healthy ? "ok" : "degraded",
      brain: "online",
      continuity,
      eventLoopLagMs: getRecentEventLoopLagMs(),
      sqlite: getSqlitePersistStats(),
    };
  });

  app.get("/health", async () => {
    // Never starve /health/live: skip expensive guardian integrity / Redis under lag.
    // Railway probes must use /health/live only (railway.toml).
    const lagMs = getRecentEventLoopLagMs();
    const skipHeavy = lagMs >= 80 || getSqlitePersistStats().flushInFlight;

    let guardianReport: Record<string, unknown> = { overall: "unknown" };
    if (skipHeavy) {
      guardianReport = {
        overall: "degraded",
        summary: `Heavy /health skipped (lag=${Math.round(lagMs)}ms or sqlite flush in flight) — use /health/live`,
        openRisks: 0,
      };
    } else {
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
    }

    let queueStats: Record<string, number> | { error: string; skipped?: boolean } = {};
    if (skipHeavy) {
      queueStats = { error: "skipped_under_lag", skipped: true };
    } else {
      try {
        queueStats = await brain.taskQueue.getStats();
      } catch (error) {
        queueStats = {
          error: error instanceof Error ? error.message : "Queue unavailable",
        };
      }
    }

    return {
      status: skipHeavy ? "degraded" : "ok",
      brain: "online",
      redisMode: brain.redisMode,
      eventLoopLagMs: lagMs,
      observability: getObservabilitySnapshot(),
      guardian: {
        overall: guardianReport.overall,
        summary: guardianReport.summary,
        openRisks: guardianReport.openRisks,
      },
      llmProviders: brain.llmRouter.listAvailable(),
      queue: queueStats,
      sqlite: getSqlitePersistStats(),
      admission: getAdmissionStats(),
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

  await breathe();
  await registerAuthRoutes(app, {
    sessionStore,
    auditLogger: brain.auditLogger,
  });

  const routeDeps: EmpireRouteDeps = {
    app,
    authenticate,
    sessionStore,
    brain,
    pillowEnabled,
    pillowHost,
    eventStream,
  };

  if (earlyListen) {
    await breathe();
    await registerCockpitCriticalRoutes(routeDeps);
    // Commerce proof path must be available without EMPIRE_ENABLE_EXTENSION_ROUTES.
    // Full REAL-module surface remains deferred behind finishRouteRegistration.
    await breathe();
    await registerCommerceCriticalRoutes(routeDeps);
    return {
      app,
      brain,
      shutdown: createEmpireShutdown({ app, brain, pillowEnabled, eventStream }),
      finishRouteRegistration: () => registerEmpireExtensionRoutes(routeDeps),
    };
  }

  await breathe();
  await registerEmpireExtensionRoutes(routeDeps);

  return {
    app,
    brain,
    shutdown: createEmpireShutdown({ app, brain, pillowEnabled, eventStream }),
  };
}

type EmpireRouteDeps = {
  app: FastifyInstance;
  authenticate: ReturnType<typeof createAuthMiddleware>;
  sessionStore: EmpireBrain["sessionStore"];
  brain: EmpireBrain;
  pillowEnabled: boolean;
  pillowHost: ReturnType<typeof getPillowHost>;
  eventStream: EventStreamHub;
};

function createEmpireShutdown(deps: {
  app: FastifyInstance;
  brain: EmpireBrain;
  pillowEnabled: boolean;
  eventStream: EventStreamHub;
}) {
  return async () => {
    deps.eventStream.stop();
    if (deps.pillowEnabled) {
      await shutdownPillowHost();
    }
    await deps.app.close();
    await deps.brain.shutdown();
  };
}

let commerceCriticalRoutesRegistered = false;

/** Supplier → Amazon listing routes required for first-dollar commerce proof. */
async function registerCommerceCriticalRoutes(deps: EmpireRouteDeps): Promise<void> {
  if (commerceCriticalRoutesRegistered) return;
  const { app, authenticate, brain } = deps;

  await breathe();
  await registerAmazonGlobalSellerRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerMarketplacePublishingRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerVersion1ActivationRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerPillowCommercePresaleRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
    getApprovalGate: () => getPresaleApprovalGate(deps.pillowHost),
  });

  await breathe();
  await registerPillowCommissioningRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  // Proactive Pillow initiation — standing commerce objective, no chat prompt required.
  getPillowCommercePresaleAutomationServer().start();
  getPillowExecutiveLoopAutomationServer().start();

  // Institutional memory must accumulate from day one (cloud SQLite EKB).
  try {
    const seeded = seedInstitutionalMemoryBootstrap(undefined, brain.auditLogger);
    logger.info({ seeded }, "Institutional memory bootstrap seeded");
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      "Institutional memory bootstrap failed — learning degraded",
    );
  }

  commerceCriticalRoutesRegistered = true;
  logger.info(
    "Commerce-critical routes registered (Amazon / marketplace publish / V1 activation / Pillow pre-sale)",
  );
}

async function registerCockpitCriticalRoutes(deps: EmpireRouteDeps): Promise<void> {
  const { app, authenticate, brain, pillowEnabled, pillowHost, eventStream } = deps;

  if (pillowEnabled) {
    await breathe();
  await registerPillowRoutes(app, {
      authenticate,
      pillowHost,
      auditLogger: brain.auditLogger,
      llmRouter: brain.llmRouter,
    });

    // Pillow also boots in the background after server start; session/chat await readiness.
    // Executive Learning review/approve APIs are Cockpit-critical (not deferred REAL modules).
    await breathe();
    await registerExecutiveLearningRoutes(app, {
      authenticate,
      auditLogger: brain.auditLogger,
    });

    // Ensure commerce pre-sale can register Grand King approvals before full Pillow boot.
    wireCanonicalPillowApprovalPipeline(getPresaleApprovalGate(pillowHost));
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

      const dispatchStarted = Date.now();
      if (body.module === "executive-home") {
        logger.info(
          {
            stage: "executive-home.dispatch.enter",
            action: body.action,
            correlationId: body.correlationId ?? request.id,
            workspaceId,
          },
          "Executive home dispatch entered",
        );
      }

      const result = await brain.orchestrator.dispatch({
        module: body.module,
        action: body.action,
        workspaceId,
        companyId: body.companyId,
        payload,
        correlationId: body.correlationId,
      });

      if (body.module === "executive-home") {
        const trace =
          result.result &&
          typeof result.result === "object" &&
          "_trace" in result.result
            ? (result.result as { _trace?: Record<string, number> })._trace
            : undefined;
        logger.info(
          {
            stage: "executive-home.dispatch.exit",
            action: body.action,
            correlationId: result.correlationId,
            durationMs: Date.now() - dispatchStarted,
            trace,
            fallback:
              result.result &&
              typeof result.result === "object" &&
              "_fallback" in result.result
                ? (result.result as { _fallback?: boolean })._fallback
                : undefined,
          },
          "Executive home dispatch completed",
        );
      }

      return reply.send(result);
    },
  );
}

async function registerEmpireExtensionRoutes(deps: EmpireRouteDeps): Promise<void> {
  const { app, authenticate, brain, pillowEnabled, pillowHost, eventStream } = deps;

  await breathe();
  await registerProductIntelligenceRoutes(app, { authenticate });

  await breathe();
  await registerCommerceIntelligenceCoreRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerRevenueLoopRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerProductionDeploymentRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerLivePaymentRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerCustomerOrderPipelineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerLiveCjFulfillmentRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerAnalyticsConversionRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerMetaAdsConnectorRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerCanvaConnectRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerVisualGenerationRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerProductPublishingRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerGrandKingsRevenueRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerFirstRevenueValidationRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerSoulFileRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerSoulRuntimeRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerGovernanceRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerIdentityRegistryRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerDoctrineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerEmpireConstitutionRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerEmpireGovernanceDoctrineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerEmpireArchitectureConstraintsRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerEmpireUxIdentityDoctrineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerEmpireCommercialBusinessDoctrineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerPolicyRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerPromiseRegisterRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerObjectiveManagementRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerKpiEngineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerDecisionRegistryRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerStrategicMemoryRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerEcommerceOsRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerAccountInfrastructureRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerMarketplaceConnectionRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerMarketplaceIntegrationArchitectureRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerCommerceReadinessRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerProductDiscoveryRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerBusinessOpportunityWorkspaceRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerMarketDominationStrategyRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerBusinessBuildRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerBusinessSimulationRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerExecutionLayerRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerRealityIntegrationRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerEyeSeriesRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerOperationFirstDollarRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerEsisRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerMasterCompletionLedgerRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerOperationalAccessRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerIntegrationsHubRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerSupplierIntelligenceRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerCommerceRuntimeRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerGlobalCommerceRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerGlobalCommerceIntelligenceRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerEmpireKnowledgeRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerGlobalCommerceInfrastructureRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerFounderAutomationRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerCommerceCriticalRoutes(deps);

  await breathe();
  await registerCommerceIntelligenceStudioRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerListingIntelligenceRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerProductMediaRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerCommerceExecutionPipelineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerExecutiveVisualDebateRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerGlobalMarketplaceOperationsRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerLiveProductIntelligenceRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerExecutiveProductOptimizationRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerSupplierIntelligenceLoopRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerGlobalOpportunityEngineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerRevenueImprovementEngineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerGlobalCommandCenterRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerEmpireEconomicsRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerGrandKingFinancialCommandCenterRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerFounderPlatformPreparationRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerAiSelfImprovementEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerVersion2BacklogEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerVersion1ReadinessAuditRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerVersion1LockdownRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerCustomerIntelligenceRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerCompetitorIntelligenceRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerCustomerPsychologyEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerGlobalCategoryExpansionEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerGlobalRevenueSimulationRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerAiChiefOfCommerceRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerAiChiefOfGrowthRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerAiChiefOfCustomerRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerGlobalStrategyEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerSuccess001CommandCenterRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerUnifiedGrandKingHeadquartersRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerWorldOperationsMapRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerGlobalMarketShareEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerProductPortfolioCommandRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerExecutiveWarRoomRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerSoulDecisionChamberRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerMissionCommandEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerGlobalExecutionTimelineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerAutonomousAnalysisEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerCommercialMemoryEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerGrandKingLiveOperationsModeRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerGlobalOperationalCommandCenterRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerGlobalAdvertisingIntelligenceRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerFirstOrderOperationsRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerGlobalOrderIntelligenceRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerPostPurchaseIntelligenceRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerGlobalKnowledgeEvolutionRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerAiStrategicMemoryRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerEmpirePlaybookEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerGlobalRiskCommandRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerFounderPlatformReadinessRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerProductionHardeningRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerVersion1AcceptanceTestRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerGrandKingGoLiveChecklistRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerVersion1GoldMasterRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerGlobalBusinessHealthEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerEmpireKpiEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerLiveCommercialInvestigationsRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerCommercialSimulationEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerGlobalExpansionCommandRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerCommercialExplorerRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerEmpireStrategicCenterRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerVersion1GovernanceReviewRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerSuccess001ReadinessReviewRoutes(app, { authenticate, auditLogger: brain.auditLogger });
  await breathe();
  await registerVersion1ExecutiveSignOffRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerGlobalSupplierMarketRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerGlobalMarketplaceAdapterFrameworkRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerMarketplaceDifferenceEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerCountryDifferenceEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerGlobalPriceIntelligenceRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerShippingIntelligenceRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerProductLaunchCommanderRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerPostLaunchCommanderRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerProductScaleEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerProductRetirementEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerEmpireRevenueForecastRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerEmpireCashflowEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerEmpireInvestmentEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerGlobalOpportunityBoardRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerExecutiveStrategyRoomRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerKingDecisionHistoryRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerSoulLearningReviewRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerEmpirePatternLibraryRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerGlobalExpansionScoreRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerEmpirePriorityEngineRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerCommandCenterPolishRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerUxReviewPreparationRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerPerformanceReviewRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerSecurityReviewRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerArchitectureReviewRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerCommercialReviewRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerVersion1FreezeReviewRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerVersion1ReleaseCandidateRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerVersion1GoLiveApprovalRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerCommerceCriticalRoutes(deps);

  await breathe();
  await registerVersion1CompletionRoutes(app, { authenticate, auditLogger: brain.auditLogger });

  await breathe();
  await registerExecutiveCouncilRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerExecutiveSurveillanceRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerGlobalNotificationRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  if (process.env.EMPIRE_LEGACY_GC05_GLOBAL_ASSISTANT === "true") {
    await breathe();
  await registerGlobalAssistantRoutes(app, {
      authenticate,
      auditLogger: brain.auditLogger,
    });
  }

  await breathe();
  await registerGrandKingRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  await breathe();
  await registerGrandKingRevenuePipelineRoutes(app, {
    authenticate,
    auditLogger: brain.auditLogger,
  });

  if (pillowEnabled) {
    if (pillowHost.getStatus().lifecycle === "running") {
      await breathe();
  await registerPillowApprovalRoutes(app, {
        authenticate,
        pillowHost,
        approvalGate: pillowHost.getApprovalGate(),
        cursorBridge: pillowHost.getCursorBridge(),
        auditLogger: brain.auditLogger,
      });
      wireCanonicalPillowApprovalPipeline(pillowHost.getApprovalGate());
      // Executive Learning routes register in Cockpit-critical path (production earlyListen).
      await breathe();
  await registerPillowExecutiveCouncilRoutes(app, {
        authenticate,
        auditLogger: brain.auditLogger,
      });
    }
  }

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
