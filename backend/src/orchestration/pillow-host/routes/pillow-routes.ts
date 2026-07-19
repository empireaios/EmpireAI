import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { LLMRouter } from "../../../brain/llm/llm-router.js";
import { logger } from "../../../config/logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  ensurePillowHostReadyOrReply,
  pillowStartingResponse,
  schedulePillowHostBoot,
} from "../pillow-boot.js";
import {
  PillowHostNotRunningError,
  PillowSessionNotFoundError,
  type PillowHost,
} from "../pillow-host.js";
import { pillowWorkspaceContextSchema } from "../workspace-context.js";
import { collectMarketplaceIntegrationSnapshot } from "../marketplace-integration-bridge.js";
import { collectBuilderConsoleSnapshot } from "../builder-console-bridge.js";
import { collectLiveEtaSnapshot } from "../live-eta-bridge.js";
import { collectExplainabilitySnapshot } from "../explainability-bridge.js";
import { collectBusinessFactorySnapshot } from "../business-factory-bridge.js";
import { collectCommerceOperatingModelSnapshot } from "../commerce-operating-model-bridge.js";
import { collectBusinessAutomationSnapshot } from "../business-automation-bridge.js";
import { collectCommercialIntelligenceSnapshot } from "../commercial-intelligence-bridge.js";
import { collectGrandKingOperatingAccountSnapshot } from "../grand-king-operating-account-bridge.js";
import { collectRepositoryEvolutionSnapshot } from "../repository-evolution-bridge.js";
import { collectKnowledgeEvolutionSnapshot } from "../knowledge-evolution-bridge.js";
import { collectArchitectureEvolutionSnapshot } from "../architecture-evolution-bridge.js";
import { collectAiEvolutionSnapshot } from "../ai-evolution-bridge.js";
import { collectEmpireEvolutionSnapshot } from "../empire-evolution-bridge.js";
import { collectExecutiveArchitectureFrameworkSnapshot } from "../executive-architecture-framework-bridge.js";
import { collectCorporateVisionEngineSnapshot } from "../corporate-vision-engine-bridge.js";
import { collectStrategicObjectiveEngineSnapshot } from "../strategic-objective-engine-bridge.js";
import { collectExecutiveRoadmapEngineSnapshot } from "../executive-roadmap-engine-bridge.js";
import { collectPriorityManagementEngineSnapshot } from "../priority-management-engine-bridge.js";
import { collectInitiativePortfolioEngineSnapshot } from "../initiative-portfolio-engine-bridge.js";
import { collectDepartmentPlanningEngineSnapshot } from "../department-planning-engine-bridge.js";
import { collectExecutiveCalendarEngineSnapshot } from "../executive-calendar-engine-bridge.js";
import { collectExecutiveDependencyEngineSnapshot } from "../executive-dependency-engine-bridge.js";
import { collectExecutiveScenarioPlannerSnapshot } from "../executive-scenario-planner-bridge.js";
import { collectLongTermGrowthPlannerSnapshot } from "../long-term-growth-planner-bridge.js";
import { collectOpportunityPrioritizationEngineSnapshot } from "../opportunity-prioritization-engine-bridge.js";
import { collectStrategicAlignmentMonitorSnapshot } from "../strategic-alignment-monitor-bridge.js";
import { collectExecutivePlanningDashboardSnapshot } from "../executive-planning-dashboard-bridge.js";
import { collectExecutivePlanningCertificationSnapshot } from "../executive-planning-certification-bridge.js";
import { collectExecutiveDecisionArchitectureSnapshot } from "../executive-decision-architecture-bridge.js";
import { collectRiskAssessmentEngineSnapshot } from "../risk-assessment-engine-bridge.js";
import { collectDecisionSimulationEngineSnapshot } from "../decision-simulation-engine-bridge.js";
import { collectExecutiveRecommendationEngineSnapshot } from "../executive-recommendation-engine-bridge.js";
import { collectResourceAllocationEngineSnapshot } from "../resource-allocation-engine-bridge.js";
import { collectConflictResolutionEngineSnapshot } from "../conflict-resolution-engine-bridge.js";
import { collectExecutiveApprovalIntelligenceSnapshot } from "../executive-approval-intelligence-bridge.js";
import { collectCrisisDecisionEngineSnapshot } from "../crisis-decision-engine-bridge.js";
import { collectExecutiveEscalationEngineSnapshot } from "../executive-escalation-engine-bridge.js";
import { collectTradeOffAnalysisEngineSnapshot } from "../trade-off-analysis-engine-bridge.js";
import { collectExecutiveConsensusEngineSnapshot } from "../executive-consensus-engine-bridge.js";
import { collectExecutivePolicyEngineSnapshot } from "../executive-policy-engine-bridge.js";
import { collectDecisionAuditEngineSnapshot } from "../decision-audit-engine-bridge.js";
import { collectExecutiveConfidenceEngineSnapshot } from "../executive-confidence-engine-bridge.js";
import { collectAutonomousDecisionMonitorSnapshot } from "../autonomous-decision-monitor-bridge.js";
import { collectExecutiveDecisionCertificationSnapshot } from "../executive-decision-certification-bridge.js";
import { collectExecutiveFinanceFrameworkSnapshot } from "../executive-finance-framework-bridge.js";
import { collectCapitalAllocationEngineSnapshot } from "../capital-allocation-engine-bridge.js";
import { collectExecutiveBudgetPlannerSnapshot } from "../executive-budget-planner-bridge.js";
import { collectInvestmentEvaluationEngineSnapshot } from "../investment-evaluation-engine-bridge.js";
import { collectRoiIntelligenceEngineSnapshot } from "../roi-intelligence-engine-bridge.js";
import { collectCashReserveIntelligenceSnapshot } from "../cash-reserve-intelligence-bridge.js";
import { collectProfitOptimizationEngineSnapshot } from "../profit-optimization-engine-bridge.js";
import { collectCostOptimizationEngineSnapshot } from "../cost-optimization-engine-bridge.js";
import { collectFinancialScenarioEngineSnapshot } from "../financial-scenario-engine-bridge.js";
import { collectExecutiveKpiEngineSnapshot } from "../executive-kpi-engine-bridge.js";
import { collectCapitalRiskEngineSnapshot } from "../capital-risk-engine-bridge.js";
import { collectExecutiveForecastIntelligenceSnapshot } from "../executive-forecast-intelligence-bridge.js";
import { collectExecutivePerformanceDashboardSnapshot } from "../executive-performance-dashboard-bridge.js";
import { collectEnterpriseValuationEngineSnapshot } from "../enterprise-valuation-engine-bridge.js";
import { collectExecutiveCapitalStrategySnapshot } from "../executive-capital-strategy-bridge.js";
import { collectFinancialExecutiveCertificationSnapshot } from "../financial-executive-certification-bridge.js";
import { collectMarketIntelligenceEngineSnapshot } from "../market-intelligence-engine-bridge.js";
import { collectCompetitorIntelligenceEngineSnapshot } from "../competitor-intelligence-engine-bridge.js";
import { collectOpportunityDiscoveryEngineSnapshot } from "../opportunity-discovery-engine-bridge.js";
import { collectThreatDetectionEngineSnapshot } from "../threat-detection-engine-bridge.js";
import { collectIndustryIntelligenceEngineSnapshot } from "../industry-intelligence-engine-bridge.js";
import { collectCustomerBehaviourIntelligenceSnapshot } from "../customer-behaviour-intelligence-bridge.js";
import { collectInnovationIntelligenceEngineSnapshot } from "../innovation-intelligence-engine-bridge.js";
import { collectExecutiveKnowledgeGraphSnapshot } from "../executive-knowledge-graph-bridge.js";
import { collectExecutivePredictionEngineSnapshot } from "../executive-prediction-engine-bridge.js";
import { collectExecutiveInsightEngineSnapshot } from "../executive-insight-engine-bridge.js";
import { collectEnterprisePatternEngineSnapshot } from "../enterprise-pattern-engine-bridge.js";
import { collectExecutiveBenchmarkEngineSnapshot } from "../executive-benchmark-engine-bridge.js";
import { collectCrossBusinessIntelligenceSnapshot } from "../cross-business-intelligence-bridge.js";
import { collectExecutiveAdvisoryEngineSnapshot } from "../executive-advisory-engine-bridge.js";
import { collectExecutiveIntelligenceCertificationSnapshot } from "../executive-intelligence-certification-bridge.js";
import { collectEnterpriseGovernanceFrameworkSnapshot } from "../enterprise-governance-framework-bridge.js";
import { collectExecutiveConstitutionalMonitorSnapshot } from "../executive-constitutional-monitor-bridge.js";
import { collectEnterpriseAuditEngineSnapshot } from "../enterprise-audit-engine-bridge.js";
import {
  collectExecutiveComplianceEngineSnapshot,
  evaluateExecutiveCompliance,
  getExecutiveCompliancePolicies,
  getExecutiveComplianceReport,
  getExecutiveComplianceViolations,
  getExecutiveComplianceHealth,
  patchExecutiveCompliancePolicy,
} from "../executive-compliance-engine-bridge.js";
import { collectExecutiveEthicsEngineSnapshot } from "../executive-ethics-engine-bridge.js";
import { collectExecutiveAccountabilityEngineSnapshot } from "../executive-accountability-engine-bridge.js";
import { collectExecutiveTransparencyEngineSnapshot } from "../executive-transparency-engine-bridge.js";
import {
  collectExecutiveExceptionManagerSnapshot,
  registerExecutiveException,
  approveExecutiveException,
  resolveExecutiveException,
  getExecutiveExceptionPolicies,
  getExecutiveExceptionReport,
  getExecutiveExceptionHistory,
  getExecutiveExceptionHealth,
} from "../executive-exception-manager-bridge.js";
import {
  collectEnterpriseRiskGovernanceSnapshot,
  getEnterpriseRiskReport,
  getEnterpriseRiskRegister,
  getEnterpriseRiskHistory,
  getEnterpriseRiskHealth,
} from "../enterprise-risk-governance-bridge.js";
import {
  collectExecutiveReviewBoardSnapshot,
  getExecutiveReviewCalendar,
  getExecutiveReviewReport,
  getExecutiveReviewHistory,
  getExecutiveReviewHealth,
} from "../executive-review-board-bridge.js";
import {
  collectExecutivePolicyEvolutionSnapshot,
  getPolicyEvolutionQueue,
  getPolicyEvolutionReport,
  getPolicyEvolutionRegister,
  getPolicyEvolutionHistory,
  getPolicyEvolutionHealth,
} from "../executive-policy-evolution-bridge.js";
import {
  collectExecutiveTrustEngineSnapshot,
  getExecutiveTrustScores,
  getExecutiveTrustReport,
  getExecutiveTrustRegister,
  getExecutiveTrustHistory,
  getExecutiveTrustHealth,
} from "../executive-trust-engine-bridge.js";
import {
  collectEnterpriseConstitutionalGuardianSnapshot,
  getConstitutionalHealth,
  getConstitutionalGuardianReport,
  getConstitutionalViolations,
  getConstitutionalGuardianHistory,
  getConstitutionalGuardianHealth,
} from "../enterprise-constitutional-guardian-bridge.js";
import {
  collectExecutiveResilienceEngineSnapshot,
  getEnterpriseHealthStatus,
  getExecutiveResilienceReport,
  getActiveResilienceIncidents,
  getExecutiveResilienceHistory,
  getExecutiveResilienceHealth,
} from "../executive-resilience-engine-bridge.js";
import {
  collectGrandKingExecutiveCockpitSnapshot,
  getGovernanceChainStatus,
  getGrandKingExecutiveReport,
  getExecutiveDashboardWidgets,
  getGrandKingExecutiveCockpitHistory,
  getGrandKingExecutiveCockpitHealth,
} from "../grand-king-executive-cockpit-bridge.js";
import { collectExecutiveGovernanceCertificationSnapshot } from "../executive-governance-certification-bridge.js";
import { collectVisualCaptureSnapshot } from "../visual-capture-bridge.js";
import { collectUiStateMapperSnapshot } from "../ui-state-mapper-bridge.js";
import { collectComponentRecognitionSnapshot } from "../component-recognition-bridge.js";
import { collectLayoutUnderstandingSnapshot } from "../layout-understanding-bridge.js";
import { collectNavigationMappingSnapshot } from "../navigation-mapping-bridge.js";
import { collectInteractionTrackingSnapshot } from "../interaction-tracking-bridge.js";
import { collectContextAwarenessSnapshot } from "../context-awareness-bridge.js";
import { collectVisualMemorySnapshot } from "../visual-memory-bridge.js";
import { collectSessionContinuitySnapshot } from "../session-continuity-bridge.js";
import { collectVisualFoundationCertificationSnapshot } from "../visual-foundation-certification-bridge.js";
import { collectUxRuleEngineSnapshot } from "../ux-rule-engine-bridge.js";
import { collectDesignSystemIntelligenceSnapshot } from "../design-system-intelligence-bridge.js";
import { collectExecutiveStyleLearningSnapshot } from "../executive-style-learning-bridge.js";
import { collectLayoutEvaluationSnapshot } from "../layout-evaluation-bridge.js";
import { collectWorkflowOptimizationSnapshot } from "../workflow-optimization-bridge.js";
import { collectAccessibilityIntelligenceSnapshot } from "../accessibility-intelligence-bridge.js";
import { collectVisualConsistencySnapshot } from "../visual-consistency-bridge.js";
import { collectUxScoringSnapshot } from "../ux-scoring-bridge.js";
import { collectRecommendationEngineSnapshot } from "../recommendation-engine-bridge.js";
import { collectUxIntelligenceCertificationSnapshot } from "../ux-intelligence-certification-bridge.js";
import { collectFrontendBuilderSnapshot } from "../frontend-builder-bridge.js";
import { collectComponentGeneratorSnapshot } from "../component-generator-bridge.js";
import { collectLayoutRefactoringSnapshot } from "../layout-refactoring-bridge.js";
import { collectThemeBuilderSnapshot } from "../theme-builder-bridge.js";
import { collectPreviewGeneratorSnapshot } from "../preview-generator-bridge.js";
import { collectValidationEngineSnapshot } from "../validation-engine-bridge.js";
import { collectRegressionProtectionSnapshot } from "../regression-protection-bridge.js";
import { collectRollbackManagerSnapshot } from "../rollback-manager-bridge.js";
import { collectChangeDocumentationSnapshot } from "../change-documentation-bridge.js";
import { collectAutonomousBuilderCertificationSnapshot } from "../autonomous-builder-certification-bridge.js";
import { collectNaturalUxConversationSnapshot } from "../natural-ux-conversation-bridge.js";
import { collectVoiceUxCommandsSnapshot } from "../voice-ux-commands-bridge.js";
import { collectScreenAnnotationSnapshot } from "../screen-annotation-bridge.js";
import { collectMultiProposalGeneratorSnapshot } from "../multi-proposal-generator-bridge.js";
import { collectSideBySideComparisonSnapshot } from "../side-by-side-comparison-bridge.js";
import { collectExplainDecisionsSnapshot } from "../explain-decisions-bridge.js";
import { collectApprovalWorkflowSnapshot } from "../approval-workflow-bridge.js";
import { collectPreferenceLearningSnapshot } from "../preference-learning-bridge.js";
import { collectContinuousCollaborationSnapshot } from "../continuous-collaboration-bridge.js";
import { collectExecutiveCollaborationCertificationSnapshot } from "../executive-collaboration-certification-bridge.js";
import { collectContinuousScreenObservationSnapshot } from "../continuous-screen-observation-bridge.js";
import { collectAutonomousUxAuditSnapshot } from "../autonomous-ux-audit-bridge.js";
import { collectUxOpportunityDiscoverySnapshot } from "../ux-opportunity-discovery-bridge.js";
import { collectProductivityIntelligenceSnapshot } from "../productivity-intelligence-bridge.js";
import { collectWorkflowEvolutionSnapshot } from "../workflow-evolution-bridge.js";
import { collectAdaptiveInterfaceSnapshot } from "../adaptive-interface-bridge.js";
import { collectContinuousUxEvolutionSnapshot } from "../continuous-ux-evolution-bridge.js";
import { collectExecutiveWorkspaceIntelligenceSnapshot } from "../executive-workspace-intelligence-bridge.js";
import { collectSelfImprovingUxSnapshot } from "../self-improving-ux-bridge.js";
import { collectVisualIntelligenceCertificationSnapshot } from "../visual-intelligence-certification-bridge.js";
import { collectMarketplaceConnectorFrameworkSnapshot } from "../marketplace-connector-framework-bridge.js";
import { collectAmazonMarketplaceIntegrationSnapshot } from "../amazon-marketplace-integration-bridge.js";
import { collectAmazonProductIntelligenceSnapshot } from "../amazon-product-intelligence-bridge.js";
import { collectAmazonOrderManagementSnapshot } from "../amazon-order-management-bridge.js";
import { collectAmazonInventorySyncSnapshot } from "../amazon-inventory-sync-bridge.js";
import { collectWalmartMarketplaceIntegrationSnapshot } from "../walmart-marketplace-integration-bridge.js";
import { collectEtsyMarketplaceIntegrationSnapshot } from "../etsy-marketplace-integration-bridge.js";
import { collectEbayMarketplaceIntegrationSnapshot } from "../ebay-marketplace-integration-bridge.js";
import { collectTikTokShopMarketplaceIntegrationSnapshot } from "../tiktok-shop-marketplace-integration-bridge.js";
import { collectShopifyStoreMarketplaceIntegrationSnapshot } from "../shopify-store-marketplace-integration-bridge.js";
import { collectWooCommerceMarketplaceIntegrationSnapshot } from "../woocommerce-marketplace-integration-bridge.js";
import { collectMarketplaceProductNormalizationSnapshot } from "../marketplace-product-normalization-bridge.js";
import { collectMarketplaceOrderNormalizationSnapshot } from "../marketplace-order-normalization-bridge.js";
import { collectMarketplaceHealthMonitorSnapshot } from "../marketplace-health-monitor-bridge.js";
import { collectMarketplaceCertificationSnapshot } from "../marketplace-certification-bridge.js";
import { collectSupplierFrameworkSnapshot } from "../supplier-framework-bridge.js";
import { collectCjDropshippingIntegrationSnapshot } from "../cj-dropshipping-integration-bridge.js";
import { collectAliExpressIntegrationSnapshot } from "../aliexpress-integration-bridge.js";
import { collectOss1688IntegrationSnapshot } from "../oss1688-integration-bridge.js";
import { collectSupplierProductSyncSnapshot } from "../supplier-product-sync-bridge.js";
import { collectSupplierInventorySyncSnapshot } from "../supplier-inventory-sync-bridge.js";
import { collectSupplierPricingEngineSnapshot } from "../supplier-pricing-engine-bridge.js";
import { collectSupplierRankingEngineSnapshot } from "../supplier-ranking-engine-bridge.js";
import { collectProcurementEngineSnapshot } from "../procurement-engine-bridge.js";
import { collectFulfilmentOrchestratorSnapshot } from "../fulfilment-orchestrator-bridge.js";
import { collectShippingCarrierIntegrationSnapshot } from "../shipping-carrier-integration-bridge.js";
import { collectShipmentTrackingEngineSnapshot } from "../shipment-tracking-engine-bridge.js";
import { collectReturnManagementSnapshot } from "../return-management-bridge.js";
import { collectWarehouseIntelligenceSnapshot } from "../warehouse-intelligence-bridge.js";
import { collectMultiWarehouseSupportSnapshot } from "../multi-warehouse-support-bridge.js";
import { collectSupplierRiskMonitorSnapshot } from "../supplier-risk-monitor-bridge.js";
import { collectLogisticsOptimizationSnapshot } from "../logistics-optimization-bridge.js";
import { collectFulfilmentSlaMonitorSnapshot } from "../fulfilment-sla-monitor-bridge.js";
import { collectProcurementIntelligenceSnapshot } from "../procurement-intelligence-bridge.js";
import { collectSupplierOperationsCertificationSnapshot } from "../supplier-operations-certification-bridge.js";
import { collectFinancialFrameworkSnapshot } from "../financial-framework-bridge.js";
import { collectPaymentGatewayIntegrationSnapshot } from "../payment-gateway-integration-bridge.js";
import { collectBankingIntegrationSnapshot } from "../banking-integration-bridge.js";
import { collectRevenueEngineSnapshot } from "../revenue-engine-bridge.js";
import { collectExpenseEngineSnapshot } from "../expense-engine-bridge.js";
import { collectProfitCalculationEngineSnapshot } from "../profit-calculation-engine-bridge.js";
import { collectCashFlowMonitorSnapshot } from "../cash-flow-monitor-bridge.js";
import { collectReconciliationEngineSnapshot } from "../reconciliation-engine-bridge.js";
import { collectInvoiceGeneratorSnapshot } from "../invoice-generator-bridge.js";
import { collectRefundEngineSnapshot } from "../refund-engine-bridge.js";
import { collectTaxIntelligenceEngineSnapshot } from "../tax-intelligence-engine-bridge.js";
import { collectMultiCurrencyEngineSnapshot } from "../multi-currency-engine-bridge.js";
import { collectFinancialForecastEngineSnapshot } from "../financial-forecast-engine-bridge.js";
import { collectBudgetManagementEngineSnapshot } from "../budget-management-engine-bridge.js";
import { collectFinancialRiskMonitorSnapshot } from "../financial-risk-monitor-bridge.js";
import { collectExecutiveFinancialDashboardSnapshot } from "../executive-financial-dashboard-bridge.js";
import { collectAccountingExportEngineSnapshot } from "../accounting-export-engine-bridge.js";
import { collectFinancialOperationsCertificationSnapshot } from "../financial-operations-certification-bridge.js";
import { collectCustomerIdentityEngineSnapshot } from "../customer-identity-engine-bridge.js";
import { collectCrmFoundationSnapshot } from "../crm-foundation-bridge.js";
import { collectCustomerTimelineEngineSnapshot } from "../customer-timeline-engine-bridge.js";
import { collectEmailCommunicationEngineSnapshot } from "../email-communication-engine-bridge.js";
import { collectSmsCommunicationEngineSnapshot } from "../sms-communication-engine-bridge.js";
import { collectWhatsAppIntegrationSnapshot } from "../whatsapp-integration-bridge.js";
import { collectLiveChatIntegrationSnapshot } from "../live-chat-integration-bridge.js";
import { collectAiCustomerSupportSnapshot } from "../ai-customer-support-bridge.js";
import { collectTicketManagementEngineSnapshot } from "../ticket-management-engine-bridge.js";
import { collectCustomerSentimentEngineSnapshot } from "../customer-sentiment-engine-bridge.js";
import { collectReviewManagementEngineSnapshot } from "../review-management-engine-bridge.js";
import { collectLoyaltyProgrammeEngineSnapshot } from "../loyalty-programme-engine-bridge.js";
import { collectReturnsIntelligenceEngineSnapshot } from "../returns-intelligence-engine-bridge.js";
import { collectCustomerRiskEngineSnapshot } from "../customer-risk-engine-bridge.js";
import { collectCustomerLifetimeValueEngineSnapshot } from "../customer-lifetime-value-engine-bridge.js";
import { collectCustomerSegmentationEngineSnapshot } from "../customer-segmentation-engine-bridge.js";
import { collectCustomerJourneyIntelligenceEngineSnapshot } from "../customer-journey-intelligence-engine-bridge.js";
import { collectExecutiveCustomerDashboardSnapshot } from "../executive-customer-dashboard-bridge.js";
import { collectCustomerOperationsCertificationSnapshot } from "../customer-operations-certification-bridge.js";
import { collectMarketingFrameworkSnapshot } from "../marketing-framework-bridge.js";
import { collectMetaAdsIntegrationSnapshot } from "../meta-ads-integration-bridge.js";
import { collectGoogleAdsIntegrationSnapshot } from "../google-ads-integration-bridge.js";
import { collectTikTokAdsIntegrationSnapshot } from "../tiktok-ads-integration-bridge.js";
import { collectYouTubeAdsIntegrationSnapshot } from "../youtube-ads-integration-bridge.js";
import { collectSeoIntelligenceSnapshot } from "../seo-intelligence-bridge.js";
import { collectCampaignManagerSnapshot } from "../campaign-manager-bridge.js";
import { collectAudienceIntelligenceSnapshot } from "../audience-intelligence-bridge.js";
import { collectAttributionEngineSnapshot } from "../attribution-engine-bridge.js";
import { collectMarketingAnalyticsDashboardSnapshot } from "../marketing-analytics-dashboard-bridge.js";
import { collectCreativeAssetManagerSnapshot } from "../creative-asset-manager-bridge.js";
import { collectAiCampaignGeneratorSnapshot } from "../ai-campaign-generator-bridge.js";
import { collectBudgetOptimizationEngineSnapshot } from "../budget-optimization-engine-bridge.js";
import { collectConversionIntelligenceSnapshot } from "../conversion-intelligence-bridge.js";
import { collectCompetitorMarketingMonitorSnapshot } from "../competitor-marketing-monitor-bridge.js";
import { collectViralTrendIntelligenceSnapshot } from "../viral-trend-intelligence-bridge.js";
import { collectMarketingExperimentEngineSnapshot } from "../marketing-experiment-engine-bridge.js";
import { collectCrossChannelOrchestratorSnapshot } from "../cross-channel-orchestrator-bridge.js";
import { collectAutonomousMarketingEngineSnapshot } from "../autonomous-marketing-engine-bridge.js";
import { collectRealWorldOperationsCertificationSnapshot } from "../real-world-operations-certification-bridge.js";
import { collectCompanyFactoryFrameworkSnapshot } from "../company-factory-framework-bridge.js";
import { collectBusinessOpportunityDiscoverySnapshot } from "../business-opportunity-discovery-bridge.js";
import { collectMarketValidationEngineSnapshot } from "../market-validation-engine-bridge.js";
import { collectCockpitUxSnapshot } from "../cockpit-ux-bridge.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

function requireFounder(
  request: FastifyRequest,
  reply: FastifyReply,
): boolean {
  const user = request.user;
  if (!user) {
    reply.code(401).send({ error: "Authentication required" });
    return false;
  }
  if (user.role !== "founder" && user.role !== "admin") {
    reply.code(403).send({ error: "Founder access required for Pillow" });
    return false;
  }
  return true;
}

function founderAuth(authenticate: AuthMiddleware) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return;
    requireFounder(request, reply);
  };
}

export async function registerPillowRoutes(
  app: FastifyInstance,
  deps: {
    authenticate: AuthMiddleware;
    pillowHost: PillowHost;
    auditLogger: AuditLogger;
    llmRouter: LLMRouter;
  },
): Promise<void> {
  const { authenticate, pillowHost, auditLogger, llmRouter } = deps;
  const pillowAuth = founderAuth(authenticate);

  app.get("/api/pillow/health", async (_request, reply) => {
    const status = pillowHost.getStatus() as Record<string, unknown> & {
      health: unknown;
      lifecycle: unknown;
      missionId: unknown;
      lastHeartbeatAt: unknown;
      lastError: unknown;
      repositoryRoot: unknown;
      governanceKnowledge?: {
        requiredKnowledgeFilesFound?: boolean;
        missingKnowledgeFiles?: string[];
        doctrineFilesFound?: number;
      } | null;
    };
    const governance = status.governanceKnowledge;
    return reply.send({
      health: status.health,
      lifecycle: status.lifecycle,
      missionId: status.missionId,
      lastHeartbeatAt: status.lastHeartbeatAt,
      lastError: status.lastError,
      resolvedRepoRoot: status.repositoryRoot,
      requiredKnowledgeFilesFound: governance?.requiredKnowledgeFilesFound ?? false,
      missingKnowledgeFiles: governance?.missingKnowledgeFiles ?? [],
      doctrineFilesFound: governance?.doctrineFilesFound ?? 0,
    });
  });

  app.get("/api/pillow/status", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send({ status: pillowHost.getStatus() });
  });

  app.get("/api/pillow/objective", { preHandler: pillowAuth }, async (_request, reply) => {
    try {
      const dashboard = pillowHost.getObjectiveDashboard();
      return reply.send({ objective: dashboard });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/vision-sync", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ visionSync: pillowHost.getVisionSynchronization() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/context-sync", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ contextSync: pillowHost.getContextSynchronization() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/recovery", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ recovery: pillowHost.getRecoveryDoctrine() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/browser-truth", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ browserTruth: pillowHost.getBrowserTruth() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/visual-capture", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectVisualCaptureSnapshot());
    }
    try {
      return reply.send({ visualCapture: pillowHost.getVisualCapture() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectVisualCaptureSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/visual-capture/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectVisualCaptureSnapshot());
    }
    try {
      const engine = await pillowHost.startVisualCapture();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectVisualCaptureSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/visual-capture/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectVisualCaptureSnapshot());
    }
    try {
      const engine = pillowHost.stopVisualCapture();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectVisualCaptureSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/ui-state-mapper", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectUiStateMapperSnapshot());
    }
    try {
      return reply.send({ uiStateMapper: pillowHost.getUiStateMapper() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectUiStateMapperSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ui-state-mapper/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectUiStateMapperSnapshot());
    }
    try {
      const engine = await pillowHost.startUiStateMapping();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectUiStateMapperSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ui-state-mapper/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectUiStateMapperSnapshot());
    }
    try {
      const engine = pillowHost.stopUiStateMapping();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectUiStateMapperSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/component-recognition", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectComponentRecognitionSnapshot());
    }
    try {
      return reply.send({ componentRecognition: pillowHost.getComponentRecognition() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectComponentRecognitionSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/component-recognition/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectComponentRecognitionSnapshot());
    }
    try {
      const engine = await pillowHost.startComponentRecognition();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectComponentRecognitionSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/component-recognition/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectComponentRecognitionSnapshot());
    }
    try {
      const engine = pillowHost.stopComponentRecognition();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectComponentRecognitionSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/layout-understanding", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectLayoutUnderstandingSnapshot());
    }
    try {
      return reply.send({ layoutUnderstanding: pillowHost.getLayoutUnderstanding() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectLayoutUnderstandingSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/layout-understanding/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLayoutUnderstandingSnapshot());
    }
    try {
      const engine = await pillowHost.startLayoutUnderstanding();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLayoutUnderstandingSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/layout-understanding/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLayoutUnderstandingSnapshot());
    }
    try {
      const engine = pillowHost.stopLayoutUnderstanding();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLayoutUnderstandingSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/navigation-mapping", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectNavigationMappingSnapshot());
    }
    try {
      return reply.send({ navigationMapping: pillowHost.getNavigationMapping() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectNavigationMappingSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/navigation-mapping/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectNavigationMappingSnapshot());
    }
    try {
      const engine = await pillowHost.startNavigationMapping();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectNavigationMappingSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/navigation-mapping/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectNavigationMappingSnapshot());
    }
    try {
      const engine = pillowHost.stopNavigationMapping();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectNavigationMappingSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/interaction-tracking", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectInteractionTrackingSnapshot());
    }
    try {
      return reply.send({ interactionTracking: pillowHost.getInteractionTracking() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectInteractionTrackingSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/interaction-tracking/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectInteractionTrackingSnapshot());
    }
    try {
      const engine = await pillowHost.startInteractionTracking();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectInteractionTrackingSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/interaction-tracking/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectInteractionTrackingSnapshot());
    }
    try {
      const engine = pillowHost.stopInteractionTracking();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectInteractionTrackingSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/interaction-tracking/record", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectInteractionTrackingSnapshot());
    }
    try {
      const body = request.body as import("@empireai/pillow").RawInteractionInput;
      const event = pillowHost.recordInteraction(body);
      return reply.send({ computedAt: new Date().toISOString(), event });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectInteractionTrackingSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/context-awareness", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectContextAwarenessSnapshot());
    }
    try {
      return reply.send({ contextAwareness: pillowHost.getContextAwareness() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectContextAwarenessSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/context-awareness/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectContextAwarenessSnapshot());
    }
    try {
      const engine = await pillowHost.startContextAwareness();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectContextAwarenessSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/context-awareness/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectContextAwarenessSnapshot());
    }
    try {
      const engine = pillowHost.stopContextAwareness();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectContextAwarenessSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/visual-memory", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectVisualMemorySnapshot());
    }
    try {
      return reply.send({ visualMemory: pillowHost.getVisualMemory() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectVisualMemorySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/visual-memory/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectVisualMemorySnapshot());
    }
    try {
      const engine = await pillowHost.startVisualMemory();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectVisualMemorySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/visual-memory/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectVisualMemorySnapshot());
    }
    try {
      const engine = pillowHost.stopVisualMemory();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectVisualMemorySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/visual-memory/capture", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectVisualMemorySnapshot());
    }
    try {
      const record = pillowHost.captureVisualMemory();
      return reply.send({ computedAt: new Date().toISOString(), record });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectVisualMemorySnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/session-continuity", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectSessionContinuitySnapshot());
    }
    try {
      return reply.send({ sessionContinuity: pillowHost.getSessionContinuity() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectSessionContinuitySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/session-continuity/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSessionContinuitySnapshot());
    }
    try {
      const engine = await pillowHost.startSessionContinuity();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSessionContinuitySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/session-continuity/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSessionContinuitySnapshot());
    }
    try {
      const engine = pillowHost.stopSessionContinuity();
      return reply.send({ computedAt: new Date().toISOString(), engine });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSessionContinuitySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/session-continuity/update", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSessionContinuitySnapshot());
    }
    try {
      const continuity = pillowHost.updateSessionContinuity();
      return reply.send({ computedAt: new Date().toISOString(), continuity });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSessionContinuitySnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/visual-foundation-certification", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectVisualFoundationCertificationSnapshot());
    }
    try {
      return reply.send({
        visualFoundationCertification: pillowHost.getVisualFoundationCertification(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectVisualFoundationCertificationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/visual-foundation-certification/run", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectVisualFoundationCertificationSnapshot());
    }
    try {
      const report = await pillowHost.runVisualFoundationCertification();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectVisualFoundationCertificationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/ux-rule-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectUxRuleEngineSnapshot());
    }
    try {
      return reply.send({
        uxRuleEngine: pillowHost.getUxRuleEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectUxRuleEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ux-rule-engine/validate", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectUxRuleEngineSnapshot());
    }
    try {
      const report = pillowHost.runUxRuleEngineValidation();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectUxRuleEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/design-system-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectDesignSystemIntelligenceSnapshot());
    }
    try {
      return reply.send({
        designSystemIntelligence: pillowHost.getDesignSystemIntelligence(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectDesignSystemIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/design-system-intelligence/analyze", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectDesignSystemIntelligenceSnapshot());
    }
    try {
      const report = pillowHost.runDesignSystemAnalysis();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectDesignSystemIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-style-learning", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveStyleLearningSnapshot());
    }
    try {
      return reply.send({
        executiveStyleLearning: pillowHost.getExecutiveStyleLearning(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveStyleLearningSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-style-learning/learn", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveStyleLearningSnapshot());
    }
    try {
      const report = pillowHost.runExecutiveStyleLearning();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveStyleLearningSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-style-learning/approve", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveStyleLearningSnapshot());
    }
    try {
      const body = request.body as {
        category?: string;
        description?: string;
        value?: string;
        referenceId?: string;
      };
      const record = pillowHost.recordExecutiveStyleApproval({
        category: (body.category ?? "layout") as import("@empireai/pillow").PreferenceCategory,
        description: body.description ?? "Approved design decision",
        value: body.value ?? "approved",
        referenceId: body.referenceId ?? `ref-${Date.now()}`,
      });
      return reply.send({ computedAt: new Date().toISOString(), record });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveStyleLearningSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-style-learning/reject", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveStyleLearningSnapshot());
    }
    try {
      const body = request.body as {
        category?: string;
        description?: string;
        value?: string;
        referenceId?: string;
      };
      const record = pillowHost.recordExecutiveStyleRejection({
        category: (body.category ?? "layout") as import("@empireai/pillow").PreferenceCategory,
        description: body.description ?? "Rejected design decision",
        value: body.value ?? "rejected",
        referenceId: body.referenceId ?? `ref-${Date.now()}`,
      });
      return reply.send({ computedAt: new Date().toISOString(), record });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveStyleLearningSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/layout-evaluation", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectLayoutEvaluationSnapshot());
    }
    try {
      return reply.send({
        layoutEvaluation: pillowHost.getLayoutEvaluation(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectLayoutEvaluationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/layout-evaluation/evaluate", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLayoutEvaluationSnapshot());
    }
    try {
      const report = pillowHost.runLayoutEvaluation();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLayoutEvaluationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/workflow-optimization", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectWorkflowOptimizationSnapshot());
    }
    try {
      return reply.send({
        workflowOptimization: pillowHost.getWorkflowOptimization(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectWorkflowOptimizationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/workflow-optimization/analyze", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWorkflowOptimizationSnapshot());
    }
    try {
      const report = pillowHost.runWorkflowOptimization();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWorkflowOptimizationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/accessibility-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAccessibilityIntelligenceSnapshot());
    }
    try {
      return reply.send({
        accessibilityIntelligence: pillowHost.getAccessibilityIntelligence(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectAccessibilityIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/accessibility-intelligence/review", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAccessibilityIntelligenceSnapshot());
    }
    try {
      const report = pillowHost.runAccessibilityReview();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAccessibilityIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/visual-consistency", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectVisualConsistencySnapshot());
    }
    try {
      return reply.send({
        visualConsistency: pillowHost.getVisualConsistency(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectVisualConsistencySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/visual-consistency/review", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectVisualConsistencySnapshot());
    }
    try {
      const report = pillowHost.runConsistencyReview();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectVisualConsistencySnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/ux-scoring", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectUxScoringSnapshot());
    }
    try {
      return reply.send({
        uxScoring: pillowHost.getUxScoring(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectUxScoringSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ux-scoring/score", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectUxScoringSnapshot());
    }
    try {
      const report = pillowHost.runUxScoring();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectUxScoringSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/recommendations", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectRecommendationEngineSnapshot());
    }
    try {
      return reply.send({
        recommendationEngine: pillowHost.getRecommendationEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectRecommendationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/recommendations/generate", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectRecommendationEngineSnapshot());
    }
    try {
      const report = pillowHost.generateRecommendations();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectRecommendationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/ux-intelligence-certification", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectUxIntelligenceCertificationSnapshot());
    }
    try {
      return reply.send({
        uxIntelligenceCertification: pillowHost.getUxIntelligenceCertification(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectUxIntelligenceCertificationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ux-intelligence-certification/run", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectUxIntelligenceCertificationSnapshot());
    }
    try {
      const report = await pillowHost.runUxIntelligenceCertification();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectUxIntelligenceCertificationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/frontend-builder", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectFrontendBuilderSnapshot());
    }
    try {
      return reply.send({
        frontendBuilder: pillowHost.getFrontendBuilder(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectFrontendBuilderSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/frontend-builder/build", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFrontendBuilderSnapshot());
    }
    try {
      const report = pillowHost.generateFrontendCode();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFrontendBuilderSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/component-generator", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectComponentGeneratorSnapshot());
    }
    try {
      return reply.send({
        componentGenerator: pillowHost.getComponentGenerator(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectComponentGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/component-generator/generate", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectComponentGeneratorSnapshot());
    }
    try {
      const report = pillowHost.generateComponents();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectComponentGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/layout-refactoring", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectLayoutRefactoringSnapshot());
    }
    try {
      return reply.send({
        layoutRefactoring: pillowHost.getLayoutRefactoring(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectLayoutRefactoringSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/layout-refactoring/refactor", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLayoutRefactoringSnapshot());
    }
    try {
      const report = pillowHost.refactorLayouts();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLayoutRefactoringSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/theme-builder", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectThemeBuilderSnapshot());
    }
    try {
      return reply.send({
        themeBuilder: pillowHost.getThemeBuilder(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectThemeBuilderSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/theme-builder/generate", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectThemeBuilderSnapshot());
    }
    try {
      const report = pillowHost.generateThemes();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectThemeBuilderSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/preview-generator", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectPreviewGeneratorSnapshot());
    }
    try {
      return reply.send({
        previewGenerator: pillowHost.getPreviewGenerator(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectPreviewGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/preview-generator/build", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectPreviewGeneratorSnapshot());
    }
    try {
      const report = pillowHost.generatePreviews();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectPreviewGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/preview-generator/cleanup", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectPreviewGeneratorSnapshot());
    }
    try {
      const cleaned = pillowHost.cleanupPreviews();
      return reply.send({ computedAt: new Date().toISOString(), cleaned });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectPreviewGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/validation-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectValidationEngineSnapshot());
    }
    try {
      return reply.send({
        validationEngine: pillowHost.getValidationEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectValidationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/validation-engine/validate", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectValidationEngineSnapshot());
    }
    try {
      const report = pillowHost.validateUi();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectValidationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/regression-protection", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectRegressionProtectionSnapshot());
    }
    try {
      return reply.send({
        regressionProtection: pillowHost.getRegressionProtection(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectRegressionProtectionSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/regression-protection/check", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectRegressionProtectionSnapshot());
    }
    try {
      const report = pillowHost.checkRegressions();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectRegressionProtectionSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/rollback-manager", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectRollbackManagerSnapshot());
    }
    try {
      return reply.send({
        rollbackManager: pillowHost.getRollbackManager(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectRollbackManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/rollback-manager/create-restore-point", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectRollbackManagerSnapshot());
    }
    try {
      const restorePoint = pillowHost.createRestorePoint();
      return reply.send({ computedAt: new Date().toISOString(), restorePoint });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectRollbackManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/rollback-manager/rollback", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectRollbackManagerSnapshot());
    }
    try {
      const report = pillowHost.executeRollback("manual_rollback_request");
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectRollbackManagerSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/change-documentation", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectChangeDocumentationSnapshot());
    }
    try {
      return reply.send({
        changeDocumentation: pillowHost.getChangeDocumentation(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectChangeDocumentationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/change-documentation/document", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectChangeDocumentationSnapshot());
    }
    try {
      const report = pillowHost.documentChanges();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectChangeDocumentationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/autonomous-builder-certification", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAutonomousBuilderCertificationSnapshot());
    }
    try {
      return reply.send({
        autonomousBuilderCertification: pillowHost.getAutonomousBuilderCertification(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectAutonomousBuilderCertificationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/autonomous-builder-certification/run", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAutonomousBuilderCertificationSnapshot());
    }
    try {
      const report = await pillowHost.runAutonomousBuilderCertification();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAutonomousBuilderCertificationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/natural-ux-conversation", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectNaturalUxConversationSnapshot());
    }
    try {
      return reply.send({
        naturalUxConversation: pillowHost.getNaturalUxConversation(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectNaturalUxConversationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/natural-ux-conversation/converse", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectNaturalUxConversationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { userRequest?: string; sessionId?: string };
      if (!body.userRequest || typeof body.userRequest !== "string") {
        return reply.code(400).send({ error: "userRequest is required" });
      }
      const report = pillowHost.converseNaturalUx(body.userRequest, body.sessionId);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectNaturalUxConversationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/voice-ux-commands", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectVoiceUxCommandsSnapshot());
    }
    try {
      return reply.send({
        voiceUxCommands: pillowHost.getVoiceUxCommands(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectVoiceUxCommandsSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/voice-ux-commands/process", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectVoiceUxCommandsSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        sourceAudioReference?: string | null;
        transcribedText?: string | null;
        simulatedTranscript?: string | null;
      };
      if (
        !body.transcribedText &&
        !body.simulatedTranscript &&
        !body.sourceAudioReference
      ) {
        return reply.code(400).send({
          error: "transcribedText, simulatedTranscript, or sourceAudioReference is required",
        });
      }
      const report = pillowHost.processVoiceUxCommand(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectVoiceUxCommandsSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/screen-annotation", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectScreenAnnotationSnapshot());
    }
    try {
      return reply.send({
        screenAnnotation: pillowHost.getScreenAnnotation(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectScreenAnnotationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/screen-annotation/annotate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectScreenAnnotationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        annotationType?: string;
        pointerCoordinates?: { x: number; y: number } | null;
        screenRegionBounds?: { x: number; y: number; width: number; height: number } | null;
        annotationText?: string | null;
        linkedConversationIntentId?: string | null;
        linkedVoiceCommandId?: string | null;
        referencedComponentIds?: string[];
        referencedLayoutRegionIds?: string[];
        referencedNavigationNodeIds?: string[];
      };
      if (!body.annotationType || typeof body.annotationType !== "string") {
        return reply.code(400).send({ error: "annotationType is required" });
      }
      const report = pillowHost.annotateScreen(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectScreenAnnotationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/multi-proposal-generator", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectMultiProposalGeneratorSnapshot());
    }
    try {
      return reply.send({
        multiProposalGenerator: pillowHost.getMultiProposalGenerator(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectMultiProposalGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/multi-proposal-generator/generate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMultiProposalGeneratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        sourceConversationIntentId?: string | null;
        sourceVoiceCommandId?: string | null;
        sourceAnnotationId?: string | null;
        sourcePointAndEditIntentId?: string | null;
        targetScreenId?: string | null;
        targetRouteOrViewId?: string | null;
        preferredCategories?: string[];
      };
      const report = pillowHost.generateMultiProposals(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMultiProposalGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/side-by-side-comparison", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectSideBySideComparisonSnapshot());
    }
    try {
      return reply.send({
        sideBySideComparison: pillowHost.getSideBySideComparison(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectSideBySideComparisonSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/side-by-side-comparison/compare", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSideBySideComparisonSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        comparisonType?: string;
        proposalIds?: string[];
        includeOriginal?: boolean;
        baselineProposalId?: string | null;
      };
      const report = pillowHost.compareSideBySide({
        sessionId: body.sessionId,
        comparisonType: (body.comparisonType ?? "original_vs_proposal") as import("@empireai/pillow").ComparisonType,
        proposalIds: body.proposalIds,
        includeOriginal: body.includeOriginal,
        baselineProposalId: body.baselineProposalId,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSideBySideComparisonSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/explain-decisions", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExplainDecisionsSnapshot());
    }
    try {
      return reply.send({
        explainDecisions: pillowHost.getExplainDecisions(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExplainDecisionsSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/explain-decisions/explain", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExplainDecisionsSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        explanationType?: string;
        proposalIds?: string[];
        comparisonId?: string | null;
        targetProposalId?: string | null;
      };
      const report = pillowHost.explainDecisions({
        sessionId: body.sessionId,
        explanationType: (body.explanationType ?? "proposal_rationale") as import("@empireai/pillow").ExplanationType,
        proposalIds: body.proposalIds,
        comparisonId: body.comparisonId,
        targetProposalId: body.targetProposalId,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExplainDecisionsSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/approval-workflow", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectApprovalWorkflowSnapshot());
    }
    try {
      return reply.send({
        approvalWorkflow: pillowHost.getApprovalWorkflow(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectApprovalWorkflowSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/approval-workflow/present", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectApprovalWorkflowSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        proposalIds?: string[];
        comparisonId?: string | null;
        explanationId?: string | null;
      };
      const presentation = pillowHost.presentApproval(body);
      return reply.send({ computedAt: new Date().toISOString(), presentation });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectApprovalWorkflowSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/approval-workflow/submit", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectApprovalWorkflowSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        approvalDecision?: string;
        approvalRationale?: string;
        requestedChanges?: string;
        proposalIds?: string[];
        comparisonId?: string | null;
        explanationId?: string | null;
        targetProposalId?: string | null;
        grandKingConfirmationRef?: string | null;
      };
      const report = pillowHost.submitApproval({
        sessionId: body.sessionId,
        approvalDecision: (body.approvalDecision ?? "defer") as import("@empireai/pillow").ApprovalDecisionType,
        approvalRationale: body.approvalRationale,
        requestedChanges: body.requestedChanges,
        proposalIds: body.proposalIds,
        comparisonId: body.comparisonId,
        explanationId: body.explanationId,
        targetProposalId: body.targetProposalId,
        grandKingConfirmationRef: body.grandKingConfirmationRef,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectApprovalWorkflowSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/preference-learning", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectPreferenceLearningSnapshot());
    }
    try {
      return reply.send({
        preferenceLearning: pillowHost.getPreferenceLearning(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectPreferenceLearningSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/preference-learning/learn", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectPreferenceLearningSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        learningScope?: string;
        categories?: string[];
      };
      const report = pillowHost.learnPreferences({
        sessionId: body.sessionId,
        learningScope: body.learningScope as import("@empireai/pillow").LearningScope | undefined,
        categories: body.categories as import("@empireai/pillow").PreferenceCategory[] | undefined,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectPreferenceLearningSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/continuous-collaboration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectContinuousCollaborationSnapshot());
    }
    try {
      return reply.send({
        continuousCollaboration: pillowHost.getContinuousCollaboration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectContinuousCollaborationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/continuous-collaboration/synchronize", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectContinuousCollaborationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        restoreContext?: boolean;
        applyPreferences?: boolean;
      };
      const report = pillowHost.synchronizeCollaboration({
        sessionId: body.sessionId,
        restoreContext: body.restoreContext,
        applyPreferences: body.applyPreferences,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectContinuousCollaborationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-collaboration-certification", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveCollaborationCertificationSnapshot());
    }
    try {
      return reply.send({
        executiveCollaborationCertification: pillowHost.getExecutiveCollaborationCertification(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveCollaborationCertificationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-collaboration-certification/run", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCollaborationCertificationSnapshot());
    }
    try {
      const report = await pillowHost.runExecutiveCollaborationCertification();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCollaborationCertificationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/continuous-screen-observation", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectContinuousScreenObservationSnapshot());
    }
    try {
      return reply.send({
        continuousScreenObservation: pillowHost.getContinuousScreenObservation(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectContinuousScreenObservationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/continuous-screen-observation/observe", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectContinuousScreenObservationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        forceObservation?: boolean;
        uiSnapshot?: {
          screenId?: string | null;
          routeOrViewId?: string | null;
          uiStateId?: string | null;
          componentSetId?: string | null;
          layoutId?: string | null;
          navigationGraphId?: string | null;
          surfaceStates?: string[];
        };
      };
      const report = pillowHost.observeScreen({
        sessionId: body.sessionId,
        forceObservation: body.forceObservation,
        uiSnapshot: body.uiSnapshot,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectContinuousScreenObservationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/continuous-screen-observation/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectContinuousScreenObservationSnapshot());
    }
    try {
      const state = pillowHost.startContinuousScreenObservation();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectContinuousScreenObservationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/continuous-screen-observation/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectContinuousScreenObservationSnapshot());
    }
    try {
      const state = pillowHost.stopContinuousScreenObservation();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectContinuousScreenObservationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/autonomous-ux-audit", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAutonomousUxAuditSnapshot());
    }
    try {
      return reply.send({
        autonomousUxAudit: pillowHost.getAutonomousUxAudit(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectAutonomousUxAuditSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/autonomous-ux-audit/run", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAutonomousUxAuditSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        forceAudit?: boolean;
        observationId?: string;
      };
      const report = pillowHost.runUxAudit({
        sessionId: body.sessionId,
        forceAudit: body.forceAudit,
        observationId: body.observationId,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAutonomousUxAuditSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/autonomous-ux-audit/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAutonomousUxAuditSnapshot());
    }
    try {
      const state = pillowHost.startContinuousUxAudit();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAutonomousUxAuditSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/autonomous-ux-audit/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAutonomousUxAuditSnapshot());
    }
    try {
      const state = pillowHost.stopContinuousUxAudit();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAutonomousUxAuditSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/ux-opportunity-discovery", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectUxOpportunityDiscoverySnapshot());
    }
    try {
      return reply.send({
        uxOpportunityDiscovery: pillowHost.getUxOpportunityDiscovery(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectUxOpportunityDiscoverySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ux-opportunity-discovery/discover", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectUxOpportunityDiscoverySnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        forceDiscovery?: boolean;
        auditId?: string;
      };
      const report = pillowHost.discoverUxOpportunities({
        sessionId: body.sessionId,
        forceDiscovery: body.forceDiscovery,
        auditId: body.auditId,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectUxOpportunityDiscoverySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ux-opportunity-discovery/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectUxOpportunityDiscoverySnapshot());
    }
    try {
      const state = pillowHost.startContinuousUxOpportunityDiscovery();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectUxOpportunityDiscoverySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ux-opportunity-discovery/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectUxOpportunityDiscoverySnapshot());
    }
    try {
      const state = pillowHost.stopContinuousUxOpportunityDiscovery();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectUxOpportunityDiscoverySnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/productivity-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectProductivityIntelligenceSnapshot());
    }
    try {
      return reply.send({
        productivityIntelligence: pillowHost.getProductivityIntelligence(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectProductivityIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/productivity-intelligence/learn", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectProductivityIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        forceLearning?: boolean;
        opportunityId?: string;
      };
      const report = pillowHost.learnProductivity({
        sessionId: body.sessionId,
        forceLearning: body.forceLearning,
        opportunityId: body.opportunityId,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectProductivityIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/productivity-intelligence/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectProductivityIntelligenceSnapshot());
    }
    try {
      const state = pillowHost.startContinuousProductivityLearning();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectProductivityIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/productivity-intelligence/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectProductivityIntelligenceSnapshot());
    }
    try {
      const state = pillowHost.stopContinuousProductivityLearning();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectProductivityIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/workflow-evolution", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectWorkflowEvolutionSnapshot());
    }
    try {
      return reply.send({
        workflowEvolution: pillowHost.getWorkflowEvolution(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectWorkflowEvolutionSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/workflow-evolution/evolve", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWorkflowEvolutionSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        forceEvolution?: boolean;
        productivityId?: string;
      };
      const report = pillowHost.evolveWorkflow({
        sessionId: body.sessionId,
        forceEvolution: body.forceEvolution,
        productivityId: body.productivityId,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWorkflowEvolutionSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/workflow-evolution/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWorkflowEvolutionSnapshot());
    }
    try {
      const state = pillowHost.startContinuousWorkflowEvolution();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWorkflowEvolutionSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/workflow-evolution/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWorkflowEvolutionSnapshot());
    }
    try {
      const state = pillowHost.stopContinuousWorkflowEvolution();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWorkflowEvolutionSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/adaptive-interface", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAdaptiveInterfaceSnapshot());
    }
    try {
      return reply.send({
        adaptiveInterface: pillowHost.getAdaptiveInterface(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectAdaptiveInterfaceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/adaptive-interface/adapt", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAdaptiveInterfaceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        forceAdaptation?: boolean;
        workflowEvolutionId?: string;
      };
      const report = pillowHost.adaptInterface({
        sessionId: body.sessionId,
        forceAdaptation: body.forceAdaptation,
        workflowEvolutionId: body.workflowEvolutionId,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAdaptiveInterfaceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/adaptive-interface/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAdaptiveInterfaceSnapshot());
    }
    try {
      const state = pillowHost.startContinuousAdaptiveInterface();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAdaptiveInterfaceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/adaptive-interface/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAdaptiveInterfaceSnapshot());
    }
    try {
      const state = pillowHost.stopContinuousAdaptiveInterface();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAdaptiveInterfaceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/continuous-ux-evolution", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectContinuousUxEvolutionSnapshot());
    }
    try {
      return reply.send({
        continuousUxEvolution: pillowHost.getContinuousUxEvolution(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectContinuousUxEvolutionSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/continuous-ux-evolution/optimize", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectContinuousUxEvolutionSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        forceEvolution?: boolean;
        adaptiveInterfaceId?: string;
      };
      const report = pillowHost.optimizeUx({
        sessionId: body.sessionId,
        forceEvolution: body.forceEvolution,
        adaptiveInterfaceId: body.adaptiveInterfaceId,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectContinuousUxEvolutionSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/continuous-ux-evolution/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectContinuousUxEvolutionSnapshot());
    }
    try {
      const state = pillowHost.startContinuousUxEvolution();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectContinuousUxEvolutionSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/continuous-ux-evolution/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectContinuousUxEvolutionSnapshot());
    }
    try {
      const state = pillowHost.stopContinuousUxEvolution();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectContinuousUxEvolutionSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-workspace-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveWorkspaceIntelligenceSnapshot());
    }
    try {
      return reply.send({
        executiveWorkspaceIntelligence: pillowHost.getExecutiveWorkspaceIntelligence(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveWorkspaceIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-workspace-intelligence/optimize", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveWorkspaceIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        forceOptimization?: boolean;
        uxEvolutionId?: string;
      };
      const report = pillowHost.optimizeExecutiveWorkspace({
        sessionId: body.sessionId,
        forceOptimization: body.forceOptimization,
        uxEvolutionId: body.uxEvolutionId,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveWorkspaceIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-workspace-intelligence/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveWorkspaceIntelligenceSnapshot());
    }
    try {
      const state = pillowHost.startContinuousExecutiveWorkspaceOptimization();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveWorkspaceIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-workspace-intelligence/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveWorkspaceIntelligenceSnapshot());
    }
    try {
      const state = pillowHost.stopContinuousExecutiveWorkspaceOptimization();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveWorkspaceIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/self-improving-ux", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectSelfImprovingUxSnapshot());
    }
    try {
      return reply.send({
        selfImprovingUx: pillowHost.getSelfImprovingUx(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectSelfImprovingUxSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/self-improving-ux/learn", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSelfImprovingUxSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        forceLearning?: boolean;
        workspaceIntelligenceId?: string;
      };
      const report = pillowHost.learnUx({
        sessionId: body.sessionId,
        forceLearning: body.forceLearning,
        workspaceIntelligenceId: body.workspaceIntelligenceId,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSelfImprovingUxSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/self-improving-ux/start", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSelfImprovingUxSnapshot());
    }
    try {
      const state = pillowHost.startContinuousUxLearning();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSelfImprovingUxSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/self-improving-ux/stop", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSelfImprovingUxSnapshot());
    }
    try {
      const state = pillowHost.stopContinuousUxLearning();
      return reply.send({ computedAt: new Date().toISOString(), state });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSelfImprovingUxSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/visual-intelligence-certification", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectVisualIntelligenceCertificationSnapshot());
    }
    try {
      return reply.send({
        visualIntelligenceCertification: pillowHost.getVisualIntelligenceCertification(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectVisualIntelligenceCertificationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/visual-intelligence-certification/certify", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectVisualIntelligenceCertificationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sessionId?: string;
        forceCertification?: boolean;
        validationScope?: string[];
      };
      const report = await pillowHost.certifyVisualIntelligence({
        sessionId: body.sessionId,
        forceCertification: body.forceCertification,
        validationScope: body.validationScope as
          | import("@empireai/pillow").CertifiedProgramme[]
          | undefined,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectVisualIntelligenceCertificationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/marketplace-connector-framework", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectMarketplaceConnectorFrameworkSnapshot());
    }
    try {
      return reply.send({
        marketplaceConnectorFramework: pillowHost.getMarketplaceConnectorFramework(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectMarketplaceConnectorFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketplace-connector-framework/register", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketplaceConnectorFrameworkSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        definition?: import("@empireai/pillow").MarketplaceConnectorDefinition;
        forceRegister?: boolean;
      };
      const report = pillowHost.registerMarketplaceConnector({
        definition: body.definition!,
        forceRegister: body.forceRegister,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketplaceConnectorFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketplace-connector-framework/activate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketplaceConnectorFrameworkSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { marketplaceId?: string };
      const report = pillowHost.activateMarketplaceConnector(body.marketplaceId ?? "");
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketplaceConnectorFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/amazon-marketplace-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAmazonMarketplaceIntegrationSnapshot());
    }
    try {
      return reply.send({
        amazonMarketplaceIntegration: pillowHost.getAmazonMarketplaceIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectAmazonMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/amazon-marketplace-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAmazonMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        region?: "na" | "fe" | "eu";
        credentialRef?: string;
        forceReconnect?: boolean;
      };
      const report = pillowHost.connectAmazon(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAmazonMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/amazon-marketplace-integration/route-api", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAmazonMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        method?: string;
        path?: string;
        region?: "na" | "fe" | "eu";
      };
      const report = await pillowHost.routeAmazonApi({
        method: body.method ?? "GET",
        path: body.path ?? "/",
        region: body.region,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAmazonMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/amazon-product-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAmazonProductIntelligenceSnapshot());
    }
    try {
      return reply.send({
        amazonProductIntelligence: pillowHost.getAmazonProductIntelligence(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectAmazonProductIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/amazon-product-intelligence/sync", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAmazonProductIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        forceFullSync?: boolean;
        region?: "na" | "fe" | "eu";
      };
      const report = await pillowHost.syncAmazonProducts(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAmazonProductIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/amazon-product-intelligence/fetch", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAmazonProductIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        asin?: string;
        region?: "na" | "fe" | "eu";
      };
      const report = await pillowHost.fetchAmazonProduct({
        asin: body.asin ?? "",
        region: body.region,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAmazonProductIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/amazon-order-management", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAmazonOrderManagementSnapshot());
    }
    try {
      return reply.send({
        amazonOrderManagement: pillowHost.getAmazonOrderManagement(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectAmazonOrderManagementSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/amazon-order-management/sync", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAmazonOrderManagementSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        forceFullSync?: boolean;
        region?: "na" | "fe" | "eu";
      };
      const report = await pillowHost.syncAmazonOrders(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAmazonOrderManagementSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/amazon-order-management/fetch", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAmazonOrderManagementSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        amazonOrderId?: string;
        region?: "na" | "fe" | "eu";
      };
      const report = await pillowHost.fetchAmazonOrder({
        amazonOrderId: body.amazonOrderId ?? "",
        region: body.region,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAmazonOrderManagementSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/amazon-order-management/process-event", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAmazonOrderManagementSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        eventType?: import("@empireai/pillow").LifecycleEventType;
        amazonOrderId?: string;
        payloadRef?: string;
      };
      const report = pillowHost.processAmazonOrderEvent({
        eventType: body.eventType ?? "order_updated",
        amazonOrderId: body.amazonOrderId ?? "",
        payloadRef: body.payloadRef ?? "",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAmazonOrderManagementSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/amazon-inventory-sync", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAmazonInventorySyncSnapshot());
    }
    try {
      return reply.send({
        amazonInventorySync: pillowHost.getAmazonInventorySync(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectAmazonInventorySyncSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/amazon-inventory-sync/sync", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAmazonInventorySyncSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        forceFullSync?: boolean;
        region?: "na" | "fe" | "eu";
      };
      const report = await pillowHost.syncAmazonInventory(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAmazonInventorySyncSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/amazon-inventory-sync/fetch", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAmazonInventorySyncSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        amazonSku?: string;
        region?: "na" | "fe" | "eu";
      };
      const report = await pillowHost.fetchAmazonInventory({
        amazonSku: body.amazonSku ?? "",
        region: body.region,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAmazonInventorySyncSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/walmart-marketplace-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectWalmartMarketplaceIntegrationSnapshot());
    }
    try {
      return reply.send({
        walmartMarketplaceIntegration: pillowHost.getWalmartMarketplaceIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectWalmartMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/walmart-marketplace-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWalmartMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        credentialRef?: string;
        forceReconnect?: boolean;
      };
      const report = pillowHost.connectWalmart(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWalmartMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/walmart-marketplace-integration/route-api", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWalmartMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        method?: string;
        path?: string;
      };
      const report = await pillowHost.routeWalmartApi({
        method: body.method ?? "GET",
        path: body.path ?? "/",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWalmartMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/etsy-marketplace-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectEtsyMarketplaceIntegrationSnapshot());
    }
    try {
      return reply.send({
        etsyMarketplaceIntegration: pillowHost.getEtsyMarketplaceIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectEtsyMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/etsy-marketplace-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectEtsyMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        credentialRef?: string;
        forceReconnect?: boolean;
      };
      const report = pillowHost.connectEtsy(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectEtsyMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/etsy-marketplace-integration/route-api", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectEtsyMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        method?: string;
        path?: string;
      };
      const report = await pillowHost.routeEtsyApi({
        method: body.method ?? "GET",
        path: body.path ?? "/",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectEtsyMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/etsy-marketplace-integration/handle-event", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectEtsyMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        topic?: string;
        payloadRef?: string;
      };
      const report = pillowHost.handleEtsyEvent({
        topic: body.topic ?? "UNKNOWN",
        payloadRef: body.payloadRef ?? "payload-ref-offline",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectEtsyMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/ebay-marketplace-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectEbayMarketplaceIntegrationSnapshot());
    }
    try {
      return reply.send({
        ebayMarketplaceIntegration: pillowHost.getEbayMarketplaceIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectEbayMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ebay-marketplace-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectEbayMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        credentialRef?: string;
        forceReconnect?: boolean;
      };
      const report = pillowHost.connectEbay(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectEbayMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ebay-marketplace-integration/route-api", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectEbayMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        method?: string;
        path?: string;
      };
      const report = await pillowHost.routeEbayApi({
        method: body.method ?? "GET",
        path: body.path ?? "/",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectEbayMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ebay-marketplace-integration/handle-event", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectEbayMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        topic?: string;
        payloadRef?: string;
      };
      const report = pillowHost.handleEbayEvent({
        topic: body.topic ?? "UNKNOWN",
        payloadRef: body.payloadRef ?? "payload-ref-offline",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectEbayMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/tiktok-shop-marketplace-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectTikTokShopMarketplaceIntegrationSnapshot());
    }
    try {
      return reply.send({
        tiktokShopMarketplaceIntegration: pillowHost.getTikTokShopMarketplaceIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectTikTokShopMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/tiktok-shop-marketplace-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTikTokShopMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        credentialRef?: string;
        shopId?: string;
        forceReconnect?: boolean;
      };
      const report = pillowHost.connectTikTokShop(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTikTokShopMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/tiktok-shop-marketplace-integration/route-api", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTikTokShopMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        method?: string;
        path?: string;
      };
      const report = await pillowHost.routeTikTokShopApi({
        method: body.method ?? "GET",
        path: body.path ?? "/",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTikTokShopMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/tiktok-shop-marketplace-integration/handle-event", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTikTokShopMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        topic?: string;
        payloadRef?: string;
      };
      const report = pillowHost.handleTikTokShopEvent({
        topic: body.topic ?? "UNKNOWN",
        payloadRef: body.payloadRef ?? "payload-ref-offline",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTikTokShopMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/shopify-store-marketplace-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectShopifyStoreMarketplaceIntegrationSnapshot());
    }
    try {
      return reply.send({
        shopifyStoreMarketplaceIntegration: pillowHost.getShopifyStoreMarketplaceIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectShopifyStoreMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/shopify-store-marketplace-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectShopifyStoreMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        credentialRef?: string;
        storeId?: string;
        storeDomain?: string;
        forceReconnect?: boolean;
      };
      const report = pillowHost.connectShopifyStore(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectShopifyStoreMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/shopify-store-marketplace-integration/route-api", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectShopifyStoreMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        method?: string;
        path?: string;
      };
      const report = await pillowHost.routeShopifyStoreApi({
        method: body.method ?? "GET",
        path: body.path ?? "/",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectShopifyStoreMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/shopify-store-marketplace-integration/handle-webhook", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectShopifyStoreMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        topic?: string;
        payloadRef?: string;
      };
      const report = pillowHost.handleShopifyStoreWebhook({
        topic: body.topic ?? "UNKNOWN",
        payloadRef: body.payloadRef ?? "payload-ref-offline",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectShopifyStoreMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/woocommerce-marketplace-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectWooCommerceMarketplaceIntegrationSnapshot());
    }
    try {
      return reply.send({
        woocommerceMarketplaceIntegration: pillowHost.getWooCommerceMarketplaceIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectWooCommerceMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/woocommerce-marketplace-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWooCommerceMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        credentialRef?: string;
        storeId?: string;
        storeUrl?: string;
        forceReconnect?: boolean;
      };
      const report = pillowHost.connectWooCommerce(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWooCommerceMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/woocommerce-marketplace-integration/route-api", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWooCommerceMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        method?: string;
        path?: string;
      };
      const report = await pillowHost.routeWooCommerceApi({
        method: body.method ?? "GET",
        path: body.path ?? "/",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWooCommerceMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/woocommerce-marketplace-integration/handle-webhook", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWooCommerceMarketplaceIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        topic?: string;
        payloadRef?: string;
      };
      const report = pillowHost.handleWooCommerceWebhook({
        topic: body.topic ?? "UNKNOWN",
        payloadRef: body.payloadRef ?? "payload-ref-offline",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWooCommerceMarketplaceIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/marketplace-product-normalization", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectMarketplaceProductNormalizationSnapshot());
    }
    try {
      return reply.send({
        marketplaceProductNormalization: pillowHost.getMarketplaceProductNormalization(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectMarketplaceProductNormalizationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketplace-product-normalization/normalize", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketplaceProductNormalizationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        marketplaceIdentifier?: string;
        includeFixtureCatalog?: boolean;
      };
      const report = await pillowHost.normalizeProducts({
        marketplaceIdentifier: body.marketplaceIdentifier as
          | "amazon"
          | "walmart"
          | "etsy"
          | "ebay"
          | "tiktok-shop"
          | "shopify"
          | "woocommerce"
          | undefined,
        includeFixtureCatalog: body.includeFixtureCatalog,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketplaceProductNormalizationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketplace-product-normalization/detect-duplicates", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketplaceProductNormalizationSnapshot());
    }
    try {
      const report = pillowHost.detectProductDuplicates({});
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketplaceProductNormalizationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/marketplace-order-normalization", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectMarketplaceOrderNormalizationSnapshot());
    }
    try {
      return reply.send({
        marketplaceOrderNormalization: pillowHost.getMarketplaceOrderNormalization(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectMarketplaceOrderNormalizationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketplace-order-normalization/normalize", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketplaceOrderNormalizationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        marketplaceIdentifier?: string;
        includeFixtureCatalog?: boolean;
      };
      const report = await pillowHost.normalizeOrders({
        marketplaceIdentifier: body.marketplaceIdentifier as
          | "amazon"
          | "walmart"
          | "etsy"
          | "ebay"
          | "tiktok-shop"
          | "shopify"
          | "woocommerce"
          | undefined,
        includeFixtureCatalog: body.includeFixtureCatalog,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketplaceOrderNormalizationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketplace-order-normalization/detect-duplicates", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketplaceOrderNormalizationSnapshot());
    }
    try {
      const report = pillowHost.detectOrderDuplicates({});
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketplaceOrderNormalizationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/marketplace-health-monitor", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectMarketplaceHealthMonitorSnapshot());
    }
    try {
      return reply.send({
        marketplaceHealthMonitor: pillowHost.getMarketplaceHealthMonitor(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectMarketplaceHealthMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketplace-health-monitor/health-check", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketplaceHealthMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        marketplaceIdentifier?: string;
        includeAllMarketplaces?: boolean;
      };
      const report = await pillowHost.runMarketplaceHealthCheck({
        marketplaceIdentifier: body.marketplaceIdentifier as
          | "amazon"
          | "walmart"
          | "etsy"
          | "ebay"
          | "tiktok-shop"
          | "shopify"
          | "woocommerce"
          | undefined,
        includeAllMarketplaces: body.includeAllMarketplaces,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketplaceHealthMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketplace-health-monitor/detect-failures", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketplaceHealthMonitorSnapshot());
    }
    try {
      const report = pillowHost.detectMarketplaceHealthFailures({});
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketplaceHealthMonitorSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/marketplace-certification", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectMarketplaceCertificationSnapshot());
    }
    try {
      return reply.send({
        marketplaceCertification: pillowHost.getMarketplaceCertification(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectMarketplaceCertificationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketplace-certification/run", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketplaceCertificationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        missionScope?: string[];
        includeSmokeTests?: boolean;
      };
      const report = await pillowHost.runMarketplaceCertification({
        missionScope: body.missionScope,
        includeSmokeTests: body.includeSmokeTests,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketplaceCertificationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketplace-certification/validate", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketplaceCertificationSnapshot());
    }
    try {
      const validation = pillowHost.validateMarketplaceCertificationReport();
      return reply.send({ computedAt: new Date().toISOString(), validation });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketplaceCertificationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/supplier-framework", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectSupplierFrameworkSnapshot());
    }
    try {
      return reply.send({
        supplierFramework: pillowHost.getSupplierFramework(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectSupplierFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/supplier-framework/register", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSupplierFrameworkSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        definition?: Record<string, unknown>;
        forceRegister?: boolean;
      };
      const report = pillowHost.registerSupplierConnector({
        definition: body.definition,
        forceRegister: body.forceRegister,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSupplierFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/supplier-framework/activate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSupplierFrameworkSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { supplierIdentifier?: string };
      const report = pillowHost.activateSupplierConnector(body.supplierIdentifier ?? "");
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSupplierFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/cj-dropshipping-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCjDropshippingIntegrationSnapshot());
    }
    try {
      return reply.send({
        cjDropshippingIntegration: pillowHost.getCjDropshippingIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCjDropshippingIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cj-dropshipping-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCjDropshippingIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { credentialRef?: string; forceReconnect?: boolean };
      const report = pillowHost.connectCjDropshipping(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCjDropshippingIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cj-dropshipping-integration/route-api", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCjDropshippingIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { method?: string; path?: string };
      const report = await pillowHost.routeCjApi({
        method: body.method ?? "GET",
        path: body.path ?? "/product/list",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCjDropshippingIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/aliexpress-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAliExpressIntegrationSnapshot());
    }
    try {
      return reply.send({
        aliExpressIntegration: pillowHost.getAliExpressIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectAliExpressIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/aliexpress-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAliExpressIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { credentialRef?: string; forceReconnect?: boolean };
      const report = pillowHost.connectAliExpress(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAliExpressIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/aliexpress-integration/route-api", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAliExpressIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { method?: string; path?: string };
      const report = await pillowHost.routeAliExpressApi({
        method: body.method ?? "GET",
        path: body.path ?? "/product/list",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAliExpressIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/1688-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectOss1688IntegrationSnapshot());
    }
    try {
      return reply.send({
        oss1688Integration: pillowHost.getOss1688Integration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectOss1688IntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/1688-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectOss1688IntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { credentialRef?: string; forceReconnect?: boolean };
      const report = pillowHost.connectOss1688(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectOss1688IntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/1688-integration/route-api", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectOss1688IntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { method?: string; path?: string };
      const report = await pillowHost.routeOss1688Api({
        method: body.method ?? "GET",
        path: body.path ?? "/product/list",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectOss1688IntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/supplier-product-sync", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectSupplierProductSyncSnapshot());
    }
    try {
      return reply.send({
        supplierProductSync: pillowHost.getSupplierProductSync(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectSupplierProductSyncSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/supplier-product-sync/sync", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSupplierProductSyncSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        supplierId?: string;
        includeFixtureCatalog?: boolean;
        changeFixtureMode?: "none" | "updated" | "discontinued" | "new";
      };
      const report = await pillowHost.syncSupplierProducts(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSupplierProductSyncSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/supplier-product-sync/detect-duplicates", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSupplierProductSyncSnapshot());
    }
    try {
      const report = pillowHost.detectDuplicateSupplierProducts();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSupplierProductSyncSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/supplier-inventory-sync", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectSupplierInventorySyncSnapshot());
    }
    try {
      return reply.send({
        supplierInventorySync: pillowHost.getSupplierInventorySync(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectSupplierInventorySyncSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/supplier-inventory-sync/sync", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSupplierInventorySyncSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        supplierId?: string;
        includeFixtureInventory?: boolean;
        changeFixtureMode?: "none" | "increase" | "decrease" | "out_of_stock" | "discontinued";
      };
      const report = await pillowHost.syncSupplierInventory(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSupplierInventorySyncSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/supplier-pricing-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectSupplierPricingEngineSnapshot());
    }
    try {
      return reply.send({
        supplierPricingEngine: pillowHost.getSupplierPricingEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectSupplierPricingEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/supplier-pricing-engine/sync", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSupplierPricingEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        supplierId?: string;
        includeFixturePricing?: boolean;
        changeFixtureMode?: "none" | "increase" | "decrease" | "anomaly";
      };
      const report = await pillowHost.syncSupplierPricing(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSupplierPricingEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/supplier-ranking-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectSupplierRankingEngineSnapshot());
    }
    try {
      return reply.send({
        supplierRankingEngine: pillowHost.getSupplierRankingEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectSupplierRankingEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/supplier-ranking-engine/rank", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSupplierRankingEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        supplierId?: string;
        includeFixtureMetrics?: boolean;
        performanceFixtureMode?: "none" | "declining" | "high_performing";
      };
      const report = pillowHost.rankSuppliers(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSupplierRankingEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/procurement-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectProcurementEngineSnapshot());
    }
    try {
      return reply.send({
        procurementEngine: pillowHost.getProcurementEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectProcurementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/procurement-engine/request", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectProcurementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        productReference?: string;
        supplierProductId?: string;
        requestedQuantity?: number;
        preferredSupplierId?: string;
        includeFixtureRequest?: boolean;
      };
      const report = pillowHost.createProcurementRequest(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectProcurementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/procurement-engine/approve", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectProcurementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { procurementId?: string; approved?: boolean };
      const report = pillowHost.approveProcurement({
        procurementId: body.procurementId ?? "",
        approved: body.approved ?? true,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectProcurementEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/fulfilment-orchestrator", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectFulfilmentOrchestratorSnapshot());
    }
    try {
      return reply.send({
        fulfilmentOrchestrator: pillowHost.getFulfilmentOrchestrator(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectFulfilmentOrchestratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/fulfilment-orchestrator/route", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFulfilmentOrchestratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        orderReference?: string;
        procurementReference?: string;
        productReference?: string;
        quantity?: number;
      };
      const report = pillowHost.routeFulfilment(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFulfilmentOrchestratorSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/shipping-carrier-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectShippingCarrierIntegrationSnapshot());
    }
    try {
      return reply.send({
        shippingCarrierIntegration: pillowHost.getShippingCarrierIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectShippingCarrierIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/shipping-carrier-integration/shipment", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectShippingCarrierIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        carrierId?: string;
        orderReference?: string;
        fulfilmentReference?: string;
        includeFixtureShipment?: boolean;
      };
      const report = pillowHost.createShipmentRequest(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectShippingCarrierIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/shipping-carrier-integration/rates", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectShippingCarrierIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { carrierId?: string; orderReference?: string };
      const report = pillowHost.requestShippingRates(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectShippingCarrierIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/shipment-tracking-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectShipmentTrackingEngineSnapshot());
    }
    try {
      return reply.send({
        shipmentTrackingEngine: pillowHost.getShipmentTrackingEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectShipmentTrackingEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/shipment-tracking-engine/sync", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectShipmentTrackingEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        shipmentId?: string;
        trackingFixtureMode?: "none" | "in_transit" | "delivered" | "delayed" | "failed";
      };
      const report = pillowHost.syncShipmentTracking(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectShipmentTrackingEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/return-management", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectReturnManagementSnapshot());
    }
    try {
      return reply.send({
        returnManagement: pillowHost.getReturnManagement(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectReturnManagementSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/return-management/request", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReturnManagementSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        orderReference?: string;
        shipmentReference?: string;
        customerReference?: string;
        supplierReference?: string;
        returnReason?: string;
        includeFixtureReturn?: boolean;
      };
      const report = pillowHost.createReturnRequest(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReturnManagementSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/warehouse-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectWarehouseIntelligenceSnapshot());
    }
    try {
      return reply.send({
        warehouseIntelligence: pillowHost.getWarehouseIntelligence(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectWarehouseIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/warehouse-intelligence/coordinate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWarehouseIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        warehouseId?: string;
        includeFixtureWarehouses?: boolean;
        warehouseFixtureMode?: "none" | "optimal" | "bottleneck" | "shortage" | "overstock";
      };
      const report = pillowHost.coordinateWarehouses(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWarehouseIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/multi-warehouse-support", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectMultiWarehouseSupportSnapshot());
    }
    try {
      return reply.send({
        multiWarehouseSupport: pillowHost.getMultiWarehouseSupport(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectMultiWarehouseSupportSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/multi-warehouse-support/register", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMultiWarehouseSupportSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        warehouseIds?: string[];
        includeFixtureWarehouses?: boolean;
        networkFixtureMode?: "none" | "balanced" | "imbalanced" | "capacity_issue";
      };
      const report = pillowHost.registerWarehouses(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMultiWarehouseSupportSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/supplier-risk-monitor", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectSupplierRiskMonitorSnapshot());
    }
    try {
      return reply.send({
        supplierRiskMonitor: pillowHost.getSupplierRiskMonitor(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectSupplierRiskMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/supplier-risk-monitor/monitor", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSupplierRiskMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        supplierIds?: string[];
        includeFixtureSuppliers?: boolean;
        riskFixtureMode?: "none" | "healthy" | "elevated" | "disrupted" | "abnormal";
      };
      const report = pillowHost.monitorSupplierHealth(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSupplierRiskMonitorSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/logistics-optimization", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectLogisticsOptimizationSnapshot());
    }
    try {
      return reply.send({
        logisticsOptimization: pillowHost.getLogisticsOptimization(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectLogisticsOptimizationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/logistics-optimization/optimize", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLogisticsOptimizationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        orderReference?: string;
        includeFixtureOrders?: boolean;
        logisticsFixtureMode?: "none" | "optimal" | "bottleneck" | "inefficient" | "high_cost";
      };
      const report = pillowHost.optimizeShipping(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLogisticsOptimizationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/fulfilment-sla-monitor", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectFulfilmentSlaMonitorSnapshot());
    }
    try {
      return reply.send({
        fulfilmentSlaMonitor: pillowHost.getFulfilmentSlaMonitor(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectFulfilmentSlaMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/fulfilment-sla-monitor/monitor", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFulfilmentSlaMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        orderReference?: string;
        includeFixtureOrders?: boolean;
        slaFixtureMode?: "none" | "compliant" | "at_risk" | "breached";
      };
      const report = pillowHost.monitorFulfilmentSla(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFulfilmentSlaMonitorSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/procurement-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectProcurementIntelligenceSnapshot());
    }
    try {
      return reply.send({
        procurementIntelligence: pillowHost.getProcurementIntelligence(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectProcurementIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/procurement-intelligence/analyze", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectProcurementIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        productReference?: string;
        procurementReference?: string;
        includeFixtureProcurements?: boolean;
        intelligenceFixtureMode?: "none" | "optimal" | "elevated_cost" | "anomaly" | "high_risk";
      };
      const report = pillowHost.analyzeProcurement(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectProcurementIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/supplier-operations-certification", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectSupplierOperationsCertificationSnapshot());
    }
    try {
      return reply.send({
        supplierOperationsCertification: pillowHost.getSupplierOperationsCertification(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectSupplierOperationsCertificationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/supplier-operations-certification/run", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSupplierOperationsCertificationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        missionScope?: string[];
        includeSmokeTests?: boolean;
      };
      const report = await pillowHost.runSupplierOperationsCertification({
        missionScope: body.missionScope,
        includeSmokeTests: body.includeSmokeTests,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSupplierOperationsCertificationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/supplier-operations-certification/validate", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSupplierOperationsCertificationSnapshot());
    }
    try {
      const validation = pillowHost.validateSupplierOperationsCertificationReport();
      return reply.send({ computedAt: new Date().toISOString(), validation });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSupplierOperationsCertificationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/financial-framework", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectFinancialFrameworkSnapshot());
    }
    try {
      return reply.send({
        financialFramework: pillowHost.getFinancialFramework(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectFinancialFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/financial-framework/register", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFinancialFrameworkSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        definition?: Record<string, unknown>;
        forceRegister?: boolean;
      };
      const report = pillowHost.registerFinancialModule({
        definition: body.definition,
        forceRegister: body.forceRegister,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFinancialFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/financial-framework/activate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFinancialFrameworkSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { financialModuleIdentifier?: string };
      const report = pillowHost.activateFinancialModule(body.financialModuleIdentifier ?? "");
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFinancialFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/payment-gateway-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectPaymentGatewayIntegrationSnapshot());
    }
    try {
      return reply.send({
        paymentGatewayIntegration: pillowHost.getPaymentGatewayIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectPaymentGatewayIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/payment-gateway-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectPaymentGatewayIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        credentialRef?: string;
        providerIdentifier?: string;
        forceReconnect?: boolean;
      };
      const report = pillowHost.connectPaymentGateway(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectPaymentGatewayIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/payment-gateway-integration/create-payment", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectPaymentGatewayIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        customerReference?: string;
        orderReference?: string;
        paymentAmount?: number;
        currency?: string;
      };
      const report = pillowHost.createPaymentRequest({
        customerReference: body.customerReference ?? "",
        orderReference: body.orderReference ?? "",
        paymentAmount: body.paymentAmount ?? 0,
        currency: body.currency,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectPaymentGatewayIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/banking-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectBankingIntegrationSnapshot());
    }
    try {
      return reply.send({
        bankingIntegration: pillowHost.getBankingIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectBankingIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/banking-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBankingIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        credentialRef?: string;
        providerIdentifier?: string;
        forceReconnect?: boolean;
      };
      const report = pillowHost.connectBankingIntegration(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBankingIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/banking-integration/sync-accounts", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBankingIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        providerIdentifier?: string;
        includeFixtureAccounts?: boolean;
      };
      const report = pillowHost.syncBankAccounts(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBankingIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/banking-integration/sync-balances", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBankingIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        bankAccountReference?: string;
        includeFixtureBalances?: boolean;
      };
      const report = pillowHost.syncAccountBalances(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBankingIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/banking-integration/sync-transactions", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBankingIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        bankAccountReference?: string;
        includeFixtureTransactions?: boolean;
      };
      const report = pillowHost.syncTransactionHistory(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBankingIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/revenue-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectRevenueEngineSnapshot());
    }
    try {
      return reply.send({
        revenueEngine: pillowHost.getRevenueEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectRevenueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/revenue-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectRevenueEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectRevenueEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectRevenueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/revenue-engine/record-payment", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectRevenueEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        paymentId?: string;
        businessReference?: string;
      };
      const report = pillowHost.recordCompletedPaymentRevenue({
        paymentId: body.paymentId ?? "",
        businessReference: body.businessReference,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectRevenueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/revenue-engine/record-marketplace", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectRevenueEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        marketplaceReference?: string;
        customerReference?: string;
        businessReference?: string;
        grossRevenue?: number;
        netRevenue?: number;
        currency?: string;
      };
      const report = pillowHost.recordMarketplaceRevenue({
        marketplaceReference: body.marketplaceReference ?? "",
        customerReference: body.customerReference,
        businessReference: body.businessReference,
        grossRevenue: body.grossRevenue ?? 0,
        netRevenue: body.netRevenue,
        currency: body.currency,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectRevenueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/revenue-engine/aggregate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectRevenueEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        currency?: string;
        businessReference?: string;
        marketplaceReference?: string;
      };
      const report = pillowHost.aggregateRevenue(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectRevenueEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/expense-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExpenseEngineSnapshot());
    }
    try {
      return reply.send({
        expenseEngine: pillowHost.getExpenseEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExpenseEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/expense-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExpenseEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectExpenseEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExpenseEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/expense-engine/record-supplier-payment", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExpenseEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        supplierReference?: string;
        paymentReference?: string;
        bankingReference?: string;
        expenseAmount?: number;
        currency?: string;
        recurring?: boolean;
      };
      const report = pillowHost.recordSupplierPayment({
        supplierReference: body.supplierReference ?? "",
        paymentReference: body.paymentReference,
        bankingReference: body.bankingReference,
        expenseAmount: body.expenseAmount ?? 0,
        currency: body.currency,
        recurring: body.recurring,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExpenseEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/expense-engine/record-shipping", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExpenseEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        expenseAmount?: number;
        paymentReference?: string;
        currency?: string;
        recurring?: boolean;
      };
      const report = pillowHost.recordShippingExpense({
        expenseAmount: body.expenseAmount ?? 0,
        paymentReference: body.paymentReference,
        currency: body.currency,
        recurring: body.recurring,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExpenseEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/expense-engine/aggregate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExpenseEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        currency?: string;
        expenseCategory?: string;
      };
      const report = pillowHost.aggregateExpenses(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExpenseEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/profit-calculation-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectProfitCalculationEngineSnapshot());
    }
    try {
      return reply.send({
        profitCalculationEngine: pillowHost.getProfitCalculationEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectProfitCalculationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/profit-calculation-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectProfitCalculationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectProfitCalculationEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectProfitCalculationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/profit-calculation-engine/calculate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectProfitCalculationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        currency?: string;
        revenueReference?: string;
        expenseReference?: string;
      };
      const report = pillowHost.calculateProfit(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectProfitCalculationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/profit-calculation-engine/calculate-marketplace", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectProfitCalculationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        marketplaceReference?: string;
        currency?: string;
      };
      const report = pillowHost.calculateProfitByMarketplace({
        marketplaceReference: body.marketplaceReference ?? "",
        currency: body.currency,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectProfitCalculationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/profit-calculation-engine/aggregate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectProfitCalculationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { currency?: string; scope?: string };
      const report = pillowHost.aggregateProfit(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectProfitCalculationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/cash-flow-monitor", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCashFlowMonitorSnapshot());
    }
    try {
      return reply.send({
        cashFlowMonitor: pillowHost.getCashFlowMonitor(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCashFlowMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cash-flow-monitor/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCashFlowMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectCashFlowMonitor(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCashFlowMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cash-flow-monitor/monitor", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCashFlowMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { bankingReference?: string };
      const report = pillowHost.monitorCashFlow(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCashFlowMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cash-flow-monitor/monitor-inflows", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCashFlowMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { revenueReference?: string };
      const report = pillowHost.monitorCashInflows(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCashFlowMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cash-flow-monitor/monitor-outflows", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCashFlowMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { expenseReference?: string };
      const report = pillowHost.monitorCashOutflows(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCashFlowMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cash-flow-monitor/forecast", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCashFlowMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { horizonDays?: number; bankingReference?: string };
      const report = pillowHost.forecastCashAvailability(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCashFlowMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cash-flow-monitor/aggregate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCashFlowMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { currency?: string; scope?: string };
      const report = pillowHost.aggregateCashFlow(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCashFlowMonitorSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/reconciliation-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectReconciliationEngineSnapshot());
    }
    try {
      return reply.send({
        reconciliationEngine: pillowHost.getReconciliationEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectReconciliationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/reconciliation-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReconciliationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectReconciliationEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReconciliationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/reconciliation-engine/reconcile-payments", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReconciliationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { paymentReference?: string; currency?: string };
      const report = pillowHost.reconcilePayments(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReconciliationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/reconciliation-engine/reconcile-banking", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReconciliationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { bankingReference?: string; currency?: string };
      const report = pillowHost.reconcileBanking(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReconciliationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/reconciliation-engine/reconcile-revenue", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReconciliationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { revenueReference?: string; currency?: string };
      const report = pillowHost.reconcileRevenue(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReconciliationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/reconciliation-engine/reconcile-expenses", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReconciliationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { expenseReference?: string; currency?: string };
      const report = pillowHost.reconcileExpenses(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReconciliationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/reconciliation-engine/reconcile-cash-flow", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReconciliationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { cashFlowReference?: string; currency?: string };
      const report = pillowHost.reconcileCashFlow(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReconciliationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/reconciliation-engine/reconcile-all", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReconciliationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { currency?: string };
      const report = pillowHost.reconcileAll(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReconciliationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/invoice-generator", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectInvoiceGeneratorSnapshot());
    }
    try {
      return reply.send({
        invoiceGenerator: pillowHost.getInvoiceGenerator(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectInvoiceGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/invoice-generator/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectInvoiceGeneratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectInvoiceGenerator(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectInvoiceGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/invoice-generator/create-customer", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectInvoiceGeneratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        revenueReference?: string;
        customerReference?: string;
        orderReference?: string;
        currency?: string;
      };
      const report = pillowHost.createCustomerInvoice({
        revenueReference: body.revenueReference ?? "",
        customerReference: body.customerReference,
        orderReference: body.orderReference,
        currency: body.currency,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectInvoiceGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/invoice-generator/create-supplier", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectInvoiceGeneratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        expenseReference?: string;
        supplierReference?: string;
        currency?: string;
      };
      const report = pillowHost.createSupplierInvoice({
        expenseReference: body.expenseReference ?? "",
        supplierReference: body.supplierReference,
        currency: body.currency,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectInvoiceGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/invoice-generator/update-status", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectInvoiceGeneratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        invoiceId?: string;
        invoiceStatus?: "draft" | "issued" | "sent" | "paid" | "cancelled" | "failed";
      };
      const report = pillowHost.updateInvoiceStatus({
        invoiceId: body.invoiceId ?? "",
        invoiceStatus: body.invoiceStatus ?? "issued",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectInvoiceGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/refund-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectRefundEngineSnapshot());
    }
    try {
      return reply.send({
        refundEngine: pillowHost.getRefundEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectRefundEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/refund-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectRefundEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectRefundEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectRefundEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/refund-engine/create-request", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectRefundEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        paymentReference?: string;
        invoiceReference?: string;
        customerReference?: string;
        orderReference?: string;
        refundAmount?: number;
        currency?: string;
        refundReason?: string;
      };
      const report = pillowHost.createRefundRequest({
        paymentReference: body.paymentReference ?? "",
        invoiceReference: body.invoiceReference,
        customerReference: body.customerReference,
        orderReference: body.orderReference,
        refundAmount: body.refundAmount ?? 0,
        currency: body.currency,
        refundReason: body.refundReason ?? "",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectRefundEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/refund-engine/process-full", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectRefundEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        paymentReference?: string;
        invoiceReference?: string;
        refundReason?: string;
        currency?: string;
      };
      const report = pillowHost.processFullRefund({
        paymentReference: body.paymentReference ?? "",
        invoiceReference: body.invoiceReference,
        refundReason: body.refundReason ?? "",
        currency: body.currency,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectRefundEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/refund-engine/process-partial", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectRefundEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        paymentReference?: string;
        invoiceReference?: string;
        refundAmount?: number;
        refundReason?: string;
        currency?: string;
      };
      const report = pillowHost.processPartialRefund({
        paymentReference: body.paymentReference ?? "",
        invoiceReference: body.invoiceReference,
        refundAmount: body.refundAmount ?? 0,
        refundReason: body.refundReason ?? "",
        currency: body.currency,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectRefundEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/tax-intelligence-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectTaxIntelligenceEngineSnapshot());
    }
    try {
      return reply.send({
        taxIntelligenceEngine: pillowHost.getTaxIntelligenceEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectTaxIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/tax-intelligence-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTaxIntelligenceEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectTaxIntelligenceEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTaxIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/tax-intelligence-engine/classify", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTaxIntelligenceEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        revenueReference?: string;
        expenseReference?: string;
        invoiceReference?: string;
        refundReference?: string;
        taxJurisdiction?: string;
      };
      const report = pillowHost.classifyTaxableTransaction(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTaxIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/tax-intelligence-engine/calculate-liability", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTaxIntelligenceEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        revenueReference?: string;
        expenseReference?: string;
        invoiceReference?: string;
        taxableAmount?: number;
        taxJurisdiction?: string;
        taxCategory?: string;
      };
      const report = pillowHost.calculateTaxLiability({
        revenueReference: body.revenueReference,
        expenseReference: body.expenseReference,
        invoiceReference: body.invoiceReference,
        taxableAmount: body.taxableAmount ?? 0,
        taxJurisdiction: body.taxJurisdiction,
        taxCategory: body.taxCategory as
          | "sales_tax"
          | "vat"
          | "income_tax"
          | "deductible"
          | "refund_adjustment"
          | "withholding"
          | undefined,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTaxIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/tax-intelligence-engine/calculate-adjustment", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTaxIntelligenceEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        refundReference?: string;
        taxJurisdiction?: string;
      };
      const report = pillowHost.calculateTaxAdjustment({
        refundReference: body.refundReference ?? "",
        taxJurisdiction: body.taxJurisdiction,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTaxIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/tax-intelligence-engine/record-payment", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTaxIntelligenceEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        taxRecordId?: string;
        paymentAmount?: number;
      };
      const report = pillowHost.recordTaxPayment({
        taxRecordId: body.taxRecordId ?? "",
        paymentAmount: body.paymentAmount ?? 0,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTaxIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/tax-intelligence-engine/summary", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTaxIntelligenceEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { taxJurisdiction?: string };
      const report = pillowHost.generateTaxSummary(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTaxIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/multi-currency-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectMultiCurrencyEngineSnapshot());
    }
    try {
      return reply.send({
        multiCurrencyEngine: pillowHost.getMultiCurrencyEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectMultiCurrencyEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/multi-currency-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMultiCurrencyEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectMultiCurrencyEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMultiCurrencyEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/multi-currency-engine/convert", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMultiCurrencyEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sourceCurrency?: string;
        targetCurrency?: string;
        originalAmount?: number;
      };
      const report = pillowHost.convertCurrency({
        sourceCurrency: body.sourceCurrency ?? "USD",
        targetCurrency: body.targetCurrency ?? "USD",
        originalAmount: body.originalAmount ?? 0,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMultiCurrencyEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/multi-currency-engine/record-transaction", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMultiCurrencyEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sourceCurrency?: string;
        originalAmount?: number;
        revenueReference?: string;
        expenseReference?: string;
      };
      const report = pillowHost.recordTransactionCurrency({
        sourceCurrency: body.sourceCurrency ?? "USD",
        originalAmount: body.originalAmount ?? 0,
        revenueReference: body.revenueReference,
        expenseReference: body.expenseReference,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMultiCurrencyEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/multi-currency-engine/refresh-rates", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMultiCurrencyEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceRefresh?: boolean };
      const report = pillowHost.refreshExchangeRates(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMultiCurrencyEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/multi-currency-engine/gain-loss", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMultiCurrencyEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        sourceCurrency?: string;
        originalAmount?: number;
        reportingCurrency?: string;
      };
      const report = pillowHost.calculateCurrencyGainLoss({
        sourceCurrency: body.sourceCurrency ?? "USD",
        originalAmount: body.originalAmount ?? 0,
        reportingCurrency: body.reportingCurrency,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMultiCurrencyEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/multi-currency-engine/summary", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMultiCurrencyEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { reportingCurrency?: string };
      const report = pillowHost.generateCurrencySummary(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMultiCurrencyEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/financial-forecast-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectFinancialForecastEngineSnapshot());
    }
    try {
      return reply.send({
        financialForecastEngine: pillowHost.getFinancialForecastEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectFinancialForecastEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/financial-forecast-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFinancialForecastEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectFinancialForecastEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFinancialForecastEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/financial-forecast-engine/generate-projection", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFinancialForecastEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forecastPeriod?: string };
      const report = pillowHost.generateFinancialProjection({
        forecastPeriod: body.forecastPeriod as "7d" | "30d" | "90d" | "quarterly" | "annual" | undefined,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFinancialForecastEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/financial-forecast-engine/analyze-trends", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFinancialForecastEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forecastPeriod?: string };
      const report = pillowHost.analyzeFinancialTrends({
        forecastPeriod: body.forecastPeriod as "7d" | "30d" | "90d" | "quarterly" | "annual" | undefined,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFinancialForecastEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/financial-forecast-engine/detect-deviations", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFinancialForecastEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forecastRecordId?: string };
      const report = pillowHost.detectForecastDeviations({
        forecastRecordId: body.forecastRecordId,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFinancialForecastEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/budget-management-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectBudgetManagementEngineSnapshot());
    }
    try {
      return reply.send({
        budgetManagementEngine: pillowHost.getBudgetManagementEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectBudgetManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-management-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectBudgetManagementEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-management-engine/create-budget", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        budgetPeriod?: string;
        budgetCategory?: string;
        budgetAllocation?: number;
      };
      const report = pillowHost.createBudget({
        budgetPeriod: body.budgetPeriod as "monthly" | "quarterly" | "annual" | undefined,
        budgetCategory: body.budgetCategory as "operations" | "marketing" | "payroll" | "supplies" | "overhead" | "other" | undefined,
        budgetAllocation: body.budgetAllocation ?? 0,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-management-engine/allocate-budget", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { budgetRecordId?: string; additionalAllocation?: number };
      const report = pillowHost.allocateBudget({
        budgetRecordId: body.budgetRecordId ?? "",
        additionalAllocation: body.additionalAllocation ?? 0,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-management-engine/track-utilization", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { budgetRecordId?: string };
      const report = pillowHost.trackBudgetUtilization({ budgetRecordId: body.budgetRecordId });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-management-engine/compare-actual", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { budgetRecordId?: string };
      const report = pillowHost.compareActualVsBudget({ budgetRecordId: body.budgetRecordId });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-management-engine/detect-overruns", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { budgetRecordId?: string };
      const report = pillowHost.detectBudgetOverruns({ budgetRecordId: body.budgetRecordId });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-management-engine/detect-variances", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { budgetRecordId?: string };
      const report = pillowHost.detectBudgetVariances({ budgetRecordId: body.budgetRecordId });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-management-engine/recommendations", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { budgetRecordId?: string };
      const report = pillowHost.generateBudgetRecommendations({ budgetRecordId: body.budgetRecordId });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/financial-risk-monitor", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectFinancialRiskMonitorSnapshot());
    }
    try {
      return reply.send({
        financialRiskMonitor: pillowHost.getFinancialRiskMonitor(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectFinancialRiskMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/financial-risk-monitor/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFinancialRiskMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectFinancialRiskMonitor(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFinancialRiskMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/financial-risk-monitor/monitor-health", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFinancialRiskMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { riskCategory?: string };
      const report = pillowHost.monitorFinancialHealth({
        riskCategory: body.riskCategory as "liquidity" | "profitability" | "cash_flow" | "budget" | "revenue_volatility" | "expense_volatility" | "composite" | undefined,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFinancialRiskMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/financial-risk-monitor/calculate-risk-score", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFinancialRiskMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { riskCategory?: string };
      const report = pillowHost.calculateFinancialRiskScore({
        riskCategory: body.riskCategory as "liquidity" | "profitability" | "cash_flow" | "budget" | "revenue_volatility" | "expense_volatility" | "composite" | undefined,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFinancialRiskMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/financial-risk-monitor/detect-anomalies", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFinancialRiskMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { riskRecordId?: string };
      const report = pillowHost.detectFinancialAnomalies({ riskRecordId: body.riskRecordId });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFinancialRiskMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/financial-risk-monitor/detect-threshold-breaches", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFinancialRiskMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { riskRecordId?: string };
      const report = pillowHost.detectThresholdBreaches({ riskRecordId: body.riskRecordId });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFinancialRiskMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/financial-risk-monitor/generate-alerts", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFinancialRiskMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { riskRecordId?: string };
      const report = pillowHost.generateFinancialRiskAlerts({ riskRecordId: body.riskRecordId });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFinancialRiskMonitorSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-financial-dashboard", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveFinancialDashboardSnapshot());
    }
    try {
      return reply.send({
        executiveFinancialDashboard: pillowHost.getExecutiveFinancialDashboard(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveFinancialDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-financial-dashboard/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveFinancialDashboardSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectExecutiveFinancialDashboard(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveFinancialDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-financial-dashboard/refresh", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveFinancialDashboardSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceRefresh?: boolean };
      const report = pillowHost.refreshExecutiveDashboard({ forceRefresh: body.forceRefresh });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveFinancialDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-financial-dashboard/generate-summary", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveFinancialDashboardSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.generateExecutiveSummary(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveFinancialDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-financial-dashboard/aggregate-kpis", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveFinancialDashboardSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.aggregateFinancialKpis(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveFinancialDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-financial-dashboard/widgets", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveFinancialDashboardSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { widgetTypes?: string[] };
      const report = pillowHost.getDashboardWidgets({
        widgetTypes: body.widgetTypes as import("@empireai/pillow").WidgetType[] | undefined,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveFinancialDashboardSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/accounting-export-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAccountingExportEngineSnapshot());
    }
    try {
      return reply.send({
        accountingExportEngine: pillowHost.getAccountingExportEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectAccountingExportEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/accounting-export-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAccountingExportEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectAccountingExportEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAccountingExportEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/accounting-export-engine/export", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAccountingExportEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        exportFormat?: string;
        exportScope?: string;
        forceExport?: boolean;
      };
      const report = pillowHost.exportFinancialRecords({
        exportFormat: body.exportFormat as import("@empireai/pillow").ExportFormat | undefined,
        exportScope: body.exportScope as import("@empireai/pillow").ExportScope | undefined,
        forceExport: body.forceExport,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAccountingExportEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/accounting-export-engine/validate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAccountingExportEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { exportRecordId?: string };
      const report = pillowHost.validateExport({ exportRecordId: body.exportRecordId });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAccountingExportEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/accounting-export-engine/detect-failures", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAccountingExportEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { exportRecordId?: string };
      const report = pillowHost.detectExportFailures({ exportRecordId: body.exportRecordId });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAccountingExportEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/accounting-export-engine/package", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAccountingExportEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { exportRecordId?: string; exportFormat?: string };
      const report = pillowHost.packageExport({
        exportRecordId: body.exportRecordId,
        exportFormat: body.exportFormat as import("@empireai/pillow").ExportFormat | undefined,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAccountingExportEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/financial-operations-certification", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectFinancialOperationsCertificationSnapshot());
    }
    try {
      return reply.send({
        financialOperationsCertification: pillowHost.getFinancialOperationsCertification(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectFinancialOperationsCertificationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/financial-operations-certification/run", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFinancialOperationsCertificationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        missionScope?: string[];
        includeSmokeTests?: boolean;
      };
      const report = await pillowHost.runFinancialOperationsCertification({
        missionScope: body.missionScope,
        includeSmokeTests: body.includeSmokeTests,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFinancialOperationsCertificationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/financial-operations-certification/validate", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectFinancialOperationsCertificationSnapshot());
    }
    try {
      const validation = pillowHost.validateFinancialOperationsCertificationReport();
      return reply.send({ computedAt: new Date().toISOString(), validation });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectFinancialOperationsCertificationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/customer-identity-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCustomerIdentityEngineSnapshot());
    }
    try {
      return reply.send({
        customerIdentityEngine: pillowHost.getCustomerIdentityEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCustomerIdentityEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-identity-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerIdentityEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectCustomerIdentityEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerIdentityEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-identity-engine/create-identity", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerIdentityEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").CreateCustomerIdentityInput;
      const report = pillowHost.createCustomerIdentity(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerIdentityEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-identity-engine/link-identity", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerIdentityEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").LinkCustomerIdentityInput;
      const report = pillowHost.linkCustomerIdentity(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerIdentityEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-identity-engine/detect-duplicates", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerIdentityEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { customerId?: string };
      const report = pillowHost.detectDuplicateIdentities({ customerId: body.customerId });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerIdentityEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-identity-engine/merge-identities", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerIdentityEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").MergeCustomerIdentitiesInput;
      const report = pillowHost.mergeCustomerIdentities(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerIdentityEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-identity-engine/resolve-identity", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerIdentityEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").ResolveCustomerIdentityInput;
      const report = pillowHost.resolveCustomerIdentity(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerIdentityEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/crm-foundation", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCrmFoundationSnapshot());
    }
    try {
      return reply.send({
        crmFoundation: pillowHost.getCrmFoundation(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCrmFoundationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/crm-foundation/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrmFoundationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectCrmFoundation(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrmFoundationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/crm-foundation/create-profile", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrmFoundationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").CreateCustomerProfileInput;
      const report = pillowHost.createCustomerProfile(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrmFoundationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/crm-foundation/update-record", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrmFoundationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").UpdateCrmRecordInput;
      const report = pillowHost.updateCrmRecord(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrmFoundationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/crm-foundation/search", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrmFoundationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").SearchCustomerRecordsInput;
      const report = pillowHost.searchCustomerRecords(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrmFoundationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/crm-foundation/add-note", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrmFoundationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").AddCustomerNoteInput;
      const report = pillowHost.addCustomerNote(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrmFoundationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/crm-foundation/update-tags", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrmFoundationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").UpdateCustomerTagsInput;
      const report = pillowHost.updateCustomerTags(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrmFoundationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/crm-foundation/update-attributes", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrmFoundationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").UpdateCustomAttributesInput;
      const report = pillowHost.updateCustomAttributes(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrmFoundationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/customer-timeline-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCustomerTimelineEngineSnapshot());
    }
    try {
      return reply.send({
        customerTimelineEngine: pillowHost.getCustomerTimelineEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCustomerTimelineEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-timeline-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectCustomerTimelineEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-timeline-engine/record-event", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").RecordTimelineEventInput;
      const report = pillowHost.recordTimelineEvent(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-timeline-engine/record-interaction", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").RecordCustomerInteractionInput;
      const report = pillowHost.recordCustomerInteraction(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-timeline-engine/record-purchase", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").RecordPurchaseInput;
      const report = pillowHost.recordPurchase(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-timeline-engine/record-support", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").RecordSupportActivityInput;
      const report = pillowHost.recordSupportActivity(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-timeline-engine/record-communication", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").RecordCommunicationInput;
      const report = pillowHost.recordCommunication(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-timeline-engine/record-account-change", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").RecordAccountChangeInput;
      const report = pillowHost.recordAccountChange(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-timeline-engine/record-milestone", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").RecordCustomerMilestoneInput;
      const report = pillowHost.recordCustomerMilestone(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-timeline-engine/search", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").SearchTimelineHistoryInput;
      const report = pillowHost.searchTimelineHistory(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerTimelineEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/email-communication-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectEmailCommunicationEngineSnapshot());
    }
    try {
      return reply.send({
        emailCommunicationEngine: pillowHost.getEmailCommunicationEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectEmailCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/email-communication-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectEmailCommunicationEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/email-communication-engine/send-transactional", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").SendEmailInput;
      const report = pillowHost.sendTransactionalEmail(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/email-communication-engine/send-marketing", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").SendEmailInput;
      const report = pillowHost.sendMarketingEmail(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/email-communication-engine/send-notification", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").SendEmailInput;
      const report = pillowHost.sendNotificationEmail(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/email-communication-engine/send-support", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").SendEmailInput;
      const report = pillowHost.sendSupportEmail(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/email-communication-engine/create-template", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").CreateEmailTemplateInput;
      const report = pillowHost.createEmailTemplate(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/email-communication-engine/process-queue", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { limit?: number };
      const report = pillowHost.processEmailQueue(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/email-communication-engine/track-open", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").TrackEmailOpenInput;
      const report = pillowHost.trackEmailOpen(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/email-communication-engine/track-click", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").TrackEmailClickInput;
      const report = pillowHost.trackEmailClick(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/email-communication-engine/detect-failures", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { emailRecordId?: string };
      const report = pillowHost.detectEmailFailures(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectEmailCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/sms-communication-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectSmsCommunicationEngineSnapshot());
    }
    try {
      return reply.send({
        smsCommunicationEngine: pillowHost.getSmsCommunicationEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectSmsCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/sms-communication-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectSmsCommunicationEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/sms-communication-engine/send-transactional", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").SendSmsInput;
      const report = pillowHost.sendTransactionalSms(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/sms-communication-engine/send-notification", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").SendSmsInput;
      const report = pillowHost.sendNotificationSms(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/sms-communication-engine/send-verification", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").SendSmsInput;
      const report = pillowHost.sendVerificationSms(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/sms-communication-engine/create-template", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").CreateSmsTemplateInput;
      const report = pillowHost.createSmsTemplate(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/sms-communication-engine/process-queue", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { limit?: number };
      const report = pillowHost.processSmsQueue(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/sms-communication-engine/track-confirmation", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").TrackDeliveryConfirmationInput;
      const report = pillowHost.trackDeliveryConfirmation(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/sms-communication-engine/retry", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").RetrySmsInput;
      const report = pillowHost.retrySms(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/sms-communication-engine/detect-failures", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { smsRecordId?: string };
      const report = pillowHost.detectSmsFailures(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSmsCommunicationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/whatsapp-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectWhatsAppIntegrationSnapshot());
    }
    try {
      return reply.send({
        whatsAppIntegration: pillowHost.getWhatsAppIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectWhatsAppIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/whatsapp-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectWhatsAppIntegration(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/whatsapp-integration/send-transactional", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").SendWhatsAppInput;
      const report = pillowHost.sendTransactionalWhatsApp(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/whatsapp-integration/send-notification", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").SendWhatsAppInput;
      const report = pillowHost.sendNotificationWhatsApp(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/whatsapp-integration/send-template", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").SendWhatsAppInput;
      const report = pillowHost.sendTemplateWhatsApp(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/whatsapp-integration/receive-inbound", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").ReceiveInboundMessageInput;
      const report = pillowHost.receiveInboundMessage(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/whatsapp-integration/manage-conversation", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").ManageConversationInput;
      const report = pillowHost.manageConversation(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/whatsapp-integration/create-template", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").CreateWhatsAppTemplateInput;
      const report = pillowHost.createWhatsAppTemplate(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/whatsapp-integration/process-queue", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { limit?: number };
      const report = pillowHost.processMessageQueue(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/whatsapp-integration/track-delivery", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").TrackDeliveryInput;
      const report = pillowHost.trackDelivery(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/whatsapp-integration/track-read-receipt", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").TrackReadReceiptInput;
      const report = pillowHost.trackReadReceipt(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/whatsapp-integration/detect-failures", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { whatsAppRecordId?: string };
      const report = pillowHost.detectMessagingFailures(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectWhatsAppIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/live-chat-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectLiveChatIntegrationSnapshot());
    }
    try {
      return reply.send({
        liveChatIntegration: pillowHost.getLiveChatIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectLiveChatIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/live-chat-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLiveChatIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectLiveChatIntegration(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLiveChatIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/live-chat-integration/create-session", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLiveChatIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").CreateChatSessionInput;
      const report = pillowHost.createChatSession(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLiveChatIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/live-chat-integration/receive-message", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLiveChatIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").ReceiveCustomerMessageInput;
      const report = pillowHost.receiveCustomerMessage(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLiveChatIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/live-chat-integration/send-response", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLiveChatIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").SendSupportResponseInput;
      const report = pillowHost.sendSupportResponse(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLiveChatIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/live-chat-integration/manage-conversation", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLiveChatIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").ManageChatConversationInput;
      const report = pillowHost.manageChatConversation(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLiveChatIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/live-chat-integration/process-queue", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLiveChatIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { limit?: number };
      const report = pillowHost.processChatQueue(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLiveChatIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/live-chat-integration/assign-session", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLiveChatIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").AssignChatSessionInput;
      const report = pillowHost.assignChatSession(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLiveChatIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/live-chat-integration/track-status", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLiveChatIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").TrackChatStatusInput;
      const report = pillowHost.trackChatStatus(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLiveChatIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/live-chat-integration/track-response-time", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLiveChatIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").TrackResponseTimeInput;
      const report = pillowHost.trackResponseTime(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLiveChatIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/live-chat-integration/detect-failures", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLiveChatIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { chatSessionId?: string };
      const report = pillowHost.detectChatFailures(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLiveChatIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/ai-customer-support", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAiCustomerSupportSnapshot());
    }
    try {
      return reply.send({
        aiCustomerSupport: pillowHost.getAiCustomerSupport(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectAiCustomerSupportSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-customer-support/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCustomerSupportSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectAiCustomerSupport(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCustomerSupportSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-customer-support/receive-enquiry", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCustomerSupportSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").ReceiveCustomerEnquiryInput;
      const report = pillowHost.receiveCustomerEnquiry(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCustomerSupportSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-customer-support/understand-intent", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCustomerSupportSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").UnderstandCustomerIntentInput;
      const report = pillowHost.understandCustomerIntent(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCustomerSupportSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-customer-support/retrieve-context", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCustomerSupportSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").RetrieveCustomerContextInput;
      const report = pillowHost.retrieveCustomerContext(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCustomerSupportSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-customer-support/generate-response", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCustomerSupportSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").GenerateAiResponseInput;
      const report = pillowHost.generateAiResponse(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCustomerSupportSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-customer-support/escalate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCustomerSupportSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").EscalateEnquiryInput;
      const report = pillowHost.escalateEnquiry(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCustomerSupportSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-customer-support/multi-channel", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCustomerSupportSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").HandleMultiChannelSupportInput;
      const report = pillowHost.handleMultiChannelSupport(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCustomerSupportSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-customer-support/generate-summary", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCustomerSupportSnapshot());
    }
    try {
      const body = (request.body ?? {}) as import("@empireai/pillow").GenerateSupportSummaryInput;
      const report = pillowHost.generateSupportSummary(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCustomerSupportSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-customer-support/detect-failures", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCustomerSupportSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { aiSupportRecordId?: string };
      const report = pillowHost.detectSupportFailures(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCustomerSupportSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/ticket-management-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectTicketManagementEngineSnapshot());
    }
    try {
      return reply.send({
        ticketManagementEngine: pillowHost.getTicketManagementEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectTicketManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ticket-management-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTicketManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectTicketManagementEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTicketManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ticket-management-engine/create-ticket", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTicketManagementEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.createSupportTicket>[0];
      const report = pillowHost.createSupportTicket(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTicketManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ticket-management-engine/classify-category", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTicketManagementEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.classifyTicketCategory>[0];
      const report = pillowHost.classifyTicketCategory(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTicketManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ticket-management-engine/assign-priority", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTicketManagementEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.assignTicketPriority>[0];
      const report = pillowHost.assignTicketPriority(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTicketManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ticket-management-engine/assign-ownership", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTicketManagementEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.assignTicketOwnership>[0];
      const report = pillowHost.assignTicketOwnership(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTicketManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ticket-management-engine/track-lifecycle", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTicketManagementEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.trackTicketLifecycle>[0];
      const report = pillowHost.trackTicketLifecycle(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTicketManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ticket-management-engine/link-customer", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTicketManagementEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.linkTicketToCustomer>[0];
      const report = pillowHost.linkTicketToCustomer(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTicketManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ticket-management-engine/link-conversation", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTicketManagementEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.linkTicketToConversation>[0];
      const report = pillowHost.linkTicketToConversation(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTicketManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ticket-management-engine/link-timeline", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTicketManagementEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.linkTicketToTimeline>[0];
      const report = pillowHost.linkTicketToTimeline(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTicketManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ticket-management-engine/detect-overdue", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTicketManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { ticketId?: string };
      const report = pillowHost.detectOverdueTickets(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTicketManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ticket-management-engine/detect-stalled", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTicketManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { ticketId?: string };
      const report = pillowHost.detectStalledTickets(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTicketManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ticket-management-engine/detect-failures", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTicketManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { ticketId?: string };
      const report = pillowHost.detectTicketFailures(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTicketManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/customer-sentiment-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCustomerSentimentEngineSnapshot());
    }
    try {
      return reply.send({
        customerSentimentEngine: pillowHost.getCustomerSentimentEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCustomerSentimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-sentiment-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectCustomerSentimentEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-sentiment-engine/analyze-message", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.analyzeCustomerMessage>[0];
      const report = pillowHost.analyzeCustomerMessage(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-sentiment-engine/analyze-conversation", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.analyzeCustomerConversation>[0];
      const report = pillowHost.analyzeCustomerConversation(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-sentiment-engine/detect-satisfaction", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.detectCustomerSatisfaction>[0];
      const report = pillowHost.detectCustomerSatisfaction(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-sentiment-engine/detect-frustration", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.detectCustomerFrustration>[0];
      const report = pillowHost.detectCustomerFrustration(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-sentiment-engine/detect-escalation-risk", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.detectEscalationRisk>[0];
      const report = pillowHost.detectEscalationRisk(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-sentiment-engine/detect-positive-experience", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.detectPositiveExperience>[0];
      const report = pillowHost.detectPositiveExperience(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-sentiment-engine/track-trends", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.trackSentimentTrends>[0];
      const report = pillowHost.trackSentimentTrends(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-sentiment-engine/calculate-score", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.calculateSentimentScore>[0];
      const report = pillowHost.calculateSentimentScore(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-sentiment-engine/generate-alerts", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.generateSentimentAlerts>[0];
      const report = pillowHost.generateSentimentAlerts(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-sentiment-engine/detect-failures", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.detectSentimentFailures>[0];
      const report = pillowHost.detectSentimentFailures(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSentimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/review-management-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectReviewManagementEngineSnapshot());
    }
    try {
      return reply.send({
        reviewManagementEngine: pillowHost.getReviewManagementEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectReviewManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/review-management-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReviewManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectReviewManagementEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReviewManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/review-management-engine/collect-review", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReviewManagementEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.collectCustomerReview>[0];
      const report = pillowHost.collectCustomerReview(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReviewManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/review-management-engine/import-marketplace-review", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReviewManagementEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.importMarketplaceReview>[0];
      const report = pillowHost.importMarketplaceReview(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReviewManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/review-management-engine/classify-sentiment", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReviewManagementEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.classifyReviewSentiment>[0];
      const report = pillowHost.classifyReviewSentiment(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReviewManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/review-management-engine/detect-negative", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReviewManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.detectNegativeReviews>[0];
      const report = pillowHost.detectNegativeReviews(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReviewManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/review-management-engine/detect-positive", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReviewManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.detectPositiveReviews>[0];
      const report = pillowHost.detectPositiveReviews(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReviewManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/review-management-engine/track-trends", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReviewManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.trackReviewTrends>[0];
      const report = pillowHost.trackReviewTrends(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReviewManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/review-management-engine/generate-alerts", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReviewManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.generateReputationAlerts>[0];
      const report = pillowHost.generateReputationAlerts(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReviewManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/review-management-engine/detect-failures", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReviewManagementEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.detectReviewFailures>[0];
      const report = pillowHost.detectReviewFailures(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReviewManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/review-management-engine/report-status", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReviewManagementEngineSnapshot());
    }
    try {
      const report = pillowHost.reportReviewStatus();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReviewManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/review-management-engine/report-health", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReviewManagementEngineSnapshot());
    }
    try {
      const report = pillowHost.reportReviewHealth();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReviewManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/loyalty-programme-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectLoyaltyProgrammeEngineSnapshot());
    }
    try {
      return reply.send({
        loyaltyProgrammeEngine: pillowHost.getLoyaltyProgrammeEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectLoyaltyProgrammeEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/loyalty-programme-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectLoyaltyProgrammeEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/loyalty-programme-engine/create-programme", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.createLoyaltyProgramme>[0];
      const report = pillowHost.createLoyaltyProgramme(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/loyalty-programme-engine/register-member", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.registerLoyaltyMember>[0];
      const report = pillowHost.registerLoyaltyMember(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/loyalty-programme-engine/award-points", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.awardLoyaltyPoints>[0];
      const report = pillowHost.awardLoyaltyPoints(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/loyalty-programme-engine/redeem-points", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.redeemLoyaltyPoints>[0];
      const report = pillowHost.redeemLoyaltyPoints(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/loyalty-programme-engine/manage-tier", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.manageLoyaltyTier>[0];
      const report = pillowHost.manageLoyaltyTier(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/loyalty-programme-engine/detect-abuse", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.detectLoyaltyAbuse>[0];
      const report = pillowHost.detectLoyaltyAbuse(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/loyalty-programme-engine/generate-rewards", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.generateLoyaltyRewards>[0];
      const report = pillowHost.generateLoyaltyRewards(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/loyalty-programme-engine/detect-failures", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.detectLoyaltyFailures>[0];
      const report = pillowHost.detectLoyaltyFailures(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/loyalty-programme-engine/report-status", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
    }
    try {
      const report = pillowHost.reportLoyaltyStatus();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/loyalty-programme-engine/report-health", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
    }
    try {
      const report = pillowHost.reportLoyaltyHealth();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectLoyaltyProgrammeEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/returns-intelligence-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectReturnsIntelligenceEngineSnapshot());
    }
    try {
      return reply.send({
        returnsIntelligenceEngine: pillowHost.getReturnsIntelligenceEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectReturnsIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/returns-intelligence-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectReturnsIntelligenceEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/returns-intelligence-engine/receive-request", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.receiveReturnRequest>[0];
      const report = pillowHost.receiveReturnRequest(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/returns-intelligence-engine/evaluate-eligibility", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.evaluateReturnEligibility>[0];
      const report = pillowHost.evaluateReturnEligibility(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/returns-intelligence-engine/analyze-history", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.analyzeReturnHistory>[0];
      const report = pillowHost.analyzeReturnHistory(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/returns-intelligence-engine/detect-abnormal", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.detectAbnormalReturnBehavior>[0];
      const report = pillowHost.detectAbnormalReturnBehavior(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/returns-intelligence-engine/detect-repeat-patterns", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.detectRepeatReturnPatterns>[0];
      const report = pillowHost.detectRepeatReturnPatterns(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/returns-intelligence-engine/recommend-decision", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
    }
    try {
      const body = request.body as Parameters<typeof pillowHost.recommendReturnDecision>[0];
      const report = pillowHost.recommendReturnDecision(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/returns-intelligence-engine/generate-insights", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.generateReturnInsights>[0];
      const report = pillowHost.generateReturnInsights(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/returns-intelligence-engine/detect-failures", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Parameters<typeof pillowHost.detectReturnFailures>[0];
      const report = pillowHost.detectReturnFailures(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/returns-intelligence-engine/report-status", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
    }
    try {
      const report = pillowHost.reportReturnIntelligenceStatus();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/returns-intelligence-engine/report-health", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
    }
    try {
      const report = pillowHost.reportReturnIntelligenceHealth();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectReturnsIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/customer-risk-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCustomerRiskEngineSnapshot());
    }
    try {
      return reply.send({
        customerRiskEngine: pillowHost.getCustomerRiskEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCustomerRiskEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-risk-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerRiskEngineSnapshot());
    }
    try {
      const body = request.body as Record<string, unknown> | undefined;
      const report = pillowHost.connectCustomerRiskEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerRiskEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-risk-engine/evaluate-risk", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerRiskEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string; riskCategory?: string };
      const report = pillowHost.evaluateCustomerRisk(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerRiskEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-risk-engine/detect-fraud", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerRiskEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.detectFraudIndicators(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerRiskEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-risk-engine/detect-abuse", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerRiskEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.detectAccountAbuse(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerRiskEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-risk-engine/detect-purchasing", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerRiskEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.detectSuspiciousPurchasingBehaviour(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerRiskEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-risk-engine/detect-returns", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerRiskEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.detectSuspiciousReturnBehaviour(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerRiskEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-risk-engine/detect-communication", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerRiskEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.detectSuspiciousCommunicationPatterns(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerRiskEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-risk-engine/calculate-score", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerRiskEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.calculateCustomerRiskScore(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerRiskEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-risk-engine/generate-alerts", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerRiskEngineSnapshot());
    }
    try {
      const body = request.body as { customerId?: string } | undefined;
      const report = pillowHost.generateCustomerRiskAlerts(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerRiskEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-risk-engine/recommend-mitigation", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerRiskEngineSnapshot());
    }
    try {
      const body = request.body as { customerRiskId: string };
      const report = pillowHost.recommendMitigationActions(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerRiskEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-risk-engine/detect-failures", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerRiskEngineSnapshot());
    }
    try {
      const body = request.body as { customerRiskId?: string } | undefined;
      const report = pillowHost.detectCustomerRiskFailures(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerRiskEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-risk-engine/report-status", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerRiskEngineSnapshot());
    }
    try {
      const report = pillowHost.reportCustomerRiskStatus();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerRiskEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-risk-engine/report-health", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerRiskEngineSnapshot());
    }
    try {
      const report = pillowHost.reportCustomerRiskHealth();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerRiskEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/customer-lifetime-value-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.send(collectCustomerLifetimeValueEngineSnapshot());
    }
    try {
      return reply.send({
        customerLifetimeValueEngine: pillowHost.getCustomerLifetimeValueEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCustomerLifetimeValueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-lifetime-value-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
    }
    try {
      const body = request.body as Record<string, unknown> | undefined;
      const report = pillowHost.connectClvEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-lifetime-value-engine/calculate-clv", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.calculateCustomerLifetimeValue(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-lifetime-value-engine/track-revenue", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.trackCustomerRevenueContribution(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-lifetime-value-engine/track-profitability", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.trackCustomerProfitability(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-lifetime-value-engine/track-retention", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.trackCustomerRetention(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-lifetime-value-engine/track-purchase-frequency", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.trackPurchaseFrequency(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-lifetime-value-engine/track-average-order-value", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.trackAverageOrderValue(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-lifetime-value-engine/predict-future-value", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.predictFutureCustomerValue(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-lifetime-value-engine/identify-high-value", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
    }
    try {
      const body = request.body as { customerId?: string } | undefined;
      const report = pillowHost.identifyHighValueCustomers(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-lifetime-value-engine/identify-declining-value", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
    }
    try {
      const body = request.body as { customerId?: string } | undefined;
      const report = pillowHost.identifyDecliningCustomerValue(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-lifetime-value-engine/detect-failures", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
    }
    try {
      const body = request.body as { clvRecordId?: string } | undefined;
      const report = pillowHost.detectClvFailures(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-lifetime-value-engine/report-status", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
    }
    try {
      const report = pillowHost.reportClvStatus();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-lifetime-value-engine/report-health", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
    }
    try {
      const report = pillowHost.reportClvHealth();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerLifetimeValueEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/customer-segmentation-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.send(collectCustomerSegmentationEngineSnapshot());
    }
    try {
      return reply.send({
        customerSegmentationEngine: pillowHost.getCustomerSegmentationEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCustomerSegmentationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-segmentation-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
    }
    try {
      const body = request.body as Record<string, unknown> | undefined;
      const report = pillowHost.connectSegmentationEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-segmentation-engine/create-segment", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
    }
    try {
      const body = request.body as { segmentName: string; segmentType: string; description?: string };
      const report = pillowHost.createCustomerSegment(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-segmentation-engine/assign", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.assignCustomerToSegments(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-segmentation-engine/segment-demographics", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.segmentByDemographics(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-segmentation-engine/segment-purchasing", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.segmentByPurchasingBehaviour(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-segmentation-engine/segment-value", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.segmentByCustomerValue(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-segmentation-engine/segment-loyalty", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.segmentByLoyaltyStatus(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-segmentation-engine/segment-sentiment", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.segmentByCustomerSentiment(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-segmentation-engine/segment-risk", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.segmentByCustomerRisk(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-segmentation-engine/detect-changes", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
    }
    try {
      const body = request.body as { customerId?: string } | undefined;
      const report = pillowHost.detectSegmentChanges(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-segmentation-engine/detect-failures", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
    }
    try {
      const body = request.body as { segmentationRecordId?: string } | undefined;
      const report = pillowHost.detectSegmentationFailures(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-segmentation-engine/report-status", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
    }
    try {
      const report = pillowHost.reportSegmentationStatus();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-segmentation-engine/report-health", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
    }
    try {
      const report = pillowHost.reportSegmentationHealth();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerSegmentationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/customer-journey-intelligence-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.send(collectCustomerJourneyIntelligenceEngineSnapshot());
    }
    try {
      return reply.send({
        ...collectCustomerJourneyIntelligenceEngineSnapshot(),
        live: true,
        customerJourneyIntelligenceEngine: pillowHost.getCustomerJourneyIntelligenceEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCustomerJourneyIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-journey-intelligence-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
    }
    try {
      const body = request.body as { forceReconnect?: boolean } | undefined;
      const report = pillowHost.connectJourneyIntelligenceEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-journey-intelligence-engine/map-journey", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.mapCustomerJourney(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-journey-intelligence-engine/track-touchpoints", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.trackCustomerTouchpoints(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-journey-intelligence-engine/identify-stages", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.identifyJourneyStages(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-journey-intelligence-engine/detect-dropoff", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.detectDropOffPoints(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-journey-intelligence-engine/detect-friction", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.detectFrictionPoints(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-journey-intelligence-engine/measure-performance", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.measureJourneyPerformance(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-journey-intelligence-engine/measure-conversion", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
    }
    try {
      const body = request.body as { customerId?: string } | undefined;
      const report = pillowHost.measureConversionRates(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-journey-intelligence-engine/recommend-improvements", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.recommendJourneyImprovements(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-journey-intelligence-engine/predict-progression", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
    }
    try {
      const body = request.body as { customerId: string };
      const report = pillowHost.predictCustomerProgression(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-journey-intelligence-engine/detect-failures", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
    }
    try {
      const body = request.body as { journeyRecordId?: string } | undefined;
      const report = pillowHost.detectJourneyFailures(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-journey-intelligence-engine/report-status", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
    }
    try {
      const report = pillowHost.reportJourneyStatus();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-journey-intelligence-engine/report-health", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
    }
    try {
      const report = pillowHost.reportJourneyHealth();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerJourneyIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-customer-dashboard", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      return reply.send({
        ...collectExecutiveCustomerDashboardSnapshot(),
        live: true,
        executiveCustomerDashboard: pillowHost.getExecutiveCustomerDashboard(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-customer-dashboard/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      const body = request.body as { forceReconnect?: boolean } | undefined;
      const report = pillowHost.connectExecutiveCustomerDashboard(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-customer-dashboard/refresh", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      const body = request.body as { forceRefresh?: boolean } | undefined;
      const report = pillowHost.refreshExecutiveCustomerDashboard(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-customer-dashboard/display-growth", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      const report = pillowHost.displayCustomerGrowth();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-customer-dashboard/display-activity", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      const report = pillowHost.displayCustomerActivity();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-customer-dashboard/display-lifetime-value", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      const report = pillowHost.displayCustomerLifetimeValue();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-customer-dashboard/display-segmentation", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      const report = pillowHost.displayCustomerSegmentation();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-customer-dashboard/display-sentiment", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      const report = pillowHost.displayCustomerSentiment();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-customer-dashboard/display-loyalty", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      const report = pillowHost.displayCustomerLoyalty();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-customer-dashboard/display-journey", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      const report = pillowHost.displayCustomerJourneyAnalytics();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-customer-dashboard/display-risk", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      const report = pillowHost.displayCustomerRisk();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-customer-dashboard/display-support", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      const report = pillowHost.displayCustomerSupportMetrics();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-customer-dashboard/aggregate-kpis", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      const report = pillowHost.aggregateExecutiveCustomerKpis();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-customer-dashboard/widgets", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      const body = request.body as { widgetTypes?: string[] } | undefined;
      const report = pillowHost.getExecutiveCustomerDashboardWidgets(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-customer-dashboard/detect-failures", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      const body = request.body as { dashboardId?: string } | undefined;
      const report = pillowHost.detectExecutiveCustomerDashboardFailures(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-customer-dashboard/report-status", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      const report = pillowHost.reportExecutiveCustomerDashboardStatus();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-customer-dashboard/report-health", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
    }
    try {
      const report = pillowHost.reportExecutiveCustomerDashboardHealth();
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectExecutiveCustomerDashboardSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/customer-operations-certification", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCustomerOperationsCertificationSnapshot());
    }
    try {
      return reply.send({
        customerOperationsCertification: pillowHost.getCustomerOperationsCertification(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCustomerOperationsCertificationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-operations-certification/run", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerOperationsCertificationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        missionScope?: string[];
        includeSmokeTests?: boolean;
      };
      const report = await pillowHost.runCustomerOperationsCertification({
        missionScope: body.missionScope,
        includeSmokeTests: body.includeSmokeTests,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerOperationsCertificationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/customer-operations-certification/validate", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCustomerOperationsCertificationSnapshot());
    }
    try {
      const validation = pillowHost.validateCustomerOperationsCertificationReport();
      return reply.send({ computedAt: new Date().toISOString(), validation });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCustomerOperationsCertificationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/marketing-framework", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectMarketingFrameworkSnapshot());
    }
    try {
      return reply.send({
        marketingFramework: pillowHost.getMarketingFramework(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectMarketingFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketing-framework/register", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketingFrameworkSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        definition?: Record<string, unknown>;
        forceRegister?: boolean;
      };
      const report = pillowHost.registerMarketingModule({
        definition: body.definition,
        forceRegister: body.forceRegister,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketing-framework/activate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketingFrameworkSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { marketingModuleIdentifier?: string };
      const report = pillowHost.activateMarketingModule(body.marketingModuleIdentifier ?? "");
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/meta-ads-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectMetaAdsIntegrationSnapshot());
    }
    try {
      return reply.send({
        metaAdsIntegration: pillowHost.getMetaAdsIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectMetaAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/meta-ads-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMetaAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        credentialRef?: string;
        businessAccountId?: string;
        adAccountId?: string;
        forceReconnect?: boolean;
      };
      const report = pillowHost.connectMetaAds(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMetaAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/meta-ads-integration/create-campaign", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMetaAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        campaignName?: string;
        businessAccountId?: string;
        adAccountId?: string;
        objective?: string;
      };
      const report = pillowHost.createMetaCampaign({
        campaignName: body.campaignName ?? "",
        businessAccountId: body.businessAccountId,
        adAccountId: body.adAccountId,
        objective: body.objective,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMetaAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/meta-ads-integration/retrieve-performance", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMetaAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { campaignReference?: string };
      const report = pillowHost.retrieveMetaPerformance({
        campaignReference: body.campaignReference,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMetaAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/meta-ads-integration/sync-status", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMetaAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { campaignReference?: string };
      const report = pillowHost.syncMetaCampaignStatus({
        campaignReference: body.campaignReference,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMetaAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/google-ads-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectGoogleAdsIntegrationSnapshot());
    }
    try {
      return reply.send({
        googleAdsIntegration: pillowHost.getGoogleAdsIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectGoogleAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/google-ads-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectGoogleAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        credentialRef?: string;
        customerAccountId?: string;
        advertisingAccountId?: string;
        forceReconnect?: boolean;
      };
      const report = pillowHost.connectGoogleAds(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectGoogleAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/google-ads-integration/create-campaign", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectGoogleAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        campaignName?: string;
        customerAccountId?: string;
        advertisingAccountId?: string;
        objective?: string;
      };
      const report = pillowHost.createGoogleCampaign({
        campaignName: body.campaignName ?? "",
        customerAccountId: body.customerAccountId,
        advertisingAccountId: body.advertisingAccountId,
        objective: body.objective,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectGoogleAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/google-ads-integration/retrieve-performance", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectGoogleAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { campaignReference?: string };
      const report = pillowHost.retrieveGooglePerformance({
        campaignReference: body.campaignReference,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectGoogleAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/google-ads-integration/sync-status", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectGoogleAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { campaignReference?: string };
      const report = pillowHost.syncGoogleCampaignStatus({
        campaignReference: body.campaignReference,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectGoogleAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/tiktok-ads-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectTikTokAdsIntegrationSnapshot());
    }
    try {
      return reply.send({
        tiktokAdsIntegration: pillowHost.getTikTokAdsIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectTikTokAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/tiktok-ads-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTikTokAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        credentialRef?: string;
        advertiserAccountId?: string;
        forceReconnect?: boolean;
      };
      const report = pillowHost.connectTikTokAds(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTikTokAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/tiktok-ads-integration/create-campaign", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTikTokAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        campaignName?: string;
        advertiserAccountId?: string;
        objective?: string;
      };
      const report = pillowHost.createTikTokCampaign({
        campaignName: body.campaignName ?? "",
        advertiserAccountId: body.advertiserAccountId,
        objective: body.objective,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTikTokAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/tiktok-ads-integration/retrieve-performance", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTikTokAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { campaignReference?: string };
      const report = pillowHost.retrieveTikTokPerformance({
        campaignReference: body.campaignReference,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTikTokAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/tiktok-ads-integration/sync-status", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTikTokAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { campaignReference?: string };
      const report = pillowHost.syncTikTokCampaignStatus({
        campaignReference: body.campaignReference,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTikTokAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/tiktok-ads-integration/sync-audience", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectTikTokAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        campaignReference?: string;
        audienceName?: string;
      };
      const report = pillowHost.syncTikTokAudience({
        campaignReference: body.campaignReference,
        audienceName: body.audienceName,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectTikTokAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/youtube-ads-integration", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectYouTubeAdsIntegrationSnapshot());
    }
    try {
      return reply.send({
        youtubeAdsIntegration: pillowHost.getYouTubeAdsIntegration(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectYouTubeAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/youtube-ads-integration/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectYouTubeAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        credentialRef?: string;
        advertiserAccountId?: string;
        forceReconnect?: boolean;
      };
      const report = pillowHost.connectYouTubeAds(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectYouTubeAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/youtube-ads-integration/create-campaign", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectYouTubeAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        campaignName?: string;
        advertiserAccountId?: string;
        objective?: string;
      };
      const report = pillowHost.createYouTubeCampaign({
        campaignName: body.campaignName ?? "",
        advertiserAccountId: body.advertiserAccountId,
        objective: body.objective,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectYouTubeAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/youtube-ads-integration/manage-video-asset", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectYouTubeAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        videoAssetName?: string;
        durationSeconds?: number;
        campaignReference?: string;
      };
      const report = pillowHost.manageYouTubeVideoAsset({
        videoAssetName: body.videoAssetName ?? "",
        durationSeconds: body.durationSeconds,
        campaignReference: body.campaignReference,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectYouTubeAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/youtube-ads-integration/retrieve-performance", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectYouTubeAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { campaignReference?: string };
      const report = pillowHost.retrieveYouTubePerformance({
        campaignReference: body.campaignReference,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectYouTubeAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/youtube-ads-integration/sync-status", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectYouTubeAdsIntegrationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { campaignReference?: string };
      const report = pillowHost.syncYouTubeCampaignStatus({
        campaignReference: body.campaignReference,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectYouTubeAdsIntegrationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/seo-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectSeoIntelligenceSnapshot());
    }
    try {
      return reply.send({
        seoIntelligence: pillowHost.getSeoIntelligence(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectSeoIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/seo-intelligence/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSeoIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        websiteReference?: string;
        projectName?: string;
      };
      const report = pillowHost.connectSeoEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSeoIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/seo-intelligence/analyze-page", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSeoIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        pageReference?: string;
        websiteReference?: string;
        pageTitle?: string;
        metaDescription?: string;
      };
      const report = pillowHost.analyzeSeoPage({
        pageReference: body.pageReference ?? "",
        websiteReference: body.websiteReference,
        pageTitle: body.pageTitle,
        metaDescription: body.metaDescription,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSeoIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/seo-intelligence/manage-keyword", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSeoIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        keyword?: string;
        websiteReference?: string;
        targetPageReference?: string;
        searchVolume?: number;
        difficulty?: number;
      };
      const report = pillowHost.manageSeoKeyword({
        keyword: body.keyword ?? "",
        websiteReference: body.websiteReference,
        targetPageReference: body.targetPageReference,
        searchVolume: body.searchVolume,
        difficulty: body.difficulty,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSeoIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/seo-intelligence/track-ranking", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSeoIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        keywordReference?: string;
        websiteReference?: string;
      };
      const report = pillowHost.trackSeoRanking(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSeoIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/seo-intelligence/generate-recommendations", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSeoIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        pageReference?: string;
        websiteReference?: string;
      };
      const report = pillowHost.generateSeoRecommendations(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSeoIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/seo-intelligence/monitor-organic", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectSeoIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        websiteReference?: string;
        pageReference?: string;
      };
      const report = pillowHost.monitorSeoOrganicPerformance(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectSeoIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/campaign-manager", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCampaignManagerSnapshot());
    }
    try {
      return reply.send({
        campaignManager: pillowHost.getCampaignManager(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCampaignManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/campaign-manager/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCampaignManagerSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean };
      const report = pillowHost.connectCampaignManager(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCampaignManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/campaign-manager/create", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCampaignManagerSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        campaignName?: string;
        campaignObjective?: "awareness" | "traffic" | "engagement" | "leads" | "conversions" | "retention";
        marketingChannels?: Array<"meta" | "google" | "tiktok" | "youtube" | "seo">;
        startAt?: string;
        endAt?: string | null;
        timezone?: string;
      };
      const report = pillowHost.createManagedCampaign({
        campaignName: body.campaignName ?? "",
        campaignObjective: body.campaignObjective ?? "awareness",
        marketingChannels: body.marketingChannels ?? [],
        startAt: body.startAt,
        endAt: body.endAt,
        timezone: body.timezone,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCampaignManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/campaign-manager/approve", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCampaignManagerSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { campaignId?: string };
      const report = pillowHost.approveManagedCampaign({
        campaignId: body.campaignId ?? "",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCampaignManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/campaign-manager/schedule", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCampaignManagerSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        campaignId?: string;
        startAt?: string;
        endAt?: string | null;
        timezone?: string;
      };
      const report = pillowHost.scheduleManagedCampaign({
        campaignId: body.campaignId ?? "",
        startAt: body.startAt ?? new Date().toISOString(),
        endAt: body.endAt,
        timezone: body.timezone,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCampaignManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/campaign-manager/coordinate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCampaignManagerSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { campaignId?: string };
      const report = pillowHost.coordinateManagedCampaign({
        campaignId: body.campaignId ?? "",
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCampaignManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/campaign-manager/track-execution", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCampaignManagerSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { campaignId?: string };
      const report = pillowHost.trackManagedCampaignExecution(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCampaignManagerSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/audience-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAudienceIntelligenceSnapshot());
    }
    try {
      return reply.send({
        audienceIntelligence: pillowHost.getAudienceIntelligence(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAudienceIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/audience-intelligence/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAudienceIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.connectAudienceIntelligence(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAudienceIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/audience-intelligence/build", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAudienceIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        audienceName?: string;
        audienceSource?: string;
        estimatedSize?: number;
        demographicHints?: string[];
        interestHints?: string[];
        behaviourHints?: string[];
      };
      const report = pillowHost.buildAudience(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAudienceIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/audience-intelligence/analyze-demographics", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAudienceIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { audienceRecordId?: string };
      const report = pillowHost.analyzeAudienceDemographics(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAudienceIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/audience-intelligence/analyze-interests", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAudienceIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { audienceRecordId?: string };
      const report = pillowHost.analyzeAudienceInterests(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAudienceIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/audience-intelligence/analyze-behaviour", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAudienceIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { audienceRecordId?: string };
      const report = pillowHost.analyzeAudienceBehaviour(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAudienceIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/audience-intelligence/analyze-intent", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAudienceIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { audienceRecordId?: string };
      const report = pillowHost.analyzeAudienceIntent(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAudienceIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/audience-intelligence/measure-engagement", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAudienceIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { audienceRecordId?: string };
      const report = pillowHost.measureAudienceEngagement(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAudienceIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/audience-intelligence/measure-quality", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAudienceIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { audienceRecordId?: string };
      const report = pillowHost.measureAudienceQuality(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAudienceIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/audience-intelligence/detect-overlap", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAudienceIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { audienceRecordId?: string };
      const report = pillowHost.detectAudienceOverlap(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAudienceIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/audience-intelligence/recommend", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAudienceIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { audienceRecordId?: string };
      const report = pillowHost.generateAudienceRecommendations(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAudienceIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/attribution-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAttributionEngineSnapshot());
    }
    try {
      return reply.send({
        attributionEngine: pillowHost.getAttributionEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAttributionEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/attribution-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAttributionEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.connectAttributionEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAttributionEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/attribution-engine/track-acquisition", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAttributionEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        customerRef?: string;
        marketingChannel?: string;
        campaignReference?: string;
        sourceLabel?: string;
      };
      const report = pillowHost.trackAttributionAcquisitionSource(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAttributionEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/attribution-engine/track-touchpoint", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAttributionEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        customerRef?: string;
        marketingChannel?: string;
        campaignReference?: string;
        advertisementReference?: string;
        sourceLabel?: string;
      };
      const report = pillowHost.trackAttributionTouchpoint(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAttributionEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/attribution-engine/track-conversion", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAttributionEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        customerRef?: string;
        conversionValue?: number;
        attributionModel?: string;
        campaignReference?: string;
      };
      const report = pillowHost.trackAttributionConversionJourney(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAttributionEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/attribution-engine/attribute", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAttributionEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        customerRef?: string;
        conversionValue?: number;
        attributionModel?: string;
        campaignReference?: string;
      };
      const report = pillowHost.attributeConversion(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAttributionEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/attribution-engine/measure-campaign", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAttributionEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { customerRef?: string; attributionModel?: string };
      const report = pillowHost.measureAttributionCampaignContribution(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAttributionEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/attribution-engine/measure-channel", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAttributionEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { customerRef?: string; attributionModel?: string };
      const report = pillowHost.measureAttributionChannelContribution(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAttributionEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/attribution-engine/measure-advertisement", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAttributionEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { customerRef?: string; attributionModel?: string };
      const report = pillowHost.measureAttributionAdvertisementContribution(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAttributionEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/attribution-engine/calculate-roas", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAttributionEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        spend?: number;
        revenue?: number;
        attributionModel?: string;
        customerRef?: string;
      };
      const report = pillowHost.calculateAttributionRoas(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAttributionEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/attribution-engine/calculate-roi", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAttributionEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        spend?: number;
        revenue?: number;
        attributionModel?: string;
        customerRef?: string;
      };
      const report = pillowHost.calculateAttributionMarketingRoi(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAttributionEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/marketing-analytics-dashboard", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectMarketingAnalyticsDashboardSnapshot());
    }
    try {
      return reply.send({
        marketingAnalyticsDashboard: pillowHost.getMarketingAnalyticsDashboard(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingAnalyticsDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketing-analytics-dashboard/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketingAnalyticsDashboardSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { forceReconnect?: boolean; authorized?: boolean };
      const report = pillowHost.connectMarketingAnalyticsDashboard(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingAnalyticsDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketing-analytics-dashboard/refresh", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketingAnalyticsDashboardSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { authorized?: boolean; includeAlerts?: boolean };
      const report = pillowHost.refreshMarketingAnalyticsDashboard(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingAnalyticsDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketing-analytics-dashboard/aggregate-kpis", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketingAnalyticsDashboardSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { authorized?: boolean };
      const report = pillowHost.aggregateMarketingAnalyticsKpis(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingAnalyticsDashboardSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketing-analytics-dashboard/executive-summary", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketingAnalyticsDashboardSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { authorized?: boolean };
      const report = pillowHost.generateMarketingAnalyticsExecutiveSummary(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingAnalyticsDashboardSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/creative-asset-manager", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCreativeAssetManagerSnapshot());
    }
    try {
      return reply.send({
        creativeAssetManager: pillowHost.getCreativeAssetManager(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCreativeAssetManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/creative-asset-manager/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCreativeAssetManagerSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.connectCreativeAssetManager(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCreativeAssetManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/creative-asset-manager/create", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCreativeAssetManagerSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        assetName?: string;
        assetType?: string;
        campaignReference?: string;
        tags?: string[];
        storageRef?: string;
      };
      const report = pillowHost.createCreativeAsset(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCreativeAssetManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/creative-asset-manager/update", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCreativeAssetManagerSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        assetId?: string;
        assetName?: string;
        tags?: string[];
        campaignReference?: string;
        forceOverwriteApproved?: boolean;
      };
      const report = pillowHost.updateCreativeAsset(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCreativeAssetManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/creative-asset-manager/version", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCreativeAssetManagerSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { assetId?: string; changeSummary?: string };
      const report = pillowHost.createCreativeAssetVersion(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCreativeAssetManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/creative-asset-manager/approve", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCreativeAssetManagerSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { assetId?: string; approved?: boolean };
      const report = pillowHost.approveCreativeAsset(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCreativeAssetManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/creative-asset-manager/tag", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCreativeAssetManagerSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { assetId?: string; tags?: string[] };
      const report = pillowHost.tagCreativeAsset(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCreativeAssetManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/creative-asset-manager/track-usage", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCreativeAssetManagerSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        assetId?: string;
        context?: string;
        campaignReference?: string;
      };
      const report = pillowHost.trackCreativeAssetUsage(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCreativeAssetManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/creative-asset-manager/search", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCreativeAssetManagerSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        query?: string;
        assetType?: string;
        approvalStatus?: string;
        tag?: string;
      };
      const report = pillowHost.searchCreativeAssets(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCreativeAssetManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/creative-asset-manager/classify", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCreativeAssetManagerSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { assetId?: string };
      const report = pillowHost.classifyCreativeAsset(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCreativeAssetManagerSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/ai-campaign-generator", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAiCampaignGeneratorSnapshot());
    }
    try {
      return reply.send({
        aiCampaignGenerator: pillowHost.getAiCampaignGenerator(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-campaign-generator/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.connectAiCampaignGenerator(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-campaign-generator/generate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        objective?: string;
        productFocus?: string;
        budgetUsd?: number;
        durationDays?: number;
        preferredChannels?: string[];
      };
      const report = pillowHost.generateAiCampaign(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-campaign-generator/strategy", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { objective?: string; productFocus?: string };
      const report = pillowHost.generateAiCampaignStrategy(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-campaign-generator/objective", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { objective?: string; productFocus?: string };
      const report = pillowHost.generateAiCampaignObjective(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-campaign-generator/recommend-channels", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.recommendAiCampaignChannels(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-campaign-generator/recommend-audience", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.recommendAiCampaignAudience(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-campaign-generator/recommend-budget", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.recommendAiCampaignBudget(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-campaign-generator/recommend-schedule", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.recommendAiCampaignSchedule(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-campaign-generator/recommend-keywords", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.recommendAiCampaignKeywords(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-campaign-generator/recommend-creatives", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.recommendAiCampaignCreatives(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/ai-campaign-generator/summary", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.generateAiCampaignSummary(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAiCampaignGeneratorSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/budget-optimization-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectBudgetOptimizationEngineSnapshot());
    }
    try {
      return reply.send({
        budgetOptimizationEngine: pillowHost.getBudgetOptimizationEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-optimization-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.connectBudgetOptimization(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-optimization-engine/allocate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        campaignReference?: string;
        marketingChannel?: string;
        allocatedBudget?: number;
        currentSpend?: number;
      };
      const report = pillowHost.allocateBudget(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-optimization-engine/reallocate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.reallocateBudget(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-optimization-engine/monitor-spend", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { budgetRecordId?: string };
      const report = pillowHost.monitorBudgetSpend(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-optimization-engine/monitor-utilization", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { budgetRecordId?: string };
      const report = pillowHost.monitorBudgetUtilization(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-optimization-engine/detect-inefficiencies", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { budgetRecordId?: string };
      const report = pillowHost.detectBudgetInefficiencies(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-optimization-engine/detect-overspend", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { budgetRecordId?: string };
      const report = pillowHost.detectBudgetOverspend(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-optimization-engine/calculate-efficiency", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { budgetRecordId?: string };
      const report = pillowHost.calculateBudgetEfficiency(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-optimization-engine/recommend", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { budgetRecordId?: string };
      const report = pillowHost.recommendBudgetAdjustments(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/budget-optimization-engine/optimize", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { campaignReference?: string; validated?: boolean };
      const report = pillowHost.optimizeBudgets(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBudgetOptimizationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/conversion-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectConversionIntelligenceSnapshot());
    }
    try {
      return reply.send({
        conversionIntelligence: pillowHost.getConversionIntelligence(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectConversionIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/conversion-intelligence/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectConversionIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.connectConversionIntelligence(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectConversionIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/conversion-intelligence/track-funnel", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectConversionIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        campaignReference?: string;
        marketingChannel?: string;
        funnelStage?: string;
        conversionRate?: number;
        dropOffRate?: number;
        landingPageScore?: number;
      };
      const report = pillowHost.trackConversionFunnel(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectConversionIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/conversion-intelligence/track-drop-off", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectConversionIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { conversionRecordId?: string };
      const report = pillowHost.trackConversionDropOff(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectConversionIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/conversion-intelligence/measure-landing-page", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectConversionIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { conversionRecordId?: string };
      const report = pillowHost.measureConversionLandingPage(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectConversionIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/conversion-intelligence/measure-campaign", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectConversionIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { campaignReference?: string };
      const report = pillowHost.measureCampaignConversion(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectConversionIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/conversion-intelligence/measure-channel", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectConversionIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { marketingChannel?: string };
      const report = pillowHost.measureChannelConversion(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectConversionIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/conversion-intelligence/detect-bottlenecks", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectConversionIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { conversionRecordId?: string };
      const report = pillowHost.detectConversionBottlenecks(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectConversionIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/conversion-intelligence/detect-abandonment", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectConversionIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { conversionRecordId?: string };
      const report = pillowHost.detectConversionAbandonment(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectConversionIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/conversion-intelligence/calculate-efficiency", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectConversionIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { conversionRecordId?: string };
      const report = pillowHost.calculateConversionEfficiency(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectConversionIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/conversion-intelligence/recommend", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectConversionIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { conversionRecordId?: string };
      const report = pillowHost.recommendConversionImprovements(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectConversionIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/conversion-intelligence/optimize", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectConversionIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { campaignReference?: string; validated?: boolean };
      const report = pillowHost.optimizeConversionFunnel(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectConversionIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/competitor-marketing-monitor", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCompetitorMarketingMonitorSnapshot());
    }
    try {
      return reply.send({
        competitorMarketingMonitor: pillowHost.getCompetitorMarketingMonitor(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/competitor-marketing-monitor/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.connectCompetitorMarketingMonitor(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/competitor-marketing-monitor/discover", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { seedIdentifier?: string; marketingChannel?: string };
      const report = pillowHost.discoverMarketingCompetitors(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/competitor-marketing-monitor/monitor-campaigns", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { competitorRecordId?: string };
      const report = pillowHost.monitorCompetitorCampaigns(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/competitor-marketing-monitor/monitor-advertisements", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { competitorRecordId?: string };
      const report = pillowHost.monitorCompetitorAdvertisements(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/competitor-marketing-monitor/monitor-keywords", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { competitorRecordId?: string };
      const report = pillowHost.monitorCompetitorKeywords(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/competitor-marketing-monitor/monitor-seo", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { competitorRecordId?: string };
      const report = pillowHost.monitorCompetitorSeoRankings(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/competitor-marketing-monitor/monitor-landing-pages", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { competitorRecordId?: string };
      const report = pillowHost.monitorCompetitorLandingPages(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/competitor-marketing-monitor/monitor-promotions", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { competitorRecordId?: string };
      const report = pillowHost.monitorCompetitorPromotions(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/competitor-marketing-monitor/detect-strategy-changes", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { competitorRecordId?: string };
      const report = pillowHost.detectCompetitorStrategyChanges(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/competitor-marketing-monitor/detect-emerging", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { competitorRecordId?: string };
      const report = pillowHost.detectEmergingMarketingCompetitors(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/competitor-marketing-monitor/generate-intelligence", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { competitorRecordId?: string };
      const report = pillowHost.generateCompetitorMarketingIntelligence(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCompetitorMarketingMonitorSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/viral-trend-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectViralTrendIntelligenceSnapshot());
    }
    try {
      return reply.send({
        viralTrendIntelligence: pillowHost.getViralTrendIntelligence(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/viral-trend-intelligence/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.connectViralTrendIntelligence(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/viral-trend-intelligence/discover", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        seedKeyword?: string;
        trendCategory?: string;
        trendSource?: string;
      };
      const report = pillowHost.discoverViralTrends(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/viral-trend-intelligence/monitor-keywords", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { trendRecordId?: string };
      const report = pillowHost.monitorViralTrendKeywords(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/viral-trend-intelligence/monitor-hashtags", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { trendRecordId?: string };
      const report = pillowHost.monitorViralTrendHashtags(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/viral-trend-intelligence/monitor-products", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { trendRecordId?: string };
      const report = pillowHost.monitorViralTrendProducts(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/viral-trend-intelligence/monitor-content", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { trendRecordId?: string };
      const report = pillowHost.monitorViralTrendContent(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/viral-trend-intelligence/monitor-creators", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { trendRecordId?: string };
      const report = pillowHost.monitorViralTrendCreators(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/viral-trend-intelligence/detect-acceleration", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { trendRecordId?: string };
      const report = pillowHost.detectViralTrendAcceleration(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/viral-trend-intelligence/detect-decline", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { trendRecordId?: string };
      const report = pillowHost.detectViralTrendDecline(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/viral-trend-intelligence/predict", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { trendRecordId?: string };
      const report = pillowHost.predictViralTrends(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/viral-trend-intelligence/recommend", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { trendRecordId?: string };
      const report = pillowHost.recommendViralTrends(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectViralTrendIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/marketing-experiment-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectMarketingExperimentEngineSnapshot());
    }
    try {
      return reply.send({
        marketingExperimentEngine: pillowHost.getMarketingExperimentEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketing-experiment-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.connectMarketingExperimentEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketing-experiment-engine/create", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        experimentName?: string;
        experimentType?: string;
        campaignReference?: string;
        variants?: string[];
        audienceReference?: string;
        validated?: boolean;
      };
      const report = pillowHost.createMarketingExperiment(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketing-experiment-engine/ab-test", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { experimentId?: string; variants?: string[] };
      const report = pillowHost.manageMarketingAbTest(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketing-experiment-engine/multivariate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { experimentId?: string; variants?: string[] };
      const report = pillowHost.manageMarketingMultivariateTest(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketing-experiment-engine/assign-audience", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        experimentId?: string;
        audienceReference?: string;
        splitPercent?: number;
      };
      const report = pillowHost.assignMarketingExperimentAudience(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketing-experiment-engine/measure", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { experimentId?: string };
      const report = pillowHost.measureMarketingExperimentPerformance(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketing-experiment-engine/compare", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { experimentId?: string };
      const report = pillowHost.compareMarketingExperimentVariants(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketing-experiment-engine/detect-significance", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { experimentId?: string };
      const report = pillowHost.detectMarketingExperimentSignificance(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketing-experiment-engine/recommend-winner", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { experimentId?: string };
      const report = pillowHost.recommendMarketingExperimentWinner(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/marketing-experiment-engine/archive", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { experimentId?: string; validated?: boolean };
      const report = pillowHost.archiveMarketingExperiment(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketingExperimentEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/cross-channel-orchestrator", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCrossChannelOrchestratorSnapshot());
    }
    try {
      return reply.send({
        crossChannelOrchestrator: pillowHost.getCrossChannelOrchestrator(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cross-channel-orchestrator/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.connectCrossChannelOrchestrator(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cross-channel-orchestrator/coordinate-campaigns", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        marketingChannels?: string[];
        schedule?: string;
        validated?: boolean;
      };
      const report = pillowHost.coordinateCrossChannelCampaigns(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cross-channel-orchestrator/synchronize-execution", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.synchronizeCrossChannelExecution(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cross-channel-orchestrator/synchronize-schedules", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { schedule?: string; validated?: boolean };
      const report = pillowHost.synchronizeCrossChannelSchedules(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cross-channel-orchestrator/coordinate-journeys", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.coordinateCrossChannelJourneys(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cross-channel-orchestrator/coordinate-channels", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.coordinateCrossChannelChannels(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cross-channel-orchestrator/coordinate-budgets", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.coordinateCrossChannelBudgets(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cross-channel-orchestrator/coordinate-assets", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.coordinateCrossChannelAssets(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cross-channel-orchestrator/coordinate-experiments", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.coordinateCrossChannelExperiments(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/cross-channel-orchestrator/detect-conflicts", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.detectCrossChannelConflicts(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCrossChannelOrchestratorSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/autonomous-marketing-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAutonomousMarketingEngineSnapshot());
    }
    try {
      return reply.send({
        autonomousMarketingEngine: pillowHost.getAutonomousMarketingEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/autonomous-marketing-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.connectAutonomousMarketingEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/autonomous-marketing-engine/monitor", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { campaignReference?: string; validated?: boolean };
      const report = pillowHost.monitorAutonomousMarketingPerformance(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/autonomous-marketing-engine/recommend", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.generateAutonomousMarketingRecommendations(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/autonomous-marketing-engine/optimize-budgets", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.optimizeAutonomousMarketingBudgets(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/autonomous-marketing-engine/optimize-audience", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.optimizeAutonomousMarketingAudience(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/autonomous-marketing-engine/optimize-scheduling", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.optimizeAutonomousMarketingScheduling(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/autonomous-marketing-engine/optimize-creative", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.optimizeAutonomousMarketingCreative(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/autonomous-marketing-engine/optimize-channels", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.optimizeAutonomousMarketingChannelAllocation(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/autonomous-marketing-engine/respond", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.respondToAutonomousMarketingPerformanceChanges(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/autonomous-marketing-engine/execute", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        autonomousMarketingId?: string;
        approved?: boolean;
        validated?: boolean;
      };
      const report = pillowHost.executeApprovedAutonomousMarketingOptimizations(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectAutonomousMarketingEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/real-world-operations-certification", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectRealWorldOperationsCertificationSnapshot());
    }
    try {
      return reply.send({
        realWorldOperationsCertification: pillowHost.getRealWorldOperationsCertification(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectRealWorldOperationsCertificationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/real-world-operations-certification/run", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectRealWorldOperationsCertificationSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        programmeScope?: string[];
        validated?: boolean;
      };
      const report = await pillowHost.runRealWorldOperationsCertification(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectRealWorldOperationsCertificationSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/real-world-operations-certification/validate", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectRealWorldOperationsCertificationSnapshot());
    }
    try {
      const validation = pillowHost.validateRealWorldOperationsCertificationReport();
      return reply.send({ computedAt: new Date().toISOString(), validation });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectRealWorldOperationsCertificationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/company-factory-framework", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCompanyFactoryFrameworkSnapshot());
    }
    try {
      return reply.send({
        companyFactoryFramework: pillowHost.getCompanyFactoryFramework(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCompanyFactoryFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/company-factory-framework/register", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCompanyFactoryFrameworkSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        definition?: Record<string, unknown>;
        forceRegister?: boolean;
      };
      const report = pillowHost.registerCompanyModule({
        definition: body.definition,
        forceRegister: body.forceRegister,
      });
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCompanyFactoryFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/company-factory-framework/activate", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectCompanyFactoryFrameworkSnapshot());
    }
    try {
      const body = (request.body ?? {}) as { companyModuleIdentifier?: string };
      const report = pillowHost.activateCompanyModule(body.companyModuleIdentifier ?? "");
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectCompanyFactoryFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/business-opportunity-discovery", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectBusinessOpportunityDiscoverySnapshot());
    }
    try {
      return reply.send({
        businessOpportunityDiscovery: pillowHost.getBusinessOpportunityDiscovery(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/business-opportunity-discovery/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.connectBusinessOpportunityDiscovery(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/business-opportunity-discovery/discover", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        industry?: string;
        marketReference?: string;
        category?: string;
        validated?: boolean;
      };
      const report = pillowHost.discoverBusinessOpportunities(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/business-opportunity-discovery/monitor-trends", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.monitorBusinessOpportunityMarketTrends(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/business-opportunity-discovery/monitor-industries", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.monitorBusinessOpportunityEmergingIndustries(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/business-opportunity-discovery/monitor-demand", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.monitorBusinessOpportunityCustomerDemand(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/business-opportunity-discovery/monitor-competitors", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.monitorBusinessOpportunityCompetitorActivity(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/business-opportunity-discovery/identify-underserved", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.identifyUnderservedBusinessMarkets(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/business-opportunity-discovery/identify-niches", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.identifyProfitableBusinessNiches(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/business-opportunity-discovery/score", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.scoreBusinessOpportunities(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/business-opportunity-discovery/rank", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.rankBusinessOpportunities(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectBusinessOpportunityDiscoverySnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/market-validation-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectMarketValidationEngineSnapshot());
    }
    try {
      return reply.send({
        marketValidationEngine: pillowHost.getMarketValidationEngine(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketValidationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/market-validation-engine/connect", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketValidationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.connectMarketValidationEngine(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketValidationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/market-validation-engine/validate-opportunity", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketValidationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as {
        opportunityReference?: string;
        industry?: string;
        validated?: boolean;
      };
      const report = pillowHost.validateMarketOpportunity(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketValidationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/market-validation-engine/validate-demand", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketValidationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.validateMarketDemand(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketValidationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/market-validation-engine/validate-customer", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketValidationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.validateMarketCustomerInterest(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketValidationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/market-validation-engine/validate-competition", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketValidationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.validateMarketCompetitiveLandscape(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketValidationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/market-validation-engine/validate-size", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketValidationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.validateMarketSize(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketValidationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/market-validation-engine/validate-profitability", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketValidationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.validateMarketProfitabilityPotential(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketValidationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/market-validation-engine/calculate-confidence", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketValidationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.calculateMarketValidationConfidence(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketValidationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/market-validation-engine/identify-risks", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketValidationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.identifyMarketRisks(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketValidationEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/market-validation-engine/recommend", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      return reply.code(503).send(collectMarketValidationEngineSnapshot());
    }
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report = pillowHost.generateMarketInvestmentRecommendation(body);
      return reply.send({ computedAt: new Date().toISOString(), report });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send(collectMarketValidationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/e2e-testing", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ e2eTesting: pillowHost.getE2eTesting() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/journey-system", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ journeySystem: pillowHost.getJourneySystem() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/brain-runtime", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ brainRuntime: pillowHost.getBrainRuntime() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/production-mode", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ productionMode: pillowHost.getProductionMode() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/durable-sessions", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ durableSessions: pillowHost.getDurableSessions() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/guardian-monitoring", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ guardianMonitoring: pillowHost.getGuardianMonitoring() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/scaling-architecture", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ scalingArchitecture: pillowHost.getScalingArchitecture() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/performance-governance", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ performanceGovernance: pillowHost.getPerformanceGovernance() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/execution-control-center", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ executionControlCenter: pillowHost.getExecutionControlCenter() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/vision-integrity", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ visionIntegrity: pillowHost.getVisionIntegrity() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/supervisor-system", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ supervisorSystem: pillowHost.getSupervisorSystem() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/builder-monitor", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ builderMonitor: pillowHost.getBuilderMonitor() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/builder-console", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectBuilderConsoleSnapshot());
    }
    try {
      return reply.send(pillowHost.getBuilderConsole());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectBuilderConsoleSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/live-eta", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectLiveEtaSnapshot());
    }
    try {
      return reply.send(pillowHost.getLiveEta());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectLiveEtaSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/explainability", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExplainabilitySnapshot());
    }
    try {
      return reply.send(pillowHost.getExplainability());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExplainabilitySnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/business-factory", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectBusinessFactorySnapshot());
    }
    try {
      return reply.send(pillowHost.getBusinessFactory());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectBusinessFactorySnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/commerce-operating-model", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCommerceOperatingModelSnapshot());
    }
    try {
      return reply.send(pillowHost.getCommerceOperatingModel());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCommerceOperatingModelSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/business-automation", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectBusinessAutomationSnapshot());
    }
    try {
      return reply.send(pillowHost.getBusinessAutomation());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectBusinessAutomationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/commercial-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCommercialIntelligenceSnapshot());
    }
    try {
      return reply.send(pillowHost.getCommercialIntelligence());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCommercialIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/grand-king-operating-account", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectGrandKingOperatingAccountSnapshot());
    }
    try {
      return reply.send(pillowHost.getGrandKingOperatingAccount());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectGrandKingOperatingAccountSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/repository-evolution", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectRepositoryEvolutionSnapshot());
    }
    try {
      return reply.send(pillowHost.getRepositoryEvolutionArchitecture());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectRepositoryEvolutionSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/knowledge-evolution", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectKnowledgeEvolutionSnapshot());
    }
    try {
      return reply.send(pillowHost.getKnowledgeEvolutionArchitecture());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectKnowledgeEvolutionSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/architecture-evolution", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectArchitectureEvolutionSnapshot());
    }
    try {
      return reply.send(pillowHost.getArchitectureEvolutionArchitecture());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectArchitectureEvolutionSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/ai-evolution", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAiEvolutionSnapshot());
    }
    try {
      return reply.send(pillowHost.getAiEvolutionArchitecture());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectAiEvolutionSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/empire-evolution", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectEmpireEvolutionSnapshot());
    }
    try {
      return reply.send(pillowHost.getEmpireEvolutionArchitecture());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectEmpireEvolutionSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-architecture-framework", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveArchitectureFrameworkSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveArchitectureFramework());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveArchitectureFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/corporate-vision-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCorporateVisionEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getCorporateVisionEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCorporateVisionEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/strategic-objective-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectStrategicObjectiveEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getStrategicObjectiveEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectStrategicObjectiveEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-roadmap-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveRoadmapEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveRoadmapEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveRoadmapEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/priority-management-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectPriorityManagementEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getPriorityManagementEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectPriorityManagementEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/initiative-portfolio-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectInitiativePortfolioEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getInitiativePortfolioEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectInitiativePortfolioEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/department-planning-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectDepartmentPlanningEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getDepartmentPlanningEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectDepartmentPlanningEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-calendar-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveCalendarEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveCalendarEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveCalendarEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-dependency-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveDependencyEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveDependencyEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveDependencyEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-scenario-planner", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveScenarioPlannerSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveScenarioPlanner());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveScenarioPlannerSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/long-term-growth-planner", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectLongTermGrowthPlannerSnapshot());
    }
    try {
      return reply.send(pillowHost.getLongTermGrowthPlanner());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectLongTermGrowthPlannerSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/opportunity-prioritization-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectOpportunityPrioritizationEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getOpportunityPrioritizationEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectOpportunityPrioritizationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/strategic-alignment-monitor", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectStrategicAlignmentMonitorSnapshot());
    }
    try {
      return reply.send(pillowHost.getStrategicAlignmentMonitor());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectStrategicAlignmentMonitorSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-planning-dashboard", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutivePlanningDashboardSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutivePlanningDashboard());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutivePlanningDashboardSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-planning-certification", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutivePlanningCertificationSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutivePlanningCertification());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutivePlanningCertificationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-decision-architecture", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveDecisionArchitectureSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveDecisionArchitecture());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveDecisionArchitectureSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/risk-assessment-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectRiskAssessmentEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getRiskAssessmentEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectRiskAssessmentEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/decision-simulation-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectDecisionSimulationEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getDecisionSimulationEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectDecisionSimulationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-recommendation-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveRecommendationEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveRecommendationEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveRecommendationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/resource-allocation-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectResourceAllocationEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getResourceAllocationEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectResourceAllocationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/conflict-resolution-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectConflictResolutionEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getConflictResolutionEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectConflictResolutionEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-approval-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveApprovalIntelligenceSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveApprovalIntelligence());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveApprovalIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/crisis-decision-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCrisisDecisionEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getCrisisDecisionEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCrisisDecisionEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-escalation-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveEscalationEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveEscalationEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveEscalationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/trade-off-analysis-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectTradeOffAnalysisEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getTradeOffAnalysisEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectTradeOffAnalysisEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-consensus-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveConsensusEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveConsensusEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveConsensusEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-policy-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutivePolicyEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutivePolicyEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutivePolicyEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/decision-audit-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectDecisionAuditEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getDecisionAuditEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectDecisionAuditEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-confidence-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveConfidenceEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveConfidenceEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveConfidenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/autonomous-decision-monitor", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectAutonomousDecisionMonitorSnapshot());
    }
    try {
      return reply.send(pillowHost.getAutonomousDecisionMonitor());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectAutonomousDecisionMonitorSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-decision-certification", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveDecisionCertificationSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveDecisionCertification());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveDecisionCertificationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-finance-framework", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveFinanceFrameworkSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveFinanceFramework());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveFinanceFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/capital-allocation-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCapitalAllocationEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getCapitalAllocationEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCapitalAllocationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-budget-planner", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveBudgetPlannerSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveBudgetPlanner());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveBudgetPlannerSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/investment-evaluation-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectInvestmentEvaluationEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getInvestmentEvaluationEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectInvestmentEvaluationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/roi-intelligence-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectRoiIntelligenceEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getRoiIntelligenceEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectRoiIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/cash-reserve-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCashReserveIntelligenceSnapshot());
    }
    try {
      return reply.send(pillowHost.getCashReserveIntelligence());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCashReserveIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/profit-optimization-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectProfitOptimizationEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getProfitOptimizationEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectProfitOptimizationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/cost-optimization-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCostOptimizationEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getCostOptimizationEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCostOptimizationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/financial-scenario-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectFinancialScenarioEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getFinancialScenarioEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectFinancialScenarioEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-kpi-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveKpiEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveKpiEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveKpiEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/capital-risk-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCapitalRiskEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getCapitalRiskEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCapitalRiskEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-forecast-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveForecastIntelligenceSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveForecastIntelligence());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveForecastIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-performance-dashboard", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutivePerformanceDashboardSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutivePerformanceDashboard());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutivePerformanceDashboardSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/enterprise-valuation-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectEnterpriseValuationEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getEnterpriseValuationEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectEnterpriseValuationEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-capital-strategy", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveCapitalStrategySnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveCapitalStrategy());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveCapitalStrategySnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/financial-executive-certification", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectFinancialExecutiveCertificationSnapshot());
    }
    try {
      return reply.send(pillowHost.getFinancialExecutiveCertification());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectFinancialExecutiveCertificationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/market-intelligence-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectMarketIntelligenceEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getMarketIntelligenceEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectMarketIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/competitor-intelligence-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCompetitorIntelligenceEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getCompetitorIntelligenceEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCompetitorIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/opportunity-discovery-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectOpportunityDiscoveryEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getOpportunityDiscoveryEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectOpportunityDiscoveryEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/threat-detection-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectThreatDetectionEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getThreatDetectionEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectThreatDetectionEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/industry-intelligence-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectIndustryIntelligenceEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getIndustryIntelligenceEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectIndustryIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/customer-behaviour-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCustomerBehaviourIntelligenceSnapshot());
    }
    try {
      return reply.send(pillowHost.getCustomerBehaviourIntelligence());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCustomerBehaviourIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/innovation-intelligence-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectInnovationIntelligenceEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getInnovationIntelligenceEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectInnovationIntelligenceEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-knowledge-graph", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveKnowledgeGraphSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveKnowledgeGraph());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveKnowledgeGraphSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-prediction-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutivePredictionEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutivePredictionEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutivePredictionEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-insight-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveInsightEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveInsightEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveInsightEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/enterprise-pattern-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectEnterprisePatternEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getEnterprisePatternEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectEnterprisePatternEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-benchmark-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveBenchmarkEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveBenchmarkEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveBenchmarkEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/cross-business-intelligence", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCrossBusinessIntelligenceSnapshot());
    }
    try {
      return reply.send(pillowHost.getCrossBusinessIntelligence());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCrossBusinessIntelligenceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-advisory-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveAdvisoryEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveAdvisoryEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveAdvisoryEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-intelligence-certification", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveIntelligenceCertificationSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveIntelligenceCertification());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveIntelligenceCertificationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/enterprise-governance-framework", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectEnterpriseGovernanceFrameworkSnapshot());
    }
    try {
      return reply.send(pillowHost.getEnterpriseGovernanceFramework());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectEnterpriseGovernanceFrameworkSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-constitutional-monitor", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveConstitutionalMonitorSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveConstitutionalMonitor());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveConstitutionalMonitorSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/enterprise-audit-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectEnterpriseAuditEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getEnterpriseAuditEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectEnterpriseAuditEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-compliance-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveComplianceEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveComplianceEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveComplianceEngineSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-compliance-engine/evaluate", { preHandler: pillowAuth }, async (request, reply) => {
    const body = (request.body ?? {}) as {
      actor?: string;
      action?: string;
      actionType?: string;
      context?: Record<string, unknown>;
      policyIds?: string[];
    };
    if (!body.actor || !body.action) {
      return reply.code(400).send({ error: "actor and action are required" });
    }
    return reply.send(
      evaluateExecutiveCompliance({
        actor: body.actor,
        action: body.action,
        actionType: (body.actionType as "executive_action") ?? "executive_action",
        context: body.context,
        policyIds: body.policyIds,
      }),
    );
  });

  app.get("/api/pillow/executive-compliance-engine/policies", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveCompliancePolicies());
  });

  app.patch("/api/pillow/executive-compliance-engine/policies/:policyId", { preHandler: pillowAuth }, async (request, reply) => {
    const { policyId } = request.params as { policyId: string };
    const body = (request.body ?? {}) as { enabled?: boolean; priority?: number; severity?: string; version?: string };
    const result = patchExecutiveCompliancePolicy(policyId, body);
    if ("error" in result) return reply.code(404).send(result);
    return reply.send(result);
  });

  app.get("/api/pillow/executive-compliance-engine/report", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveComplianceReport());
  });

  app.get("/api/pillow/executive-compliance-engine/violations", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveComplianceViolations());
  });

  app.get("/api/pillow/executive-compliance-engine/health", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveComplianceHealth());
  });

  app.get("/api/pillow/executive-ethics-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveEthicsEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveEthicsEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveEthicsEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-accountability-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveAccountabilityEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveAccountabilityEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveAccountabilityEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-transparency-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveTransparencyEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveTransparencyEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveTransparencyEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-exception-manager", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveExceptionManagerSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveExceptionManager());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveExceptionManagerSnapshot());
      }
      throw error;
    }
  });

  app.post("/api/pillow/executive-exception-manager/register", { preHandler: pillowAuth }, async (request, reply) => {
    const body = (request.body ?? {}) as {
      title?: string;
      category?: string;
      reason?: string;
      businessJustification?: string;
      requestedBy?: string;
      durationDays?: number;
      riskLevel?: string;
    };
    if (!body.title || !body.category || !body.reason || !body.requestedBy) {
      return reply.code(400).send({ error: "title, category, reason, and requestedBy are required" });
    }
    return reply.send(
      registerExecutiveException({
        title: body.title,
        category: body.category as "governance_exceptions",
        reason: body.reason,
        businessJustification: body.businessJustification ?? body.reason,
        requestedBy: body.requestedBy,
        durationDays: body.durationDays,
        riskLevel: body.riskLevel as "low" | undefined,
      }),
    );
  });

  app.post("/api/pillow/executive-exception-manager/approve", { preHandler: pillowAuth }, async (request, reply) => {
    const body = (request.body ?? {}) as {
      exceptionId?: string;
      approvedBy?: string;
      approved?: boolean;
      notes?: string;
    };
    if (!body.exceptionId || !body.approvedBy || body.approved === undefined) {
      return reply.code(400).send({ error: "exceptionId, approvedBy, and approved are required" });
    }
    const result = approveExecutiveException({
      exceptionId: body.exceptionId,
      approvedBy: body.approvedBy,
      approved: body.approved,
      notes: body.notes,
    });
    if ("error" in result) return reply.code(404).send(result);
    return reply.send(result);
  });

  app.post("/api/pillow/executive-exception-manager/resolve", { preHandler: pillowAuth }, async (request, reply) => {
    const body = (request.body ?? {}) as { exceptionId?: string; actor?: string };
    if (!body.exceptionId || !body.actor) {
      return reply.code(400).send({ error: "exceptionId and actor are required" });
    }
    const result = resolveExecutiveException(body.exceptionId, body.actor);
    if ("error" in result) return reply.code(404).send(result);
    return reply.send(result);
  });

  app.get("/api/pillow/executive-exception-manager/policies", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveExceptionPolicies());
  });

  app.get("/api/pillow/executive-exception-manager/report", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveExceptionReport());
  });

  app.get("/api/pillow/executive-exception-manager/history", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveExceptionHistory());
  });

  app.get("/api/pillow/executive-exception-manager/health", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveExceptionHealth());
  });

  app.get("/api/pillow/enterprise-risk-governance", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectEnterpriseRiskGovernanceSnapshot());
    }
    try {
      return reply.send(pillowHost.getEnterpriseRiskGovernance());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectEnterpriseRiskGovernanceSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/enterprise-risk-governance/register", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getEnterpriseRiskRegister());
  });

  app.get("/api/pillow/enterprise-risk-governance/report", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getEnterpriseRiskReport());
  });

  app.get("/api/pillow/enterprise-risk-governance/history", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getEnterpriseRiskHistory());
  });

  app.get("/api/pillow/enterprise-risk-governance/health", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getEnterpriseRiskHealth());
  });

  app.get("/api/pillow/executive-review-board", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveReviewBoardSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveReviewBoard());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveReviewBoardSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-review-board/calendar", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveReviewCalendar());
  });

  app.get("/api/pillow/executive-review-board/report", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveReviewReport());
  });

  app.get("/api/pillow/executive-review-board/history", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveReviewHistory());
  });

  app.get("/api/pillow/executive-review-board/health", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveReviewHealth());
  });

  app.get("/api/pillow/executive-policy-evolution", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutivePolicyEvolutionSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutivePolicyEvolution());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutivePolicyEvolutionSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-policy-evolution/queue", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getPolicyEvolutionQueue());
  });

  app.get("/api/pillow/executive-policy-evolution/report", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getPolicyEvolutionReport());
  });

  app.get("/api/pillow/executive-policy-evolution/history", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getPolicyEvolutionHistory());
  });

  app.get("/api/pillow/executive-policy-evolution/health", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getPolicyEvolutionHealth());
  });

  app.get("/api/pillow/executive-trust-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveTrustEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveTrustEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveTrustEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-trust-engine/scores", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveTrustScores());
  });

  app.get("/api/pillow/executive-trust-engine/report", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveTrustReport());
  });

  app.get("/api/pillow/executive-trust-engine/history", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveTrustHistory());
  });

  app.get("/api/pillow/executive-trust-engine/health", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveTrustHealth());
  });

  app.get("/api/pillow/enterprise-constitutional-guardian", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectEnterpriseConstitutionalGuardianSnapshot());
    }
    try {
      return reply.send(pillowHost.getEnterpriseConstitutionalGuardian());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectEnterpriseConstitutionalGuardianSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/enterprise-constitutional-guardian/health-status", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getConstitutionalHealth());
  });

  app.get("/api/pillow/enterprise-constitutional-guardian/report", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getConstitutionalGuardianReport());
  });

  app.get("/api/pillow/enterprise-constitutional-guardian/violations", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getConstitutionalViolations());
  });

  app.get("/api/pillow/enterprise-constitutional-guardian/history", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getConstitutionalGuardianHistory());
  });

  app.get("/api/pillow/enterprise-constitutional-guardian/health", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getConstitutionalGuardianHealth());
  });

  app.get("/api/pillow/executive-resilience-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveResilienceEngineSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveResilienceEngine());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveResilienceEngineSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/executive-resilience-engine/health-status", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getEnterpriseHealthStatus());
  });

  app.get("/api/pillow/executive-resilience-engine/report", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveResilienceReport());
  });

  app.get("/api/pillow/executive-resilience-engine/incidents", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getActiveResilienceIncidents());
  });

  app.get("/api/pillow/executive-resilience-engine/history", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveResilienceHistory());
  });

  app.get("/api/pillow/executive-resilience-engine/health", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveResilienceHealth());
  });

  app.get("/api/pillow/grand-king-executive-cockpit", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectGrandKingExecutiveCockpitSnapshot());
    }
    try {
      return reply.send(pillowHost.getGrandKingExecutiveCockpit());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectGrandKingExecutiveCockpitSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/grand-king-executive-cockpit/governance-chain", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getGovernanceChainStatus());
  });

  app.get("/api/pillow/grand-king-executive-cockpit/report", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getGrandKingExecutiveReport());
  });

  app.get("/api/pillow/grand-king-executive-cockpit/widgets", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getExecutiveDashboardWidgets());
  });

  app.get("/api/pillow/grand-king-executive-cockpit/history", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getGrandKingExecutiveCockpitHistory());
  });

  app.get("/api/pillow/grand-king-executive-cockpit/health", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send(getGrandKingExecutiveCockpitHealth());
  });

  app.get("/api/pillow/executive-governance-certification", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectExecutiveGovernanceCertificationSnapshot());
    }
    try {
      return reply.send(pillowHost.getExecutiveGovernanceCertification());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectExecutiveGovernanceCertificationSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/marketplace-integration", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    return reply.send(
      collectMarketplaceIntegrationSnapshot(user.workspaceId),
    );
  });

  app.get("/api/pillow/eta-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ etaEngine: pillowHost.getEtaEngine() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/autonomous-recovery-engine", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ autonomousRecoveryEngine: pillowHost.getAutonomousRecoveryEngine() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/zero-human-automation", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ zeroHumanAutomationEngine: pillowHost.getZeroHumanAutomationEngine() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/intelligence-platform", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({
        intelligencePlatform: pillowHost.getIntelligencePlatformSnapshot(),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/repository-architecture-intelligence", { preHandler: pillowAuth }, async (request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      const query = request.query as { search?: string; impactTarget?: string };
      return reply.send({
        repositoryArchitectureIntelligence: pillowHost.getRepositoryArchitectureIntelligence({
          search: query.search,
          impactTarget: query.impactTarget,
        }),
      });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.get("/api/pillow/cockpit-ux", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return reply.send(collectCockpitUxSnapshot());
    }
    try {
      return reply.send(pillowHost.getCockpitUxArchitecture());
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.send(collectCockpitUxSnapshot());
      }
      throw error;
    }
  });

  app.get("/api/pillow/founder-shell", { preHandler: pillowAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
      return pillowStartingResponse(reply);
    }
    try {
      return reply.send({ founderShellEngine: pillowHost.getFounderShellEngine() });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.post("/api/pillow/session", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        workspaceId: z.string().min(1).optional(),
      })
      .parse(request.body ?? {});

    const workspaceId = body.workspaceId ?? user.workspaceId;
    if (workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace access denied" });
    }

    if (!(await ensurePillowHostReadyOrReply(pillowHost, llmRouter, auditLogger, reply))) {
      return;
    }

    try {
      const session = pillowHost.createSession(workspaceId);
      auditLogger.write({
        action: "pillow.session.create",
        actor: user.email,
        workspaceId,
        correlationId: request.id,
        metadata: { sessionId: session.sessionId },
      });
      return reply.code(201).send({ session });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.delete("/api/pillow/session", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        sessionId: z.string().min(1),
        workspaceId: z.string().min(1).optional(),
      })
      .parse(request.query);

    const workspaceId = query.workspaceId ?? user.workspaceId;
    if (workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace access denied" });
    }

    const removed = pillowHost.destroySession(workspaceId, query.sessionId);
    if (!removed) {
      return reply.code(404).send({ error: "Session not found" });
    }

    auditLogger.write({
      action: "pillow.session.destroy",
      actor: user.email,
      workspaceId,
      correlationId: request.id,
      metadata: { sessionId: query.sessionId },
    });

    return reply.send({ ok: true, sessionId: query.sessionId });
  });

  app.get("/api/pillow/history", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        sessionId: z.string().min(1),
        workspaceId: z.string().min(1).optional(),
      })
      .parse(request.query);

    const workspaceId = query.workspaceId ?? user.workspaceId;
    if (workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace access denied" });
    }

    const session = pillowHost.getSession(workspaceId, query.sessionId);
    if (!session) {
      return reply.code(404).send({ error: "Session not found" });
    }

    return reply.send({
      sessionId: session.sessionId,
      workspaceId: session.workspaceId,
      history: session.conversationHistory,
      tokenUsage: session.tokenUsage,
      repositoryFingerprint: session.repositoryFingerprint,
      currentMission: session.currentMission,
      approvalState: session.approvalState,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      requestLogs: pillowHost.listRequestLogs({
        workspaceId,
        sessionId: query.sessionId,
        limit: 50,
      }),
    });
  });

  app.post("/api/pillow/chat", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        message: z.string().min(1),
        sessionId: z.string().min(1),
        workspaceId: z.string().min(1).optional(),
        provider: z.enum(["openai", "anthropic", "gemini"]).optional(),
        workspaceContext: pillowWorkspaceContextSchema.optional(),
      })
      .parse(request.body);

    const workspaceId = body.workspaceId ?? user.workspaceId;
    if (workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace access denied" });
    }

    if (!(await ensurePillowHostReadyOrReply(pillowHost, llmRouter, auditLogger, reply))) {
      return;
    }

    const chatStarted = Date.now();
    logger.info(
      { correlationId: request.id, sessionId: body.sessionId, stage: "chat.enter" },
      "Pillow chat request entered",
    );

    try {
      const result = await pillowHost.routePrompt({
        workspaceId,
        sessionId: body.sessionId,
        message: body.message,
        actor: user.email,
        correlationId: request.id,
        provider: body.provider,
        workspaceContext: body.workspaceContext,
      });
      logger.info(
        {
          correlationId: request.id,
          sessionId: body.sessionId,
          stage: "chat.exit",
          durationMs: Date.now() - chatStarted,
          trace: result.trace,
          kind: result.kind,
        },
        "Pillow chat request completed",
      );
      return reply.send({ result });
    } catch (error) {
      if (error instanceof PillowSessionNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.post("/api/pillow/chat/stream", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        message: z.string().min(1),
        sessionId: z.string().min(1),
        workspaceId: z.string().min(1).optional(),
        provider: z.enum(["openai", "anthropic", "gemini"]).optional(),
        workspaceContext: pillowWorkspaceContextSchema.optional(),
      })
      .parse(request.body);

    const workspaceId = body.workspaceId ?? user.workspaceId;
    if (workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace access denied" });
    }

    if (!(await ensurePillowHostReadyOrReply(pillowHost, llmRouter, auditLogger, reply))) {
      return;
    }

    reply.hijack();
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const writeEvent = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      writeEvent("started", { sessionId: body.sessionId });
      const result = await pillowHost.routePrompt({
        workspaceId,
        sessionId: body.sessionId,
        message: body.message,
        actor: user.email,
        correlationId: request.id,
        provider: body.provider,
        workspaceContext: body.workspaceContext,
      });

      const tokens = result.message.match(/\S+\s*|\s+/g) ?? [result.message];
      for (const token of tokens) {
        writeEvent("token", { delta: token });
        await new Promise((resolve) => setTimeout(resolve, 12));
      }

      writeEvent("done", { result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      writeEvent("error", { message });
    } finally {
      reply.raw.end();
    }
  });

  app.get("/api/pillow/events/stream", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({ workspaceId: z.string().optional() })
      .parse(request.query);
    const workspaceId = query.workspaceId ?? user.workspaceId;

    reply.hijack();
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const writeEvent = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    writeEvent("connected", { workspaceId });

    const pushStatus = () => {
      const payload: Record<string, unknown> = {
        pillow: pillowHost.getStatus(),
        at: new Date().toISOString(),
      };
      try {
        const bridge = pillowHost.getCursorBridge() as { getStatus: (id: string) => unknown };
        payload.cursor = bridge.getStatus(workspaceId);
      } catch {
        payload.cursor = null;
      }
      writeEvent("status", payload);
    };

    pushStatus();
    const timer = setInterval(pushStatus, 4000);
    request.raw.on("close", () => {
      clearInterval(timer);
    });
  });
}
