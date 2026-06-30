import {
  createBullMQConnection,
  createRedisClient,
  probeRedisAvailable,
  REDIS_START_HINT,
  shouldAllowRedisDegradedMode,
  type RedisClient,
} from "../config/redis-client.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { agentDefinitions } from "../agents/definitions/agents.js";
import { moduleRoutes } from "../agents/routes/module-routes.js";
import { coreTools } from "../agents/tools/core-tools.js";
import { aiCeoTools } from "../agents/tools/ai-ceo-tools.js";
import { moduleLoadTools } from "../agents/tools/module-load-tools.js";
import { domainTools } from "../agents/tools/domain-tools.js";
import { productScoutTools } from "../agents/tools/product-scout-tools.js";
import { supplierIntelligenceTools } from "../agents/tools/supplier-intelligence-tools.js";
import { storeExecutionTools } from "../agents/store-execution-bridge/index.js";
import { orderExecutionTools } from "../agents/order-execution-bridge/index.js";
import { revenueLoopTools } from "../revenue/minimum-live-revenue-loop/tools/revenue-loop-tools.js";
import { productionDeploymentTools } from "../execution/production-store-deployment/tools/production-deployment-tools.js";
import { livePaymentTools } from "../revenue/live-payment-engine/tools/live-payment-tools.js";
import { customerOrderPipelineTools } from "../revenue/customer-order-pipeline/tools/customer-order-pipeline-tools.js";
import { liveCjFulfillmentTools } from "../execution/live-cj-fulfillment/tools/live-cj-fulfillment-tools.js";
import { analyticsConversionTools } from "../execution/analytics-conversion-engine/tools/analytics-conversion-tools.js";
import { metaAdsConnectorTools } from "../execution/meta-ads-connector/tools/meta-ads-connector-tools.js";
import { productPublishingTools } from "../execution/product-publishing-engine/tools/product-publishing-tools.js";
import { grandKingsRevenueTools } from "../revenue/grand-kings-revenue-engine/tools/grand-kings-revenue-tools.js";
import { firstRevenueValidationTools } from "../revenue/first-revenue-validation/tools/first-revenue-validation-tools.js";
import { soulFileTools } from "../foundation/soul-file/tools/soul-file-tools.js";
import { getSoulRuntimeEngine, soulRuntimeTools } from "../foundation/soul-runtime/index.js";
import {
  getGovernanceEngine,
  governanceTools,
  initializeGovernancePolicies,
} from "../foundation/empire-governance/index.js";
import { initializeIdentityRegistry } from "../foundation/identity-registry/index.js";
import { identityRegistryTools } from "../foundation/identity-registry/tools/identity-registry-tools.js";
import { initializeDoctrines } from "../foundation/doctrine-engine/index.js";
import { doctrineTools } from "../foundation/doctrine-engine/tools/doctrine-tools.js";
import { empireConstitutionTools } from "../foundation/empire-constitution/tools/empire-constitution-tools.js";
import { empireGovernanceDoctrineTools } from "../foundation/empire-governance-doctrine/tools/empire-governance-doctrine-tools.js";
import { empireArchitectureConstraintsTools } from "../foundation/empire-architecture-constraints/tools/empire-architecture-constraints-tools.js";
import { empireUxIdentityDoctrineTools } from "../foundation/empire-ux-identity-doctrine/tools/empire-ux-identity-doctrine-tools.js";
import { empireCommercialBusinessDoctrineTools } from "../foundation/empire-commercial-business-doctrine/tools/empire-commercial-business-doctrine-tools.js";
import { initializePolicies } from "../foundation/policy-engine/index.js";
import { policyTools } from "../foundation/policy-engine/tools/policy-tools.js";
import { initializePromiseRegister } from "../foundation/promise-register/index.js";
import { promiseRegisterTools } from "../foundation/promise-register/tools/promise-register-tools.js";
import { initializeKpiEngine } from "../foundation/kpi-engine/index.js";
import { kpiEngineTools } from "../foundation/kpi-engine/tools/kpi-engine-tools.js";
import { initializeDecisionRegistry } from "../foundation/decision-registry/index.js";
import { decisionRegistryTools } from "../foundation/decision-registry/tools/decision-registry-tools.js";
import { initializeStrategicMemory } from "../foundation/strategic-memory-engine/index.js";
import { strategicMemoryTools } from "../foundation/strategic-memory-engine/tools/strategic-memory-tools.js";
import { ecommerceOsTools } from "../orchestration/ecommerce-os-orchestrator/tools/ecommerce-os-tools.js";
import { accountInfrastructureTools } from "../orchestration/account-infrastructure-engine/tools/account-infrastructure-tools.js";
import { marketplaceConnectionTools } from "../orchestration/marketplace-connection-engine/tools/marketplace-connection-tools.js";
import { commerceReadinessTools } from "../orchestration/commerce-readiness-engine/tools/commerce-readiness-tools.js";
import { productDiscoveryTools } from "../orchestration/product-discovery-opportunity-engine/tools/product-discovery-tools.js";
import { businessOpportunityWorkspaceTools } from "../orchestration/business-opportunity-workspace/tools/business-opportunity-workspace-tools.js";
import { businessPreviewStudioTools } from "../orchestration/business-preview-studio/tools/business-preview-studio-tools.js";
import { marketDominationStrategyTools } from "../orchestration/market-domination-strategy-engine/tools/market-domination-strategy-tools.js";
import { businessBuildEngineTools } from "../orchestration/business-build-engine/tools/business-build-tools.js";
import { businessSimulationEngineTools } from "../orchestration/business-simulation-engine/tools/business-simulation-tools.js";
import { executionLayerTools } from "../orchestration/execution-layer/tools/execution-layer-tools.js";
import { realityIntegrationTools } from "../orchestration/reality-integration/tools/reality-integration-tools.js";
import { eyeSeriesTools } from "../orchestration/eye-series/tools/eye-series-tools.js";
import { operationFirstDollarTools } from "../operation-first-dollar/tools/operation-first-dollar-tools.js";
import { esisTools } from "../orchestration/empire-self-inspection/tools/esis-tools.js";
import { masterCompletionLedgerTools } from "../orchestration/master-completion-ledger/tools/master-completion-ledger-tools.js";
import { operationalAccessTools } from "../operational-access/tools/operational-access-tools.js";
import { supplierIntelligenceFoundationTools } from "../supplier-intelligence/tools/supplier-intelligence-tools.js";
import { commerceRuntimeTools } from "../runtime/commerce-runtime/tools/commerce-runtime-tools.js";
import { globalCommerceTools } from "../runtime/global-commerce/tools/global-commerce-tools.js";
import { globalCommerceIntelligenceTools } from "../runtime/global-commerce-intelligence/tools/global-commerce-intelligence-tools.js";
import { empireKnowledgeTools } from "../runtime/empire-knowledge/tools/empire-knowledge-tools.js";
import { globalCommerceInfrastructureTools } from "../runtime/global-commerce-infrastructure/tools/global-commerce-infrastructure-tools.js";
import { founderAutomationTools } from "../runtime/founder-automation/tools/founder-automation-tools.js";
import { amazonGlobalSellerTools } from "../runtime/amazon-global-seller/tools/amazon-global-seller-tools.js";
import { commerceIntelligenceStudioTools } from "../runtime/commerce-intelligence-studio/tools/commerce-intelligence-studio-tools.js";
import { marketplacePublishingTools } from "../runtime/marketplace-publishing/tools/marketplace-publishing-tools.js";
import { listingIntelligenceTools } from "../runtime/listing-intelligence/tools/listing-intelligence-tools.js";
import { productMediaTools } from "../runtime/product-media/tools/product-media-tools.js";
import { commerceExecutionPipelineTools } from "../runtime/commerce-execution-pipeline/tools/commerce-execution-pipeline-tools.js";
import { executiveVisualDebateTools } from "../runtime/executive-visual-debate/tools/executive-visual-debate-tools.js";
import { globalMarketplaceOperationsTools } from "../runtime/global-marketplace-operations/tools/global-marketplace-operations-tools.js";
import { liveProductIntelligenceTools } from "../runtime/live-product-intelligence/tools/live-product-intelligence-tools.js";
import { executiveProductOptimizationTools } from "../runtime/executive-product-optimization/tools/executive-product-optimization-tools.js";
import { supplierIntelligenceLoopTools } from "../runtime/supplier-intelligence-loop/tools/supplier-intelligence-loop-tools.js";
import { globalOpportunityEngineTools } from "../runtime/global-opportunity-engine/tools/global-opportunity-engine-tools.js";
import { revenueImprovementEngineTools } from "../runtime/revenue-improvement-engine/tools/revenue-improvement-engine-tools.js";
import { globalCommandCenterTools } from "../runtime/global-command-center/tools/global-command-center-tools.js";
import { empireEconomicsTools } from "../runtime/empire-economics/tools/empire-economics-tools.js";
import { grandKingFinancialCommandCenterTools } from "../runtime/grand-king-financial-command-center/tools/grand-king-financial-command-center-tools.js";
import { founderPlatformPreparationTools } from "../runtime/founder-platform-preparation/tools/founder-platform-preparation-tools.js";
import { aiSelfImprovementEngineTools } from "../runtime/ai-self-improvement-engine/tools/ai-self-improvement-engine-tools.js";
import { version2BacklogEngineTools } from "../runtime/version-2-backlog-engine/tools/version-2-backlog-engine-tools.js";
import { version1ReadinessAuditTools } from "../runtime/version-1-readiness-audit/tools/version-1-readiness-audit-tools.js";
import { version1LockdownTools } from "../runtime/version-1-lockdown/tools/version-1-lockdown-tools.js";
import { customerIntelligenceTools } from "../runtime/customer-intelligence/tools/customer-intelligence-tools.js";
import { competitorIntelligenceTools } from "../runtime/competitor-intelligence/tools/competitor-intelligence-tools.js";
import { customerPsychologyEngineTools } from "../runtime/customer-psychology-engine/tools/customer-psychology-engine-tools.js";
import { globalCategoryExpansionEngineTools } from "../runtime/global-category-expansion-engine/tools/global-category-expansion-engine-tools.js";
import { globalRevenueSimulationTools } from "../runtime/global-revenue-simulation/tools/global-revenue-simulation-tools.js";
import { aiChiefOfCommerceTools } from "../runtime/ai-chief-of-commerce/tools/ai-chief-of-commerce-tools.js";
import { aiChiefOfGrowthTools } from "../runtime/ai-chief-of-growth/tools/ai-chief-of-growth-tools.js";
import { aiChiefOfCustomerTools } from "../runtime/ai-chief-of-customer/tools/ai-chief-of-customer-tools.js";
import { globalStrategyEngineTools } from "../runtime/global-strategy-engine/tools/global-strategy-engine-tools.js";
import { success001CommandCenterTools } from "../runtime/success-001-command-center/tools/success-001-command-center-tools.js";
import { unifiedGrandKingHeadquartersTools } from "../runtime/unified-grand-king-headquarters/tools/unified-grand-king-headquarters-tools.js";
import { worldOperationsMapTools } from "../runtime/world-operations-map/tools/world-operations-map-tools.js";
import { globalMarketShareEngineTools } from "../runtime/global-market-share-engine/tools/global-market-share-engine-tools.js";
import { productPortfolioCommandTools } from "../runtime/product-portfolio-command/tools/product-portfolio-command-tools.js";
import { executiveWarRoomTools } from "../runtime/executive-war-room/tools/executive-war-room-tools.js";
import { soulDecisionChamberTools } from "../runtime/soul-decision-chamber/tools/soul-decision-chamber-tools.js";
import { missionCommandEngineTools } from "../runtime/mission-command-engine/tools/mission-command-engine-tools.js";
import { globalExecutionTimelineTools } from "../runtime/global-execution-timeline/tools/global-execution-timeline-tools.js";
import { autonomousAnalysisEngineTools } from "../runtime/autonomous-analysis-engine/tools/autonomous-analysis-engine-tools.js";
import { commercialMemoryEngineTools } from "../runtime/commercial-memory-engine/tools/commercial-memory-engine-tools.js";
import { grandKingLiveOperationsModeTools } from "../runtime/grand-king-live-operations-mode/tools/grand-king-live-operations-mode-tools.js";
import { globalOperationalCommandCenterTools } from "../runtime/global-operational-command-center/tools/global-operational-command-center-tools.js";
import { globalAdvertisingIntelligenceTools } from "../runtime/global-advertising-intelligence/tools/global-advertising-intelligence-tools.js";
import { firstOrderOperationsTools } from "../runtime/first-order-operations/tools/first-order-operations-tools.js";
import { globalOrderIntelligenceTools } from "../runtime/global-order-intelligence/tools/global-order-intelligence-tools.js";
import { postPurchaseIntelligenceTools } from "../runtime/post-purchase-intelligence/tools/post-purchase-intelligence-tools.js";
import { globalKnowledgeEvolutionTools } from "../runtime/global-knowledge-evolution/tools/global-knowledge-evolution-tools.js";
import { aiStrategicMemoryTools } from "../runtime/ai-strategic-memory/tools/ai-strategic-memory-tools.js";
import { empirePlaybookEngineTools } from "../runtime/empire-playbook-engine/tools/empire-playbook-engine-tools.js";
import { globalRiskCommandTools } from "../runtime/global-risk-command/tools/global-risk-command-tools.js";
import { founderPlatformReadinessTools } from "../runtime/founder-platform-readiness/tools/founder-platform-readiness-tools.js";
import { productionHardeningTools } from "../runtime/production-hardening/tools/production-hardening-tools.js";
import { version1AcceptanceTestTools } from "../runtime/version-1-acceptance-test/tools/version-1-acceptance-test-tools.js";
import { grandKingGoLiveChecklistTools } from "../runtime/grand-king-go-live-checklist/tools/grand-king-go-live-checklist-tools.js";
import { version1GoldMasterTools } from "../runtime/version-1-gold-master/tools/version-1-gold-master-tools.js";
import { globalBusinessHealthEngineTools } from "../runtime/global-business-health-engine/tools/global-business-health-engine-tools.js";
import { empireKpiEngineTools } from "../runtime/empire-kpi-engine/tools/empire-kpi-engine-tools.js";
import { liveCommercialInvestigationsTools } from "../runtime/live-commercial-investigations/tools/live-commercial-investigations-tools.js";
import { commercialSimulationEngineTools } from "../runtime/commercial-simulation-engine/tools/commercial-simulation-engine-tools.js";
import { globalExpansionCommandTools } from "../runtime/global-expansion-command/tools/global-expansion-command-tools.js";
import { commercialExplorerTools } from "../runtime/commercial-explorer/tools/commercial-explorer-tools.js";
import { empireStrategicCenterTools } from "../runtime/empire-strategic-center/tools/empire-strategic-center-tools.js";
import { version1GovernanceReviewTools } from "../runtime/version-1-governance-review/tools/version-1-governance-review-tools.js";
import { success001ReadinessReviewTools } from "../runtime/success-001-readiness-review/tools/success-001-readiness-review-tools.js";
import { version1ExecutiveSignOffTools } from "../runtime/version-1-executive-sign-off/tools/version-1-executive-sign-off-tools.js";
import { globalSupplierMarketTools } from "../runtime/global-supplier-market/tools/global-supplier-market-tools.js";
import { globalMarketplaceAdapterFrameworkTools } from "../runtime/global-marketplace-adapter-framework/tools/global-marketplace-adapter-framework-tools.js";
import { marketplaceDifferenceEngineTools } from "../runtime/marketplace-difference-engine/tools/marketplace-difference-engine-tools.js";
import { countryDifferenceEngineTools } from "../runtime/country-difference-engine/tools/country-difference-engine-tools.js";
import { globalPriceIntelligenceTools } from "../runtime/global-price-intelligence/tools/global-price-intelligence-tools.js";
import { shippingIntelligenceTools } from "../runtime/shipping-intelligence/tools/shipping-intelligence-tools.js";
import { productLaunchCommanderTools } from "../runtime/product-launch-commander/tools/product-launch-commander-tools.js";
import { postLaunchCommanderTools } from "../runtime/post-launch-commander/tools/post-launch-commander-tools.js";
import { productScaleEngineTools } from "../runtime/product-scale-engine/tools/product-scale-engine-tools.js";
import { productRetirementEngineTools } from "../runtime/product-retirement-engine/tools/product-retirement-engine-tools.js";
import { empireRevenueForecastTools } from "../runtime/empire-revenue-forecast/tools/empire-revenue-forecast-tools.js";
import { empireCashflowEngineTools } from "../runtime/empire-cashflow-engine/tools/empire-cashflow-engine-tools.js";
import { empireInvestmentEngineTools } from "../runtime/empire-investment-engine/tools/empire-investment-engine-tools.js";
import { globalOpportunityBoardTools } from "../runtime/global-opportunity-board/tools/global-opportunity-board-tools.js";
import { executiveStrategyRoomTools } from "../runtime/executive-strategy-room/tools/executive-strategy-room-tools.js";
import { kingDecisionHistoryTools } from "../runtime/king-decision-history/tools/king-decision-history-tools.js";
import { soulLearningReviewTools } from "../runtime/soul-learning-review/tools/soul-learning-review-tools.js";
import { empirePatternLibraryTools } from "../runtime/empire-pattern-library/tools/empire-pattern-library-tools.js";
import { globalExpansionScoreTools } from "../runtime/global-expansion-score/tools/global-expansion-score-tools.js";
import { empirePriorityEngineTools } from "../runtime/empire-priority-engine/tools/empire-priority-engine-tools.js";
import { commandCenterPolishTools } from "../runtime/command-center-polish/tools/command-center-polish-tools.js";
import { uxReviewPreparationTools } from "../runtime/ux-review-preparation/tools/ux-review-preparation-tools.js";
import { performanceReviewTools } from "../runtime/performance-review/tools/performance-review-tools.js";
import { securityReviewTools } from "../runtime/security-review/tools/security-review-tools.js";
import { architectureReviewTools } from "../runtime/architecture-review/tools/architecture-review-tools.js";
import { commercialReviewTools } from "../runtime/commercial-review/tools/commercial-review-tools.js";
import { version1FreezeReviewTools } from "../runtime/version-1-freeze-review/tools/version-1-freeze-review-tools.js";
import { version1ReleaseCandidateTools } from "../runtime/version-1-release-candidate/tools/version-1-release-candidate-tools.js";
import { version1GoLiveApprovalTools } from "../runtime/version-1-go-live-approval/tools/version-1-go-live-approval-tools.js";
import { version1CompletionTools } from "../runtime/version-1-completion/tools/version-1-completion-tools.js";
import { executiveCouncilTools } from "../executive-council/tools/executive-council-tools.js";
import { executiveSurveillanceTools } from "../executive-surveillance/tools/executive-surveillance-tools.js";
import { grandKingTools } from "../grand-king/tools/grand-king-tools.js";
import { grandKingRevenuePipelineTools } from "../grand-king-revenue-pipeline/tools/grand-king-revenue-pipeline-tools.js";
import { getGrandKingSchedulerDefinitions } from "../grand-king/automation/grand-king-automation-server.js";
import { registerSupplierIntelligenceModule } from "../intelligence/supplier-intelligence-engine/module-contract.js";
import { workflowDefinitions } from "../agents/workflows/workflows.js";
import { AgentManager } from "./agent-manager.js";
import { AuditLogger } from "./audit/audit-logger.js";
import { DecisionEngine } from "./decision-engine.js";
import { EventBus } from "./events/event-bus.js";
import { LLMRouter } from "./llm/llm-router.js";
import { MemoryStore } from "./memory/memory-store.js";
import { Orchestrator } from "./orchestrator.js";
import { BrainScheduler } from "./scheduler.js";
import {
  DegradedTaskQueue,
  TaskQueue,
  type BrainTaskQueue,
} from "./task-queue.js";
import { ToolRegistry } from "./tools/tool-registry.js";
import { WorkflowEngine } from "./workflow-engine.js";
import { BrainWorkerPool } from "./workers/worker-pool.js";
import { GuardianEngine } from "../guardian/guardian-engine.js";
import {
  InMemorySessionStore,
  SessionStore,
  type SessionStoreBackend,
} from "../auth/session-store.js";

export type RedisMode = "connected" | "degraded";

export type EmpireBrain = {
  redisMode: RedisMode;
  redis: RedisClient | null;
  sessionStore: SessionStoreBackend;
  auditLogger: AuditLogger;
  memoryStore: MemoryStore;
  eventBus: EventBus;
  toolRegistry: ToolRegistry;
  llmRouter: LLMRouter;
  decisionEngine: DecisionEngine;
  agentManager: AgentManager;
  workflowEngine: WorkflowEngine;
  taskQueue: BrainTaskQueue;
  scheduler: BrainScheduler;
  orchestrator: Orchestrator;
  workerPool: BrainWorkerPool;
  guardian: GuardianEngine;
  shutdown: () => Promise<void>;
};

export async function createBrain(options?: {
  startWorkers?: boolean;
  startScheduler?: boolean;
}): Promise<EmpireBrain> {
  const redisAvailable = await probeRedisAvailable(env.REDIS_URL);
  const allowDegraded = shouldAllowRedisDegradedMode();

  if (!redisAvailable && !allowDegraded) {
    throw new Error(
      `Redis unavailable at ${env.REDIS_URL}. Start Redis or set REDIS_OPTIONAL=true for local fallback.`,
    );
  }

  const redisMode: RedisMode =
    redisAvailable ? "connected" : "degraded";

  if (redisMode === "degraded") {
    logger.warn(
      `Redis unavailable — running in local degraded mode (queue/events/sessions in-memory). Start Redis with: ${REDIS_START_HINT}`,
    );
  }

  const redis =
    redisMode === "connected" ? createRedisClient(env.REDIS_URL) : null;
  const bullmqConnection =
    redisMode === "connected" ? createBullMQConnection(env.REDIS_URL) : null;

  const auditLogger = new AuditLogger();
  const soulRuntimeEngine = getSoulRuntimeEngine();
  soulRuntimeEngine.attachAuditLogger(auditLogger);
  const governanceEngine = getGovernanceEngine();
  initializeIdentityRegistry("ws_empire_1");
  initializeDoctrines("ws_empire_1");
  initializePolicies("ws_empire_1");
  initializePromiseRegister("ws_empire_1");
  initializeKpiEngine("ws_empire_1");
  initializeDecisionRegistry("ws_empire_1");
  initializeStrategicMemory("ws_empire_1");
  initializeGovernancePolicies("ws_empire_1");
  const guardian = new GuardianEngine(auditLogger);
  const memoryStore = new MemoryStore();
  const eventBus = new EventBus(redis, { localOnly: redisMode === "degraded" });
  const toolRegistry = new ToolRegistry();
  const llmRouter = new LLMRouter();
  const decisionEngine = new DecisionEngine();
  const taskQueue: BrainTaskQueue =
    redisMode === "connected"
      ? new TaskQueue(bullmqConnection!, auditLogger)
      : new DegradedTaskQueue(auditLogger);
  const sessionStore: SessionStoreBackend =
    redisMode === "connected"
      ? new SessionStore(redis!)
      : new InMemorySessionStore();

  registerSupplierIntelligenceModule();

  const brainTools = [
    ...coreTools,
    ...moduleLoadTools,
    ...aiCeoTools,
    ...domainTools,
    ...productScoutTools,
    ...supplierIntelligenceTools,
    ...storeExecutionTools,
    ...orderExecutionTools,
    ...revenueLoopTools,
    ...productionDeploymentTools,
    ...livePaymentTools,
    ...customerOrderPipelineTools,
    ...liveCjFulfillmentTools,
    ...analyticsConversionTools,
    ...metaAdsConnectorTools,
    ...productPublishingTools,
    ...grandKingsRevenueTools,
    ...firstRevenueValidationTools,
    ...soulFileTools,
    ...soulRuntimeTools,
    ...governanceTools,
    ...identityRegistryTools,
    ...doctrineTools,
    ...empireConstitutionTools,
    ...empireGovernanceDoctrineTools,
    ...empireArchitectureConstraintsTools,
    ...empireUxIdentityDoctrineTools,
    ...empireCommercialBusinessDoctrineTools,
    ...policyTools,
    ...promiseRegisterTools,
    ...kpiEngineTools,
    ...decisionRegistryTools,
    ...strategicMemoryTools,
    ...ecommerceOsTools,
    ...accountInfrastructureTools,
    ...marketplaceConnectionTools,
    ...commerceReadinessTools,
    ...productDiscoveryTools,
    ...businessOpportunityWorkspaceTools,
    ...businessPreviewStudioTools,
    ...marketDominationStrategyTools,
    ...businessBuildEngineTools,
    ...businessSimulationEngineTools,
    ...executionLayerTools,
    ...realityIntegrationTools,
    ...eyeSeriesTools,
    ...operationFirstDollarTools,
    ...esisTools,
    ...masterCompletionLedgerTools,
    ...operationalAccessTools,
    ...supplierIntelligenceFoundationTools,
    ...commerceRuntimeTools,
    ...globalCommerceTools,
    ...globalCommerceIntelligenceTools,
    ...empireKnowledgeTools,
    ...globalCommerceInfrastructureTools,
    ...founderAutomationTools,
    ...amazonGlobalSellerTools,
    ...commerceIntelligenceStudioTools,
    ...marketplacePublishingTools,
    ...listingIntelligenceTools,
    ...productMediaTools,
    ...commerceExecutionPipelineTools,
    ...executiveVisualDebateTools,
    ...globalMarketplaceOperationsTools,
    ...liveProductIntelligenceTools,
    ...executiveProductOptimizationTools,
    ...supplierIntelligenceLoopTools,
    ...globalOpportunityEngineTools,
    ...revenueImprovementEngineTools,
    ...globalCommandCenterTools,
    ...empireEconomicsTools,
    ...grandKingFinancialCommandCenterTools,
    ...founderPlatformPreparationTools,
    ...aiSelfImprovementEngineTools,
    ...version2BacklogEngineTools,
    ...version1ReadinessAuditTools,
    ...version1LockdownTools,
    ...customerIntelligenceTools,
    ...competitorIntelligenceTools,
    ...customerPsychologyEngineTools,
    ...globalCategoryExpansionEngineTools,
    ...globalRevenueSimulationTools,
    ...aiChiefOfCommerceTools,
    ...aiChiefOfGrowthTools,
    ...aiChiefOfCustomerTools,
    ...globalStrategyEngineTools,
    ...success001CommandCenterTools,
    ...unifiedGrandKingHeadquartersTools,
    ...worldOperationsMapTools,
    ...globalMarketShareEngineTools,
    ...productPortfolioCommandTools,
    ...executiveWarRoomTools,
    ...soulDecisionChamberTools,
    ...missionCommandEngineTools,
    ...globalExecutionTimelineTools,
    ...autonomousAnalysisEngineTools,
    ...commercialMemoryEngineTools,
    ...grandKingLiveOperationsModeTools,
    ...globalOperationalCommandCenterTools,
    ...globalAdvertisingIntelligenceTools,
    ...firstOrderOperationsTools,
    ...globalOrderIntelligenceTools,
    ...postPurchaseIntelligenceTools,
    ...globalKnowledgeEvolutionTools,
    ...aiStrategicMemoryTools,
    ...empirePlaybookEngineTools,
    ...globalRiskCommandTools,
    ...founderPlatformReadinessTools,
    ...productionHardeningTools,
    ...version1AcceptanceTestTools,
    ...grandKingGoLiveChecklistTools,
    ...version1GoldMasterTools,
    ...globalBusinessHealthEngineTools,
    ...empireKpiEngineTools,
    ...liveCommercialInvestigationsTools,
    ...commercialSimulationEngineTools,
    ...globalExpansionCommandTools,
    ...commercialExplorerTools,
    ...empireStrategicCenterTools,
    ...version1GovernanceReviewTools,
    ...success001ReadinessReviewTools,
    ...version1ExecutiveSignOffTools,
    ...globalSupplierMarketTools,
    ...globalMarketplaceAdapterFrameworkTools,
    ...marketplaceDifferenceEngineTools,
    ...countryDifferenceEngineTools,
    ...globalPriceIntelligenceTools,
    ...shippingIntelligenceTools,
    ...productLaunchCommanderTools,
    ...postLaunchCommanderTools,
    ...productScaleEngineTools,
    ...productRetirementEngineTools,
    ...empireRevenueForecastTools,
    ...empireCashflowEngineTools,
    ...empireInvestmentEngineTools,
    ...globalOpportunityBoardTools,
    ...executiveStrategyRoomTools,
    ...kingDecisionHistoryTools,
    ...soulLearningReviewTools,
    ...empirePatternLibraryTools,
    ...globalExpansionScoreTools,
    ...empirePriorityEngineTools,
    ...commandCenterPolishTools,
    ...uxReviewPreparationTools,
    ...performanceReviewTools,
    ...securityReviewTools,
    ...architectureReviewTools,
    ...commercialReviewTools,
    ...version1FreezeReviewTools,
    ...version1ReleaseCandidateTools,
    ...version1GoLiveApprovalTools,
    ...version1CompletionTools,
    ...executiveCouncilTools,
    ...executiveSurveillanceTools,
    ...grandKingTools,
    ...grandKingRevenuePipelineTools,
  ];
  const uniqueTools = [...new Map(brainTools.map((tool) => [tool.name, tool])).values()];
  toolRegistry.registerMany(uniqueTools);

  const agentManager = new AgentManager({
    toolRegistry,
    llmRouter,
    memoryStore,
    decisionEngine,
    eventBus,
    auditLogger,
  });

  agentManager.registerMany(agentDefinitions);

  const workflowEngine = new WorkflowEngine({
    agentManager,
    toolRegistry,
    eventBus,
    auditLogger,
  });

  workflowEngine.registerMany(workflowDefinitions);

  const orchestrator = new Orchestrator({
    agentManager,
    workflowEngine,
    taskQueue,
    eventBus,
    auditLogger,
    toolRegistry,
    guardian: env.GUARDIAN_ENABLED ? guardian : undefined,
    governance: governanceEngine,
    routes: moduleRoutes,
  });

  const scheduler = new BrainScheduler(taskQueue, auditLogger);
  const workerPool = new BrainWorkerPool(bullmqConnection, {
    agentManager,
    workflowEngine,
    toolRegistry,
  });

  await eventBus.start();

  if (options?.startScheduler ?? false) {
    for (const definition of getGrandKingSchedulerDefinitions()) {
      await scheduler.register(definition);
    }
    await scheduler.start();
  }

  if (options?.startWorkers ?? false) {
    workerPool.start();
  }

  logger.info(
    {
      agents: agentManager.list().length,
      tools: toolRegistry.list().length,
      llmProviders: llmRouter.listAvailable(),
      redisMode,
    },
    "EmpireAI Brain initialized",
  );

  const shutdown = async () => {
    soulRuntimeEngine.stop();
    await workerPool.stop();
    await scheduler.close();
    await taskQueue.close();
    await eventBus.stop();
    redis?.disconnect();
    logger.info("EmpireAI Brain shutdown complete");
  };

  return {
    redisMode,
    redis,
    sessionStore,
    auditLogger,
    memoryStore,
    eventBus,
    toolRegistry,
    llmRouter,
    decisionEngine,
    agentManager,
    workflowEngine,
    taskQueue,
    scheduler,
    orchestrator,
    workerPool,
    guardian,
    shutdown,
  };
}

export type { OrchestratorDispatchRequest, OrchestratorDispatchResult } from "./types.js";

export {
  INTELLIGENCE_MODULE_CATALOG,
  INTELLIGENCE_MODULE_IDS,
  MODULE_CAPABILITIES,
  PRODUCT_SCOUT_ACTION_MAP,
  StubIntelligenceModuleRegistry,
  intelligenceModuleRegistry,
  isIntelligenceModuleId,
} from "./contract/index.js";
export type {
  AIEmployeeModule,
  BrainDecision,
  BrainExecutionResult,
  BrainObservation,
  BrainRecommendation,
  IntelligenceBrainTask,
  IntelligenceCapability,
  IntelligenceModuleCatalogEntry,
  IntelligenceModuleContract,
  IntelligenceModuleId,
  IntelligenceModuleRegistry,
  ModuleCapabilityMap,
  ModuleHealthReport,
  ModuleInputSpec,
  ModuleOutputSpec,
  ModuleValidationResult,
  ProductScoutModuleContractAdapter,
  ProductScoutTaskInput,
} from "./contract/index.js";
