import type { DigitalProductAnalyticsWorkerConfiguration } from "./configuration.js";
import type {
  ANALYTICS_TYPES,
  DPA_CAPABILITIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  RESEARCH_COMPLIANCE_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AnalyticsType = (typeof ANALYTICS_TYPES)[number];
export type ResearchComplianceLevel = (typeof RESEARCH_COMPLIANCE_LEVELS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type DigitalProductAnalyticsWorkerCapability = (typeof DPA_CAPABILITIES)[number];

export type AnalyticsStep = {
  stepId: string;
  stepType: string;
  title: string;
  order: number;
  summary?: string;
};

export type SalesMetrics = {
  unitsSold: number;
  ordersCount: number;
  periodLabel: string;
  measured: boolean;
  dataSource?: string;
};

export type RevenueMetrics = {
  grossRevenue: number;
  currency: string;
  periodLabel: string;
  measured: boolean;
  dataSource?: string;
};

export type ProfitMetrics = {
  estimatedProfit: number;
  marginPercent: number;
  currency: string;
  periodLabel: string;
  measured: boolean;
  estimated: boolean;
  dataSource?: string;
};

export type ConversionMetrics = {
  conversionRatePercent: number;
  visitorsPlaceholder: number;
  checkoutsStarted: number;
  purchasesCompleted: number;
  measured: boolean;
  dataSource?: string;
};

export type RefundMetrics = {
  refundRatePercent: number;
  refundCount: number;
  refundAmount: number;
  currency: string;
  measured: boolean;
  dataSource?: string;
};

export type CustomerFeedbackSummary = {
  sentiment: "positive" | "neutral" | "mixed" | "negative" | "unknown";
  themes: string[];
  sampleSize: number;
  summary: string;
};

export type ImprovementRecommendation = {
  recommendationId: string;
  title: string;
  rationale: string;
  priority: "high" | "medium" | "low";
  category: string;
  measuredBasis: string[];
  isRecommendation: true;
};

export type AnalyticsValidationResults = {
  summary: string;
  errors: string[];
  warnings: string[];
  metricsAvailable: boolean;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

export type SelfReviewFinding = {
  findingId: string;
  category: string;
  severity: "info" | "warning" | "error";
  message: string;
};

/** Machine-readable Digital Product Analytics Report (Q5-11). */
export type DigitalProductAnalyticsReport = {
  analyticsReportId: string;
  timestamp: string;
  productId: string;
  productTitle: string;
  salesMetrics: SalesMetrics;
  revenueMetrics: RevenueMetrics;
  profitMetrics: ProfitMetrics;
  conversionMetrics: ConversionMetrics;
  refundMetrics: RefundMetrics;
  customerFeedbackSummary: CustomerFeedbackSummary;
  improvementRecommendations: ImprovementRecommendation[];
  executiveSummary: string;
  confidenceScore: number;
  metadataVersion: string;
  researchReportId: string | null;
  opportunityId: string | null;
  businessId: string;
  factoryMissionId: string;
  checkoutId: string | null;
  deliveryId: string | null;
  analyticsType: AnalyticsType;
  analyticsSteps: AnalyticsStep[];
  supportedAnalyticsTypes: AnalyticsType[];
  underperformingDetected: boolean;
  trendsDetected: boolean;
  selfReviewPassed: boolean;
  selfReviewFindings: SelfReviewFinding[];
  selfReviewSummary: string;
  qualityReview: string;
  complianceReview: string;
  researchCompliance: ResearchComplianceLevel;
  researchComplianceNotes: string;
  workerId: string;
  reportVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverEditProducts: true;
  neverProcessPayments: true;
  neverDeliverProducts: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ512OrLater: true;
  neverModifyProductsWithoutPillowApproval: true;
  neverFabricateMetrics: true;
  preserveCompleteDataTraceability: true;
  distinguishMeasuredDataFromRecommendations: true;
  preserveHistoricalAnalytics: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type AnalyticsContext = {
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  checkoutId?: string | null;
  deliveryId?: string | null;
  productTitle?: string | null;
  productId?: string | null;
  analyticsType?: AnalyticsType | null;
  currency?: string | null;
  periodLabel?: string | null;
  feedbackThemes?: string[];
  feedbackSentiment?: CustomerFeedbackSummary["sentiment"] | null;
};

export type DigitalProductAnalyticsWorkerInput = {
  analyticsReportId?: string | null;
  productId?: string | null;
  productTitle?: string | null;
  checkoutId?: string | null;
  deliveryId?: string | null;
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  analyticsType?: AnalyticsType | string | null;
  currency?: string | null;
  periodLabel?: string | null;
  /** Optional measured input fields — when absent, metrics marked measured:false. */
  unitsSold?: number | null;
  ordersCount?: number | null;
  grossRevenue?: number | null;
  estimatedProfit?: number | null;
  marginPercent?: number | null;
  conversionRatePercent?: number | null;
  visitorsPlaceholder?: number | null;
  checkoutsStarted?: number | null;
  purchasesCompleted?: number | null;
  refundRatePercent?: number | null;
  refundCount?: number | null;
  refundAmount?: number | null;
  feedbackThemes?: string[] | null;
  feedbackSentiment?: CustomerFeedbackSummary["sentiment"] | null;
  feedbackSampleSize?: number | null;
  feedbackSummary?: string | null;
  confidenceScore?: number | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  editProducts?: boolean;
  modifyProducts?: boolean;
  processPayments?: boolean;
  deliverProducts?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ512OrLater?: boolean;
  fabricateMetrics?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type DigitalProductAnalyticsWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type DigitalProductAnalyticsWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-DPA-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: DigitalProductAnalyticsWorkerCapability[];
  totalAnalyticsReports: number;
  lastAnalyticsReportId: string | null;
  lastAnalyticsType: AnalyticsType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type DigitalProductAnalyticsWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  analyticsReports: DigitalProductAnalyticsReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverEditProducts: true;
  neverProcessPayments: true;
  neverDeliverProducts: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ512OrLater: true;
  neverFabricateMetrics: true;
};

export type DigitalProductAnalyticsWorkerRunReport = {
  analyticsRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "track_product_sales"
    | "track_revenue_and_profit_metrics"
    | "track_conversion_rates"
    | "track_refund_rates"
    | "analyse_customer_feedback"
    | "detect_product_performance_trends"
    | "detect_underperforming_products"
    | "recommend_improvement_opportunities"
    | "generate_executive_performance_summaries"
    | "produce_digital_product_analytics_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: DigitalProductAnalyticsWorkerEngineRecord;
  catalog: DigitalProductAnalyticsWorkerCatalog | null;
  analyticsReports: DigitalProductAnalyticsReport[];
  latestAnalyticsReport: DigitalProductAnalyticsReport | null;
  integrations: IntegrationHandshake[];
  validation: DigitalProductAnalyticsWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type DigitalProductAnalyticsWorkerState = {
  engineVersion: "PILLOW-DPA-001";
  missionId: "Q5-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: DigitalProductAnalyticsWorkerConfiguration;
  latestReport: DigitalProductAnalyticsWorkerRunReport | null;
  engineRecord: DigitalProductAnalyticsWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalAnalyticsReports: number;
    lastAnalyticsReportId: string | null;
    lastAnalyticsType: AnalyticsType | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type DigitalProductAnalyticsWorkerCockpitSnapshot = {
  missionId: "Q5-11";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalAnalyticsReports: number;
  latestAnalyticsReportId: string | null;
  lastAnalyticsType: AnalyticsType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverEditProducts: true;
  neverProcessPayments: true;
  neverDeliverProducts: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ512OrLater: true;
  neverFabricateMetrics: true;
};

export type SelfReviewResult = {
  passed: boolean;
  summary: string;
  qualityReview: string;
  complianceReview: string;
  findings: SelfReviewFinding[];
  confidenceScore: number;
  researchCompliance: ResearchComplianceLevel;
  researchComplianceNotes: string;
  metricsAvailable: boolean;
};
