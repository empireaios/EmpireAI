import type { ContextBuilder } from "../context/engine.js";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import type { RecoveryManagerEngine } from "../recovery/engine.js";
import type { ExecutiveAuditReviewerEngine } from "../audit-reviewer/engine.js";
import type { RepositorySynchronizerEngine } from "../synchronizer/engine.js";
import type { ContinuousDueDiligenceEngine } from "../due-diligence/engine.js";
import type { AutonomousImprovementEngine } from "../improvement/engine.js";
import type { LiveRepositoryWatcherEngine } from "../watcher/engine.js";
import type { GrandKingCommandInterface } from "../command/engine.js";
import type { ObjectiveEngine } from "../objective/engine.js";
import type { AutonomousRuntimeOrchestrator } from "../objective/autonomous-runtime-orchestrator.js";
import type { TechnicalChiefEngine } from "../technical-chief/engine.js";
import type { UxDesignerEngine } from "../ux-designer/engine.js";
import type { CursorBridgeEngine } from "../cursor-bridge/engine.js";
import type { InfrastructureCommanderEngine } from "../infrastructure-commander/engine.js";
import type { CommerceIntelligenceEngine } from "../commerce-intelligence/engine.js";
import type { EmpireCommanderEngine } from "../empire-commander/engine.js";
import type { EmpireOperatingSystemEngine } from "../empire-operating-system/engine.js";
import type { ContinuousEvolutionEngine } from "../continuous-evolution/engine.js";
import type { SubsystemEntry, SubsystemHealth, SubsystemId } from "./types.js";

export interface PillowSubsystemBundle {
  bootstrap: EmpireBootstrapContext;
  intelligence: RepositoryIntelligenceContext;
  contextBuilder: ContextBuilder;
  memory: RepositoryMemoryEngine;
  planner: MissionPlannerEngine;
  supervisor: CursorSupervisorEngine;
  recovery: RecoveryManagerEngine;
  auditReviewer: ExecutiveAuditReviewerEngine;
  synchronizer: RepositorySynchronizerEngine;
  dueDiligence: ContinuousDueDiligenceEngine;
  improvement: AutonomousImprovementEngine;
  watcher?: LiveRepositoryWatcherEngine;
  command?: GrandKingCommandInterface;
  objective?: ObjectiveEngine;
  autonomousRuntime?: AutonomousRuntimeOrchestrator;
  technicalChief?: TechnicalChiefEngine;
  uxDesigner?: UxDesignerEngine;
  cursorBridge?: CursorBridgeEngine;
  visionSynchronization?: import("../vision-synchronization/engine.js").VisionSynchronizationEngine;
  contextSynchronization?: import("../context-synchronization/engine.js").ContextSynchronizationEngine;
  cursorProtocol?: import("../cursor-protocol/engine.js").CursorProtocolEngine;
  recoveryDoctrine?: import("../recovery-doctrine/engine.js").RecoveryDoctrineEngine;
  browserTruth?: import("../browser-truth/engine.js").BrowserTruthEngine;
  visualCapture?: import("../visual-capture-engine/engine.js").VisualCaptureEngine;
  uiStateMapper?: import("../ui-state-mapper/engine.js").UiStateMapperEngine;
  componentRecognition?: import("../component-recognition-engine/engine.js").ComponentRecognitionEngine;
  layoutUnderstanding?: import("../layout-understanding-engine/engine.js").LayoutUnderstandingEngine;
  navigationMapping?: import("../navigation-mapping-engine/engine.js").NavigationMappingEngine;
  interactionTracking?: import("../interaction-tracking-engine/engine.js").InteractionTrackingEngine;
  contextAwareness?: import("../context-awareness-engine/engine.js").ContextAwarenessEngine;
  visualMemory?: import("../visual-memory-engine/engine.js").VisualMemoryEngine;
  sessionContinuity?: import("../session-continuity-engine/engine.js").SessionContinuityEngine;
  visualFoundationCertification?: import("../visual-foundation-certification-engine/engine.js").VisualFoundationCertificationEngine;
  uxRuleEngine?: import("../ux-rule-engine/engine.js").UxRuleEngine;
  designSystemIntelligence?: import("../design-system-intelligence-engine/engine.js").DesignSystemIntelligenceEngine;
  executiveStyleLearning?: import("../executive-style-learning-engine/engine.js").ExecutiveStyleLearningEngine;
  layoutEvaluation?: import("../layout-evaluation-engine/engine.js").LayoutEvaluationEngine;
  workflowOptimization?: import("../workflow-optimization-engine/engine.js").WorkflowOptimizationEngine;
  accessibilityIntelligence?: import("../accessibility-intelligence-engine/engine.js").AccessibilityIntelligenceEngine;
  visualConsistency?: import("../visual-consistency-engine/engine.js").VisualConsistencyEngine;
  uxScoring?: import("../ux-scoring-engine/engine.js").UxScoringEngine;
  recommendationEngine?: import("../recommendation-engine/engine.js").RecommendationEngine;
  uxIntelligenceCertification?: import("../ux-intelligence-certification-engine/engine.js").UxIntelligenceCertificationEngine;
  frontendBuilder?: import("../frontend-builder/engine.js").FrontendBuilder;
  componentGenerator?: import("../component-generator/engine.js").ComponentGenerator;
  layoutRefactoring?: import("../layout-refactoring/engine.js").LayoutRefactoringEngine;
  themeBuilder?: import("../theme-builder/engine.js").ThemeBuilder;
  previewGenerator?: import("../preview-generator/engine.js").PreviewGenerator;
  validationEngine?: import("../validation-engine/engine.js").ValidationEngine;
  regressionProtection?: import("../regression-protection/engine.js").RegressionProtectionEngine;
  rollbackManager?: import("../rollback-manager/engine.js").RollbackManagerEngine;
  changeDocumentation?: import("../change-documentation/engine.js").ChangeDocumentationEngine;
  autonomousBuilderCertification?: import("../autonomous-builder-certification-engine/engine.js").AutonomousBuilderCertificationEngine;
  naturalUxConversation?: import("../natural-ux-conversation/engine.js").NaturalUxConversationEngine;
  voiceUxCommands?: import("../voice-ux-commands/engine.js").VoiceUxCommandsEngine;
  screenAnnotation?: import("../screen-annotation/engine.js").ScreenAnnotationEngine;
  multiProposalGenerator?: import("../multi-proposal-generator/engine.js").MultiProposalGeneratorEngine;
  sideBySideComparison?: import("../side-by-side-comparison/engine.js").SideBySideComparisonEngine;
  explainDecisions?: import("../explain-decisions/engine.js").ExplainDecisionsEngine;
  approvalWorkflow?: import("../approval-workflow/engine.js").ApprovalWorkflowEngine;
  preferenceLearning?: import("../preference-learning/engine.js").PreferenceLearningEngine;
  continuousCollaboration?: import("../continuous-collaboration/engine.js").ContinuousCollaborationEngine;
  executiveCollaborationCertification?: import("../executive-collaboration-certification-engine/engine.js").ExecutiveCollaborationCertificationEngine;
  continuousScreenObservation?: import("../continuous-screen-observation-engine/engine.js").ContinuousScreenObservationEngine;
  autonomousUxAudit?: import("../autonomous-ux-audit-engine/engine.js").AutonomousUxAuditEngine;
  uxOpportunityDiscovery?: import("../ux-opportunity-discovery-engine/engine.js").UxOpportunityDiscoveryEngine;
  productivityIntelligence?: import("../productivity-intelligence-engine/engine.js").ProductivityIntelligenceEngine;
  workflowEvolution?: import("../workflow-evolution-engine/engine.js").WorkflowEvolutionEngine;
  adaptiveInterface?: import("../adaptive-interface-engine/engine.js").AdaptiveInterfaceEngine;
  continuousUxEvolution?: import("../continuous-ux-evolution-engine/engine.js").ContinuousUxEvolutionEngine;
  executiveWorkspaceIntelligence?: import("../executive-workspace-intelligence-engine/engine.js").ExecutiveWorkspaceIntelligenceEngine;
  selfImprovingUx?: import("../self-improving-ux-engine/engine.js").SelfImprovingUxEngine;
  visualIntelligenceCertification?: import("../visual-intelligence-certification-engine/engine.js").VisualIntelligenceCertificationEngine;
  e2eTesting?: import("../e2e-testing/engine.js").E2eTestingEngine;
  journeySystem?: import("../journey-system/engine.js").JourneySystemEngine;
  brainRuntime?: import("../brain-runtime/engine.js").BrainRuntimeEngine;
  productionMode?: import("../production-mode/engine.js").ProductionModeEngine;
  durableSessions?: import("../durable-sessions/engine.js").DurableSessionEngine;
  guardianMonitoring?: import("../guardian-monitoring/engine.js").GuardianMonitoringEngine;
  scalingArchitecture?: import("../scaling-architecture/engine.js").ScalingArchitectureEngine;
  performanceGovernance?: import("../performance-governance/engine.js").PerformanceGovernanceEngine;
  executionControlCenter?: import("../execution-control-center/engine.js").ExecutionControlCenterEngine;
  visionIntegrity?: import("../vision-integrity-engine/engine.js").VisionIntegrityEngine;
  builderMonitor?: import("../builder-monitor/engine.js").BuilderMonitorEngine;
  etaEngine?: import("../eta-engine/engine.js").EtaEngine;
  autonomousRecoveryEngine?: import("../autonomous-recovery-engine/engine.js").AutonomousRecoveryEngine;
  zeroHumanAutomationEngine?: import("../zero-human-automation/engine.js").ZeroHumanAutomationEngine;
  founderShellEngine?: import("../founder-shell/engine.js").FounderShellEngine;
  infrastructureCommander?: InfrastructureCommanderEngine;
  commerceIntelligence?: CommerceIntelligenceEngine;
  marketplaceConnectorFramework?: import("../marketplace-connector-framework/engine.js").MarketplaceConnectorFrameworkEngine;
  amazonMarketplaceIntegration?: import("../amazon-marketplace-integration/engine.js").AmazonMarketplaceIntegrationEngine;
  amazonProductIntelligence?: import("../amazon-product-intelligence/engine.js").AmazonProductIntelligenceEngine;
  amazonOrderManagement?: import("../amazon-order-management/engine.js").AmazonOrderManagementEngine;
  amazonInventorySync?: import("../amazon-inventory-sync/engine.js").AmazonInventorySyncEngine;
  walmartMarketplaceIntegration?: import("../walmart-marketplace-integration/engine.js").WalmartMarketplaceIntegrationEngine;
  etsyMarketplaceIntegration?: import("../etsy-marketplace-integration/engine.js").EtsyMarketplaceIntegrationEngine;
  ebayMarketplaceIntegration?: import("../ebay-marketplace-integration/engine.js").EbayMarketplaceIntegrationEngine;
  tiktokShopMarketplaceIntegration?: import("../tiktok-shop-marketplace-integration/engine.js").TikTokShopMarketplaceIntegrationEngine;
  shopifyStoreMarketplaceIntegration?: import("../shopify-store-marketplace-integration/engine.js").ShopifyStoreMarketplaceIntegrationEngine;
  woocommerceMarketplaceIntegration?: import("../woocommerce-marketplace-integration/engine.js").WooCommerceMarketplaceIntegrationEngine;
  marketplaceProductNormalization?: import("../marketplace-product-normalization/engine.js").MarketplaceProductNormalizationEngine;
  marketplaceOrderNormalization?: import("../marketplace-order-normalization/engine.js").MarketplaceOrderNormalizationEngine;
  marketplaceHealthMonitor?: import("../marketplace-health-monitor/engine.js").MarketplaceHealthMonitorEngine;
  marketplaceCertification?: import("../marketplace-certification/engine.js").MarketplaceCertificationEngine;
  supplierFramework?: import("../supplier-framework/engine.js").SupplierFrameworkEngine;
  cjDropshippingIntegration?: import("../cj-dropshipping-integration/engine.js").CjDropshippingIntegrationEngine;
  aliExpressIntegration?: import("../aliexpress-integration/engine.js").AliExpressIntegrationEngine;
  oss1688Integration?: import("../1688-integration/engine.js").Oss1688IntegrationEngine;
  supplierProductSync?: import("../supplier-product-sync/engine.js").SupplierProductSyncEngine;
  supplierInventorySync?: import("../supplier-inventory-sync/engine.js").SupplierInventorySyncEngine;
  supplierPricingEngine?: import("../supplier-pricing-engine/engine.js").SupplierPricingEngine;
  supplierRankingEngine?: import("../supplier-ranking-engine/engine.js").SupplierRankingEngine;
  procurementEngine?: import("../procurement-engine/engine.js").ProcurementEngine;
  fulfilmentOrchestrator?: import("../fulfilment-orchestrator/engine.js").FulfilmentOrchestrator;
  shippingCarrierIntegration?: import("../shipping-carrier-integration/engine.js").ShippingCarrierIntegrationEngine;
  shipmentTrackingEngine?: import("../shipment-tracking-engine/engine.js").ShipmentTrackingEngine;
  returnManagement?: import("../return-management/engine.js").ReturnManagementEngine;
  warehouseIntelligence?: import("../warehouse-intelligence/engine.js").WarehouseIntelligenceEngine;
  multiWarehouseSupport?: import("../multi-warehouse-support/engine.js").MultiWarehouseSupportEngine;
  supplierRiskMonitor?: import("../supplier-risk-monitor/engine.js").SupplierRiskMonitorEngine;
  logisticsOptimization?: import("../logistics-optimization/engine.js").LogisticsOptimizationEngine;
  fulfilmentSlaMonitor?: import("../fulfilment-sla-monitor/engine.js").FulfilmentSlaMonitorEngine;
  procurementIntelligence?: import("../procurement-intelligence/engine.js").ProcurementIntelligenceEngine;
  supplierOperationsCertification?: import("../supplier-operations-certification/engine.js").SupplierOperationsCertificationEngine;
  financialFramework?: import("../financial-framework/engine.js").FinancialFrameworkEngine;
  paymentGatewayIntegration?: import("../payment-gateway-integration/engine.js").PaymentGatewayIntegrationEngine;
  bankingIntegration?: import("../banking-integration/engine.js").BankingIntegrationEngine;
  revenueEngine?: import("../revenue-engine/engine.js").RevenueEngine;
  expenseEngine?: import("../expense-engine/engine.js").ExpenseEngine;
  profitCalculationEngine?: import("../profit-calculation-engine/engine.js").ProfitCalculationEngine;
  cashFlowMonitor?: import("../cash-flow-monitor/engine.js").CashFlowMonitorEngine;
  reconciliationEngine?: import("../reconciliation-engine/engine.js").ReconciliationEngine;
  invoiceGenerator?: import("../invoice-generator/engine.js").InvoiceGeneratorEngine;
  refundEngine?: import("../refund-engine/engine.js").RefundEngine;
  taxIntelligenceEngine?: import("../tax-intelligence-engine/engine.js").TaxIntelligenceEngine;
  multiCurrencyEngine?: import("../multi-currency-engine/engine.js").MultiCurrencyEngine;
  financialForecastEngine?: import("../financial-forecast-engine/engine.js").FinancialForecastEngine;
  budgetManagementEngine?: import("../budget-management-engine/engine.js").BudgetManagementEngine;
  financialRiskMonitor?: import("../financial-risk-monitor/engine.js").FinancialRiskMonitor;
  executiveFinancialDashboard?: import("../executive-financial-dashboard/engine.js").ExecutiveFinancialDashboard;
  accountingExportEngine?: import("../accounting-export-engine/engine.js").AccountingExportEngine;
  financialOperationsCertification?: import("../financial-operations-certification/engine.js").FinancialOperationsCertificationEngine;
  customerIdentityEngine?: import("../customer-identity-engine/engine.js").CustomerIdentityEngine;
  crmFoundation?: import("../crm-foundation/engine.js").CrmFoundationEngine;
  customerTimelineEngine?: import("../customer-timeline-engine/engine.js").CustomerTimelineEngine;
  emailCommunicationEngine?: import("../email-communication-engine/engine.js").EmailCommunicationEngine;
  smsCommunicationEngine?: import("../sms-communication-engine/engine.js").SmsCommunicationEngine;
  whatsAppIntegration?: import("../whatsapp-integration/engine.js").WhatsAppIntegration;
  liveChatIntegration?: import("../live-chat-integration/engine.js").LiveChatIntegration;
  aiCustomerSupport?: import("../ai-customer-support/engine.js").AiCustomerSupport;
  ticketManagementEngine?: import("../ticket-management-engine/engine.js").TicketManagementEngine;
  customerSentimentEngine?: import("../customer-sentiment-engine/engine.js").CustomerSentimentEngine;
  reviewManagementEngine?: import("../review-management-engine/engine.js").ReviewManagementEngine;
  loyaltyProgrammeEngine?: import("../loyalty-programme-engine/engine.js").LoyaltyProgrammeEngine;
  returnsIntelligenceEngine?: import("../returns-intelligence-engine/engine.js").ReturnsIntelligenceEngine;
  customerRiskEngine?: import("../customer-risk-engine/engine.js").CustomerRiskEngine;
  customerLifetimeValueEngine?: import("../customer-lifetime-value-engine/engine.js").CustomerLifetimeValueEngine;
  customerSegmentationEngine?: import("../customer-segmentation-engine/engine.js").CustomerSegmentationEngine;
  customerJourneyIntelligenceEngine?: import("../customer-journey-intelligence-engine/engine.js").CustomerJourneyIntelligenceEngine;
  executiveCustomerDashboard?: import("../executive-customer-dashboard/engine.js").ExecutiveCustomerDashboard;
  customerOperationsCertification?: import("../customer-operations-certification/engine.js").CustomerOperationsCertificationEngine;
  marketingFramework?: import("../marketing-framework/engine.js").MarketingFrameworkEngine;
  metaAdsIntegration?: import("../meta-ads-integration/engine.js").MetaAdsIntegration;
  googleAdsIntegration?: import("../google-ads-integration/engine.js").GoogleAdsIntegration;
  tiktokAdsIntegration?: import("../tiktok-ads-integration/engine.js").TikTokAdsIntegration;
  youtubeAdsIntegration?: import("../youtube-ads-integration/engine.js").YouTubeAdsIntegration;
  seoIntelligenceEngine?: import("../seo-intelligence-engine/engine.js").SeoIntelligenceEngine;
  campaignManager?: import("../campaign-manager/engine.js").CampaignManagerEngine;
  audienceIntelligence?: import("../audience-intelligence/engine.js").AudienceIntelligenceEngine;
  attributionEngine?: import("../attribution-engine/engine.js").AttributionEngine;
  marketingAnalyticsDashboard?: import("../marketing-analytics-dashboard/engine.js").MarketingAnalyticsDashboard;
  creativeAssetManager?: import("../creative-asset-manager/engine.js").CreativeAssetManager;
  aiCampaignGenerator?: import("../ai-campaign-generator/engine.js").AiCampaignGenerator;
  budgetOptimizationEngine?: import("../budget-optimization-engine/engine.js").BudgetOptimizationEngine;
  conversionIntelligence?: import("../conversion-intelligence/engine.js").ConversionIntelligence;
  competitorMarketingMonitor?: import("../competitor-marketing-monitor/engine.js").CompetitorMarketingMonitor;
  viralTrendIntelligence?: import("../viral-trend-intelligence/engine.js").ViralTrendIntelligence;
  marketingExperimentEngine?: import("../marketing-experiment-engine/engine.js").MarketingExperimentEngine;
  crossChannelOrchestrator?: import("../cross-channel-orchestrator/engine.js").CrossChannelOrchestrator;
  autonomousMarketingEngine?: import("../autonomous-marketing-engine/engine.js").AutonomousMarketingEngine;
  realWorldOperationsCertification?: import("../real-world-operations-certification/engine.js").RealWorldOperationsCertificationEngine;
  companyFactoryFramework?: import("../company-factory-framework/engine.js").CompanyFactoryFrameworkEngine;
  businessOpportunityDiscovery?: import("../business-opportunity-discovery/engine.js").BusinessOpportunityDiscovery;
  marketValidationEngine?: import("../market-validation-engine/engine.js").MarketValidationEngine;
  empireCommander?: EmpireCommanderEngine;
  empireOperatingSystem?: EmpireOperatingSystemEngine;
  continuousEvolution?: ContinuousEvolutionEngine;
}

interface SubsystemDescriptor {
  id: SubsystemId;
  label: string;
  missionId: string | null;
  runtimePath: string | null;
  probe: (bundle: PillowSubsystemBundle) => SubsystemHealth;
}

const SUBSYSTEM_DESCRIPTORS: SubsystemDescriptor[] = [
  {
    id: "bootstrap",
    label: "Repository Bootstrap Engine",
    missionId: "PILLOW-002",
    runtimePath: "pillow/src/bootstrap/",
    probe: () => "ready",
  },
  {
    id: "intelligence",
    label: "Repository Intelligence Engine",
    missionId: "PILLOW-003",
    runtimePath: "pillow/src/intelligence/",
    probe: (b) => (b.intelligence.entities.length > 0 ? "ready" : "degraded"),
  },
  {
    id: "context_builder",
    label: "Context Builder",
    missionId: "PILLOW-004",
    runtimePath: "pillow/src/context/",
    probe: () => "ready",
  },
  {
    id: "memory",
    label: "Repository Memory Engine",
    missionId: "PILLOW-005",
    runtimePath: "pillow/src/memory/",
    probe: (b) => {
      try {
        const mem = b.memory.getMemory();
        return mem.status === "ready" ? "ready" : "degraded";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "mission_planner",
    label: "Mission Planner",
    missionId: "PILLOW-006",
    runtimePath: "pillow/src/planner/",
    probe: (b) => {
      try {
        b.planner.getPlan();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "cursor_supervisor",
    label: "Supervisor System",
    missionId: "PILLOW-SV-001",
    runtimePath: "pillow/src/supervisor/",
    probe: (b) => {
      try {
        const s = b.supervisor.getState();
        return s.status === "degraded" || s.status === "blocked" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "recovery_manager",
    label: "Recovery Manager",
    missionId: "PILLOW-008",
    runtimePath: "pillow/src/recovery/",
    probe: (b) => {
      try {
        b.recovery.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "executive_audit_reviewer",
    label: "Executive Audit Reviewer",
    missionId: "PILLOW-009",
    runtimePath: "pillow/src/audit-reviewer/",
    probe: (b) => {
      try {
        b.auditReviewer.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "repository_synchronizer",
    label: "Repository Synchronizer",
    missionId: "PILLOW-010",
    runtimePath: "pillow/src/synchronizer/",
    probe: (b) => {
      try {
        b.synchronizer.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "due_diligence",
    label: "Continuous Due Diligence Engine",
    missionId: "PILLOW-011",
    runtimePath: "pillow/src/due-diligence/",
    probe: (b) => {
      try {
        const s = b.dueDiligence.getState();
        return s.interrupted ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "autonomous_improvement",
    label: "Autonomous Improvement Engine",
    missionId: "PILLOW-012",
    runtimePath: "pillow/src/improvement/",
    probe: (b) => {
      try {
        b.improvement.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "live_repository_watcher",
    label: "Live Repository Watcher",
    missionId: "PILLOW-014",
    runtimePath: "pillow/src/watcher/",
    probe: (b) => {
      if (!b.watcher) return "unavailable";
      try {
        b.watcher.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "grand_king_command_interface",
    label: "Grand King Command Interface",
    missionId: "PILLOW-015",
    runtimePath: "pillow/src/command/",
    probe: (b) => {
      if (!b.command) return "unavailable";
      try {
        b.command.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "objective_engine",
    label: "Objective-Driven Runtime Orchestrator",
    missionId: "PILLOW-019",
    runtimePath: "pillow/src/objective/",
    probe: (b) => {
      if (!b.objective) return "unavailable";
      try {
        b.objective.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "technical_chief",
    label: "Technical Chief",
    missionId: "PILLOW-TC-001",
    runtimePath: "pillow/src/technical-chief/",
    probe: (b) => {
      if (!b.technicalChief) return "unavailable";
      try {
        b.technicalChief.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "ux_designer",
    label: "AI UX Designer",
    missionId: "PILLOW-UX-001",
    runtimePath: "pillow/src/ux-designer/",
    probe: (b) => {
      if (!b.uxDesigner) return "unavailable";
      try {
        b.uxDesigner.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "cursor_bridge",
    label: "Autonomous Cursor Bridge",
    missionId: "PILLOW-CB-001",
    runtimePath: "pillow/src/cursor-bridge/",
    probe: (b) => {
      if (!b.cursorBridge) return "unavailable";
      try {
        b.cursorBridge.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "vision_synchronization",
    label: "Vision Synchronization System",
    missionId: "PILLOW-VS-001",
    runtimePath: "pillow/src/vision-synchronization/",
    probe: (b) => {
      if (!b.visionSynchronization) return "unavailable";
      try {
        const s = b.visionSynchronization.getState();
        return s.status === "degraded" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "context_synchronization",
    label: "Context Synchronization System",
    missionId: "PILLOW-CS-001",
    runtimePath: "pillow/src/context-synchronization/",
    probe: (b) => {
      if (!b.contextSynchronization) return "unavailable";
      try {
        const s = b.contextSynchronization.getState();
        return s.status === "degraded" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "cursor_protocol",
    label: "Cursor Protocol System",
    missionId: "PILLOW-CP-001",
    runtimePath: "pillow/src/cursor-protocol/",
    probe: (b) => {
      if (!b.cursorProtocol) return "unavailable";
      try {
        const s = b.cursorProtocol.getState();
        return s.status === "degraded" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "recovery_doctrine",
    label: "Recovery Doctrine System",
    missionId: "PILLOW-RD-001",
    runtimePath: "pillow/src/recovery-doctrine/",
    probe: (b) => {
      if (!b.recoveryDoctrine) return "unavailable";
      try {
        const s = b.recoveryDoctrine.getState();
        return s.status === "degraded" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "browser_truth",
    label: "Browser Truth System",
    missionId: "PILLOW-BT-001",
    runtimePath: "pillow/src/browser-truth/",
    probe: (b) => {
      if (!b.browserTruth) return "unavailable";
      try {
        const s = b.browserTruth.getState();
        return s.status === "degraded" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "visual_capture",
    label: "Visual Capture Engine",
    missionId: "PILLOW-VCE-001",
    runtimePath: "pillow/src/visual-capture-engine/",
    probe: (b) => {
      if (!b.visualCapture) return "unavailable";
      try {
        const s = b.visualCapture.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "ui_state_mapper",
    label: "UI State Mapper",
    missionId: "PILLOW-USM-001",
    runtimePath: "pillow/src/ui-state-mapper/",
    probe: (b) => {
      if (!b.uiStateMapper) return "unavailable";
      try {
        const s = b.uiStateMapper.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "component_recognition",
    label: "Component Recognition Engine",
    missionId: "PILLOW-CRE-001",
    runtimePath: "pillow/src/component-recognition-engine/",
    probe: (b) => {
      if (!b.componentRecognition) return "unavailable";
      try {
        const s = b.componentRecognition.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "layout_understanding",
    label: "Layout Understanding Engine",
    missionId: "PILLOW-LUE-001",
    runtimePath: "pillow/src/layout-understanding-engine/",
    probe: (b) => {
      if (!b.layoutUnderstanding) return "unavailable";
      try {
        const s = b.layoutUnderstanding.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "navigation_mapping",
    label: "Navigation Mapping Engine",
    missionId: "PILLOW-NME-001",
    runtimePath: "pillow/src/navigation-mapping-engine/",
    probe: (b) => {
      if (!b.navigationMapping) return "unavailable";
      try {
        const s = b.navigationMapping.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "interaction_tracking",
    label: "Interaction Tracking Engine",
    missionId: "PILLOW-ITE-001",
    runtimePath: "pillow/src/interaction-tracking-engine/",
    probe: (b) => {
      if (!b.interactionTracking) return "unavailable";
      try {
        const s = b.interactionTracking.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "context_awareness",
    label: "Context Awareness Engine",
    missionId: "PILLOW-CAE-001",
    runtimePath: "pillow/src/context-awareness-engine/",
    probe: (b) => {
      if (!b.contextAwareness) return "unavailable";
      try {
        const s = b.contextAwareness.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "visual_memory",
    label: "Visual Memory Engine",
    missionId: "PILLOW-VME-001",
    runtimePath: "pillow/src/visual-memory-engine/",
    probe: (b) => {
      if (!b.visualMemory) return "unavailable";
      try {
        const s = b.visualMemory.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "session_continuity",
    label: "Session Continuity Engine",
    missionId: "PILLOW-SCE-001",
    runtimePath: "pillow/src/session-continuity-engine/",
    probe: (b) => {
      if (!b.sessionContinuity) return "unavailable";
      try {
        const s = b.sessionContinuity.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "visual_foundation_certification",
    label: "Visual Foundation Certification",
    missionId: "PILLOW-VFC-001",
    runtimePath: "pillow/src/visual-foundation-certification-engine/",
    probe: (b) => {
      if (!b.visualFoundationCertification) return "unavailable";
      try {
        const s = b.visualFoundationCertification.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "ux_rule_engine",
    label: "UX Rule Engine",
    missionId: "PILLOW-URE-001",
    runtimePath: "pillow/src/ux-rule-engine/",
    probe: (b) => {
      if (!b.uxRuleEngine) return "unavailable";
      try {
        const s = b.uxRuleEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "design_system_intelligence",
    label: "Design System Intelligence",
    missionId: "PILLOW-DSI-001",
    runtimePath: "pillow/src/design-system-intelligence-engine/",
    probe: (b) => {
      if (!b.designSystemIntelligence) return "unavailable";
      try {
        const s = b.designSystemIntelligence.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "executive_style_learning",
    label: "Executive Style Learning",
    missionId: "PILLOW-ESL-001",
    runtimePath: "pillow/src/executive-style-learning-engine/",
    probe: (b) => {
      if (!b.executiveStyleLearning) return "unavailable";
      try {
        const s = b.executiveStyleLearning.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "layout_evaluation",
    label: "Layout Evaluation",
    missionId: "PILLOW-LEV-001",
    runtimePath: "pillow/src/layout-evaluation-engine/",
    probe: (b) => {
      if (!b.layoutEvaluation) return "unavailable";
      try {
        const s = b.layoutEvaluation.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "workflow_optimization",
    label: "Workflow Optimization",
    missionId: "PILLOW-WFO-001",
    runtimePath: "pillow/src/workflow-optimization-engine/",
    probe: (b) => {
      if (!b.workflowOptimization) return "unavailable";
      try {
        const s = b.workflowOptimization.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "accessibility_intelligence",
    label: "Accessibility Intelligence",
    missionId: "PILLOW-AII-001",
    runtimePath: "pillow/src/accessibility-intelligence-engine/",
    probe: (b) => {
      if (!b.accessibilityIntelligence) return "unavailable";
      try {
        const s = b.accessibilityIntelligence.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "visual_consistency",
    label: "Visual Consistency",
    missionId: "PILLOW-VCE-001",
    runtimePath: "pillow/src/visual-consistency-engine/",
    probe: (b) => {
      if (!b.visualConsistency) return "unavailable";
      try {
        const s = b.visualConsistency.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "ux_scoring",
    label: "UX Scoring",
    missionId: "PILLOW-UXS-001",
    runtimePath: "pillow/src/ux-scoring-engine/",
    probe: (b) => {
      if (!b.uxScoring) return "unavailable";
      try {
        const s = b.uxScoring.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "recommendation_engine",
    label: "Recommendation Engine",
    missionId: "PILLOW-REC-001",
    runtimePath: "pillow/src/recommendation-engine/",
    probe: (b) => {
      if (!b.recommendationEngine) return "unavailable";
      try {
        const s = b.recommendationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "ux_intelligence_certification",
    label: "UX Intelligence Certification",
    missionId: "PILLOW-UIC-001",
    runtimePath: "pillow/src/ux-intelligence-certification-engine/",
    probe: (b) => {
      if (!b.uxIntelligenceCertification) return "unavailable";
      try {
        const s = b.uxIntelligenceCertification.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "frontend_builder",
    label: "Frontend Builder",
    missionId: "PILLOW-FB-001",
    runtimePath: "pillow/src/frontend-builder/",
    probe: (b) => {
      if (!b.frontendBuilder) return "unavailable";
      try {
        const s = b.frontendBuilder.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "component_generator",
    label: "Component Generator",
    missionId: "PILLOW-CG-001",
    runtimePath: "pillow/src/component-generator/",
    probe: (b) => {
      if (!b.componentGenerator) return "unavailable";
      try {
        const s = b.componentGenerator.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "layout_refactoring",
    label: "Layout Refactoring",
    missionId: "PILLOW-LR-001",
    runtimePath: "pillow/src/layout-refactoring/",
    probe: (b) => {
      if (!b.layoutRefactoring) return "unavailable";
      try {
        const s = b.layoutRefactoring.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "theme_builder",
    label: "Theme Builder",
    missionId: "PILLOW-TB-001",
    runtimePath: "pillow/src/theme-builder/",
    probe: (b) => {
      if (!b.themeBuilder) return "unavailable";
      try {
        const s = b.themeBuilder.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "preview_generator",
    label: "Preview Generator",
    missionId: "PILLOW-PG-001",
    runtimePath: "pillow/src/preview-generator/",
    probe: (b) => {
      if (!b.previewGenerator) return "unavailable";
      try {
        const s = b.previewGenerator.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "validation_engine",
    label: "Validation Engine",
    missionId: "PILLOW-VE-001",
    runtimePath: "pillow/src/validation-engine/",
    probe: (b) => {
      if (!b.validationEngine) return "unavailable";
      try {
        const s = b.validationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "regression_protection",
    label: "Regression Protection",
    missionId: "PILLOW-RP-001",
    runtimePath: "pillow/src/regression-protection/",
    probe: (b) => {
      if (!b.regressionProtection) return "unavailable";
      try {
        const s = b.regressionProtection.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "rollback_manager",
    label: "Rollback Manager",
    missionId: "PILLOW-RM-001",
    runtimePath: "pillow/src/rollback-manager/",
    probe: (b) => {
      if (!b.rollbackManager) return "unavailable";
      try {
        const s = b.rollbackManager.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "change_documentation",
    label: "Change Documentation",
    missionId: "PILLOW-CD-001",
    runtimePath: "pillow/src/change-documentation/",
    probe: (b) => {
      if (!b.changeDocumentation) return "unavailable";
      try {
        const s = b.changeDocumentation.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "autonomous_builder_certification",
    label: "Autonomous Builder Certification",
    missionId: "PILLOW-ABC-001",
    runtimePath: "pillow/src/autonomous-builder-certification-engine/",
    probe: (b) => {
      if (!b.autonomousBuilderCertification) return "unavailable";
      try {
        const s = b.autonomousBuilderCertification.getState();
        return s.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "natural_ux_conversation",
    label: "Natural UX Conversation",
    missionId: "PILLOW-NUC-001",
    runtimePath: "pillow/src/natural-ux-conversation/",
    probe: (b) => {
      if (!b.naturalUxConversation) return "unavailable";
      try {
        const s = b.naturalUxConversation.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "voice_ux_commands",
    label: "Voice UX Commands",
    missionId: "PILLOW-VUC-001",
    runtimePath: "pillow/src/voice-ux-commands/",
    probe: (b) => {
      if (!b.voiceUxCommands) return "unavailable";
      try {
        const s = b.voiceUxCommands.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "screen_annotation",
    label: "Screen Annotation",
    missionId: "PILLOW-SA-001",
    runtimePath: "pillow/src/screen-annotation/",
    probe: (b) => {
      if (!b.screenAnnotation) return "unavailable";
      try {
        const s = b.screenAnnotation.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "multi_proposal_generator",
    label: "Multi-Proposal Generator",
    missionId: "PILLOW-MPG-001",
    runtimePath: "pillow/src/multi-proposal-generator/",
    probe: (b) => {
      if (!b.multiProposalGenerator) return "unavailable";
      try {
        const s = b.multiProposalGenerator.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "side_by_side_comparison",
    label: "Side-by-Side Comparison",
    missionId: "PILLOW-SBC-001",
    runtimePath: "pillow/src/side-by-side-comparison/",
    probe: (b) => {
      if (!b.sideBySideComparison) return "unavailable";
      try {
        const s = b.sideBySideComparison.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "explain_decisions",
    label: "Explain Decisions",
    missionId: "PILLOW-ED-001",
    runtimePath: "pillow/src/explain-decisions/",
    probe: (b) => {
      if (!b.explainDecisions) return "unavailable";
      try {
        const s = b.explainDecisions.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "approval_workflow",
    label: "Approval Workflow",
    missionId: "PILLOW-AW-001",
    runtimePath: "pillow/src/approval-workflow/",
    probe: (b) => {
      if (!b.approvalWorkflow) return "unavailable";
      try {
        const s = b.approvalWorkflow.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "preference_learning",
    label: "Preference Learning",
    missionId: "PILLOW-PL-001",
    runtimePath: "pillow/src/preference-learning/",
    probe: (b) => {
      if (!b.preferenceLearning) return "unavailable";
      try {
        const s = b.preferenceLearning.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "continuous_collaboration",
    label: "Continuous Collaboration",
    missionId: "PILLOW-CC-001",
    runtimePath: "pillow/src/continuous-collaboration/",
    probe: (b) => {
      if (!b.continuousCollaboration) return "unavailable";
      try {
        const s = b.continuousCollaboration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "executive_collaboration_certification",
    label: "Executive Collaboration Certification",
    missionId: "PILLOW-EXC-001",
    runtimePath: "pillow/src/executive-collaboration-certification-engine/",
    probe: (b) => {
      if (!b.executiveCollaborationCertification) return "unavailable";
      try {
        const s = b.executiveCollaborationCertification.getState();
        return s.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "continuous_screen_observation",
    label: "Continuous Screen Observation",
    missionId: "PILLOW-CSO-001",
    runtimePath: "pillow/src/continuous-screen-observation-engine/",
    probe: (b) => {
      if (!b.continuousScreenObservation) return "unavailable";
      try {
        const s = b.continuousScreenObservation.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "autonomous_ux_audit",
    label: "Autonomous UX Audit",
    missionId: "PILLOW-AUA-001",
    runtimePath: "pillow/src/autonomous-ux-audit-engine/",
    probe: (b) => {
      if (!b.autonomousUxAudit) return "unavailable";
      try {
        const s = b.autonomousUxAudit.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "ux_opportunity_discovery",
    label: "UX Opportunity Discovery",
    missionId: "PILLOW-UOD-001",
    runtimePath: "pillow/src/ux-opportunity-discovery-engine/",
    probe: (b) => {
      if (!b.uxOpportunityDiscovery) return "unavailable";
      try {
        const s = b.uxOpportunityDiscovery.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "productivity_intelligence",
    label: "Productivity Intelligence",
    missionId: "PILLOW-PIE-001",
    runtimePath: "pillow/src/productivity-intelligence-engine/",
    probe: (b) => {
      if (!b.productivityIntelligence) return "unavailable";
      try {
        const s = b.productivityIntelligence.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "workflow_evolution",
    label: "Workflow Evolution",
    missionId: "PILLOW-WFE-001",
    runtimePath: "pillow/src/workflow-evolution-engine/",
    probe: (b) => {
      if (!b.workflowEvolution) return "unavailable";
      try {
        const s = b.workflowEvolution.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "adaptive_interface",
    label: "Adaptive Interface",
    missionId: "PILLOW-AIE-001",
    runtimePath: "pillow/src/adaptive-interface-engine/",
    probe: (b) => {
      if (!b.adaptiveInterface) return "unavailable";
      try {
        const s = b.adaptiveInterface.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "continuous_ux_evolution",
    label: "Continuous UX Evolution",
    missionId: "PILLOW-CUE-001",
    runtimePath: "pillow/src/continuous-ux-evolution-engine/",
    probe: (b) => {
      if (!b.continuousUxEvolution) return "unavailable";
      try {
        const s = b.continuousUxEvolution.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "executive_workspace_intelligence",
    label: "Executive Workspace Intelligence",
    missionId: "PILLOW-EWI-001",
    runtimePath: "pillow/src/executive-workspace-intelligence-engine/",
    probe: (b) => {
      if (!b.executiveWorkspaceIntelligence) return "unavailable";
      try {
        const s = b.executiveWorkspaceIntelligence.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "self_improving_ux",
    label: "Self-Improving UX Engine",
    missionId: "PILLOW-SIUX-001",
    runtimePath: "pillow/src/self-improving-ux-engine/",
    probe: (b) => {
      if (!b.selfImprovingUx) return "unavailable";
      try {
        const s = b.selfImprovingUx.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "visual_intelligence_certification",
    label: "Visual Intelligence Certification",
    missionId: "PILLOW-VIC-001",
    runtimePath: "pillow/src/visual-intelligence-certification-engine/",
    probe: (b) => {
      if (!b.visualIntelligenceCertification) return "unavailable";
      try {
        const s = b.visualIntelligenceCertification.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "e2e_testing",
    label: "End-to-End Testing Architecture",
    missionId: "PILLOW-E2E-001",
    runtimePath: "pillow/src/e2e-testing/",
    probe: (b) => {
      if (!b.e2eTesting) return "unavailable";
      try {
        const s = b.e2eTesting.getState();
        return s.status === "degraded" || s.status === "blocked" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "journey_system",
    label: "Journey System",
    missionId: "PILLOW-JR-001",
    runtimePath: "pillow/src/journey-system/",
    probe: (b) => {
      if (!b.journeySystem) return "unavailable";
      try {
        const s = b.journeySystem.getState();
        return s.status === "degraded" || s.status === "blocked" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "brain_runtime",
    label: "Brain Runtime System",
    missionId: "PILLOW-BR-001",
    runtimePath: "pillow/src/brain-runtime/",
    probe: (b) => {
      if (!b.brainRuntime) return "unavailable";
      try {
        const s = b.brainRuntime.getState();
        return s.status === "degraded" || s.status === "blocked" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "production_mode",
    label: "Production Mode Doctrine",
    missionId: "PILLOW-PM-001",
    runtimePath: "pillow/src/production-mode/",
    probe: (b) => {
      if (!b.productionMode) return "unavailable";
      try {
        const s = b.productionMode.getState();
        return s.status === "degraded" || s.status === "blocked" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "durable_sessions",
    label: "Durable Session Architecture",
    missionId: "PILLOW-DS-001",
    runtimePath: "pillow/src/durable-sessions/",
    probe: (b) => {
      if (!b.durableSessions) return "unavailable";
      try {
        const s = b.durableSessions.getState();
        return s.status === "degraded" || s.status === "blocked" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "guardian_monitoring",
    label: "Guardian Monitoring System",
    missionId: "PILLOW-GM-001",
    runtimePath: "pillow/src/guardian-monitoring/",
    probe: (b) => {
      if (!b.guardianMonitoring) return "unavailable";
      try {
        const s = b.guardianMonitoring.getState();
        return s.status === "degraded" || s.status === "blocked" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "scaling_architecture",
    label: "Scaling Architecture",
    missionId: "PILLOW-SCL-001",
    runtimePath: "pillow/src/scaling-architecture/",
    probe: (b) => {
      if (!b.scalingArchitecture) return "unavailable";
      try {
        const s = b.scalingArchitecture.getState();
        return s.status === "degraded" || s.status === "blocked" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "performance_governance",
    label: "Performance Governance",
    missionId: "PILLOW-PG-001",
    runtimePath: "pillow/src/performance-governance/",
    probe: (b) => {
      if (!b.performanceGovernance) return "unavailable";
      try {
        const s = b.performanceGovernance.getState();
        return s.status === "degraded" || s.status === "blocked" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "execution_control_center",
    label: "Execution Control Center",
    missionId: "PILLOW-ECC-001",
    runtimePath: "pillow/src/execution-control-center/",
    probe: (b) => {
      if (!b.executionControlCenter) return "unavailable";
      try {
        const s = b.executionControlCenter.getState();
        return s.status === "degraded" || s.status === "blocked" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "vision_integrity_engine",
    label: "Vision Integrity Engine",
    missionId: "PILLOW-VIE-001",
    runtimePath: "pillow/src/vision-integrity-engine/",
    probe: (b) => {
      if (!b.visionIntegrity) return "unavailable";
      try {
        const s = b.visionIntegrity.getState();
        return s.status === "degraded" || s.status === "blocked" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "builder_monitor",
    label: "Builder Monitor",
    missionId: "PILLOW-BM-001",
    runtimePath: "pillow/src/builder-monitor/",
    probe: (b) => {
      if (!b.builderMonitor) return "unavailable";
      try {
        const s = b.builderMonitor.getState();
        return s.status === "degraded" || s.status === "blocked" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "eta_engine",
    label: "ETA Engine",
    missionId: "PILLOW-ETA-001",
    runtimePath: "pillow/src/eta-engine/",
    probe: (b) => {
      if (!b.etaEngine) return "unavailable";
      try {
        const s = b.etaEngine.getState();
        return s.status === "degraded" || s.status === "blocked" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "autonomous_recovery_engine",
    label: "Autonomous Recovery Engine",
    missionId: "PILLOW-ARE-001",
    runtimePath: "pillow/src/autonomous-recovery-engine/",
    probe: (b) => {
      if (!b.autonomousRecoveryEngine) return "unavailable";
      try {
        const s = b.autonomousRecoveryEngine.getState();
        return s.status === "degraded" || s.status === "blocked" || s.status === "recovering"
          ? "degraded"
          : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "zero_human_automation",
    label: "Zero-Human Automation",
    missionId: "PILLOW-ZHA-001",
    runtimePath: "pillow/src/zero-human-automation/",
    probe: (b) => {
      if (!b.zeroHumanAutomationEngine) return "unavailable";
      try {
        const s = b.zeroHumanAutomationEngine.getState();
        return s.status === "degraded" || s.status === "blocked" || s.status === "stopped"
          ? "degraded"
          : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "founder_shell",
    label: "Founder Shell",
    missionId: "PILLOW-FS-001",
    runtimePath: "pillow/src/founder-shell/",
    probe: (b) => {
      if (!b.founderShellEngine) return "unavailable";
      try {
        const s = b.founderShellEngine.getState();
        return s.status === "degraded" || s.status === "blocked" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "infrastructure_commander",
    label: "Infrastructure Commander",
    missionId: "PILLOW-IC-001",
    runtimePath: "pillow/src/infrastructure-commander/",
    probe: (b) => {
      if (!b.infrastructureCommander) return "unavailable";
      try {
        b.infrastructureCommander.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "commerce_intelligence",
    label: "Commerce Intelligence Executive",
    missionId: "PILLOW-CI-001",
    runtimePath: "pillow/src/commerce-intelligence/",
    probe: (b) => {
      if (!b.commerceIntelligence) return "unavailable";
      try {
        b.commerceIntelligence.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "marketplace_connector_framework",
    label: "Marketplace Connector Framework",
    missionId: "PILLOW-MCF-001",
    runtimePath: "pillow/src/marketplace-connector-framework/",
    probe: (b) => {
      if (!b.marketplaceConnectorFramework) return "unavailable";
      try {
        const s = b.marketplaceConnectorFramework.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "amazon_marketplace_integration",
    label: "Amazon Marketplace Integration",
    missionId: "PILLOW-AMZ-001",
    runtimePath: "pillow/src/amazon-marketplace-integration/",
    probe: (b) => {
      if (!b.amazonMarketplaceIntegration) return "unavailable";
      try {
        const s = b.amazonMarketplaceIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "amazon_product_intelligence",
    label: "Amazon Product Intelligence",
    missionId: "PILLOW-AMZPI-001",
    runtimePath: "pillow/src/amazon-product-intelligence/",
    probe: (b) => {
      if (!b.amazonProductIntelligence) return "unavailable";
      try {
        const s = b.amazonProductIntelligence.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "amazon_order_management",
    label: "Amazon Order Management",
    missionId: "PILLOW-AMZO-001",
    runtimePath: "pillow/src/amazon-order-management/",
    probe: (b) => {
      if (!b.amazonOrderManagement) return "unavailable";
      try {
        const s = b.amazonOrderManagement.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "amazon_inventory_sync",
    label: "Amazon Inventory Sync",
    missionId: "PILLOW-AMZINV-001",
    runtimePath: "pillow/src/amazon-inventory-sync/",
    probe: (b) => {
      if (!b.amazonInventorySync) return "unavailable";
      try {
        const s = b.amazonInventorySync.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "walmart_marketplace_integration",
    label: "Walmart Marketplace Integration",
    missionId: "PILLOW-WMT-001",
    runtimePath: "pillow/src/walmart-marketplace-integration/",
    probe: (b) => {
      if (!b.walmartMarketplaceIntegration) return "unavailable";
      try {
        const s = b.walmartMarketplaceIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "etsy_marketplace_integration",
    label: "Etsy Marketplace Integration",
    missionId: "PILLOW-ETSY-001",
    runtimePath: "pillow/src/etsy-marketplace-integration/",
    probe: (b) => {
      if (!b.etsyMarketplaceIntegration) return "unavailable";
      try {
        const s = b.etsyMarketplaceIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "ebay_marketplace_integration",
    label: "eBay Marketplace Integration",
    missionId: "PILLOW-EBAY-001",
    runtimePath: "pillow/src/ebay-marketplace-integration/",
    probe: (b) => {
      if (!b.ebayMarketplaceIntegration) return "unavailable";
      try {
        const s = b.ebayMarketplaceIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "tiktok_shop_marketplace_integration",
    label: "TikTok Shop Marketplace Integration",
    missionId: "PILLOW-TTS-001",
    runtimePath: "pillow/src/tiktok-shop-marketplace-integration/",
    probe: (b) => {
      if (!b.tiktokShopMarketplaceIntegration) return "unavailable";
      try {
        const s = b.tiktokShopMarketplaceIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "shopify_store_marketplace_integration",
    label: "Shopify Store Marketplace Integration",
    missionId: "PILLOW-SHF-001",
    runtimePath: "pillow/src/shopify-store-marketplace-integration/",
    probe: (b) => {
      if (!b.shopifyStoreMarketplaceIntegration) return "unavailable";
      try {
        const s = b.shopifyStoreMarketplaceIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "woocommerce_marketplace_integration",
    label: "WooCommerce Marketplace Integration",
    missionId: "PILLOW-WOO-001",
    runtimePath: "pillow/src/woocommerce-marketplace-integration/",
    probe: (b) => {
      if (!b.woocommerceMarketplaceIntegration) return "unavailable";
      try {
        const s = b.woocommerceMarketplaceIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "marketplace_product_normalization",
    label: "Marketplace Product Normalization",
    missionId: "PILLOW-MPN-001",
    runtimePath: "pillow/src/marketplace-product-normalization/",
    probe: (b) => {
      if (!b.marketplaceProductNormalization) return "unavailable";
      try {
        const s = b.marketplaceProductNormalization.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "marketplace_order_normalization",
    label: "Marketplace Order Normalization",
    missionId: "PILLOW-MON-001",
    runtimePath: "pillow/src/marketplace-order-normalization/",
    probe: (b) => {
      if (!b.marketplaceOrderNormalization) return "unavailable";
      try {
        const s = b.marketplaceOrderNormalization.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "marketplace_health_monitor",
    label: "Marketplace Health Monitor",
    missionId: "PILLOW-MHM-001",
    runtimePath: "pillow/src/marketplace-health-monitor/",
    probe: (b) => {
      if (!b.marketplaceHealthMonitor) return "unavailable";
      try {
        const s = b.marketplaceHealthMonitor.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "marketplace_certification",
    label: "Marketplace Certification",
    missionId: "PILLOW-MCT-001",
    runtimePath: "pillow/src/marketplace-certification/",
    probe: (b) => {
      if (!b.marketplaceCertification) return "unavailable";
      try {
        const s = b.marketplaceCertification.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "supplier_framework",
    label: "Supplier Framework",
    missionId: "PILLOW-SF-001",
    runtimePath: "pillow/src/supplier-framework/",
    probe: (b) => {
      if (!b.supplierFramework) return "unavailable";
      try {
        const s = b.supplierFramework.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "cj_dropshipping_integration",
    label: "CJdropshipping Integration",
    missionId: "PILLOW-CJ-001",
    runtimePath: "pillow/src/cj-dropshipping-integration/",
    probe: (b) => {
      if (!b.cjDropshippingIntegration) return "unavailable";
      try {
        const s = b.cjDropshippingIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "aliexpress_integration",
    label: "AliExpress Integration",
    missionId: "PILLOW-AEX-001",
    runtimePath: "pillow/src/aliexpress-integration/",
    probe: (b) => {
      if (!b.aliExpressIntegration) return "unavailable";
      try {
        const s = b.aliExpressIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "oss1688_integration",
    label: "1688 Integration",
    missionId: "PILLOW-1688-001",
    runtimePath: "pillow/src/1688-integration/",
    probe: (b) => {
      if (!b.oss1688Integration) return "unavailable";
      try {
        const s = b.oss1688Integration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "supplier_product_sync",
    label: "Supplier Product Sync",
    missionId: "PILLOW-SPS-001",
    runtimePath: "pillow/src/supplier-product-sync/",
    probe: (b) => {
      if (!b.supplierProductSync) return "unavailable";
      try {
        const s = b.supplierProductSync.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "supplier_inventory_sync",
    label: "Supplier Inventory Sync",
    missionId: "PILLOW-SIS-001",
    runtimePath: "pillow/src/supplier-inventory-sync/",
    probe: (b) => {
      if (!b.supplierInventorySync) return "unavailable";
      try {
        const s = b.supplierInventorySync.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "supplier_pricing_engine",
    label: "Supplier Pricing Engine",
    missionId: "PILLOW-SPE-001",
    runtimePath: "pillow/src/supplier-pricing-engine/",
    probe: (b) => {
      if (!b.supplierPricingEngine) return "unavailable";
      try {
        const s = b.supplierPricingEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "supplier_ranking_engine",
    label: "Supplier Ranking Engine",
    missionId: "PILLOW-SRE-001",
    runtimePath: "pillow/src/supplier-ranking-engine/",
    probe: (b) => {
      if (!b.supplierRankingEngine) return "unavailable";
      try {
        const s = b.supplierRankingEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "procurement_engine",
    label: "Procurement Engine",
    missionId: "PILLOW-PCE-001",
    runtimePath: "pillow/src/procurement-engine/",
    probe: (b) => {
      if (!b.procurementEngine) return "unavailable";
      try {
        const s = b.procurementEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "fulfilment_orchestrator",
    label: "Fulfilment Orchestrator",
    missionId: "PILLOW-FO-001",
    runtimePath: "pillow/src/fulfilment-orchestrator/",
    probe: (b) => {
      if (!b.fulfilmentOrchestrator) return "unavailable";
      try {
        const s = b.fulfilmentOrchestrator.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "shipping_carrier_integration",
    label: "Shipping Carrier Integration",
    missionId: "PILLOW-SCI-001",
    runtimePath: "pillow/src/shipping-carrier-integration/",
    probe: (b) => {
      if (!b.shippingCarrierIntegration) return "unavailable";
      try {
        const s = b.shippingCarrierIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "shipment_tracking_engine",
    label: "Shipment Tracking Engine",
    missionId: "PILLOW-STE-001",
    runtimePath: "pillow/src/shipment-tracking-engine/",
    probe: (b) => {
      if (!b.shipmentTrackingEngine) return "unavailable";
      try {
        const s = b.shipmentTrackingEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "return_management",
    label: "Return Management",
    missionId: "PILLOW-RM-001",
    runtimePath: "pillow/src/return-management/",
    probe: (b) => {
      if (!b.returnManagement) return "unavailable";
      try {
        const s = b.returnManagement.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "warehouse_intelligence",
    label: "Warehouse Intelligence",
    missionId: "PILLOW-WI-001",
    runtimePath: "pillow/src/warehouse-intelligence/",
    probe: (b) => {
      if (!b.warehouseIntelligence) return "unavailable";
      try {
        const s = b.warehouseIntelligence.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "multi_warehouse_support",
    label: "Multi-Warehouse Support",
    missionId: "PILLOW-MWS-001",
    runtimePath: "pillow/src/multi-warehouse-support/",
    probe: (b) => {
      if (!b.multiWarehouseSupport) return "unavailable";
      try {
        const s = b.multiWarehouseSupport.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "supplier_risk_monitor",
    label: "Supplier Risk Monitor",
    missionId: "PILLOW-SRM-001",
    runtimePath: "pillow/src/supplier-risk-monitor/",
    probe: (b) => {
      if (!b.supplierRiskMonitor) return "unavailable";
      try {
        const s = b.supplierRiskMonitor.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "logistics_optimization",
    label: "Logistics Optimization",
    missionId: "PILLOW-LO-001",
    runtimePath: "pillow/src/logistics-optimization/",
    probe: (b) => {
      if (!b.logisticsOptimization) return "unavailable";
      try {
        const s = b.logisticsOptimization.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "fulfilment_sla_monitor",
    label: "Fulfilment SLA Monitor",
    missionId: "PILLOW-FSM-001",
    runtimePath: "pillow/src/fulfilment-sla-monitor/",
    probe: (b) => {
      if (!b.fulfilmentSlaMonitor) return "unavailable";
      try {
        const s = b.fulfilmentSlaMonitor.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "procurement_intelligence",
    label: "Procurement Intelligence",
    missionId: "PILLOW-PI-001",
    runtimePath: "pillow/src/procurement-intelligence/",
    probe: (b) => {
      if (!b.procurementIntelligence) return "unavailable";
      try {
        const s = b.procurementIntelligence.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "supplier_operations_certification",
    label: "Supplier Operations Certification",
    missionId: "PILLOW-SOC-001",
    runtimePath: "pillow/src/supplier-operations-certification/",
    probe: (b) => {
      if (!b.supplierOperationsCertification) return "unavailable";
      try {
        const s = b.supplierOperationsCertification.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "financial_framework",
    label: "Financial Framework",
    missionId: "PILLOW-FF-001",
    runtimePath: "pillow/src/financial-framework/",
    probe: (b) => {
      if (!b.financialFramework) return "unavailable";
      try {
        const s = b.financialFramework.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "payment_gateway_integration",
    label: "Payment Gateway Integration",
    missionId: "PILLOW-PG-001",
    runtimePath: "pillow/src/payment-gateway-integration/",
    probe: (b) => {
      if (!b.paymentGatewayIntegration) return "unavailable";
      try {
        const s = b.paymentGatewayIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "banking_integration",
    label: "Banking Integration",
    missionId: "PILLOW-BI-001",
    runtimePath: "pillow/src/banking-integration/",
    probe: (b) => {
      if (!b.bankingIntegration) return "unavailable";
      try {
        const s = b.bankingIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "revenue_engine",
    label: "Revenue Engine",
    missionId: "PILLOW-RE-001",
    runtimePath: "pillow/src/revenue-engine/",
    probe: (b) => {
      if (!b.revenueEngine) return "unavailable";
      try {
        const s = b.revenueEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "expense_engine",
    label: "Expense Engine",
    missionId: "PILLOW-EX-001",
    runtimePath: "pillow/src/expense-engine/",
    probe: (b) => {
      if (!b.expenseEngine) return "unavailable";
      try {
        const s = b.expenseEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "profit_calculation_engine",
    label: "Profit Calculation Engine",
    missionId: "PILLOW-PC-001",
    runtimePath: "pillow/src/profit-calculation-engine/",
    probe: (b) => {
      if (!b.profitCalculationEngine) return "unavailable";
      try {
        const s = b.profitCalculationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "cash_flow_monitor",
    label: "Cash Flow Monitor",
    missionId: "PILLOW-CF-001",
    runtimePath: "pillow/src/cash-flow-monitor/",
    probe: (b) => {
      if (!b.cashFlowMonitor) return "unavailable";
      try {
        const s = b.cashFlowMonitor.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "reconciliation_engine",
    label: "Reconciliation Engine",
    missionId: "PILLOW-RC-001",
    runtimePath: "pillow/src/reconciliation-engine/",
    probe: (b) => {
      if (!b.reconciliationEngine) return "unavailable";
      try {
        const s = b.reconciliationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "invoice_generator",
    label: "Invoice Generator",
    missionId: "PILLOW-IG-001",
    runtimePath: "pillow/src/invoice-generator/",
    probe: (b) => {
      if (!b.invoiceGenerator) return "unavailable";
      try {
        const s = b.invoiceGenerator.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "refund_engine",
    label: "Refund Engine",
    missionId: "PILLOW-RF-001",
    runtimePath: "pillow/src/refund-engine/",
    probe: (b) => {
      if (!b.refundEngine) return "unavailable";
      try {
        const s = b.refundEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "tax_intelligence_engine",
    label: "Tax Intelligence Engine",
    missionId: "PILLOW-TX-001",
    runtimePath: "pillow/src/tax-intelligence-engine/",
    probe: (b) => {
      if (!b.taxIntelligenceEngine) return "unavailable";
      try {
        const s = b.taxIntelligenceEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "multi_currency_engine",
    label: "Multi-Currency Engine",
    missionId: "PILLOW-MC-001",
    runtimePath: "pillow/src/multi-currency-engine/",
    probe: (b) => {
      if (!b.multiCurrencyEngine) return "unavailable";
      try {
        const s = b.multiCurrencyEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "financial_forecast_engine",
    label: "Financial Forecast Engine",
    missionId: "PILLOW-FCT-001",
    runtimePath: "pillow/src/financial-forecast-engine/",
    probe: (b) => {
      if (!b.financialForecastEngine) return "unavailable";
      try {
        const s = b.financialForecastEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "budget_management_engine",
    label: "Budget Management Engine",
    missionId: "PILLOW-BMG-001",
    runtimePath: "pillow/src/budget-management-engine/",
    probe: (b) => {
      if (!b.budgetManagementEngine) return "unavailable";
      try {
        const s = b.budgetManagementEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "financial_risk_monitor",
    label: "Financial Risk Monitor",
    missionId: "PILLOW-FRM-001",
    runtimePath: "pillow/src/financial-risk-monitor/",
    probe: (b) => {
      if (!b.financialRiskMonitor) return "unavailable";
      try {
        const s = b.financialRiskMonitor.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "executive_financial_dashboard",
    label: "Executive Financial Dashboard",
    missionId: "PILLOW-EFD-001",
    runtimePath: "pillow/src/executive-financial-dashboard/",
    probe: (b) => {
      if (!b.executiveFinancialDashboard) return "unavailable";
      try {
        const s = b.executiveFinancialDashboard.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "accounting_export_engine",
    label: "Accounting Export Engine",
    missionId: "PILLOW-AEE-001",
    runtimePath: "pillow/src/accounting-export-engine/",
    probe: (b) => {
      if (!b.accountingExportEngine) return "unavailable";
      try {
        const s = b.accountingExportEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "financial_operations_certification",
    label: "Financial Operations Certification",
    missionId: "PILLOW-FOC-001",
    runtimePath: "pillow/src/financial-operations-certification/",
    probe: (b) => {
      if (!b.financialOperationsCertification) return "unavailable";
      try {
        const s = b.financialOperationsCertification.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "customer_identity_engine",
    label: "Customer Identity Engine",
    missionId: "PILLOW-CIE-001",
    runtimePath: "pillow/src/customer-identity-engine/",
    probe: (b) => {
      if (!b.customerIdentityEngine) return "unavailable";
      try {
        const s = b.customerIdentityEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "crm_foundation",
    label: "CRM Foundation",
    missionId: "PILLOW-CRM-001",
    runtimePath: "pillow/src/crm-foundation/",
    probe: (b) => {
      if (!b.crmFoundation) return "unavailable";
      try {
        const s = b.crmFoundation.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "customer_timeline_engine",
    label: "Customer Timeline Engine",
    missionId: "PILLOW-CTE-001",
    runtimePath: "pillow/src/customer-timeline-engine/",
    probe: (b) => {
      if (!b.customerTimelineEngine) return "unavailable";
      try {
        const s = b.customerTimelineEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "email_communication_engine",
    label: "Email Communication Engine",
    missionId: "PILLOW-ECE-001",
    runtimePath: "pillow/src/email-communication-engine/",
    probe: (b) => {
      if (!b.emailCommunicationEngine) return "unavailable";
      try {
        const s = b.emailCommunicationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "sms_communication_engine",
    label: "SMS Communication Engine",
    missionId: "PILLOW-SCE-001",
    runtimePath: "pillow/src/sms-communication-engine/",
    probe: (b) => {
      if (!b.smsCommunicationEngine) return "unavailable";
      try {
        const s = b.smsCommunicationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "whatsapp_integration",
    label: "WhatsApp Integration",
    missionId: "PILLOW-WAI-001",
    runtimePath: "pillow/src/whatsapp-integration/",
    probe: (b) => {
      if (!b.whatsAppIntegration) return "unavailable";
      try {
        const s = b.whatsAppIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "live_chat_integration",
    label: "Live Chat Integration",
    missionId: "PILLOW-LCI-001",
    runtimePath: "pillow/src/live-chat-integration/",
    probe: (b) => {
      if (!b.liveChatIntegration) return "unavailable";
      try {
        const s = b.liveChatIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "ai_customer_support",
    label: "AI Customer Support",
    missionId: "PILLOW-ACS-001",
    runtimePath: "pillow/src/ai-customer-support/",
    probe: (b) => {
      if (!b.aiCustomerSupport) return "unavailable";
      try {
        const s = b.aiCustomerSupport.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "ticket_management_engine",
    label: "Ticket Management Engine",
    missionId: "PILLOW-TME-001",
    runtimePath: "pillow/src/ticket-management-engine/",
    probe: (b) => {
      if (!b.ticketManagementEngine) return "unavailable";
      try {
        const s = b.ticketManagementEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "customer_sentiment_engine",
    label: "Customer Sentiment Engine",
    missionId: "PILLOW-CSE-001",
    runtimePath: "pillow/src/customer-sentiment-engine/",
    probe: (b) => {
      if (!b.customerSentimentEngine) return "unavailable";
      try {
        const s = b.customerSentimentEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "review_management_engine",
    label: "Review Management Engine",
    missionId: "PILLOW-RME-001",
    runtimePath: "pillow/src/review-management-engine/",
    probe: (b) => {
      if (!b.reviewManagementEngine) return "unavailable";
      try {
        const s = b.reviewManagementEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "loyalty_programme_engine",
    label: "Loyalty Programme Engine",
    missionId: "PILLOW-LPE-001",
    runtimePath: "pillow/src/loyalty-programme-engine/",
    probe: (b) => {
      if (!b.loyaltyProgrammeEngine) return "unavailable";
      try {
        const s = b.loyaltyProgrammeEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "returns_intelligence_engine",
    label: "Returns Intelligence Engine",
    missionId: "PILLOW-RIE-001",
    runtimePath: "pillow/src/returns-intelligence-engine/",
    probe: (b) => {
      if (!b.returnsIntelligenceEngine) return "unavailable";
      try {
        const s = b.returnsIntelligenceEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "customer_risk_engine",
    label: "Customer Risk Engine",
    missionId: "PILLOW-CRE-001",
    runtimePath: "pillow/src/customer-risk-engine/",
    probe: (b) => {
      if (!b.customerRiskEngine) return "unavailable";
      try {
        const s = b.customerRiskEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "customer_lifetime_value_engine",
    label: "Customer Lifetime Value Engine",
    missionId: "PILLOW-CLVE-001",
    runtimePath: "pillow/src/customer-lifetime-value-engine/",
    probe: (b) => {
      if (!b.customerLifetimeValueEngine) return "unavailable";
      try {
        const s = b.customerLifetimeValueEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "customer_segmentation_engine",
    label: "Customer Segmentation Engine",
    missionId: "PILLOW-CSEG-001",
    runtimePath: "pillow/src/customer-segmentation-engine/",
    probe: (b) => {
      if (!b.customerSegmentationEngine) return "unavailable";
      try {
        const s = b.customerSegmentationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "customer_journey_intelligence_engine",
    label: "Customer Journey Intelligence Engine",
    missionId: "PILLOW-CJI-001",
    runtimePath: "pillow/src/customer-journey-intelligence-engine/",
    probe: (b) => {
      if (!b.customerJourneyIntelligenceEngine) return "unavailable";
      try {
        const s = b.customerJourneyIntelligenceEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "executive_customer_dashboard",
    label: "Executive Customer Dashboard",
    missionId: "PILLOW-ECD-001",
    runtimePath: "pillow/src/executive-customer-dashboard/",
    probe: (b) => {
      if (!b.executiveCustomerDashboard) return "unavailable";
      try {
        const s = b.executiveCustomerDashboard.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "customer_operations_certification",
    label: "Customer Operations Certification",
    missionId: "PILLOW-COC-001",
    runtimePath: "pillow/src/customer-operations-certification/",
    probe: (b) => {
      if (!b.customerOperationsCertification) return "unavailable";
      try {
        const s = b.customerOperationsCertification.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "marketing_framework",
    label: "Marketing Framework",
    missionId: "PILLOW-MFW-001",
    runtimePath: "pillow/src/marketing-framework/",
    probe: (b) => {
      if (!b.marketingFramework) return "unavailable";
      try {
        const s = b.marketingFramework.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "meta_ads_integration",
    label: "Meta Ads Integration",
    missionId: "PILLOW-MAI-001",
    runtimePath: "pillow/src/meta-ads-integration/",
    probe: (b) => {
      if (!b.metaAdsIntegration) return "unavailable";
      try {
        const s = b.metaAdsIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "google_ads_integration",
    label: "Google Ads Integration",
    missionId: "PILLOW-GAI-001",
    runtimePath: "pillow/src/google-ads-integration/",
    probe: (b) => {
      if (!b.googleAdsIntegration) return "unavailable";
      try {
        const s = b.googleAdsIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "tiktok_ads_integration",
    label: "TikTok Ads Integration",
    missionId: "PILLOW-TAI-001",
    runtimePath: "pillow/src/tiktok-ads-integration/",
    probe: (b) => {
      if (!b.tiktokAdsIntegration) return "unavailable";
      try {
        const s = b.tiktokAdsIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "youtube_ads_integration",
    label: "YouTube Ads Integration",
    missionId: "PILLOW-YAI-001",
    runtimePath: "pillow/src/youtube-ads-integration/",
    probe: (b) => {
      if (!b.youtubeAdsIntegration) return "unavailable";
      try {
        const s = b.youtubeAdsIntegration.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "seo_intelligence_engine",
    label: "SEO Intelligence Engine",
    missionId: "PILLOW-SIE-001",
    runtimePath: "pillow/src/seo-intelligence-engine/",
    probe: (b) => {
      if (!b.seoIntelligenceEngine) return "unavailable";
      try {
        const s = b.seoIntelligenceEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "campaign_manager",
    label: "Campaign Manager",
    missionId: "PILLOW-CAM-001",
    runtimePath: "pillow/src/campaign-manager/",
    probe: (b) => {
      if (!b.campaignManager) return "unavailable";
      try {
        const s = b.campaignManager.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "audience_intelligence",
    label: "Audience Intelligence",
    missionId: "PILLOW-AUD-001",
    runtimePath: "pillow/src/audience-intelligence/",
    probe: (b) => {
      if (!b.audienceIntelligence) return "unavailable";
      try {
        const s = b.audienceIntelligence.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "attribution_engine",
    label: "Attribution Engine",
    missionId: "PILLOW-ATT-001",
    runtimePath: "pillow/src/attribution-engine/",
    probe: (b) => {
      if (!b.attributionEngine) return "unavailable";
      try {
        const s = b.attributionEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "marketing_analytics_dashboard",
    label: "Marketing Analytics Dashboard",
    missionId: "PILLOW-MAD-001",
    runtimePath: "pillow/src/marketing-analytics-dashboard/",
    probe: (b) => {
      if (!b.marketingAnalyticsDashboard) return "unavailable";
      try {
        const s = b.marketingAnalyticsDashboard.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "creative_asset_manager",
    label: "Creative Asset Manager",
    missionId: "PILLOW-CRA-001",
    runtimePath: "pillow/src/creative-asset-manager/",
    probe: (b) => {
      if (!b.creativeAssetManager) return "unavailable";
      try {
        const s = b.creativeAssetManager.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "ai_campaign_generator",
    label: "AI Campaign Generator",
    missionId: "PILLOW-ACG-001",
    runtimePath: "pillow/src/ai-campaign-generator/",
    probe: (b) => {
      if (!b.aiCampaignGenerator) return "unavailable";
      try {
        const s = b.aiCampaignGenerator.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "budget_optimization_engine",
    label: "Budget Optimization Engine",
    missionId: "PILLOW-BOE-001",
    runtimePath: "pillow/src/budget-optimization-engine/",
    probe: (b) => {
      if (!b.budgetOptimizationEngine) return "unavailable";
      try {
        const s = b.budgetOptimizationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "conversion_intelligence",
    label: "Conversion Intelligence",
    missionId: "PILLOW-CVI-001",
    runtimePath: "pillow/src/conversion-intelligence/",
    probe: (b) => {
      if (!b.conversionIntelligence) return "unavailable";
      try {
        const s = b.conversionIntelligence.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "competitor_marketing_monitor",
    label: "Competitor Marketing Monitor",
    missionId: "PILLOW-CMM-001",
    runtimePath: "pillow/src/competitor-marketing-monitor/",
    probe: (b) => {
      if (!b.competitorMarketingMonitor) return "unavailable";
      try {
        const s = b.competitorMarketingMonitor.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "viral_trend_intelligence",
    label: "Viral Trend Intelligence",
    missionId: "PILLOW-VTI-001",
    runtimePath: "pillow/src/viral-trend-intelligence/",
    probe: (b) => {
      if (!b.viralTrendIntelligence) return "unavailable";
      try {
        const s = b.viralTrendIntelligence.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "marketing_experiment_engine",
    label: "Marketing Experiment Engine",
    missionId: "PILLOW-MEE-001",
    runtimePath: "pillow/src/marketing-experiment-engine/",
    probe: (b) => {
      if (!b.marketingExperimentEngine) return "unavailable";
      try {
        const s = b.marketingExperimentEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "cross_channel_orchestrator",
    label: "Cross-Channel Orchestrator",
    missionId: "PILLOW-CCO-001",
    runtimePath: "pillow/src/cross-channel-orchestrator/",
    probe: (b) => {
      if (!b.crossChannelOrchestrator) return "unavailable";
      try {
        const s = b.crossChannelOrchestrator.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "autonomous_marketing_engine",
    label: "Autonomous Marketing Engine",
    missionId: "PILLOW-AME-001",
    runtimePath: "pillow/src/autonomous-marketing-engine/",
    probe: (b) => {
      if (!b.autonomousMarketingEngine) return "unavailable";
      try {
        const s = b.autonomousMarketingEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "real_world_operations_certification",
    label: "Real World Operations Certification",
    missionId: "PILLOW-RWOC-001",
    runtimePath: "pillow/src/real-world-operations-certification/",
    probe: (b) => {
      if (!b.realWorldOperationsCertification) return "unavailable";
      try {
        const s = b.realWorldOperationsCertification.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "company_factory_framework",
    label: "Company Factory Framework",
    missionId: "PILLOW-CFF-001",
    runtimePath: "pillow/src/company-factory-framework/",
    probe: (b) => {
      if (!b.companyFactoryFramework) return "unavailable";
      try {
        const s = b.companyFactoryFramework.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "business_opportunity_discovery",
    label: "Business Opportunity Discovery",
    missionId: "PILLOW-BOD-001",
    runtimePath: "pillow/src/business-opportunity-discovery/",
    probe: (b) => {
      if (!b.businessOpportunityDiscovery) return "unavailable";
      try {
        const s = b.businessOpportunityDiscovery.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "market_validation_engine",
    label: "Market Validation Engine",
    missionId: "PILLOW-MVE-001",
    runtimePath: "pillow/src/market-validation-engine/",
    probe: (b) => {
      if (!b.marketValidationEngine) return "unavailable";
      try {
        const s = b.marketValidationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "empire_commander",
    label: "Empire Commander",
    missionId: "PILLOW-EC-001",
    runtimePath: "pillow/src/empire-commander/",
    probe: (b) => {
      if (!b.empireCommander) return "unavailable";
      try {
        b.empireCommander.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "empire_operating_system",
    label: "Empire Operating System",
    missionId: "PILLOW-EOS-001",
    runtimePath: "pillow/src/empire-operating-system/",
    probe: (b) => {
      if (!b.empireOperatingSystem) return "unavailable";
      try {
        b.empireOperatingSystem.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "continuous_evolution",
    label: "Continuous Empire Evolution",
    missionId: "PILLOW-CEV-001",
    runtimePath: "pillow/src/continuous-evolution/",
    probe: (b) => {
      if (!b.continuousEvolution) return "unavailable";
      try {
        b.continuousEvolution.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
];

export function discoverSubsystems(
  bundle: PillowSubsystemBundle,
): SubsystemEntry[] {
  const now = new Date().toISOString();
  return SUBSYSTEM_DESCRIPTORS.map((d) => ({
    id: d.id,
    label: d.label,
    missionId: d.missionId,
    health: d.probe(bundle),
    runtimePath: d.runtimePath,
    discoveredAt: now,
  }));
}

export function getSubsystemById(
  registry: SubsystemEntry[],
  id: SubsystemId,
): SubsystemEntry | undefined {
  return registry.find((s) => s.id === id);
}
