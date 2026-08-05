import type {
  AUDIT_STATUSES,
  CURRENCIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  ESCALATION_LEVELS,
  INTEGRATION_TARGETS,
  CAPRW_CAPABILITIES,
  OPERATIONAL_STATES,
  RESOLUTION_STATUSES,
  RISK_CATEGORIES,
  SEVERITY_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CapitalRiskWorkerConfiguration } from "./configuration.js";
import type { MoneyMinor } from "./money.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type RiskCategory = (typeof RISK_CATEGORIES)[number];
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];
export type EscalationLevel = (typeof ESCALATION_LEVELS)[number];
export type ResolutionStatus = (typeof RESOLUTION_STATUSES)[number];
export type Currency = (typeof CURRENCIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type CaprwCapability = (typeof CAPRW_CAPABILITIES)[number];

export type SummaryRecordKind = "factual_measured" | "unavailable";
export type SummaryStatus = "available" | "unavailable";

export type VerifiedBudgetSnapshot = {
  plannedMinor: number;
  actualMinor: number;
  currency: string;
  sourceRefs: string[];
  fabricated: false;
};

export type VerifiedCashflowSnapshot = {
  netCashflowMinor: number;
  cashPositionMinor: number;
  currency: string;
  sourceRefs: string[];
  fabricated: false;
};

export type VerifiedProfitabilitySnapshot = {
  netProfitMinor: number;
  marginBps?: number | null;
  priorMarginBps?: number | null;
  currency: string;
  sourceRefs: string[];
  fabricated: false;
};

export type VerifiedRevenueSnapshot = {
  totalMinor: number;
  priorTotalMinor?: number | null;
  currency: string;
  sourceRefs: string[];
  fabricated: false;
};

export type InvestmentOpportunitySnapshot = {
  opportunityId: string;
  expectedRoiBps: number;
  recommendation: "recommend" | "defer" | "reject" | "monitor";
  capitalRequiredMinor: number;
  evidenceRefs: string[];
};

export type VerifiedInvestmentSnapshot = {
  opportunities: InvestmentOpportunitySnapshot[];
  currency: string;
  sourceRefs: string[];
  fabricated: false;
};

export type VerifiedLiquiditySnapshot = {
  runwayDays?: number | null;
  currency: string;
  sourceRefs: string[];
  fabricated?: false;
};

export type MultiBusinessCashEntry = {
  businessId: string;
  cashMinor: number;
};

export type InjectedAccountingEntry = {
  entryId: string;
  entryType: string;
  businessId: string;
  accountingPeriod: string;
  timestamp: string;
  currency: string;
  lines: Array<{ accountId: string; debit: number; credit: number; currency?: string | null }>;
  traceabilityRefs?: string[];
};

export type InjectedFinancialReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  reportingPeriod?: string | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

export type OverspendSummary = {
  plannedMinor: number | null;
  actualMinor: number | null;
  overrunMinor: number | null;
  overrunBps: number | null;
  currency: string;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
  status: SummaryStatus;
  fabricated: false;
};

export type CashShortageSummary = {
  cashPositionMinor: number | null;
  thresholdMinor: number | null;
  shortageMinor: number | null;
  currency: string;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
  status: SummaryStatus;
  fabricated: false;
};

export type LiquiditySummary = {
  runwayDays: number | null;
  warningDays: number | null;
  currency: string;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
  status: SummaryStatus;
  fabricated: false;
};

export type InvestmentRiskSummary = {
  underperformingCount: number;
  totalOpportunities: number;
  currency: string;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
  status: SummaryStatus;
  fabricated: false;
};

export type BudgetOverrunSummary = {
  plannedMinor: number | null;
  actualMinor: number | null;
  overrunBps: number | null;
  currency: string;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
  status: SummaryStatus;
  fabricated: false;
};

export type TrendRiskSummary = {
  revenueDeclineBps: number | null;
  marginDeclineBps: number | null;
  currency: string;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
  status: SummaryStatus;
  fabricated: false;
};

export type CapitalRisk = {
  riskId: string;
  category: RiskCategory;
  severity: SeverityLevel;
  probabilityBps: number;
  impactBps: number;
  escalationLevel: EscalationLevel;
  resolutionStatus: ResolutionStatus;
  title: string;
  description: string;
  evidenceRefs: string[];
  sourceRefs: string[];
  magnitudeMinor: number | null;
  currency: string;
  detectedFrom: string;
  observedAt: string;
  fabricated: false;
};

export type RecommendedMitigation = {
  mitigationId: string;
  riskId: string;
  recommendation: string;
  escalationLevel: EscalationLevel;
  signalKind: "risk_mitigation_recommendation";
  isAutomaticExecution: false;
  isApproval: false;
  fabricated: false;
};

export type ExecutiveRiskSummary = {
  summaryId: string;
  timestamp: string;
  totalRisks: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  topRisks: CapitalRisk[];
  escalationRequired: boolean;
  highestEscalationLevel: EscalationLevel;
  fabricated: false;
};

export type RiskDashboardWidget = {
  widgetId: string;
  category: RiskCategory | "aggregate";
  title: string;
  riskCount: number;
  highestSeverity: SeverityLevel | null;
  sourceRefs: string[];
};

export type EnterpriseRiskDashboard = {
  dashboardId: string;
  timestamp: string;
  widgets: RiskDashboardWidget[];
  executiveRiskSummary: ExecutiveRiskSummary;
  risksBySeverity: Record<SeverityLevel, number>;
  currency: string;
  fabricated: false;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "bound" | "unavailable";
  timestamp: string;
  details: string;
};

export type ValidationResult = {
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
};

export type CapitalRiskReport = {
  reportId: string;
  timestamp: string;
  capitalProjectId: string;
  reportingPeriod: string;
  capitalBusinessId: string;
  currency: string;
  executiveRiskSummary: ExecutiveRiskSummary;
  enterpriseRiskDashboard: EnterpriseRiskDashboard;
  detectedRisks: CapitalRisk[];
  prioritisedRisks: CapitalRisk[];
  recommendedMitigations: RecommendedMitigation[];
  overspendSummary: OverspendSummary;
  cashShortageSummary: CashShortageSummary;
  liquiditySummary: LiquiditySummary;
  investmentRiskSummary: InvestmentRiskSummary;
  budgetOverrunSummary: BudgetOverrunSummary;
  trendRiskSummary: TrendRiskSummary;
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: typeof import("./paths.js").CAPRW_METADATA_VERSION;
  reportVersion: typeof import("./paths.js").CAPITAL_RISK_REPORT_VERSION;
  workerId: string;
  validation: ValidationResult;
  runTimestamp: string;
  consumableByQ911: true;
  submittedThroughExecutiveReportingRuntime: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  neverApproveFinancialDecisions: true;
  neverExecuteInvestments: true;
  neverMoveCapital: true;
  neverModifyAccountingRecords: true;
  neverFabricateRisksOrEvidence: true;
  neverAutomaticallyExecuteMitigation: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ911OrLater: true;
  preserveCompleteTraceability: true;
  preserveRiskHistory: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  observedRisksDistinctFromPredictions: true;
};

export type Q911ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "capital-risk-worker";
  missionId: "Q9-10";
  consumerMissionId: "Q9-11";
  exposedFields: string[];
  riskCategoryCatalog: string[];
  severityLevelCatalog: string[];
  escalationLevelCatalog: string[];
  currencyCatalog: string[];
  notes: string[];
  neverImplementQ911OrLater: true;
  structuralSignalOnly: true;
};

export type CapitalRiskWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-CAPRW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CaprwCapability[];
  totalRisks: number;
  totalReports: number;
  totalDashboards: number;
  lastBusinessId: string | null;
  lastReportingPeriod: string | null;
  dependencyPresence: {
    capitalFactoryCore: boolean;
    accountingWorker: boolean;
    cashflowWorker: boolean;
    budgetPlanningWorker: boolean;
    profitabilityWorker: boolean;
    forecastingWorker: boolean;
    taxSupportWorker: boolean;
    investmentPlanningWorker: boolean;
    financialReportingWorker: boolean;
  };
  metadataVersion: typeof import("./paths.js").CAPRW_METADATA_VERSION;
};

export type CapitalRiskWorkerCatalog = {
  catalogVersion: string;
  riskCategories: string[];
  severityLevels: string[];
  escalationLevels: string[];
  resolutionStatuses: string[];
  currencies: string[];
  capabilities: CaprwCapability[];
};

export type CaprwInput = {
  capitalBusinessId?: string | null;
  capitalProjectId?: string | null;
  reportingPeriod?: string | null;
  currency?: string | null;
  budgetSnapshot?: VerifiedBudgetSnapshot | null;
  cashflowSnapshot?: VerifiedCashflowSnapshot | null;
  profitabilitySnapshot?: VerifiedProfitabilitySnapshot | null;
  revenueSnapshot?: VerifiedRevenueSnapshot | null;
  investmentSnapshot?: VerifiedInvestmentSnapshot | null;
  liquiditySnapshot?: VerifiedLiquiditySnapshot | null;
  multiBusinessCash?: MultiBusinessCashEntry[] | null;
  validated?: boolean | null;
  forceFail?: boolean | null;
};

export type CaprwAction =
  | "connect"
  | "consume_accounting"
  | "consume_cashflow"
  | "consume_budget"
  | "consume_profitability"
  | "consume_forecasting"
  | "consume_tax_support"
  | "consume_investment_planning"
  | "consume_financial_reporting"
  | "detect_risks"
  | "prioritise_risks"
  | "generate_executive_risk_dashboard"
  | "produce_capital_risk_report"
  | "submit_report"
  | "list"
  | "validate"
  | "diagnostics";

export type CaprwRunReport = {
  action: CaprwAction;
  validation: ValidationResult;
  runTimestamp: string;
  capitalBusinessId?: string | null;
  reportingPeriod?: string | null;
  detectedRisks?: CapitalRisk[] | null;
  prioritisedRisks?: CapitalRisk[] | null;
  executiveRiskSummary?: ExecutiveRiskSummary | null;
  enterpriseRiskDashboard?: EnterpriseRiskDashboard | null;
  capitalRiskReport?: CapitalRiskReport | null;
  handshakes?: IntegrationHandshake[] | null;
  details?: string | null;
};

export type CapitalRiskWorkerState = {
  engineVersion: "PILLOW-CAPRW-001";
  missionId: "Q9-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: CapitalRiskWorkerConfiguration;
  latestReport: CapitalRiskReport | null;
  engineRecord: CapitalRiskWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalRisks: number;
    totalReports: number;
    totalDashboards: number;
    lastBusinessId: string | null;
    notes: string[];
  };
};

export type CapitalRiskWorkerCockpitSnapshot = {
  missionId: "Q9-10";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalRisks: number;
  totalReports: number;
  totalDashboards: number;
  latestCapitalBusinessId: string | null;
  workerId: string;
  neverApproveFinancialDecisions: true;
  neverExecuteInvestments: true;
  neverMoveCapital: true;
  neverFabricateRisksOrEvidence: true;
  neverAutomaticallyExecuteMitigation: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ911OrLater: true;
  consumableByQ911: true;
};

export type DetectionContext = {
  currency: string;
  config: CapitalRiskWorkerConfiguration;
  budgetSnapshot?: VerifiedBudgetSnapshot | null;
  cashflowSnapshot?: VerifiedCashflowSnapshot | null;
  profitabilitySnapshot?: VerifiedProfitabilitySnapshot | null;
  revenueSnapshot?: VerifiedRevenueSnapshot | null;
  investmentSnapshot?: VerifiedInvestmentSnapshot | null;
  liquiditySnapshot?: VerifiedLiquiditySnapshot | null;
  multiBusinessCash?: MultiBusinessCashEntry[] | null;
};

export type { MoneyMinor };
