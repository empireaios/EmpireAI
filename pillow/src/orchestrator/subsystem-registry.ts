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
  businessModelGenerator?: import("../business-model-generator/engine.js").BusinessModelGenerator;
  brandCreationEngine?: import("../brand-creation-engine/engine.js").BrandCreationEngine;
  domainDigitalAssetPlanner?: import("../domain-digital-asset-planner/engine.js").DomainDigitalAssetPlanner;
  storeGenerationEngine?: import("../store-generation-engine/engine.js").StoreGenerationEngine;
  productPortfolioBuilder?: import("../product-portfolio-builder/engine.js").ProductPortfolioBuilder;
  pricingStrategyEngine?: import("../pricing-strategy-engine/engine.js").PricingStrategyEngine;
  launchReadinessValidator?: import("../launch-readiness-validator/engine.js").LaunchReadinessValidator;
  businessLaunchOrchestrator?: import("../business-launch-orchestrator/engine.js").BusinessLaunchOrchestrator;
  growthInitializationEngine?: import("../growth-initialization-engine/engine.js").GrowthInitializationEngine;
  launchMonitoringEngine?: import("../launch-monitoring-engine/engine.js").LaunchMonitoringEngine;
  firstRevenueOptimizer?: import("../first-revenue-optimizer/engine.js").FirstRevenueOptimizer;
  companyFactoryCertified?: import("../company-factory-certified/engine.js").CompanyFactoryCertified;
  enterprisePortfolioFramework?: import("../enterprise-portfolio-framework/engine.js").EnterprisePortfolioFrameworkEngine;
  multiCompanyRegistry?: import("../multi-company-registry/engine.js").MultiCompanyRegistry;
  portfolioPerformanceEngine?: import("../portfolio-performance-engine/engine.js").PortfolioPerformanceEngine;
  crossBusinessKnowledgeEngine?: import("../cross-business-knowledge-engine/engine.js").CrossBusinessKnowledgeEngine;
  capitalDistributionEngine?: import("../capital-distribution-engine/engine.js").CapitalDistributionEngine;
  executivePortfolioDashboard?: import("../executive-portfolio-dashboard/engine.js").ExecutivePortfolioDashboard;
  portfolioRiskEngine?: import("../portfolio-risk-engine/engine.js").PortfolioRiskEngine;
  portfolioBalanceEngine?: import("../portfolio-balance-engine/engine.js").PortfolioBalanceEngine;
  businessHealthRanking?: import("../business-health-ranking/engine.js").BusinessHealthRanking;
  portfolioIntelligenceCertified?: import("../portfolio-intelligence-certified/engine.js").PortfolioIntelligenceCertified;
  crossCompanyResourceEngine?: import("../cross-company-resource-engine/engine.js").CrossCompanyResourceEngine;
  sharedCustomerIntelligence?: import("../shared-customer-intelligence/engine.js").SharedCustomerIntelligence;
  sharedSupplierIntelligence?: import("../shared-supplier-intelligence/engine.js").SharedSupplierIntelligence;
  portfolioForecastEngine?: import("../portfolio-forecast-engine/engine.js").PortfolioForecastEngine;
  acquisitionEvaluationEngine?: import("../acquisition-evaluation-engine/engine.js").AcquisitionEvaluationEngine;
  portfolioOptimizationEngine?: import("../portfolio-optimization-engine/engine.js").PortfolioOptimizationEngine;
  companyLifecycleManager?: import("../company-lifecycle-manager/engine.js").CompanyLifecycleManager;
  portfolioExpansionPlanner?: import("../portfolio-expansion-planner/engine.js").PortfolioExpansionPlanner;
  enterpriseValueEngine?: import("../enterprise-value-engine/engine.js").EnterpriseValueEngine;
  autonomousPortfolioBoard?: import("../autonomous-portfolio-board/engine.js").AutonomousPortfolioBoard;
  portfolioCertified?: import("../portfolio-certified/engine.js").PortfolioCertified;
  autonomousScalingFramework?: import("../autonomous-scaling-framework/engine.js").AutonomousScalingFrameworkEngine;
  winningProductDetector?: import("../winning-product-detector/engine.js").WinningProductDetectorEngine;
  scalingDecisionEngine?: import("../scaling-decision-engine/engine.js").ScalingDecisionEngine;
  capacityPlanningEngine?: import("../capacity-planning-engine/engine.js").CapacityPlanningEngine;
  marketingScaleEngine?: import("../marketing-scale-engine/engine.js").MarketingScaleEngine;
  supplierScaleEngine?: import("../supplier-scale-engine/engine.js").SupplierScaleEngine;
  financialScaleEngine?: import("../financial-scale-engine/engine.js").FinancialScaleEngine;
  workforceIntelligence?: import("../workforce-intelligence/engine.js").WorkforceIntelligenceEngine;
  executiveScalingDashboard?: import("../executive-scaling-dashboard/engine.js").ExecutiveScalingDashboardEngine;
  bottleneckIntelligence?: import("../bottleneck-intelligence/engine.js").BottleneckIntelligenceEngine;
  operationalElasticityEngine?: import("../operational-elasticity-engine/engine.js").OperationalElasticityEngine;
  performancePreservationEngine?: import("../performance-preservation-engine/engine.js").PerformancePreservationEngine;
  scalingRiskMonitor?: import("../scaling-risk-monitor/engine.js").ScalingRiskMonitorEngine;
  globalScalingPlanner?: import("../global-scaling-planner/engine.js").GlobalScalingPlannerEngine;
  autonomousGrowthOptimizer?: import("../autonomous-growth-optimizer/engine.js").AutonomousGrowthOptimizerEngine;
  revenueAccelerationEngine?: import("../revenue-acceleration-engine/engine.js").RevenueAccelerationEngine;
  profitScalingEngine?: import("../profit-scaling-engine/engine.js").ProfitScalingEngine;
  scaleSimulationEngine?: import("../scale-simulation-engine/engine.js").ScaleSimulationEngine;
  selfBalancingEnterprise?: import("../self-balancing-enterprise/engine.js").SelfBalancingEnterprise;
  globalExpansionFramework?: import("../global-expansion-framework/engine.js").GlobalExpansionFrameworkEngine;
  empireIntelligenceFramework?: import("../empire-intelligence-framework/engine.js").EmpireIntelligenceFrameworkEngine;
  countryIntelligenceEngine?: import("../country-intelligence-engine/engine.js").CountryIntelligenceEngine;
  localizationEngine?: import("../localization-engine/engine.js").LocalizationEngine;
  languageIntelligenceEngine?: import("../language-intelligence/engine.js").LanguageIntelligenceEngine;
  currencyIntelligenceEngine?: import("../currency-intelligence/engine.js").CurrencyIntelligenceEngine;
  regionalComplianceEngine?: import("../regional-compliance-engine/engine.js").RegionalComplianceEngine;
  globalTaxIntelligenceEngine?: import("../global-tax-intelligence/engine.js").GlobalTaxIntelligenceEngine;
  internationalLogisticsEngine?: import("../international-logistics-engine/engine.js").InternationalLogisticsEngine;
  globalMarketIntelligenceEngine?: import("../global-market-intelligence/engine.js").GlobalMarketIntelligenceEngine;
  executiveGlobalDashboardEngine?: import("../executive-global-dashboard/engine.js").ExecutiveGlobalDashboardEngine;
  globalBrandManagementEngine?: import("../global-brand-management/engine.js").GlobalBrandManagementEngine;
  internationalPartnershipEngine?: import("../international-partnership-engine/engine.js").InternationalPartnershipEngine;
  globalTalentIntelligenceEngine?: import("../global-talent-intelligence/engine.js").GlobalTalentIntelligenceEngine;
  regionalGrowthOptimizerEngine?: import("../regional-growth-optimizer/engine.js").RegionalGrowthOptimizerEngine;
  globalRiskIntelligenceEngine?: import("../global-risk-intelligence/engine.js").GlobalRiskIntelligenceEngine;
  crossRegionLearningEngine?: import("../cross-region-learning-engine/engine.js").CrossRegionLearningEngine;
  empireKnowledgeEngine?: import("../empire-knowledge-engine/engine.js").EmpireKnowledgeEngine;
  empireMemoryEngine?: import("../empire-memory-engine/engine.js").EmpireMemoryEngine;
  empireOptimizationEngine?: import("../empire-optimization-engine/engine.js").EmpireOptimizationEngine;
  empireCapitalAllocation?: import("../empire-capital-allocation/engine.js").EmpireCapitalAllocation;
  empireOpportunityEngine?: import("../empire-opportunity-engine/engine.js").EmpireOpportunityEngine;
  empireInnovationEngine?: import("../empire-innovation-engine/engine.js").EmpireInnovationEngine;
  empireResilienceEngine?: import("../empire-resilience-engine/engine.js").EmpireResilienceEngine;
  empireSelfImprovementEngine?: import("../empire-self-improvement-engine/engine.js").EmpireSelfImprovementEngine;
  executiveEmpireDashboard?: import("../executive-empire-dashboard/engine.js").ExecutiveEmpireDashboardEngine;
  crossEmpireGovernanceEngine?: import("../cross-empire-governance-engine/engine.js").CrossEmpireGovernanceEngine;
  autonomousInvestmentEngine?: import("../autonomous-investment-engine/engine.js").AutonomousInvestmentEngine;
  enterpriseSuccessionEngine?: import("../enterprise-succession-engine/engine.js").EnterpriseSuccessionEngine;
  empireLegacyEngine?: import("../empire-legacy-engine/engine.js").EmpireLegacyEngine;
  grandKingAdvisoryEngine?: import("../grand-king-advisory-engine/engine.js").GrandKingAdvisoryEngine;
  civilizationKnowledgeEngine?: import("../civilization-knowledge-engine/engine.js").CivilizationKnowledgeEngine;
  autonomousEmpireEvolution?: import("../autonomous-empire-evolution/engine.js").AutonomousEmpireEvolution;
  empirePerformanceGuardian?: import("../empire-performance-guardian/engine.js").EmpirePerformanceGuardian;
  infiniteGrowthEngine?: import("../infinite-growth-engine/engine.js").InfiniteGrowthEngine;
  globalExpansionSimulator?: import("../global-expansion-simulator/engine.js").GlobalExpansionSimulator;
  internationalExecutiveCockpit?: import("../international-executive-cockpit/engine.js").InternationalExecutiveCockpit;
  globalOperationsCertified?: import("../global-operations-certified/engine.js").GlobalOperationsCertified;
  empireCertified?: import("../empire-certified/engine.js").EmpireCertified;
  executivePlanner?: import("../executive-planner/engine.js").ExecutivePlanner;
  opportunityScanner?: import("../opportunity-scanner/engine.js").OpportunityScanner;
  businessStateManager?: import("../business-state-manager/engine.js").BusinessStateManager;
  executionMemory?: import("../execution-memory/engine.js").ExecutionMemory;
  decisionEngine?: import("../decision-engine/engine.js").DecisionEngine;
  approvalRouter?: import("../approval-router/engine.js").ApprovalRouter;
  strategicRecommendationEngine?: import("../strategic-recommendation-engine/engine.js").StrategicRecommendationEngine;
  executiveAuditEngine?: import("../executive-audit-engine/engine.js").ExecutiveAuditEngine;
  workforceOrchestrator?: import("../workforce-orchestrator/engine.js").WorkforceOrchestrator;
  workforceCapabilityRegistry?: import("../workforce-capability-registry/engine.js").WorkforceCapabilityRegistry;
  workforceAccessManager?: import("../workforce-access-manager/engine.js").WorkforceAccessManager;
  skillToolRouter?: import("../skill-tool-router/engine.js").SkillToolRouter;
  collectiveReasoningEngine?: import("../collective-reasoning-engine/engine.js").CollectiveReasoningEngine;
  experienceReplayEngine?: import("../experience-replay-engine/engine.js").ExperienceReplayEngine;
  operationalPlaybookEngine?: import("../operational-playbook-engine/engine.js").OperationalPlaybookEngine;
  decisionMemory?: import("../decision-memory/engine.js").DecisionMemory;
  adaptiveWorkforceOptimizer?: import("../adaptive-workforce-optimizer/engine.js").AdaptiveWorkforceOptimizer;
  executiveCommandCenter?: import("../executive-command-center/engine.js").ExecutiveCommandCenter;
  workforceOperatingSystem?: import("../workforce-operating-system/engine.js").WorkforceOperatingSystem;
  taskNegotiationProtocol?: import("../task-negotiation-protocol/engine.js").TaskNegotiationProtocol;
  peerReviewRuntime?: import("../peer-review-runtime/engine.js").PeerReviewRuntime;
  escalationFramework?: import("../escalation-framework/engine.js").EscalationFramework;
  knowledgeSharingBus?: import("../knowledge-sharing-bus/engine.js").KnowledgeSharingBus;
  interWorkerMessaging?: import("../inter-worker-messaging/engine.js").InterWorkerMessaging;
  missionCoordinationEngine?: import("../mission-coordination-engine/engine.js").MissionCoordinationEngine;
  executiveReportingRuntime?: import("../executive-reporting-runtime/engine.js").ExecutiveReportingRuntime;
  workerQualityStandard?: import("../worker-quality-standard/engine.js").WorkerQualityStandard;
  workerSelfCritiqueProtocol?: import("../worker-self-critique-protocol/engine.js").WorkerSelfCritiqueProtocol;
  workforceCertificationMonitor?: import("../workforce-certification-monitor/engine.js").WorkforceCertificationMonitor;
  unifiedWorkforceCertification?: import("../unified-workforce-certification/engine.js").UnifiedWorkforceCertification;
  workerConstitution?: import("../worker-constitution/engine.js").WorkerConstitution;
  organizationCharter?: import("../organization-charter/engine.js").OrganizationCharter;
  roleTaxonomy?: import("../role-taxonomy/engine.js").RoleTaxonomy;
  skillTaxonomy?: import("../skill-taxonomy/engine.js").SkillTaxonomy;
  authorityMatrix?: import("../authority-matrix/engine.js").AuthorityMatrix;
  responsibilityMatrix?: import("../responsibility-matrix/engine.js").ResponsibilityMatrix;
  workerRegistry?: import("../worker-registry/engine.js").WorkerRegistry;
  workerLifecycle?: import("../worker-lifecycle/engine.js").WorkerLifecycle;
  workerAssignmentEngine?: import("../worker-assignment-engine/engine.js").WorkerAssignmentEngine;
  workerMonitoring?: import("../worker-monitoring/engine.js").WorkerMonitoring;
  workerPerformanceReview?: import("../worker-performance-review/engine.js").WorkerPerformanceReview;
  workerRecoverySystem?: import("../worker-recovery-system/engine.js").WorkerRecoverySystem;
  workforceFactoryCertification?: import("../workforce-factory-certification/engine.js").WorkforceFactoryCertification;
  empireBuilderFactoryCore?: import("../empire-builder-factory-core/engine.js").EmpireBuilderFactoryCore;
  businessIdeaInterpreter?: import("../business-idea-interpreter/engine.js").BusinessIdeaInterpreter;
  empireBuilderModelGenerator?: import("../empire-builder-model-generator/engine.js").EmpireBuilderModelGenerator;
  marketResearchWorker?: import("../market-research-worker/engine.js").MarketResearchWorker;
  opportunityEvaluationWorker?: import("../opportunity-evaluation-worker/engine.js").OpportunityEvaluationWorker;
  businessBlueprintWorker?: import("../business-blueprint-worker/engine.js").BusinessBlueprintWorker;
  launchPlanWorker?: import("../launch-plan-worker/engine.js").LaunchPlanWorker;
  businessRiskWorker?: import("../business-risk-worker/engine.js").BusinessRiskWorker;
  businessApprovalPackWorker?: import("../business-approval-pack-worker/engine.js").BusinessApprovalPackWorker;
  empireBuilderCertification?: import("../empire-builder-certification/engine.js").EmpireBuilderCertification;
  commerceFactoryCore?: import("../commerce-factory-core/engine.js").CommerceFactoryCore;
  productDiscoveryWorker?: import("../product-discovery-worker/engine.js").ProductDiscoveryWorker;
  productEvaluationWorker?: import("../product-evaluation-worker/engine.js").ProductEvaluationWorker;
  supplierDiscoveryWorker?: import("../supplier-discovery-worker/engine.js").SupplierDiscoveryWorker;
  supplierEvaluationWorker?: import("../supplier-evaluation-worker/engine.js").SupplierEvaluationWorker;
  supplierNegotiationWorker?: import("../supplier-negotiation-worker/engine.js").SupplierNegotiationWorker;
  productImageWorker?: import("../product-image-worker/engine.js").ProductImageWorker;
  productListingWorker?: import("../product-listing-worker/engine.js").ProductListingWorker;
  pricingWorker?: import("../pricing-worker/engine.js").PricingWorker;
  inventoryWorker?: import("../inventory-worker/engine.js").InventoryWorker;
  orderWorker?: import("../order-worker/engine.js").OrderWorker;
  refundDisputeWorker?: import("../refund-dispute-worker/engine.js").RefundDisputeWorker;
  commerceAnalyticsWorker?: import("../commerce-analytics-worker/engine.js").CommerceAnalyticsWorker;
  commerceCertification?: import("../commerce-certification/engine.js").CommerceCertification;
  mediaFactoryCore?: import("../media-factory-core/engine.js").MediaFactoryCore;
  editorInChiefWorker?: import("../editor-in-chief-worker/engine.js").EditorInChiefWorker;
  trendResearchWorker?: import("../trend-research-worker/engine.js").TrendResearchWorker;
  topicPlannerWorker?: import("../topic-planner-worker/engine.js").TopicPlannerWorker;
  scriptWorker?: import("../script-worker/engine.js").ScriptWorker;
  hookWorker?: import("../hook-worker/engine.js").HookWorker;
  thumbnailWorker?: import("../thumbnail-worker/engine.js").ThumbnailWorker;
  visualResearchWorker?: import("../visual-research-worker/engine.js").VisualResearchWorker;
  imageCreativeWorker?: import("../image-creative-worker/engine.js").ImageCreativeWorker;
  voiceWorker?: import("../voice-worker/engine.js").VoiceWorker;
  videoAssemblyWorker?: import("../video-assembly-worker/engine.js").VideoAssemblyWorker;
  subtitleWorker?: import("../subtitle-worker/engine.js").SubtitleWorker;
  musicSoundWorker?: import("../music-sound-worker/engine.js").MusicSoundWorker;
  publishingWorker?: import("../publishing-worker/engine.js").PublishingWorker;
  mediaAnalyticsWorker?: import("../media-analytics-worker/engine.js").MediaAnalyticsWorker;
  mediaLearningWorker?: import("../media-learning-worker/engine.js").MediaLearningWorker;
  channelRecommendationWorker?: import("../channel-recommendation-worker/engine.js").ChannelRecommendationWorker;
  mediaExecutiveReviewWorker?: import("../media-executive-review-worker/engine.js").MediaExecutiveReviewWorker;
  mediaCertification?: import("../media-certification/engine.js").MediaCertification;
  digitalProductsFactoryCore?: import("../digital-products-factory-core/engine.js").DigitalProductsFactoryCore;
  digitalProductResearchWorker?: import("../digital-product-research-worker/engine.js").DigitalProductResearchWorker;
  ebookWorker?: import("../ebook-worker/engine.js").EbookWorker;
  promptProductWorker?: import("../prompt-product-worker/engine.js").PromptProductWorker;
  courseBuilderWorker?: import("../course-builder-worker/engine.js").CourseBuilderWorker;
  templateBuilderWorker?: import("../template-builder-worker/engine.js").TemplateBuilderWorker;
  designWorker?: import("../design-worker/engine.js").DesignWorker;
  salesPageWorker?: import("../sales-page-worker/engine.js").SalesPageWorker;
  checkoutWorker?: import("../checkout-worker/engine.js").CheckoutWorker;
  digitalDeliveryWorker?: import("../digital-delivery-worker/engine.js").DigitalDeliveryWorker;
  digitalProductAnalyticsWorker?: import("../digital-product-analytics-worker/engine.js").DigitalProductAnalyticsWorker;
  digitalProductsCertification?: import("../digital-products-certification/engine.js").DigitalProductsCertification;
  enterprisePlatformFactoryCore?: import("../enterprise-platform-factory-core/engine.js").EnterprisePlatformFactoryCore;
  requirementsWorker?: import("../requirements-worker/engine.js").RequirementsWorker;
  architectureWorker?: import("../architecture-worker/engine.js").ArchitectureWorker;
  frontendWorker?: import("../frontend-worker/engine.js").FrontendWorker;
  backendWorker?: import("../backend-worker/engine.js").BackendWorker;
  databaseWorker?: import("../database-worker/engine.js").DatabaseWorker;
  authenticationWorker?: import("../authentication-worker/engine.js").AuthenticationWorker;
  authorizationWorker?: import("../authorization-worker/engine.js").AuthorizationWorker;
  billingWorker?: import("../billing-worker/engine.js").BillingWorker;
  apiIntegrationWorker?: import("../api-integration-worker/engine.js").ApiIntegrationWorker;
  workflowBuilderWorker?: import("../workflow-builder-worker/engine.js").WorkflowBuilderWorker;
  notificationWorker?: import("../notification-worker/engine.js").NotificationWorker;
  testingWorker?: import("../testing-worker/engine.js").TestingWorker;
  deploymentWorker?: import("../deployment-worker/engine.js").DeploymentWorker;
  platformCertification?: import("../platform-certification/engine.js").PlatformCertification;
  localBusinessFactoryCore?: import("../local-business-factory-core/engine.js").LocalBusinessFactoryCore;
  localMarketResearchWorker?: import("../local-market-research-worker/engine.js").LocalMarketResearchWorker;
  serviceOfferWorker?: import("../service-offer-worker/engine.js").ServiceOfferWorker;
  bookingWorker?: import("../booking-worker/engine.js").BookingWorker;
  crmWorker?: import("../crm-worker/engine.js").CrmWorker;
  whatsAppWorker?: import("../whatsapp-worker/engine.js").WhatsAppWorker;
  localSeoWorker?: import("../local-seo-worker/engine.js").LocalSeoWorker;
  leadGenerationWorker?: import("../lead-generation-worker/engine.js").LeadGenerationWorker;
  operationsWorker?: import("../operations-worker/engine.js").OperationsWorker;
  localBusinessLaunchPack?: import("../local-business-launch-pack/engine.js").LocalBusinessLaunchPack;
  localBusinessCertification?: import("../local-business-certification/engine.js").LocalBusinessCertification;
  affiliateFactoryCore?: import("../affiliate-factory-core/engine.js").AffiliateFactoryCore;
  affiliateOpportunityWorker?: import("../affiliate-opportunity-worker/engine.js").AffiliateOpportunityWorker;
  comparisonSiteWorker?: import("../comparison-site-worker/engine.js").ComparisonSiteWorker;
  reviewContentWorker?: import("../review-content-worker/engine.js").ReviewContentWorker;
  seoContentWorker?: import("../seo-content-worker/engine.js").SeoContentWorker;
  emailFunnelWorker?: import("../email-funnel-worker/engine.js").EmailFunnelWorker;
  analyticsWorker?: import("../analytics-worker/engine.js").AnalyticsWorker;
  affiliateComplianceWorker?: import("../affiliate-compliance-worker/engine.js").AffiliateComplianceWorker;
  affiliateCertification?: import("../affiliate-certification/engine.js").AffiliateCertification;
  capitalFactoryCore?: import("../capital-factory-core/engine.js").CapitalFactoryCore;
  accountingWorker?: import("../accounting-worker/engine.js").AccountingWorker;
  cashflowWorker?: import("../cashflow-worker/engine.js").CashflowWorker;
  budgetPlanningWorker?: import("../budget-planning-worker/engine.js").BudgetPlanningWorker;
  profitabilityWorker?: import("../profitability-worker/engine.js").ProfitabilityWorker;
  forecastingWorker?: import("../forecasting-worker/engine.js").ForecastingWorker;
  taxSupportWorker?: import("../tax-support-worker/engine.js").TaxSupportWorker;
  investmentPlanningWorker?: import("../investment-planning-worker/engine.js").InvestmentPlanningWorker;
  financialReportingWorker?: import("../financial-reporting-worker/engine.js").FinancialReportingWorker;
  capitalRiskWorker?: import("../capital-risk-worker/engine.js").CapitalRiskWorker;
  capitalFactoryCertification?: import("../capital-factory-certification/engine.js").CapitalFactoryCertification;
  sharedRuntimeCore?: import("../shared-runtime-core/engine.js").SharedRuntimeCore;
  pillowOrchestrationRuntime?: import("../pillow-orchestration-runtime/engine.js").PillowOrchestrationRuntime;
  missionRuntime?: import("../mission-runtime/engine.js").MissionRuntime;
  queueRuntime?: import("../queue-runtime/engine.js").QueueRuntime;
  memoryRuntime?: import("../memory-runtime/engine.js").MemoryRuntime;
  apiRuntime?: import("../api-runtime/engine.js").ApiRuntime;
  toolRuntime?: import("../tool-runtime/engine.js").ToolRuntime;
  communicationRuntime?: import("../communication-runtime/engine.js").CommunicationRuntime;
  approvalRuntime?: import("../approval-runtime/engine.js").ApprovalRuntime;
  monitoringRuntime?: import("../monitoring-runtime/engine.js").MonitoringRuntime;
  recoveryRuntime?: import("../recovery-runtime/engine.js").RecoveryRuntime;
  schedulingRuntime?: import("../scheduling-runtime/engine.js").SchedulingRuntime;
  auditRuntime?: import("../audit-runtime/engine.js").AuditRuntime;
  sharedRuntimeCertification?: import("../shared-runtime-certification/engine.js").SharedRuntimeCertification;
  productionCertificationCore?: import("../production-certification-core/engine.js").ProductionCertificationCore;
  workerReadinessAudit?: import("../worker-readiness-audit/engine.js").WorkerReadinessAudit;
  pillowCommandAudit?: import("../pillow-command-audit/engine.js").PillowCommandAudit;
  businessFactoryAudit?: import("../business-factory-audit/engine.js").BusinessFactoryAudit;
  securityAudit?: import("../security-audit/engine.js").SecurityAudit;
  performanceAudit?: import("../performance-audit/engine.js").PerformanceAudit;
  recoveryAudit?: import("../recovery-audit/engine.js").RecoveryAudit;
  executiveAcceptancePack?: import("../executive-acceptance-pack/engine.js").ExecutiveAcceptancePack;
  grandKingAcceptanceGate?: import("../grand-king-acceptance-gate/engine.js").GrandKingAcceptanceGate;
  postLaunchMonitoring?: import("../post-launch-monitoring/engine.js").PostLaunchMonitoring;
  qSeriesCertification?: import("../q-series-certification/engine.js").QSeriesCertification;
  qSeriesCompletion?: import("../q-series-completion/engine.js").QSeriesCompletion;
  aiInnovationFactory?: import("../ai-innovation-factory/engine.js").AiInnovationFactory;
  implementationSpecificationEngine?: import("../implementation-specification-engine/engine.js").ImplementationSpecificationEngine;
  repositoryIntelligenceEngine?: import("../repository-intelligence-engine/engine.js").RepositoryIntelligenceEngine;
  missionPlanningEngine?: import("../mission-planning-engine/engine.js").MissionPlanningEngine;
  cursorSpecificationGenerator?: import("../cursor-specification-generator/engine.js").CursorSpecificationGenerator;
  implementationRecoveryPlanner?: import("../implementation-recovery-planner/engine.js").ImplementationRecoveryPlanner;
  programmeCertificationFactory?: import("../programme-certification-factory/engine.js").ProgrammeCertificationFactory;
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
    id: "business_model_generator",
    label: "Business Model Generator",
    missionId: "PILLOW-BMG-001",
    runtimePath: "pillow/src/business-model-generator/",
    probe: (b) => {
      if (!b.businessModelGenerator) return "unavailable";
      try {
        const s = b.businessModelGenerator.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "brand_creation_engine",
    label: "Brand Creation Engine",
    missionId: "PILLOW-BCE-001",
    runtimePath: "pillow/src/brand-creation-engine/",
    probe: (b) => {
      if (!b.brandCreationEngine) return "unavailable";
      try {
        const s = b.brandCreationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "domain_digital_asset_planner",
    label: "Domain & Digital Asset Planner",
    missionId: "PILLOW-DAP-001",
    runtimePath: "pillow/src/domain-digital-asset-planner/",
    probe: (b) => {
      if (!b.domainDigitalAssetPlanner) return "unavailable";
      try {
        const s = b.domainDigitalAssetPlanner.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "store_generation_engine",
    label: "Store Generation Engine",
    missionId: "PILLOW-SGE-001",
    runtimePath: "pillow/src/store-generation-engine/",
    probe: (b) => {
      if (!b.storeGenerationEngine) return "unavailable";
      try {
        const s = b.storeGenerationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "product_portfolio_builder",
    label: "Product Portfolio Builder",
    missionId: "PILLOW-PPB-001",
    runtimePath: "pillow/src/product-portfolio-builder/",
    probe: (b) => {
      if (!b.productPortfolioBuilder) return "unavailable";
      try {
        const s = b.productPortfolioBuilder.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "pricing_strategy_engine",
    label: "Pricing Strategy Engine",
    missionId: "PILLOW-PSE-001",
    runtimePath: "pillow/src/pricing-strategy-engine/",
    probe: (b) => {
      if (!b.pricingStrategyEngine) return "unavailable";
      try {
        const s = b.pricingStrategyEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "launch_readiness_validator",
    label: "Launch Readiness Validator",
    missionId: "PILLOW-LRV-001",
    runtimePath: "pillow/src/launch-readiness-validator/",
    probe: (b) => {
      if (!b.launchReadinessValidator) return "unavailable";
      try {
        const s = b.launchReadinessValidator.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "business_launch_orchestrator",
    label: "Business Launch Orchestrator",
    missionId: "PILLOW-BLO-001",
    runtimePath: "pillow/src/business-launch-orchestrator/",
    probe: (b) => {
      if (!b.businessLaunchOrchestrator) return "unavailable";
      try {
        const s = b.businessLaunchOrchestrator.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "growth_initialization_engine",
    label: "Growth Initialization Engine",
    missionId: "PILLOW-GIE-001",
    runtimePath: "pillow/src/growth-initialization-engine/",
    probe: (b) => {
      if (!b.growthInitializationEngine) return "unavailable";
      try {
        const s = b.growthInitializationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "launch_monitoring_engine",
    label: "Launch Monitoring Engine",
    missionId: "PILLOW-LME-001",
    runtimePath: "pillow/src/launch-monitoring-engine/",
    probe: (b) => {
      if (!b.launchMonitoringEngine) return "unavailable";
      try {
        const s = b.launchMonitoringEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "first_revenue_optimizer",
    label: "First Revenue Optimizer",
    missionId: "PILLOW-FRO-001",
    runtimePath: "pillow/src/first-revenue-optimizer/",
    probe: (b) => {
      if (!b.firstRevenueOptimizer) return "unavailable";
      try {
        const s = b.firstRevenueOptimizer.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "company_factory_certified",
    label: "Company Factory Certified",
    missionId: "PILLOW-CFC-001",
    runtimePath: "pillow/src/company-factory-certified/",
    probe: (b) => {
      if (!b.companyFactoryCertified) return "unavailable";
      try {
        const s = b.companyFactoryCertified.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "enterprise_portfolio_framework",
    label: "Enterprise Portfolio Framework",
    missionId: "PILLOW-EPF-001",
    runtimePath: "pillow/src/enterprise-portfolio-framework/",
    probe: (b) => {
      if (!b.enterprisePortfolioFramework) return "unavailable";
      try {
        const s = b.enterprisePortfolioFramework.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "multi_company_registry",
    label: "Multi-Company Registry",
    missionId: "PILLOW-MCR-001",
    runtimePath: "pillow/src/multi-company-registry/",
    probe: (b) => {
      if (!b.multiCompanyRegistry) return "unavailable";
      try {
        const s = b.multiCompanyRegistry.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "portfolio_performance_engine",
    label: "Portfolio Performance Engine",
    missionId: "PILLOW-PPE-001",
    runtimePath: "pillow/src/portfolio-performance-engine/",
    probe: (b) => {
      if (!b.portfolioPerformanceEngine) return "unavailable";
      try {
        const s = b.portfolioPerformanceEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "cross_business_knowledge_engine",
    label: "Cross-Business Knowledge Engine",
    missionId: "PILLOW-CBK-001",
    runtimePath: "pillow/src/cross-business-knowledge-engine/",
    probe: (b) => {
      if (!b.crossBusinessKnowledgeEngine) return "unavailable";
      try {
        const s = b.crossBusinessKnowledgeEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "capital_distribution_engine",
    label: "Capital Distribution Engine",
    missionId: "PILLOW-CDE-001",
    runtimePath: "pillow/src/capital-distribution-engine/",
    probe: (b) => {
      if (!b.capitalDistributionEngine) return "unavailable";
      try {
        const s = b.capitalDistributionEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "executive_portfolio_dashboard",
    label: "Executive Portfolio Dashboard",
    missionId: "PILLOW-EPD-001",
    runtimePath: "pillow/src/executive-portfolio-dashboard/",
    probe: (b) => {
      if (!b.executivePortfolioDashboard) return "unavailable";
      try {
        const s = b.executivePortfolioDashboard.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "portfolio_risk_engine",
    label: "Portfolio Risk Engine",
    missionId: "PILLOW-PRE-001",
    runtimePath: "pillow/src/portfolio-risk-engine/",
    probe: (b) => {
      if (!b.portfolioRiskEngine) return "unavailable";
      try {
        const s = b.portfolioRiskEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "portfolio_balance_engine",
    label: "Portfolio Balance Engine",
    missionId: "PILLOW-PBE-001",
    runtimePath: "pillow/src/portfolio-balance-engine/",
    probe: (b) => {
      if (!b.portfolioBalanceEngine) return "unavailable";
      try {
        const s = b.portfolioBalanceEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "business_health_ranking",
    label: "Business Health Ranking",
    missionId: "PILLOW-BHR-001",
    runtimePath: "pillow/src/business-health-ranking/",
    probe: (b) => {
      if (!b.businessHealthRanking) return "unavailable";
      try {
        const s = b.businessHealthRanking.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "portfolio_intelligence_certified",
    label: "Portfolio Intelligence Certified",
    missionId: "PILLOW-PIC-001",
    runtimePath: "pillow/src/portfolio-intelligence-certified/",
    probe: (b) => {
      if (!b.portfolioIntelligenceCertified) return "unavailable";
      try {
        const s = b.portfolioIntelligenceCertified.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "cross_company_resource_engine",
    label: "Cross-Company Resource Engine",
    missionId: "PILLOW-CCRE-001",
    runtimePath: "pillow/src/cross-company-resource-engine/",
    probe: (b) => {
      if (!b.crossCompanyResourceEngine) return "unavailable";
      try {
        const s = b.crossCompanyResourceEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "shared_customer_intelligence",
    label: "Shared Customer Intelligence",
    missionId: "PILLOW-SCI-001",
    runtimePath: "pillow/src/shared-customer-intelligence/",
    probe: (b) => {
      if (!b.sharedCustomerIntelligence) return "unavailable";
      try {
        const s = b.sharedCustomerIntelligence.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "shared_supplier_intelligence",
    label: "Shared Supplier Intelligence",
    missionId: "PILLOW-SSI-001",
    runtimePath: "pillow/src/shared-supplier-intelligence/",
    probe: (b) => {
      if (!b.sharedSupplierIntelligence) return "unavailable";
      try {
        const s = b.sharedSupplierIntelligence.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "portfolio_forecast_engine",
    label: "Portfolio Forecast Engine",
    missionId: "PILLOW-PFE-001",
    runtimePath: "pillow/src/portfolio-forecast-engine/",
    probe: (b) => {
      if (!b.portfolioForecastEngine) return "unavailable";
      try {
        const s = b.portfolioForecastEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "acquisition_evaluation_engine",
    label: "Acquisition Evaluation Engine",
    missionId: "PILLOW-AEE-001",
    runtimePath: "pillow/src/acquisition-evaluation-engine/",
    probe: (b) => {
      if (!b.acquisitionEvaluationEngine) return "unavailable";
      try {
        const s = b.acquisitionEvaluationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "portfolio_optimization_engine",
    label: "Portfolio Optimization Engine",
    missionId: "PILLOW-POE-001",
    runtimePath: "pillow/src/portfolio-optimization-engine/",
    probe: (b) => {
      if (!b.portfolioOptimizationEngine) return "unavailable";
      try {
        const s = b.portfolioOptimizationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "company_lifecycle_manager",
    label: "Company Lifecycle Manager",
    missionId: "PILLOW-CLM-001",
    runtimePath: "pillow/src/company-lifecycle-manager/",
    probe: (b) => {
      if (!b.companyLifecycleManager) return "unavailable";
      try {
        const s = b.companyLifecycleManager.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "portfolio_expansion_planner",
    label: "Portfolio Expansion Planner",
    missionId: "PILLOW-PEP-001",
    runtimePath: "pillow/src/portfolio-expansion-planner/",
    probe: (b) => {
      if (!b.portfolioExpansionPlanner) return "unavailable";
      try {
        const s = b.portfolioExpansionPlanner.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "enterprise_value_engine",
    label: "Enterprise Value Engine",
    missionId: "PILLOW-EVE-001",
    runtimePath: "pillow/src/enterprise-value-engine/",
    probe: (b) => {
      if (!b.enterpriseValueEngine) return "unavailable";
      try {
        const s = b.enterpriseValueEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "autonomous_portfolio_board",
    label: "Autonomous Portfolio Board",
    missionId: "PILLOW-APB-001",
    runtimePath: "pillow/src/autonomous-portfolio-board/",
    probe: (b) => {
      if (!b.autonomousPortfolioBoard) return "unavailable";
      try {
        const s = b.autonomousPortfolioBoard.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "portfolio_certified",
    label: "Portfolio Certified",
    missionId: "PILLOW-PTC-001",
    runtimePath: "pillow/src/portfolio-certified/",
    probe: (b) => {
      if (!b.portfolioCertified) return "unavailable";
      try {
        const s = b.portfolioCertified.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "autonomous_scaling_framework",
    label: "Autonomous Scaling Framework",
    missionId: "PILLOW-ASF-001",
    runtimePath: "pillow/src/autonomous-scaling-framework/",
    probe: (b) => {
      if (!b.autonomousScalingFramework) return "unavailable";
      try {
        const s = b.autonomousScalingFramework.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "winning_product_detector",
    label: "Winning Product Detector",
    missionId: "PILLOW-WPD-001",
    runtimePath: "pillow/src/winning-product-detector/",
    probe: (b) => {
      if (!b.winningProductDetector) return "unavailable";
      try {
        const s = b.winningProductDetector.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "scaling_decision_engine",
    label: "Scaling Decision Engine",
    missionId: "PILLOW-SDE-001",
    runtimePath: "pillow/src/scaling-decision-engine/",
    probe: (b) => {
      if (!b.scalingDecisionEngine) return "unavailable";
      try {
        const s = b.scalingDecisionEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "capacity_planning_engine",
    label: "Capacity Planning Engine",
    missionId: "PILLOW-CPE-001",
    runtimePath: "pillow/src/capacity-planning-engine/",
    probe: (b) => {
      if (!b.capacityPlanningEngine) return "unavailable";
      try {
        const s = b.capacityPlanningEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "marketing_scale_engine",
    label: "Marketing Scale Engine",
    missionId: "PILLOW-MSE-001",
    runtimePath: "pillow/src/marketing-scale-engine/",
    probe: (b) => {
      if (!b.marketingScaleEngine) return "unavailable";
      try {
        const s = b.marketingScaleEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "supplier_scale_engine",
    label: "Supplier Scale Engine",
    missionId: "PILLOW-SSE-001",
    runtimePath: "pillow/src/supplier-scale-engine/",
    probe: (b) => {
      if (!b.supplierScaleEngine) return "unavailable";
      try {
        const s = b.supplierScaleEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "financial_scale_engine",
    label: "Financial Scale Engine",
    missionId: "PILLOW-FSE-001",
    runtimePath: "pillow/src/financial-scale-engine/",
    probe: (b) => {
      if (!b.financialScaleEngine) return "unavailable";
      try {
        const s = b.financialScaleEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "workforce_intelligence",
    label: "Workforce Intelligence",
    missionId: "PILLOW-WFI-001",
    runtimePath: "pillow/src/workforce-intelligence/",
    probe: (b) => {
      if (!b.workforceIntelligence) return "unavailable";
      try {
        const s = b.workforceIntelligence.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "executive_scaling_dashboard",
    label: "Executive Scaling Dashboard",
    missionId: "PILLOW-ESD-001",
    runtimePath: "pillow/src/executive-scaling-dashboard/",
    probe: (b) => {
      if (!b.executiveScalingDashboard) return "unavailable";
      try {
        const s = b.executiveScalingDashboard.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "bottleneck_intelligence",
    label: "Bottleneck Intelligence",
    missionId: "PILLOW-BNI-001",
    runtimePath: "pillow/src/bottleneck-intelligence/",
    probe: (b) => {
      if (!b.bottleneckIntelligence) return "unavailable";
      try {
        const s = b.bottleneckIntelligence.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "operational_elasticity_engine",
    label: "Operational Elasticity Engine",
    missionId: "PILLOW-OEE-001",
    runtimePath: "pillow/src/operational-elasticity-engine/",
    probe: (b) => {
      if (!b.operationalElasticityEngine) return "unavailable";
      try {
        const s = b.operationalElasticityEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "performance_preservation_engine",
    label: "Performance Preservation Engine",
    missionId: "PILLOW-PPE-001",
    runtimePath: "pillow/src/performance-preservation-engine/",
    probe: (b) => {
      if (!b.performancePreservationEngine) return "unavailable";
      try {
        const s = b.performancePreservationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "scaling_risk_monitor",
    label: "Scaling Risk Monitor",
    missionId: "PILLOW-SRM-001",
    runtimePath: "pillow/src/scaling-risk-monitor/",
    probe: (b) => {
      if (!b.scalingRiskMonitor) return "unavailable";
      try {
        const s = b.scalingRiskMonitor.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "global_scaling_planner",
    label: "Global Scaling Planner",
    missionId: "PILLOW-GSP-001",
    runtimePath: "pillow/src/global-scaling-planner/",
    probe: (b) => {
      if (!b.globalScalingPlanner) return "unavailable";
      try {
        const s = b.globalScalingPlanner.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "autonomous_growth_optimizer",
    label: "Autonomous Growth Optimizer",
    missionId: "PILLOW-AGO-001",
    runtimePath: "pillow/src/autonomous-growth-optimizer/",
    probe: (b) => {
      if (!b.autonomousGrowthOptimizer) return "unavailable";
      try {
        const s = b.autonomousGrowthOptimizer.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "revenue_acceleration_engine",
    label: "Revenue Acceleration Engine",
    missionId: "PILLOW-RAE-001",
    runtimePath: "pillow/src/revenue-acceleration-engine/",
    probe: (b) => {
      if (!b.revenueAccelerationEngine) return "unavailable";
      try {
        const s = b.revenueAccelerationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "profit_scaling_engine",
    label: "Profit Scaling Engine",
    missionId: "PILLOW-PSE-001",
    runtimePath: "pillow/src/profit-scaling-engine/",
    probe: (b) => {
      if (!b.profitScalingEngine) return "unavailable";
      try {
        const s = b.profitScalingEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "scale_simulation_engine",
    label: "Scale Simulation Engine",
    missionId: "PILLOW-SSI-001",
    runtimePath: "pillow/src/scale-simulation-engine/",
    probe: (b) => {
      if (!b.scaleSimulationEngine) return "unavailable";
      try {
        const s = b.scaleSimulationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "self_balancing_enterprise",
    label: "Self-Balancing Enterprise",
    missionId: "PILLOW-SBE-001",
    runtimePath: "pillow/src/self-balancing-enterprise/",
    probe: (b) => {
      if (!b.selfBalancingEnterprise) return "unavailable";
      try {
        const s = b.selfBalancingEnterprise.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "global_expansion_framework",
    label: "Global Expansion Framework",
    missionId: "PILLOW-GEF-001",
    runtimePath: "pillow/src/global-expansion-framework/",
    probe: (b) => {
      if (!b.globalExpansionFramework) return "unavailable";
      try {
        const s = b.globalExpansionFramework.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "empire_intelligence_framework",
    label: "Empire Intelligence Framework",
    missionId: "PILLOW-EIF-001",
    runtimePath: "pillow/src/empire-intelligence-framework/",
    probe: (b) => {
      if (!b.empireIntelligenceFramework) return "unavailable";
      try { return b.empireIntelligenceFramework.getState().health.status === "failed" ? "degraded" : "ready"; }
      catch { return "unavailable"; }
    },
  },
  {
    id: "country_intelligence_engine",
    label: "Country Intelligence Engine",
    missionId: "PILLOW-CIE-001",
    runtimePath: "pillow/src/country-intelligence-engine/",
    probe: (b) => {
      if (!b.countryIntelligenceEngine) return "unavailable";
      try {
        const s = b.countryIntelligenceEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "localization_engine",
    label: "Localization Engine",
    missionId: "PILLOW-LOC-001",
    runtimePath: "pillow/src/localization-engine/",
    probe: (b) => {
      if (!b.localizationEngine) return "unavailable";
      try {
        const s = b.localizationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "language_intelligence",
    label: "Language Intelligence",
    missionId: "PILLOW-LI-001",
    runtimePath: "pillow/src/language-intelligence/",
    probe: (b) => {
      if (!b.languageIntelligenceEngine) return "unavailable";
      try {
        const s = b.languageIntelligenceEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "currency_intelligence",
    label: "Currency Intelligence",
    missionId: "PILLOW-CUR-001",
    runtimePath: "pillow/src/currency-intelligence/",
    probe: (b) => {
      if (!b.currencyIntelligenceEngine) return "unavailable";
      try {
        const s = b.currencyIntelligenceEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "regional_compliance_engine",
    label: "Regional Compliance Engine",
    missionId: "PILLOW-RCE-001",
    runtimePath: "pillow/src/regional-compliance-engine/",
    probe: (b) => {
      if (!b.regionalComplianceEngine) return "unavailable";
      try {
        const s = b.regionalComplianceEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "global_tax_intelligence",
    label: "Global Tax Intelligence",
    missionId: "PILLOW-GTI-001",
    runtimePath: "pillow/src/global-tax-intelligence/",
    probe: (b) => {
      if (!b.globalTaxIntelligenceEngine) return "unavailable";
      try {
        const s = b.globalTaxIntelligenceEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "international_logistics_engine",
    label: "International Logistics Engine",
    missionId: "PILLOW-ILE-001",
    runtimePath: "pillow/src/international-logistics-engine/",
    probe: (b) => {
      if (!b.internationalLogisticsEngine) return "unavailable";
      try {
        const s = b.internationalLogisticsEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "global_market_intelligence",
    label: "Global Market Intelligence",
    missionId: "PILLOW-GMI-001",
    runtimePath: "pillow/src/global-market-intelligence/",
    probe: (b) => {
      if (!b.globalMarketIntelligenceEngine) return "unavailable";
      try {
        const s = b.globalMarketIntelligenceEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "executive_global_dashboard",
    label: "Executive Global Dashboard",
    missionId: "PILLOW-EGD-001",
    runtimePath: "pillow/src/executive-global-dashboard/",
    probe: (b) => {
      if (!b.executiveGlobalDashboardEngine) return "unavailable";
      try {
        const s = b.executiveGlobalDashboardEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "global_brand_management",
    label: "Global Brand Management",
    missionId: "PILLOW-GBM-001",
    runtimePath: "pillow/src/global-brand-management/",
    probe: (b) => {
      if (!b.globalBrandManagementEngine) return "unavailable";
      try {
        const s = b.globalBrandManagementEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "international_partnership_engine",
    label: "International Partnership Engine",
    missionId: "PILLOW-IPE-001",
    runtimePath: "pillow/src/international-partnership-engine/",
    probe: (b) => {
      if (!b.internationalPartnershipEngine) return "unavailable";
      try {
        const s = b.internationalPartnershipEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "global_talent_intelligence",
    label: "Global Talent Intelligence",
    missionId: "PILLOW-TAL-001",
    runtimePath: "pillow/src/global-talent-intelligence/",
    probe: (b) => {
      if (!b.globalTalentIntelligenceEngine) return "unavailable";
      try {
        const s = b.globalTalentIntelligenceEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "regional_growth_optimizer",
    label: "Regional Growth Optimizer",
    missionId: "PILLOW-RGO-001",
    runtimePath: "pillow/src/regional-growth-optimizer/",
    probe: (b) => {
      if (!b.regionalGrowthOptimizerEngine) return "unavailable";
      try {
        const s = b.regionalGrowthOptimizerEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "global_risk_intelligence",
    label: "Global Risk Intelligence",
    missionId: "X4-15",
    runtimePath: "pillow/src/global-risk-intelligence/",
    probe: (b) => {
      if (!b.globalRiskIntelligenceEngine) return "unavailable";
      try {
        const s = b.globalRiskIntelligenceEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "cross-region-learning-engine",
    label: "Cross-Region Learning Engine",
    missionId: "X4-16",
    runtimePath: "pillow/src/cross-region-learning-engine/",
    probe: (b) => {
      if (!b.crossRegionLearningEngine) return "unavailable";
      try {
        return b.crossRegionLearningEngine.getState().health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "empire-knowledge-engine",
    label: "Empire Knowledge Engine",
    missionId: "X5-02",
    runtimePath: "pillow/src/empire-knowledge-engine/",
    probe: (b) => {
      if (!b.empireKnowledgeEngine) return "unavailable";
      try {
        return b.empireKnowledgeEngine.getState().health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "empire-memory-engine",
    label: "Empire Memory Engine",
    missionId: "X5-03",
    runtimePath: "pillow/src/empire-memory-engine/",
    probe: (b) => {
      if (!b.empireMemoryEngine) return "unavailable";
      try {
        return b.empireMemoryEngine.getState().health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "empire-optimization-engine",
    label: "Empire Optimization Engine",
    missionId: "X5-04",
    runtimePath: "pillow/src/empire-optimization-engine/",
    probe: (b) => {
      if (!b.empireOptimizationEngine) return "unavailable";
      try {
        return b.empireOptimizationEngine.getState().health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "empire-capital-allocation",
    label: "Empire Capital Allocation",
    missionId: "X5-05",
    runtimePath: "pillow/src/empire-capital-allocation/",
    probe: (b) => {
      if (!b.empireCapitalAllocation) return "unavailable";
      try {
        return b.empireCapitalAllocation.getState().health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "empire-opportunity-engine",
    label: "Empire Opportunity Engine",
    missionId: "X5-06",
    runtimePath: "pillow/src/empire-opportunity-engine/",
    probe: (b) => {
      if (!b.empireOpportunityEngine) return "unavailable";
      try {
        return b.empireOpportunityEngine.getState().health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "empire-innovation-engine",
    label: "Empire Innovation Engine",
    missionId: "X5-07",
    runtimePath: "pillow/src/empire-innovation-engine/",
    probe: (b) => { if (!b.empireInnovationEngine) return "unavailable"; try { return b.empireInnovationEngine.getState().health.status === "failed" ? "degraded" : "ready"; } catch { return "unavailable"; } },
  },
  {
    id: "empire-resilience-engine",
    label: "Empire Resilience Engine",
    missionId: "X5-08",
    runtimePath: "pillow/src/empire-resilience-engine/",
    probe: (b) => { if (!b.empireResilienceEngine) return "unavailable"; try { return b.empireResilienceEngine.getState().health.status === "failed" ? "degraded" : "ready"; } catch { return "unavailable"; } },
  },
  {
    id: "empire-self-improvement-engine",
    label: "Empire Self-Improvement Engine",
    missionId: "X5-09",
    runtimePath: "pillow/src/empire-self-improvement-engine/",
    probe: (b) => { if (!b.empireSelfImprovementEngine) return "unavailable"; try { return b.empireSelfImprovementEngine.getState().health.status === "failed" ? "degraded" : "ready"; } catch { return "unavailable"; } },
  },
  {
    id: "executive-empire-dashboard",
    label: "Executive Empire Dashboard",
    missionId: "X5-10",
    runtimePath: "pillow/src/executive-empire-dashboard/",
    probe: (b) => { if (!b.executiveEmpireDashboard) return "unavailable"; try { return b.executiveEmpireDashboard.getState().health.status === "failed" ? "degraded" : "ready"; } catch { return "unavailable"; } },
  },
  {
    id: "cross-empire-governance-engine",
    label: "Cross-Empire Governance Engine",
    missionId: "X5-11",
    runtimePath: "pillow/src/cross-empire-governance-engine/",
    probe: (b) => { if (!b.crossEmpireGovernanceEngine) return "unavailable"; try { return b.crossEmpireGovernanceEngine.getState().health.status === "failed" ? "degraded" : "ready"; } catch { return "unavailable"; } },
  },
  {
    id: "autonomous-investment-engine",
    label: "Autonomous Investment Engine",
    missionId: "X5-12",
    runtimePath: "pillow/src/autonomous-investment-engine/",
    probe: (b) => { if (!b.autonomousInvestmentEngine) return "unavailable"; try { return b.autonomousInvestmentEngine.getState().health.status === "failed" ? "degraded" : "ready"; } catch { return "unavailable"; } },
  },
  {
    id: "enterprise-succession-engine",
    label: "Enterprise Succession Engine",
    missionId: "X5-13",
    runtimePath: "pillow/src/enterprise-succession-engine/",
    probe: (b) => { if (!b.enterpriseSuccessionEngine) return "unavailable"; try { return b.enterpriseSuccessionEngine.getState().health.status === "failed" ? "degraded" : "ready"; } catch { return "unavailable"; } },
  },
  {
    id: "empire-legacy-engine",
    label: "Empire Legacy Engine",
    missionId: "X5-14",
    runtimePath: "pillow/src/empire-legacy-engine/",
    probe: (b) => { if (!b.empireLegacyEngine) return "unavailable"; try { return b.empireLegacyEngine.getState().health.status === "failed" ? "degraded" : "ready"; } catch { return "unavailable"; } },
  },
  {
    id: "grand-king-advisory-engine",
    label: "Grand King Advisory Engine",
    missionId: "X5-15",
    runtimePath: "pillow/src/grand-king-advisory-engine/",
    probe: (b) => { if (!b.grandKingAdvisoryEngine) return "unavailable"; try { return b.grandKingAdvisoryEngine.getState().health.status === "failed" ? "degraded" : "ready"; } catch { return "unavailable"; } },
  },
  {
    id: "civilization-knowledge-engine",
    label: "Civilization Knowledge Engine",
    missionId: "X5-16",
    runtimePath: "pillow/src/civilization-knowledge-engine/",
    probe: (b) => { if (!b.civilizationKnowledgeEngine) return "unavailable"; try { return b.civilizationKnowledgeEngine.getState().health.status === "failed" ? "degraded" : "ready"; } catch { return "unavailable"; } },
  },
  {
    id: "autonomous-empire-evolution",
    label: "Autonomous Empire Evolution",
    missionId: "X5-17",
    runtimePath: "pillow/src/autonomous-empire-evolution/",
    probe: (b) => { if (!b.autonomousEmpireEvolution) return "unavailable"; try { return b.autonomousEmpireEvolution.getState().health.status === "failed" ? "degraded" : "ready"; } catch { return "unavailable"; } },
  },
  {
    id: "empire-performance-guardian",
    label: "Empire Performance Guardian",
    missionId: "X5-18",
    runtimePath: "pillow/src/empire-performance-guardian/",
    probe: (b) => { if (!b.empirePerformanceGuardian) return "unavailable"; try { return b.empirePerformanceGuardian.getState().health.status === "failed" ? "degraded" : "ready"; } catch { return "unavailable"; } },
  },
  {
    id: "infinite-growth-engine",
    label: "Infinite Growth Engine",
    missionId: "X5-19",
    runtimePath: "pillow/src/infinite-growth-engine/",
    probe: (b) => { if (!b.infiniteGrowthEngine) return "unavailable"; try { return b.infiniteGrowthEngine.getState().health.status === "failed" ? "degraded" : "ready"; } catch { return "unavailable"; } },
  },
  {
    id: "empire-certified",
    label: "Empire Certified",
    missionId: "X5-20",
    runtimePath: "pillow/src/empire-certified/",
    probe: (b) => {
      if (!b.empireCertified) return "unavailable";
      try {
        const s = b.empireCertified.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "executive-planner",
    label: "Executive Planner",
    missionId: "Q0-01",
    runtimePath: "pillow/src/executive-planner/",
    probe: (b) => {
      if (!b.executivePlanner) return "unavailable";
      try {
        const s = b.executivePlanner.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "opportunity-scanner",
    label: "Opportunity Scanner",
    missionId: "Q0-02",
    runtimePath: "pillow/src/opportunity-scanner/",
    probe: (b) => {
      if (!b.opportunityScanner) return "unavailable";
      try {
        const s = b.opportunityScanner.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "business-state-manager",
    label: "Business State Manager",
    missionId: "Q0-03",
    runtimePath: "pillow/src/business-state-manager/",
    probe: (b) => {
      if (!b.businessStateManager) return "unavailable";
      try {
        const s = b.businessStateManager.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "execution-memory",
    label: "Execution Memory",
    missionId: "Q0-04",
    runtimePath: "pillow/src/execution-memory/",
    probe: (b) => {
      if (!b.executionMemory) return "unavailable";
      try {
        const s = b.executionMemory.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "decision-engine",
    label: "Decision Engine",
    missionId: "Q0-05",
    runtimePath: "pillow/src/decision-engine/",
    probe: (b) => {
      if (!b.decisionEngine) return "unavailable";
      try {
        const s = b.decisionEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "approval-router",
    label: "Approval Router",
    missionId: "Q0-06",
    runtimePath: "pillow/src/approval-router/",
    probe: (b) => {
      if (!b.approvalRouter) return "unavailable";
      try {
        const s = b.approvalRouter.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "strategic-recommendation-engine",
    label: "Strategic Recommendation Engine",
    missionId: "Q0-07",
    runtimePath: "pillow/src/strategic-recommendation-engine/",
    probe: (b) => {
      if (!b.strategicRecommendationEngine) return "unavailable";
      try {
        const s = b.strategicRecommendationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "executive-audit-engine",
    label: "Executive Audit Engine",
    missionId: "Q0-08",
    runtimePath: "pillow/src/executive-audit-engine/",
    probe: (b) => {
      if (!b.executiveAuditEngine) return "unavailable";
      try {
        const s = b.executiveAuditEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "workforce-orchestrator",
    label: "Pillow Workforce Orchestrator",
    missionId: "Q0-09",
    runtimePath: "pillow/src/workforce-orchestrator/",
    probe: (b) => {
      if (!b.workforceOrchestrator) return "unavailable";
      try {
        const s = b.workforceOrchestrator.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "workforce-capability-registry",
    label: "Workforce Capability Registry",
    missionId: "Q0-10",
    runtimePath: "pillow/src/workforce-capability-registry/",
    probe: (b) => {
      if (!b.workforceCapabilityRegistry) return "unavailable";
      try {
        const s = b.workforceCapabilityRegistry.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "workforce-access-manager",
    label: "Workforce Access Manager",
    missionId: "Q0-11",
    runtimePath: "pillow/src/workforce-access-manager/",
    probe: (b) => {
      if (!b.workforceAccessManager) return "unavailable";
      try {
        const s = b.workforceAccessManager.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "skill-tool-router",
    label: "Skill & Tool Router",
    missionId: "Q0-12",
    runtimePath: "pillow/src/skill-tool-router/",
    probe: (b) => {
      if (!b.skillToolRouter) return "unavailable";
      try {
        const s = b.skillToolRouter.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "collective-reasoning-engine",
    label: "Collective Reasoning Engine",
    missionId: "Q0-13",
    runtimePath: "pillow/src/collective-reasoning-engine/",
    probe: (b) => {
      if (!b.collectiveReasoningEngine) return "unavailable";
      try {
        const s = b.collectiveReasoningEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "experience-replay-engine",
    label: "Experience Replay Engine",
    missionId: "Q0-14",
    runtimePath: "pillow/src/experience-replay-engine/",
    probe: (b) => {
      if (!b.experienceReplayEngine) return "unavailable";
      try {
        const s = b.experienceReplayEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "operational-playbook-engine",
    label: "Operational Playbook Engine",
    missionId: "Q0-15",
    runtimePath: "pillow/src/operational-playbook-engine/",
    probe: (b) => {
      if (!b.operationalPlaybookEngine) return "unavailable";
      try {
        const s = b.operationalPlaybookEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "decision-memory",
    label: "Decision Memory",
    missionId: "Q0-16",
    runtimePath: "pillow/src/decision-memory/",
    probe: (b) => {
      if (!b.decisionMemory) return "unavailable";
      try {
        const s = b.decisionMemory.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "adaptive-workforce-optimizer",
    label: "Adaptive Workforce Optimizer",
    missionId: "Q0-17",
    runtimePath: "pillow/src/adaptive-workforce-optimizer/",
    probe: (b) => {
      if (!b.adaptiveWorkforceOptimizer) return "unavailable";
      try {
        const s = b.adaptiveWorkforceOptimizer.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "executive-command-center",
    label: "Pillow Executive Command Center",
    missionId: "Q0-18",
    runtimePath: "pillow/src/executive-command-center/",
    probe: (b) => {
      if (!b.executiveCommandCenter) return "unavailable";
      try {
        const s = b.executiveCommandCenter.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "workforce-operating-system",
    label: "Workforce Operating System",
    missionId: "Q0-19",
    runtimePath: "pillow/src/workforce-operating-system/",
    probe: (b) => {
      if (!b.workforceOperatingSystem) return "unavailable";
      try {
        const s = b.workforceOperatingSystem.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "task-negotiation-protocol",
    label: "Task Negotiation Protocol",
    missionId: "Q0-20",
    runtimePath: "pillow/src/task-negotiation-protocol/",
    probe: (b) => {
      if (!b.taskNegotiationProtocol) return "unavailable";
      try {
        const s = b.taskNegotiationProtocol.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "peer-review-runtime",
    label: "Peer Review Runtime",
    missionId: "Q0-21",
    runtimePath: "pillow/src/peer-review-runtime/",
    probe: (b) => {
      if (!b.peerReviewRuntime) return "unavailable";
      try {
        const s = b.peerReviewRuntime.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "escalation-framework",
    label: "Escalation Framework",
    missionId: "Q0-22",
    runtimePath: "pillow/src/escalation-framework/",
    probe: (b) => {
      if (!b.escalationFramework) return "unavailable";
      try {
        const s = b.escalationFramework.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "knowledge-sharing-bus",
    label: "Knowledge Sharing Bus",
    missionId: "Q0-23",
    runtimePath: "pillow/src/knowledge-sharing-bus/",
    probe: (b) => {
      if (!b.knowledgeSharingBus) return "unavailable";
      try {
        const s = b.knowledgeSharingBus.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "inter-worker-messaging",
    label: "Inter-Worker Messaging",
    missionId: "Q0-24",
    runtimePath: "pillow/src/inter-worker-messaging/",
    probe: (b) => {
      if (!b.interWorkerMessaging) return "unavailable";
      try {
        const s = b.interWorkerMessaging.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "mission-coordination-engine",
    label: "Mission Coordination Engine",
    missionId: "Q0-25",
    runtimePath: "pillow/src/mission-coordination-engine/",
    probe: (b) => {
      if (!b.missionCoordinationEngine) return "unavailable";
      try {
        const s = b.missionCoordinationEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "executive-reporting-runtime",
    label: "Executive Reporting Runtime",
    missionId: "Q0-26",
    runtimePath: "pillow/src/executive-reporting-runtime/",
    probe: (b) => {
      if (!b.executiveReportingRuntime) return "unavailable";
      try {
        const s = b.executiveReportingRuntime.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "worker-quality-standard",
    label: "Worker Quality Standard",
    missionId: "Q0-27",
    runtimePath: "pillow/src/worker-quality-standard/",
    probe: (b) => {
      if (!b.workerQualityStandard) return "unavailable";
      try {
        const s = b.workerQualityStandard.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "worker-self-critique-protocol",
    label: "Worker Self-Critique Protocol",
    missionId: "Q0-28",
    runtimePath: "pillow/src/worker-self-critique-protocol/",
    probe: (b) => {
      if (!b.workerSelfCritiqueProtocol) return "unavailable";
      try {
        const s = b.workerSelfCritiqueProtocol.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "workforce-certification-monitor",
    label: "Workforce Certification Monitor",
    missionId: "Q0-29",
    runtimePath: "pillow/src/workforce-certification-monitor/",
    probe: (b) => {
      if (!b.workforceCertificationMonitor) return "unavailable";
      try {
        const s = b.workforceCertificationMonitor.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "unified-workforce-certification",
    label: "Unified Workforce Certification",
    missionId: "Q0-30",
    runtimePath: "pillow/src/unified-workforce-certification/",
    probe: (b) => {
      if (!b.unifiedWorkforceCertification) return "unavailable";
      try {
        const s = b.unifiedWorkforceCertification.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "worker-constitution",
    label: "Worker Constitution",
    missionId: "Q1-01",
    runtimePath: "pillow/src/worker-constitution/",
    probe: (b) => {
      if (!b.workerConstitution) return "unavailable";
      try {
        const s = b.workerConstitution.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "organization-charter",
    label: "Organization Charter",
    missionId: "Q1-02",
    runtimePath: "pillow/src/organization-charter/",
    probe: (b) => {
      if (!b.organizationCharter) return "unavailable";
      try {
        const s = b.organizationCharter.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "role-taxonomy",
    label: "Role Taxonomy",
    missionId: "Q1-03",
    runtimePath: "pillow/src/role-taxonomy/",
    probe: (b) => {
      if (!b.roleTaxonomy) return "unavailable";
      try {
        const s = b.roleTaxonomy.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "skill-taxonomy",
    label: "Skill Taxonomy",
    missionId: "Q1-04",
    runtimePath: "pillow/src/skill-taxonomy/",
    probe: (b) => {
      if (!b.skillTaxonomy) return "unavailable";
      try {
        const s = b.skillTaxonomy.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "authority-matrix",
    label: "Authority Matrix",
    missionId: "Q1-05",
    runtimePath: "pillow/src/authority-matrix/",
    probe: (b) => {
      if (!b.authorityMatrix) return "unavailable";
      try {
        const s = b.authorityMatrix.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "responsibility-matrix",
    label: "Responsibility Matrix",
    missionId: "Q1-06",
    runtimePath: "pillow/src/responsibility-matrix/",
    probe: (b) => {
      if (!b.responsibilityMatrix) return "unavailable";
      try {
        const s = b.responsibilityMatrix.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "worker-registry",
    label: "Worker Registry",
    missionId: "Q1-07",
    runtimePath: "pillow/src/worker-registry/",
    probe: (b) => {
      if (!b.workerRegistry) return "unavailable";
      try {
        const s = b.workerRegistry.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "worker-lifecycle",
    label: "Worker Lifecycle",
    missionId: "Q1-08",
    runtimePath: "pillow/src/worker-lifecycle/",
    probe: (b) => {
      if (!b.workerLifecycle) return "unavailable";
      try {
        const s = b.workerLifecycle.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "worker-assignment-engine",
    label: "Worker Assignment Engine",
    missionId: "Q1-09",
    runtimePath: "pillow/src/worker-assignment-engine/",
    probe: (b) => {
      if (!b.workerAssignmentEngine) return "unavailable";
      try {
        const s = b.workerAssignmentEngine.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "worker-monitoring",
    label: "Worker Monitoring",
    missionId: "Q1-10",
    runtimePath: "pillow/src/worker-monitoring/",
    probe: (b) => {
      if (!b.workerMonitoring) return "unavailable";
      try {
        const s = b.workerMonitoring.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "worker-performance-review",
    label: "Worker Performance Review",
    missionId: "Q1-11",
    runtimePath: "pillow/src/worker-performance-review/",
    probe: (b) => {
      if (!b.workerPerformanceReview) return "unavailable";
      try {
        const s = b.workerPerformanceReview.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "worker-recovery-system",
    label: "Worker Recovery System",
    missionId: "Q1-12",
    runtimePath: "pillow/src/worker-recovery-system/",
    probe: (b) => {
      if (!b.workerRecoverySystem) return "unavailable";
      try {
        const s = b.workerRecoverySystem.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "workforce-factory-certification",
    label: "Workforce Factory Certification",
    missionId: "Q1-13",
    runtimePath: "pillow/src/workforce-factory-certification/",
    probe: (b) => {
      if (!b.workforceFactoryCertification) return "unavailable";
      try {
        const s = b.workforceFactoryCertification.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "empire-builder-factory-core",
    label: "Empire Builder Factory Core",
    missionId: "Q2-01",
    runtimePath: "pillow/src/empire-builder-factory-core/",
    probe: (b) => {
      if (!b.empireBuilderFactoryCore) return "unavailable";
      try {
        const s = b.empireBuilderFactoryCore.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "business-idea-interpreter",
    label: "Business Idea Interpreter",
    missionId: "Q2-02",
    runtimePath: "pillow/src/business-idea-interpreter/",
    probe: (b) => {
      if (!b.businessIdeaInterpreter) return "unavailable";
      try {
        const s = b.businessIdeaInterpreter.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "empire-builder-model-generator",
    label: "Empire Builder Model Generator",
    missionId: "Q2-03",
    runtimePath: "pillow/src/empire-builder-model-generator/",
    probe: (b) => {
      if (!b.empireBuilderModelGenerator) return "unavailable";
      try {
        const s = b.empireBuilderModelGenerator.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "market-research-worker",
    label: "Market Research Worker",
    missionId: "Q2-04",
    runtimePath: "pillow/src/market-research-worker/",
    probe: (b) => {
      if (!b.marketResearchWorker) return "unavailable";
      try {
        const s = b.marketResearchWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "opportunity-evaluation-worker",
    label: "Opportunity Evaluation Worker",
    missionId: "Q2-05",
    runtimePath: "pillow/src/opportunity-evaluation-worker/",
    probe: (b) => {
      if (!b.opportunityEvaluationWorker) return "unavailable";
      try {
        const s = b.opportunityEvaluationWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "business-blueprint-worker",
    label: "Business Blueprint Worker",
    missionId: "Q2-06",
    runtimePath: "pillow/src/business-blueprint-worker/",
    probe: (b) => {
      if (!b.businessBlueprintWorker) return "unavailable";
      try {
        const s = b.businessBlueprintWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "launch-plan-worker",
    label: "Launch Plan Worker",
    missionId: "Q2-07",
    runtimePath: "pillow/src/launch-plan-worker/",
    probe: (b) => {
      if (!b.launchPlanWorker) return "unavailable";
      try {
        const s = b.launchPlanWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "business-risk-worker",
    label: "Business Risk Worker",
    missionId: "Q2-08",
    runtimePath: "pillow/src/business-risk-worker/",
    probe: (b) => {
      if (!b.businessRiskWorker) return "unavailable";
      try {
        const s = b.businessRiskWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "business-approval-pack-worker",
    label: "Business Approval Pack Worker",
    missionId: "Q2-09",
    runtimePath: "pillow/src/business-approval-pack-worker/",
    probe: (b) => {
      if (!b.businessApprovalPackWorker) return "unavailable";
      try {
        const s = b.businessApprovalPackWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "empire-builder-certification",
    label: "Empire Builder Certification",
    missionId: "Q2-10",
    runtimePath: "pillow/src/empire-builder-certification/",
    probe: (b) => {
      if (!b.empireBuilderCertification) return "unavailable";
      try {
        const s = b.empireBuilderCertification.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "commerce-factory-core",
    label: "Commerce Factory Core",
    missionId: "Q3-01",
    runtimePath: "pillow/src/commerce-factory-core/",
    probe: (b) => {
      if (!b.commerceFactoryCore) return "unavailable";
      try {
        const s = b.commerceFactoryCore.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "product-discovery-worker",
    label: "Product Discovery Worker",
    missionId: "Q3-02",
    runtimePath: "pillow/src/product-discovery-worker/",
    probe: (b) => {
      if (!b.productDiscoveryWorker) return "unavailable";
      try {
        const s = b.productDiscoveryWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "product-evaluation-worker",
    label: "Product Evaluation Worker",
    missionId: "Q3-03",
    runtimePath: "pillow/src/product-evaluation-worker/",
    probe: (b) => {
      if (!b.productEvaluationWorker) return "unavailable";
      try {
        const s = b.productEvaluationWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "supplier-discovery-worker",
    label: "Supplier Discovery Worker",
    missionId: "Q3-04",
    runtimePath: "pillow/src/supplier-discovery-worker/",
    probe: (b) => {
      if (!b.supplierDiscoveryWorker) return "unavailable";
      try {
        const s = b.supplierDiscoveryWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "supplier-evaluation-worker",
    label: "Supplier Evaluation Worker",
    missionId: "Q3-05",
    runtimePath: "pillow/src/supplier-evaluation-worker/",
    probe: (b) => {
      if (!b.supplierEvaluationWorker) return "unavailable";
      try {
        const s = b.supplierEvaluationWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "supplier-negotiation-worker",
    label: "Supplier Negotiation Worker",
    missionId: "Q3-06",
    runtimePath: "pillow/src/supplier-negotiation-worker/",
    probe: (b) => {
      if (!b.supplierNegotiationWorker) return "unavailable";
      try {
        const s = b.supplierNegotiationWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "product-image-worker",
    label: "Product Image Worker",
    missionId: "Q3-07",
    runtimePath: "pillow/src/product-image-worker/",
    probe: (b) => {
      if (!b.productImageWorker) return "unavailable";
      try {
        const s = b.productImageWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "product-listing-worker",
    label: "Product Listing Worker",
    missionId: "Q3-08",
    runtimePath: "pillow/src/product-listing-worker/",
    probe: (b) => {
      if (!b.productListingWorker) return "unavailable";
      try {
        const s = b.productListingWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "pricing-worker",
    label: "Pricing Worker",
    missionId: "Q3-09",
    runtimePath: "pillow/src/pricing-worker/",
    probe: (b) => {
      if (!b.pricingWorker) return "unavailable";
      try {
        const s = b.pricingWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "inventory-worker",
    label: "Inventory Worker",
    missionId: "Q3-10",
    runtimePath: "pillow/src/inventory-worker/",
    probe: (b) => {
      if (!b.inventoryWorker) return "unavailable";
      try {
        const s = b.inventoryWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "order-worker",
    label: "Order Worker",
    missionId: "Q3-11",
    runtimePath: "pillow/src/order-worker/",
    probe: (b) => {
      if (!b.orderWorker) return "unavailable";
      try {
        const s = b.orderWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "refund-dispute-worker",
    label: "Refund & Dispute Worker",
    missionId: "Q3-12",
    runtimePath: "pillow/src/refund-dispute-worker/",
    probe: (b) => {
      if (!b.refundDisputeWorker) return "unavailable";
      try {
        const s = b.refundDisputeWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "commerce-analytics-worker",
    label: "Commerce Analytics Worker",
    missionId: "Q3-13",
    runtimePath: "pillow/src/commerce-analytics-worker/",
    probe: (b) => {
      if (!b.commerceAnalyticsWorker) return "unavailable";
      try {
        const s = b.commerceAnalyticsWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "commerce-certification",
    label: "Commerce Certification",
    missionId: "Q3-14",
    runtimePath: "pillow/src/commerce-certification/",
    probe: (b) => {
      if (!b.commerceCertification) return "unavailable";
      try {
        const s = b.commerceCertification.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "media-factory-core",
    label: "Media Factory Core",
    missionId: "Q4-01",
    runtimePath: "pillow/src/media-factory-core/",
    probe: (b) => {
      if (!b.mediaFactoryCore) return "unavailable";
      try {
        const s = b.mediaFactoryCore.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "editor-in-chief-worker",
    label: "Editor-in-Chief Worker",
    missionId: "Q4-02",
    runtimePath: "pillow/src/editor-in-chief-worker/",
    probe: (b) => {
      if (!b.editorInChiefWorker) return "unavailable";
      try {
        const s = b.editorInChiefWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "trend-research-worker",
    label: "Trend Research Worker",
    missionId: "Q4-03",
    runtimePath: "pillow/src/trend-research-worker/",
    probe: (b) => {
      if (!b.trendResearchWorker) return "unavailable";
      try {
        const s = b.trendResearchWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "topic-planner-worker",
    label: "Topic Planner Worker",
    missionId: "Q4-04",
    runtimePath: "pillow/src/topic-planner-worker/",
    probe: (b) => {
      if (!b.topicPlannerWorker) return "unavailable";
      try {
        const s = b.topicPlannerWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "script-worker",
    label: "Script Worker",
    missionId: "Q4-05",
    runtimePath: "pillow/src/script-worker/",
    probe: (b) => {
      if (!b.scriptWorker) return "unavailable";
      try {
        const s = b.scriptWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "hook-worker",
    label: "Hook Worker",
    missionId: "Q4-06",
    runtimePath: "pillow/src/hook-worker/",
    probe: (b) => {
      if (!b.hookWorker) return "unavailable";
      try {
        const s = b.hookWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "thumbnail-worker",
    label: "Thumbnail Worker",
    missionId: "Q4-07",
    runtimePath: "pillow/src/thumbnail-worker/",
    probe: (b) => {
      if (!b.thumbnailWorker) return "unavailable";
      try {
        const s = b.thumbnailWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "visual-research-worker",
    label: "Visual Research Worker",
    missionId: "Q4-08",
    runtimePath: "pillow/src/visual-research-worker/",
    probe: (b) => {
      if (!b.visualResearchWorker) return "unavailable";
      try {
        const s = b.visualResearchWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "image-creative-worker",
    label: "Image & Creative Worker",
    missionId: "Q4-09",
    runtimePath: "pillow/src/image-creative-worker/",
    probe: (b) => {
      if (!b.imageCreativeWorker) return "unavailable";
      try {
        const s = b.imageCreativeWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "voice-worker",
    label: "Voice Worker",
    missionId: "Q4-10",
    runtimePath: "pillow/src/voice-worker/",
    probe: (b) => {
      if (!b.voiceWorker) return "unavailable";
      try {
        const s = b.voiceWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "video-assembly-worker",
    label: "Video Assembly Worker",
    missionId: "Q4-11",
    runtimePath: "pillow/src/video-assembly-worker/",
    probe: (b) => {
      if (!b.videoAssemblyWorker) return "unavailable";
      try {
        const s = b.videoAssemblyWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "subtitle-worker",
    label: "Subtitle Worker",
    missionId: "Q4-12",
    runtimePath: "pillow/src/subtitle-worker/",
    probe: (b) => {
      if (!b.subtitleWorker) return "unavailable";
      try {
        const s = b.subtitleWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "music-sound-worker",
    label: "Music & Sound Worker",
    missionId: "Q4-13",
    runtimePath: "pillow/src/music-sound-worker/",
    probe: (b) => {
      if (!b.musicSoundWorker) return "unavailable";
      try {
        const s = b.musicSoundWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "publishing-worker",
    label: "Publishing Worker",
    missionId: "Q4-14",
    runtimePath: "pillow/src/publishing-worker/",
    probe: (b) => {
      if (!b.publishingWorker) return "unavailable";
      try {
        const s = b.publishingWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "media-analytics-worker",
    label: "Media Analytics Worker",
    missionId: "Q4-15",
    runtimePath: "pillow/src/media-analytics-worker/",
    probe: (b) => {
      if (!b.mediaAnalyticsWorker) return "unavailable";
      try {
        const s = b.mediaAnalyticsWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "media-learning-worker",
    label: "Media Learning Worker",
    missionId: "Q4-16",
    runtimePath: "pillow/src/media-learning-worker/",
    probe: (b) => {
      if (!b.mediaLearningWorker) return "unavailable";
      try {
        const s = b.mediaLearningWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "channel-recommendation-worker",
    label: "Channel Recommendation Worker",
    missionId: "Q4-17",
    runtimePath: "pillow/src/channel-recommendation-worker/",
    probe: (b) => {
      if (!b.channelRecommendationWorker) return "unavailable";
      try {
        const s = b.channelRecommendationWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "media-executive-review-worker",
    label: "Media Executive Review Worker",
    missionId: "Q4-18",
    runtimePath: "pillow/src/media-executive-review-worker/",
    probe: (b) => {
      if (!b.mediaExecutiveReviewWorker) return "unavailable";
      try {
        const s = b.mediaExecutiveReviewWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "media-certification",
    label: "Media Certification",
    missionId: "Q4-19",
    runtimePath: "pillow/src/media-certification/",
    probe: (b) => {
      if (!b.mediaCertification) return "unavailable";
      try {
        const s = b.mediaCertification.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "digital-products-factory-core",
    label: "Digital Products Factory Core",
    missionId: "Q5-01",
    runtimePath: "pillow/src/digital-products-factory-core/",
    probe: (b) => {
      if (!b.digitalProductsFactoryCore) return "unavailable";
      try {
        const s = b.digitalProductsFactoryCore.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "digital-product-research-worker",
    label: "Digital Product Research Worker",
    missionId: "Q5-02",
    runtimePath: "pillow/src/digital-product-research-worker/",
    probe: (b) => {
      if (!b.digitalProductResearchWorker) return "unavailable";
      try {
        const s = b.digitalProductResearchWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "ebook-worker",
    label: "Ebook Worker",
    missionId: "Q5-03",
    runtimePath: "pillow/src/ebook-worker/",
    probe: (b) => {
      if (!b.ebookWorker) return "unavailable";
      try {
        const s = b.ebookWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "prompt-product-worker",
    label: "Prompt Product Worker",
    missionId: "Q5-04",
    runtimePath: "pillow/src/prompt-product-worker/",
    probe: (b) => {
      if (!b.promptProductWorker) return "unavailable";
      try {
        const s = b.promptProductWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "course-builder-worker",
    label: "Course Builder Worker",
    missionId: "Q5-05",
    runtimePath: "pillow/src/course-builder-worker/",
    probe: (b) => {
      if (!b.courseBuilderWorker) return "unavailable";
      try {
        const s = b.courseBuilderWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "template-builder-worker",
    label: "Template Builder Worker",
    missionId: "Q5-06",
    runtimePath: "pillow/src/template-builder-worker/",
    probe: (b) => {
      if (!b.templateBuilderWorker) return "unavailable";
      try {
        const s = b.templateBuilderWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "design-worker",
    label: "Design Worker",
    missionId: "Q5-07",
    runtimePath: "pillow/src/design-worker/",
    probe: (b) => {
      if (!b.designWorker) return "unavailable";
      try {
        const s = b.designWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "sales-page-worker",
    label: "Sales Page Worker",
    missionId: "Q5-08",
    runtimePath: "pillow/src/sales-page-worker/",
    probe: (b) => {
      if (!b.salesPageWorker) return "unavailable";
      try {
        const s = b.salesPageWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "checkout-worker",
    label: "Checkout Worker",
    missionId: "Q5-09",
    runtimePath: "pillow/src/checkout-worker/",
    probe: (b) => {
      if (!b.checkoutWorker) return "unavailable";
      try {
        const s = b.checkoutWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "digital-delivery-worker",
    label: "Digital Delivery Worker",
    missionId: "Q5-10",
    runtimePath: "pillow/src/digital-delivery-worker/",
    probe: (b) => {
      if (!b.digitalDeliveryWorker) return "unavailable";
      try {
        const s = b.digitalDeliveryWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "digital-product-analytics-worker",
    label: "Digital Product Analytics Worker",
    missionId: "Q5-11",
    runtimePath: "pillow/src/digital-product-analytics-worker/",
    probe: (b) => {
      if (!b.digitalProductAnalyticsWorker) return "unavailable";
      try {
        const s = b.digitalProductAnalyticsWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "digital-products-certification",
    label: "Digital Products Certification",
    missionId: "Q5-12",
    runtimePath: "pillow/src/digital-products-certification/",
    probe: (b) => {
      if (!b.digitalProductsCertification) return "unavailable";
      try {
        const s = b.digitalProductsCertification.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "enterprise-platform-factory-core",
    label: "Enterprise Platform Factory Core",
    missionId: "Q6-01",
    runtimePath: "pillow/src/enterprise-platform-factory-core/",
    probe: (b) => {
      if (!b.enterprisePlatformFactoryCore) return "unavailable";
      try {
        const s = b.enterprisePlatformFactoryCore.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "requirements-worker",
    label: "Requirements Worker",
    missionId: "Q6-02",
    runtimePath: "pillow/src/requirements-worker/",
    probe: (b) => {
      if (!b.requirementsWorker) return "unavailable";
      try {
        const s = b.requirementsWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "architecture-worker",
    label: "Architecture Worker",
    missionId: "Q6-03",
    runtimePath: "pillow/src/architecture-worker/",
    probe: (b) => {
      if (!b.architectureWorker) return "unavailable";
      try {
        const s = b.architectureWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "frontend-worker",
    label: "Frontend Worker",
    missionId: "Q6-04",
    runtimePath: "pillow/src/frontend-worker/",
    probe: (b) => {
      if (!b.frontendWorker) return "unavailable";
      try {
        const s = b.frontendWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "backend-worker",
    label: "Backend Worker",
    missionId: "Q6-05",
    runtimePath: "pillow/src/backend-worker/",
    probe: (b) => {
      if (!b.backendWorker) return "unavailable";
      try {
        const s = b.backendWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "database-worker",
    label: "Database Worker",
    missionId: "Q6-06",
    runtimePath: "pillow/src/database-worker/",
    probe: (b) => {
      if (!b.databaseWorker) return "unavailable";
      try {
        const s = b.databaseWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "authentication-worker",
    label: "Authentication Worker",
    missionId: "Q6-07",
    runtimePath: "pillow/src/authentication-worker/",
    probe: (b) => {
      if (!b.authenticationWorker) return "unavailable";
      try {
        const s = b.authenticationWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "authorization-worker",
    label: "Authorization Worker",
    missionId: "Q6-08",
    runtimePath: "pillow/src/authorization-worker/",
    probe: (b) => {
      if (!b.authorizationWorker) return "unavailable";
      try {
        const s = b.authorizationWorker.getState();
        return s.health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "billing-worker",
    label: "Billing Worker",
    missionId: "Q6-09",
    runtimePath: "pillow/src/billing-worker/",
    probe: (b) => {
      if (!b.billingWorker) return "unavailable";
      try {
        return b.billingWorker.getState().status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "api-integration-worker",
    label: "API Integration Worker",
    missionId: "Q6-10",
    runtimePath: "pillow/src/api-integration-worker/",
    probe: (b) => {
      if (!b.apiIntegrationWorker) return "unavailable";
      try {
        return b.apiIntegrationWorker.getState().status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "workflow-builder-worker",
    label: "Workflow Builder Worker",
    missionId: "Q6-11",
    runtimePath: "pillow/src/workflow-builder-worker/",
    probe: (b) => {
      if (!b.workflowBuilderWorker) return "unavailable";
      try {
        const status = b.workflowBuilderWorker.getState().status;
        return status === "failed" || status === "degraded" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "notification-worker",
    label: "Notification Worker",
    missionId: "Q6-12",
    runtimePath: "pillow/src/notification-worker/",
    probe: (b) => {
      if (!b.notificationWorker) return "unavailable";
      try {
        const status = b.notificationWorker.getState().status;
        return status === "blocked" || status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "testing-worker",
    label: "Testing Worker",
    missionId: "Q6-13",
    runtimePath: "pillow/src/testing-worker/",
    probe: (b) => {
      if (!b.testingWorker) return "unavailable";
      try {
        const status = b.testingWorker.getState().status;
        return status === "blocked" || status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "deployment-worker",
    label: "Deployment Worker",
    missionId: "Q6-14",
    runtimePath: "pillow/src/deployment-worker/",
    probe: (b) => {
      if (!b.deploymentWorker) return "unavailable";
      try {
        const status = b.deploymentWorker.getState().status;
        return status === "blocked" || status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "platform-certification",
    label: "Platform Certification",
    missionId: "Q6-15",
    runtimePath: "pillow/src/platform-certification/",
    probe: (b) => {
      if (!b.platformCertification) return "unavailable";
      try {
        const status = b.platformCertification.getState().status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "local-business-factory-core",
    label: "Local Business Factory Core",
    missionId: "Q7-01",
    runtimePath: "pillow/src/local-business-factory-core/",
    probe: (b) => {
      if (!b.localBusinessFactoryCore) return "unavailable";
      try {
        const status = b.localBusinessFactoryCore.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "local-market-research-worker",
    label: "Local Market Research Worker",
    missionId: "Q7-02",
    runtimePath: "pillow/src/local-market-research-worker/",
    probe: (b) => {
      if (!b.localMarketResearchWorker) return "unavailable";
      try {
        const status = b.localMarketResearchWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "service-offer-worker",
    label: "Service Offer Worker",
    missionId: "Q7-03",
    runtimePath: "pillow/src/service-offer-worker/",
    probe: (b) => {
      if (!b.serviceOfferWorker) return "unavailable";
      try {
        const status = b.serviceOfferWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "booking-worker",
    label: "Booking Worker",
    missionId: "Q7-04",
    runtimePath: "pillow/src/booking-worker/",
    probe: (b) => {
      if (!b.bookingWorker) return "unavailable";
      try {
        const status = b.bookingWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "crm-worker",
    label: "CRM Worker",
    missionId: "Q7-05",
    runtimePath: "pillow/src/crm-worker/",
    probe: (b) => {
      if (!b.crmWorker) return "unavailable";
      try {
        const status = b.crmWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "whatsapp-worker",
    label: "WhatsApp Worker",
    missionId: "Q7-06",
    runtimePath: "pillow/src/whatsapp-worker/",
    probe: (b) => {
      if (!b.whatsAppWorker) return "unavailable";
      try {
        const status = b.whatsAppWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "local-seo-worker",
    label: "Local SEO Worker",
    missionId: "Q7-07",
    runtimePath: "pillow/src/local-seo-worker/",
    probe: (b) => {
      if (!b.localSeoWorker) return "unavailable";
      try {
        const status = b.localSeoWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "lead-generation-worker",
    label: "Lead Generation Worker",
    missionId: "Q7-08",
    runtimePath: "pillow/src/lead-generation-worker/",
    probe: (b) => {
      if (!b.leadGenerationWorker) return "unavailable";
      try {
        const status = b.leadGenerationWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "operations-worker",
    label: "Operations Worker",
    missionId: "Q7-09",
    runtimePath: "pillow/src/operations-worker/",
    probe: (b) => {
      if (!b.operationsWorker) return "unavailable";
      try {
        const status = b.operationsWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "local-business-launch-pack",
    label: "Local Business Launch Pack",
    missionId: "Q7-10",
    runtimePath: "pillow/src/local-business-launch-pack/",
    probe: (b) => {
      if (!b.localBusinessLaunchPack) return "unavailable";
      try {
        const status = b.localBusinessLaunchPack.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "local-business-certification",
    label: "Local Business Certification",
    missionId: "Q7-11",
    runtimePath: "pillow/src/local-business-certification/",
    probe: (b) => {
      if (!b.localBusinessCertification) return "unavailable";
      try {
        const status = b.localBusinessCertification.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "affiliate-factory-core",
    label: "Affiliate Factory Core",
    missionId: "Q8-01",
    runtimePath: "pillow/src/affiliate-factory-core/",
    probe: (b) => {
      if (!b.affiliateFactoryCore) return "unavailable";
      try {
        const status = b.affiliateFactoryCore.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "affiliate-opportunity-worker",
    label: "Affiliate Opportunity Worker",
    missionId: "Q8-02",
    runtimePath: "pillow/src/affiliate-opportunity-worker/",
    probe: (b) => {
      if (!b.affiliateOpportunityWorker) return "unavailable";
      try {
        const status = b.affiliateOpportunityWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "comparison-site-worker",
    label: "Comparison Site Worker",
    missionId: "Q8-03",
    runtimePath: "pillow/src/comparison-site-worker/",
    probe: (b) => {
      if (!b.comparisonSiteWorker) return "unavailable";
      try {
        const status = b.comparisonSiteWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "review-content-worker",
    label: "Review Content Worker",
    missionId: "Q8-04",
    runtimePath: "pillow/src/review-content-worker/",
    probe: (b) => {
      if (!b.reviewContentWorker) return "unavailable";
      try {
        const status = b.reviewContentWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "seo-content-worker",
    label: "SEO Content Worker",
    missionId: "Q8-05",
    runtimePath: "pillow/src/seo-content-worker/",
    probe: (b) => {
      if (!b.seoContentWorker) return "unavailable";
      try {
        const status = b.seoContentWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "email-funnel-worker",
    label: "Email Funnel Worker",
    missionId: "Q8-06",
    runtimePath: "pillow/src/email-funnel-worker/",
    probe: (b) => {
      if (!b.emailFunnelWorker) return "unavailable";
      try {
        const status = b.emailFunnelWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "analytics-worker",
    label: "Analytics Worker",
    missionId: "Q8-07",
    runtimePath: "pillow/src/analytics-worker/",
    probe: (b) => {
      if (!b.analyticsWorker) return "unavailable";
      try {
        const status = b.analyticsWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "affiliate-compliance-worker",
    label: "Affiliate Compliance Worker",
    missionId: "Q8-08",
    runtimePath: "pillow/src/affiliate-compliance-worker/",
    probe: (b) => {
      if (!b.affiliateComplianceWorker) return "unavailable";
      try {
        const status = b.affiliateComplianceWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "affiliate-certification",
    label: "Affiliate Certification",
    missionId: "Q8-09",
    runtimePath: "pillow/src/affiliate-certification/",
    probe: (b) => {
      if (!b.affiliateCertification) return "unavailable";
      try {
        const status = b.affiliateCertification.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "capital-factory-core",
    label: "Capital Factory Core",
    missionId: "Q9-01",
    runtimePath: "pillow/src/capital-factory-core/",
    probe: (b) => {
      if (!b.capitalFactoryCore) return "unavailable";
      try {
        const status = b.capitalFactoryCore.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "accounting-worker",
    label: "Accounting Worker",
    missionId: "Q9-02",
    runtimePath: "pillow/src/accounting-worker/",
    probe: (b) => {
      if (!b.accountingWorker) return "unavailable";
      try {
        const status = b.accountingWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "cashflow-worker",
    label: "Cashflow Worker",
    missionId: "Q9-03",
    runtimePath: "pillow/src/cashflow-worker/",
    probe: (b) => {
      if (!b.cashflowWorker) return "unavailable";
      try {
        const status = b.cashflowWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "budget-planning-worker",
    label: "Budget Planning Worker",
    missionId: "Q9-04",
    runtimePath: "pillow/src/budget-planning-worker/",
    probe: (b) => {
      if (!b.budgetPlanningWorker) return "unavailable";
      try {
        const status = b.budgetPlanningWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "profitability-worker",
    label: "Profitability Worker",
    missionId: "Q9-05",
    runtimePath: "pillow/src/profitability-worker/",
    probe: (b) => {
      if (!b.profitabilityWorker) return "unavailable";
      try {
        const status = b.profitabilityWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "forecasting-worker",
    label: "Forecasting Worker",
    missionId: "Q9-06",
    runtimePath: "pillow/src/forecasting-worker/",
    probe: (b) => {
      if (!b.forecastingWorker) return "unavailable";
      try {
        const status = b.forecastingWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "tax-support-worker",
    label: "Tax Support Worker",
    missionId: "Q9-07",
    runtimePath: "pillow/src/tax-support-worker/",
    probe: (b) => {
      if (!b.taxSupportWorker) return "unavailable";
      try {
        const status = b.taxSupportWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "investment-planning-worker",
    label: "Investment Planning Worker",
    missionId: "Q9-08",
    runtimePath: "pillow/src/investment-planning-worker/",
    probe: (b) => {
      if (!b.investmentPlanningWorker) return "unavailable";
      try {
        const status = b.investmentPlanningWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "financial-reporting-worker",
    label: "Financial Reporting Worker",
    missionId: "Q9-09",
    runtimePath: "pillow/src/financial-reporting-worker/",
    probe: (b) => {
      if (!b.financialReportingWorker) return "unavailable";
      try {
        const status = b.financialReportingWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "capital-risk-worker",
    label: "Capital Risk Worker",
    missionId: "Q9-10",
    runtimePath: "pillow/src/capital-risk-worker/",
    probe: (b) => {
      if (!b.capitalRiskWorker) return "unavailable";
      try {
        const status = b.capitalRiskWorker.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "capital-factory-certification",
    label: "Capital Factory Certification",
    missionId: "Q9-11",
    runtimePath: "pillow/src/capital-factory-certification/",
    probe: (b) => {
      if (!b.capitalFactoryCertification) return "unavailable";
      try {
        const status = b.capitalFactoryCertification.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "shared-runtime-core",
    label: "Shared Runtime Core",
    missionId: "Q10-01",
    runtimePath: "pillow/src/shared-runtime-core/",
    probe: (b) => {
      if (!b.sharedRuntimeCore) return "unavailable";
      try {
        const status = b.sharedRuntimeCore.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "pillow-orchestration-runtime",
    label: "Pillow Orchestration Runtime",
    missionId: "Q10-02",
    runtimePath: "pillow/src/pillow-orchestration-runtime/",
    probe: (b) => {
      if (!b.pillowOrchestrationRuntime) return "unavailable";
      try {
        const status = b.pillowOrchestrationRuntime.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "mission-runtime",
    label: "Mission Runtime",
    missionId: "Q10-03",
    runtimePath: "pillow/src/mission-runtime/",
    probe: (b) => {
      if (!b.missionRuntime) return "unavailable";
      try {
        const status = b.missionRuntime.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "queue-runtime",
    label: "Queue Runtime",
    missionId: "Q10-04",
    runtimePath: "pillow/src/queue-runtime/",
    probe: (b) => {
      if (!b.queueRuntime) return "unavailable";
      try {
        const status = b.queueRuntime.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "memory-runtime",
    label: "Memory Runtime",
    missionId: "Q10-05",
    runtimePath: "pillow/src/memory-runtime/",
    probe: (b) => {
      if (!b.memoryRuntime) return "unavailable";
      try {
        const status = b.memoryRuntime.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "api-runtime",
    label: "API Runtime",
    missionId: "Q10-06",
    runtimePath: "pillow/src/api-runtime/",
    probe: (b) => {
      if (!b.apiRuntime) return "unavailable";
      try {
        const status = b.apiRuntime.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "tool-runtime",
    label: "Tool Runtime",
    missionId: "Q10-07",
    runtimePath: "pillow/src/tool-runtime/",
    probe: (b) => {
      if (!b.toolRuntime) return "unavailable";
      try {
        const status = b.toolRuntime.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "communication-runtime",
    label: "Communication Runtime",
    missionId: "Q10-08",
    runtimePath: "pillow/src/communication-runtime/",
    probe: (b) => {
      if (!b.communicationRuntime) return "unavailable";
      try {
        const status = b.communicationRuntime.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "approval-runtime",
    label: "Approval Runtime",
    missionId: "Q10-09",
    runtimePath: "pillow/src/approval-runtime/",
    probe: (b) => {
      if (!b.approvalRuntime) return "unavailable";
      try {
        const status = b.approvalRuntime.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "monitoring-runtime",
    label: "Monitoring Runtime",
    missionId: "Q10-10",
    runtimePath: "pillow/src/monitoring-runtime/",
    probe: (b) => {
      if (!b.monitoringRuntime) return "unavailable";
      try {
        const status = b.monitoringRuntime.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "recovery-runtime",
    label: "Recovery Runtime",
    missionId: "Q10-11",
    runtimePath: "pillow/src/recovery-runtime/",
    probe: (b) => {
      if (!b.recoveryRuntime) return "unavailable";
      try {
        const status = b.recoveryRuntime.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "scheduling-runtime",
    label: "Scheduling Runtime",
    missionId: "Q10-12",
    runtimePath: "pillow/src/scheduling-runtime/",
    probe: (b) => {
      if (!b.schedulingRuntime) return "unavailable";
      try {
        const status = b.schedulingRuntime.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "audit-runtime",
    label: "Audit Runtime",
    missionId: "Q10-13",
    runtimePath: "pillow/src/audit-runtime/",
    probe: (b) => {
      if (!b.auditRuntime) return "unavailable";
      try {
        const status = b.auditRuntime.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "shared-runtime-certification",
    label: "Shared Runtime Certification",
    missionId: "Q10-14",
    runtimePath: "pillow/src/shared-runtime-certification/",
    probe: (b) => {
      if (!b.sharedRuntimeCertification) return "unavailable";
      try {
        const status = b.sharedRuntimeCertification.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "production-certification-core",
    label: "Production Certification Core",
    missionId: "Q11-01",
    runtimePath: "pillow/src/production-certification-core/",
    probe: (b) => {
      if (!b.productionCertificationCore) return "unavailable";
      try {
        const status = b.productionCertificationCore.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "worker-readiness-audit",
    label: "Worker Readiness Audit",
    missionId: "Q11-02",
    runtimePath: "pillow/src/worker-readiness-audit/",
    probe: (b) => {
      if (!b.workerReadinessAudit) return "unavailable";
      try {
        const status = b.workerReadinessAudit.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "pillow-command-audit",
    label: "Pillow Command Audit",
    missionId: "Q11-03",
    runtimePath: "pillow/src/pillow-command-audit/",
    probe: (b) => {
      if (!b.pillowCommandAudit) return "unavailable";
      try {
        const status = b.pillowCommandAudit.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "business-factory-audit",
    label: "Business Factory Audit",
    missionId: "Q11-04",
    runtimePath: "pillow/src/business-factory-audit/",
    probe: (b) => {
      if (!b.businessFactoryAudit) return "unavailable";
      try {
        const status = b.businessFactoryAudit.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "security-audit",
    label: "Security Audit",
    missionId: "Q11-05",
    runtimePath: "pillow/src/security-audit/",
    probe: (b) => {
      if (!b.securityAudit) return "unavailable";
      try {
        const status = b.securityAudit.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "performance-audit",
    label: "Performance Audit",
    missionId: "Q11-06",
    runtimePath: "pillow/src/performance-audit/",
    probe: (b) => {
      if (!b.performanceAudit) return "unavailable";
      try {
        const status = b.performanceAudit.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "recovery-audit",
    label: "Recovery Audit",
    missionId: "Q11-07",
    runtimePath: "pillow/src/recovery-audit/",
    probe: (b) => {
      if (!b.recoveryAudit) return "unavailable";
      try {
        const status = b.recoveryAudit.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "executive-acceptance-pack",
    label: "Executive Acceptance Pack",
    missionId: "Q11-09",
    runtimePath: "pillow/src/executive-acceptance-pack/",
    probe: (b) => {
      if (!b.executiveAcceptancePack) return "unavailable";
      try {
        const status = b.executiveAcceptancePack.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "grand-king-acceptance-gate",
    label: "Grand King Acceptance Gate",
    missionId: "Q11-10",
    runtimePath: "pillow/src/grand-king-acceptance-gate/",
    probe: (b) => {
      if (!b.grandKingAcceptanceGate) return "unavailable";
      try {
        const status = b.grandKingAcceptanceGate.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "post-launch-monitoring",
    label: "Post-Launch Monitoring",
    missionId: "Q11-11",
    runtimePath: "pillow/src/post-launch-monitoring/",
    probe: (b) => {
      if (!b.postLaunchMonitoring) return "unavailable";
      try {
        const status = b.postLaunchMonitoring.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "q-series-certification",
    label: "Q Series Certification",
    missionId: "Q11-12",
    runtimePath: "pillow/src/q-series-certification/",
    probe: (b) => {
      if (!b.qSeriesCertification) return "unavailable";
      try {
        const status = b.qSeriesCertification.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "q-series-completion",
    label: "Q Series Completion",
    missionId: "Q11-13",
    runtimePath: "pillow/src/q-series-completion/",
    probe: (b) => {
      if (!b.qSeriesCompletion) return "unavailable";
      try {
        const status = b.qSeriesCompletion.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "ai-innovation-factory",
    label: "AI Innovation Factory",
    missionId: "Q12-01",
    runtimePath: "pillow/src/ai-innovation-factory/",
    probe: (b) => {
      if (!b.aiInnovationFactory) return "unavailable";
      try {
        const status = b.aiInnovationFactory.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "implementation-specification-engine",
    label: "Implementation Specification Engine",
    missionId: "Q13-01",
    runtimePath: "pillow/src/implementation-specification-engine/",
    probe: (b) => {
      if (!b.implementationSpecificationEngine) return "unavailable";
      try {
        const status = b.implementationSpecificationEngine.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "repository-intelligence-engine",
    label: "Repository Intelligence Engine",
    missionId: "Q13-02",
    runtimePath: "pillow/src/repository-intelligence-engine/",
    probe: (b) => {
      if (!b.repositoryIntelligenceEngine) return "unavailable";
      try {
        const status = b.repositoryIntelligenceEngine.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "mission-planning-engine",
    label: "Mission Planning Engine",
    missionId: "Q13-03",
    runtimePath: "pillow/src/mission-planning-engine/",
    probe: (b) => {
      if (!b.missionPlanningEngine) return "unavailable";
      try {
        const status = b.missionPlanningEngine.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "cursor-specification-generator",
    label: "Cursor Specification Generator",
    missionId: "Q13-04",
    runtimePath: "pillow/src/cursor-specification-generator/",
    probe: (b) => {
      if (!b.cursorSpecificationGenerator) return "unavailable";
      try {
        const status = b.cursorSpecificationGenerator.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "implementation-recovery-planner",
    label: "Implementation Recovery Planner",
    missionId: "Q13-05",
    runtimePath: "pillow/src/implementation-recovery-planner/",
    probe: (b) => {
      if (!b.implementationRecoveryPlanner) return "unavailable";
      try {
        const status = b.implementationRecoveryPlanner.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "programme-certification-factory",
    label: "Programme Certification Factory",
    missionId: "Q13-06",
    runtimePath: "pillow/src/programme-certification-factory/",
    probe: (b) => {
      if (!b.programmeCertificationFactory) return "unavailable";
      try {
        const status = b.programmeCertificationFactory.getState().health.status;
        return status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "global-expansion-simulator",
    label: "Global Expansion Simulator",
    missionId: "X4-17",
    runtimePath: "pillow/src/global-expansion-simulator/",
    probe: (b) => {
      if (!b.globalExpansionSimulator) return "unavailable";
      try {
        return b.globalExpansionSimulator.getState().health.status === "failed" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "international-executive-cockpit",
    label: "International Executive Cockpit",
    missionId: "X4-18",
    runtimePath: "pillow/src/international-executive-cockpit/",
    probe: (b) => {
      if (!b.internationalExecutiveCockpit) return "unavailable";
      try {
        return b.internationalExecutiveCockpit.getState().health.status === "standby" ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "global-operations-certified",
    label: "Global Operations Certified",
    missionId: "X4-19",
    runtimePath: "pillow/src/global-operations-certified/",
    probe: (b) => {
      if (!b.globalOperationsCertified) return "unavailable";
      try {
        const s = b.globalOperationsCertified.getState();
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
