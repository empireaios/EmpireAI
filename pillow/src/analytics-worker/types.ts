import type {
  ANOMALY_SEVERITIES,
  ANW_METADATA_VERSION,
  ANALYTICS_WORKER_IDENTITY,
  AUDIT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  TREND_DIRECTIONS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AnalyticsWorkerConfiguration } from "./configuration.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type TrendDirection = (typeof TREND_DIRECTIONS)[number];
export type AnomalySeverity = (typeof ANOMALY_SEVERITIES)[number];

export type MetricSnapshot = {
  clicks?: number | null;
  uniqueClicks?: number | null;
  conversions?: number | null;
  commissionAmount?: number | null;
  revenueAmount?: number | null;
  currency?: string | null;
  impressions?: number | null;
  organicSessions?: number | null;
  averageRank?: number | null;
  rankingKeywords?: number | null;
  funnelStarts?: number | null;
  funnelCompletions?: number | null;
  emailOpens?: number | null;
  emailClicks?: number | null;
  periodLabel?: string | null;
  priorPeriod?: MetricSnapshot | null;
};

export type OpportunityFixture = {
  reportId?: string;
  affiliateProjectId?: string;
  affiliateBusinessId?: string;
  opportunityScore?: number | null;
  productCategory?: string;
};

export type SeoFixture = {
  reportId?: string;
  affiliateProjectId?: string;
  topic?: string;
  contentQualitySummary?: { completenessScore?: number };
  targetKeywords?: Array<{ keyword: string }>;
};

export type FunnelFixture = {
  reportId?: string;
  affiliateProjectId?: string;
  funnelName?: string;
  funnelStages?: Array<{ stageType: string; name: string }>;
  emailSequence?: Array<{ emails?: unknown[] }>;
  conversionObjectives?: string[];
};

export type ClickMetrics = {
  metricsId: string;
  clicks: number | null;
  uniqueClicks: number | null;
  impressions: number | null;
  ctr: number | null;
  fabricated: false;
  evidencePresent: boolean;
};

export type ConversionMetrics = {
  metricsId: string;
  conversions: number | null;
  conversionRate: number | null;
  fabricated: false;
  evidencePresent: boolean;
};

export type CommissionSummary = {
  summaryId: string;
  commissionAmount: number | null;
  currency: string | null;
  epc: number | null;
  fabricated: false;
  evidencePresent: boolean;
};

export type RevenueSummary = {
  summaryId: string;
  revenueAmount: number | null;
  currency: string | null;
  fabricated: false;
  evidencePresent: boolean;
};

export type SeoPerformance = {
  summaryId: string;
  organicSessions: number | null;
  averageRank: number | null;
  rankingKeywords: number | null;
  contentCompleteness: number | null;
  notes: string[];
  fabricated: false;
  evidencePresent: boolean;
};

export type FunnelPerformance = {
  summaryId: string;
  funnelStarts: number | null;
  funnelCompletions: number | null;
  completionRate: number | null;
  emailOpens: number | null;
  emailClicks: number | null;
  stageCount: number;
  notes: string[];
  fabricated: false;
  evidencePresent: boolean;
};

export type TrendPoint = {
  metric: string;
  direction: TrendDirection;
  current: number | null;
  prior: number | null;
  delta: number | null;
  evidencePresent: boolean;
};

export type AnomalySignal = {
  anomalyId: string;
  metric: string;
  severity: AnomalySeverity;
  detail: string;
  evidencePresent: boolean;
};

export type TrendAnalysis = {
  analysisId: string;
  trends: TrendPoint[];
  anomalies: AnomalySignal[];
  summary: string;
  fabricated: false;
};

export type OptimisationOpportunity = {
  opportunityId: string;
  area: "clicks" | "conversions" | "commissions" | "seo" | "funnel" | "content" | "general";
  recommendation: string;
  rationale: string;
  priority: "low" | "medium" | "high";
  fabricated: false;
  evidencePresent: boolean;
};

export type KpiDashboard = {
  dashboardId: string;
  kpis: Array<{
    key: string;
    label: string;
    value: number | null;
    unit: string;
    evidencePresent: boolean;
  }>;
  periodLabel: string;
  notes: string[];
};

export type HistoryEntry = {
  entryId: string;
  reportId: string;
  timestamp: string;
  clicks: number | null;
  conversions: number | null;
  commissionAmount: number | null;
  revenueAmount: number | null;
};

export type AnalyticsReport = {
  reportId: string;
  timestamp: string;
  affiliateProjectId: string;
  clickMetrics: ClickMetrics;
  conversionMetrics: ConversionMetrics;
  commissionSummary: CommissionSummary;
  revenueSummary: RevenueSummary;
  seoPerformance: SeoPerformance;
  funnelPerformance: FunnelPerformance;
  optimisationOpportunities: OptimisationOpportunity[];
  trendAnalysis: TrendAnalysis;
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: typeof ANW_METADATA_VERSION | string;
  reportVersion: string;
  workerId: string;
  affiliateBusinessId: string;
  kpiDashboard: KpiDashboard;
  history: HistoryEntry[];
  supportingEvidence: string[];
  sourceOpportunityReportId: string | null;
  sourceSeoReportId: string | null;
  sourceFunnelReportId: string | null;
  validation: { decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[] };
  runTimestamp: string;
  consumableByQ808: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  preserveCompleteTraceability: true;
  preserveAnalyticsHistory: true;
  neverFabricateAnalyticsOrPerformanceResults: true;
  neverModifyCampaignsAutomatically: true;
  neverManipulateAnalytics: true;
  neverReplaceAffiliateComplianceWorker: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ808OrLater: true;
};

export type AnwInput = {
  affiliateProjectId?: string | null;
  affiliateBusinessId?: string | null;
  periodLabel?: string | null;
  metricSnapshot?: MetricSnapshot | null;
  fixtureMetrics?: MetricSnapshot | null;
  opportunityReport?: OpportunityFixture | null;
  fixtureOpportunity?: OpportunityFixture | null;
  seoReport?: SeoFixture | null;
  fixtureSeo?: SeoFixture | null;
  funnelReport?: FunnelFixture | null;
  fixtureFunnel?: FunnelFixture | null;
  grandKingInstructions?: string | null;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  fabricateAnalyticsOrPerformanceResults?: boolean;
  modifyCampaignsAutomatically?: boolean;
  manipulateAnalytics?: boolean;
  replaceAffiliateComplianceWorker?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ808OrLater?: boolean;
  missionId?: string | null;
};

export type AnwRunReport = {
  action: string;
  validation: { decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[] };
  latestReport: AnalyticsReport | null;
  clickMetrics?: ClickMetrics | null;
  conversionMetrics?: ConversionMetrics | null;
  commissionSummary?: CommissionSummary | null;
  revenueSummary?: RevenueSummary | null;
  seoPerformance?: SeoPerformance | null;
  funnelPerformance?: FunnelPerformance | null;
  optimisationOpportunities?: OptimisationOpportunity[];
  trendAnalysis?: TrendAnalysis | null;
  kpiDashboard?: KpiDashboard | null;
  history?: HistoryEntry[];
  notes: string[];
};

export type AnalyticsWorkerEngineRecord = {
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalHistoryEntries: number;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
};

export type AnalyticsWorkerCatalog = {
  workerId: string;
  workerName: string;
  capabilities: string[];
  totalReports: number;
  totalHistoryEntries: number;
};

export type AnalyticsWorkerCockpitSnapshot = {
  missionId: "Q8-07";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalHistoryEntries: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverFabricateAnalyticsOrPerformanceResults: true;
  neverModifyCampaignsAutomatically: true;
  neverManipulateAnalytics: true;
  neverReplaceAffiliateComplianceWorker: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ808OrLater: true;
  consumableByQ808: true;
};

export type AnalyticsWorkerState = {
  engineVersion: "PILLOW-ANW-001";
  missionId: "Q8-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: AnalyticsWorkerConfiguration;
  latestReport: AnalyticsReport | null;
  engineRecord: AnalyticsWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    totalHistoryEntries: number;
    lastReportId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type Q808ConsumableContract = {
  contractVersion: "ANW-Q808-v1";
  consumableByQ808: true;
  fields: readonly string[];
  types: Record<string, string>;
  notes: string[];
  neverFabricateAnalyticsOrPerformanceResults: true;
  neverModifyCampaignsAutomatically: true;
  neverManipulateAnalytics: true;
  neverReplaceAffiliateComplianceWorker: true;
};

export type IntegrationHandshake = {
  target: string;
  status: "bound" | "unavailable" | "failed";
  timestamp: string;
  detail: string;
};

export type AnalyticsSession = {
  sessionId: string;
  affiliateBusinessId: string;
  affiliateProjectId: string;
  periodLabel: string;
  sourceOpportunityReportId: string | null;
  sourceSeoReportId: string | null;
  sourceFunnelReportId: string | null;
  snapshot: MetricSnapshot | null;
  clickMetrics: ClickMetrics | null;
  conversionMetrics: ConversionMetrics | null;
  commissionSummary: CommissionSummary | null;
  revenueSummary: RevenueSummary | null;
  seoPerformance: SeoPerformance | null;
  funnelPerformance: FunnelPerformance | null;
  trendAnalysis: TrendAnalysis | null;
  optimisationOpportunities: OptimisationOpportunity[];
  kpiDashboard: KpiDashboard | null;
  outstandingIssues: string[];
  createdAt: string;
  updatedAt: string;
};

export type WorkerIdentity = typeof ANALYTICS_WORKER_IDENTITY;
