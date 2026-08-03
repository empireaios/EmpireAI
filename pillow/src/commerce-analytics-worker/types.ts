import type { CommerceAnalyticsWorkerConfiguration } from "./configuration.js";
import type {
  CAW_CAPABILITIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  INTEGRATION_TARGETS,
  METRIC_KINDS,
  OPERATIONAL_STATES,
  OPPORTUNITY_SEVERITIES,
  PRODUCT_PERFORMANCE_CLASSIFICATIONS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type MetricKind = (typeof METRIC_KINDS)[number];
export type ProductPerformanceClassification =
  (typeof PRODUCT_PERFORMANCE_CLASSIFICATIONS)[number];
export type OpportunitySeverity = (typeof OPPORTUNITY_SEVERITIES)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type CommerceAnalyticsWorkerCapability = (typeof CAW_CAPABILITIES)[number];

export type MetricValue = {
  value: number;
  kind: MetricKind;
  note: string;
};

export type EvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  relatedTopic: string;
  recordedAt: string;
};

export type SignificantChange = {
  changeId: string;
  metric: string;
  previousValue: number;
  currentValue: number;
  deltaPercent: number;
  significance: string;
  kind: MetricKind;
  notedAt: string;
};

export type ImprovementOpportunity = {
  opportunityId: string;
  severity: OpportunitySeverity;
  code: string;
  title: string;
  description: string;
  relatedMetric: string;
};

export type ExecutiveRecommendation = {
  recommendationId: string;
  priority: "high" | "medium" | "low";
  recommendation: string;
  rationale: string;
};

/** Analytics context inputs for commerce intelligence operations (read-only). */
export type AnalyticsContextInput = {
  businessId?: string | null;
  productId?: string | null;
  productName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  unitsSold?: number | null;
  revenue?: number | null;
  sessions?: number | null;
  orders?: number | null;
  averageOrderValue?: number | null;
  grossProfit?: number | null;
  netProfit?: number | null;
  costOfGoods?: number | null;
  customerIssueCount?: number | null;
  refundCount?: number | null;
  refundAmount?: number | null;
  onTimeFulfilments?: number | null;
  totalFulfilments?: number | null;
  fulfilmentFailures?: number | null;
  currentStock?: number | null;
  reorderPoint?: number | null;
  recommendedSellingPrice?: number | null;
  landedCost?: number | null;
  targetMargin?: number | null;
  previousUnitsSold?: number | null;
  previousRevenue?: number | null;
  previousConversionRate?: number | null;
  previousNetProfit?: number | null;
  previousRefundRate?: number | null;
  periodLabel?: string | null;
  pricingReportId?: string | null;
  inventoryReportId?: string | null;
  orderReportIds?: string[] | null;
  refundCaseIds?: string[] | null;
  businessMissionId?: string | null;
};

/** Machine-readable Commerce Analytics Report (Q3-13). */
export type CommerceAnalyticsReport = {
  analyticsReportId: string;
  timestamp: string;
  businessId: string;
  productId: string;
  productName: string;
  supplierId: string | null;
  supplierName: string | null;
  salesMetrics: {
    unitsSold: MetricValue;
    revenue: MetricValue;
    averageOrderValue: MetricValue;
    periodLabel: string;
  };
  conversionMetrics: {
    sessions: MetricValue;
    orders: MetricValue;
    conversionRate: MetricValue;
  };
  profitMetrics: {
    grossProfit: MetricValue;
    netProfit: MetricValue;
    grossMarginPercent: MetricValue;
    netMarginPercent: MetricValue;
  };
  customerIssueMetrics: {
    issueCount: MetricValue;
    issueRate: MetricValue;
    topIssueTypes: string[];
  };
  refundMetrics: {
    refundCount: MetricValue;
    refundRate: MetricValue;
    refundAmount: MetricValue;
  };
  supplierPerformance: {
    supplierId: string | null;
    onTimeRate: MetricValue;
    fulfilmentFailureRate: MetricValue;
    stockAvailabilityScore: MetricValue;
    overallScore: MetricValue;
  };
  productPerformanceClassification: ProductPerformanceClassification;
  significantChanges: SignificantChange[];
  improvementOpportunities: ImprovementOpportunity[];
  executiveRecommendations: ExecutiveRecommendation[];
  confidenceScore: number;
  pricingReportId: string | null;
  inventoryReportId: string | null;
  orderReportIds: string[];
  refundCaseIds: string[];
  businessMissionId: string | null;
  supportingEvidence: EvidenceItem[];
  metadataVersion: string;
  reportVersion: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverModifyProducts: true;
  neverModifyPricing: true;
  neverModifySuppliers: true;
  neverExecuteOptimizations: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ314OrLater: true;
  neverModifyOperationalData: true;
  preserveCompleteTraceability: true;
  preserveHistoricalAnalytics: true;
  distinguishMeasuredFromEstimates: true;
  highlightSignificantChanges: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type CommerceAnalyticsWorkerInput = {
  analyticsReportId?: string | null;
  analyticsContext?: AnalyticsContextInput | null;
  businessId?: string | null;
  productId?: string | null;
  productName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  unitsSold?: number | null;
  revenue?: number | null;
  sessions?: number | null;
  orders?: number | null;
  averageOrderValue?: number | null;
  grossProfit?: number | null;
  netProfit?: number | null;
  costOfGoods?: number | null;
  customerIssueCount?: number | null;
  refundCount?: number | null;
  refundAmount?: number | null;
  onTimeFulfilments?: number | null;
  totalFulfilments?: number | null;
  fulfilmentFailures?: number | null;
  currentStock?: number | null;
  reorderPoint?: number | null;
  recommendedSellingPrice?: number | null;
  landedCost?: number | null;
  targetMargin?: number | null;
  previousUnitsSold?: number | null;
  previousRevenue?: number | null;
  previousConversionRate?: number | null;
  previousNetProfit?: number | null;
  previousRefundRate?: number | null;
  periodLabel?: string | null;
  pricingReportId?: string | null;
  inventoryReportId?: string | null;
  orderReportIds?: string[] | null;
  refundCaseIds?: string[] | null;
  businessMissionId?: string | null;
  evidenceSources?: Array<{
    source?: string | null;
    claim?: string | null;
    kind?: EvidenceKind | string | null;
    relatedTopic?: string | null;
  }> | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  modifyProducts?: boolean;
  modifyPricing?: boolean;
  modifySuppliers?: boolean;
  executeOptimizations?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ314OrLater?: boolean;
  modifyOperationalData?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type CommerceAnalyticsWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CommerceAnalyticsWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-CAW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CommerceAnalyticsWorkerCapability[];
  totalAnalyticsReports: number;
  lastAnalyticsReportId: string | null;
  lastProductPerformanceClassification: ProductPerformanceClassification | null;
  lastConfidenceScore: number | null;
  lastOpportunityCount: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type CommerceAnalyticsWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  analyticsReports: CommerceAnalyticsReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverModifyProducts: true;
  neverModifyPricing: true;
  neverModifySuppliers: true;
  neverExecuteOptimizations: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverModifyOperationalData: true;
};

export type CommerceAnalyticsWorkerRunReport = {
  analyticsRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_context"
    | "track_product_performance"
    | "track_sales_performance"
    | "track_conversion_rates"
    | "track_gross_and_net_profit"
    | "track_customer_issues"
    | "track_refund_rates"
    | "track_supplier_performance"
    | "detect_declining_products"
    | "detect_high_performing_products"
    | "identify_optimization_opportunities"
    | "produce_report"
    | "submit_findings"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: CommerceAnalyticsWorkerEngineRecord;
  catalog: CommerceAnalyticsWorkerCatalog | null;
  analyticsReports: CommerceAnalyticsReport[];
  latestAnalyticsReport: CommerceAnalyticsReport | null;
  integrations: IntegrationHandshake[];
  validation: CommerceAnalyticsWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CommerceAnalyticsWorkerState = {
  engineVersion: "PILLOW-CAW-001";
  missionId: "Q3-13";
  status: EngineStatus;
  initializedAt: string;
  configuration: CommerceAnalyticsWorkerConfiguration;
  latestReport: CommerceAnalyticsWorkerRunReport | null;
  engineRecord: CommerceAnalyticsWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalAnalyticsReports: number;
    lastAnalyticsReportId: string | null;
    lastProductPerformanceClassification: ProductPerformanceClassification | null;
    lastConfidenceScore: number | null;
    lastOpportunityCount: number | null;
    notes: string[];
  };
};

export type CommerceAnalyticsWorkerCockpitSnapshot = {
  missionId: "Q3-13";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalAnalyticsReports: number;
  latestAnalyticsReportId: string | null;
  lastProductPerformanceClassification: ProductPerformanceClassification | null;
  lastConfidenceScore: number | null;
  lastOpportunityCount: number | null;
  workerId: string;
  neverModifyProducts: true;
  neverModifyPricing: true;
  neverModifySuppliers: true;
  neverExecuteOptimizations: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverModifyOperationalData: true;
};
