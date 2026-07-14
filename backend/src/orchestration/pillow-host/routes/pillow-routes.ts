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
