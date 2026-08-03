import type {
  APPROVAL_STATUSES,
  AUDIT_STATUSES,
  BPW_CAPABILITIES,
  BUDGET_CATEGORIES,
  BUDGET_PERIODS,
  BUDGET_SCOPES,
  CURRENCIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  RECOMMENDATION_ACTIONS,
  VALIDATION_STATUSES,
  VARIANCE_SEVERITIES,
  VARIANCE_SIGNALS,
} from "./paths.js";
import type { BudgetPlanningWorkerConfiguration } from "./configuration.js";
import type { MoneyMinor } from "./money.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];
export type BudgetPeriod = (typeof BUDGET_PERIODS)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type VarianceSignal = (typeof VARIANCE_SIGNALS)[number];
export type BudgetScope = (typeof BUDGET_SCOPES)[number];
export type VarianceSeverity = (typeof VARIANCE_SEVERITIES)[number];
export type RecommendationAction = (typeof RECOMMENDATION_ACTIONS)[number];
export type Currency = (typeof CURRENCIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type BpwCapability = (typeof BPW_CAPABILITIES)[number];

/**
 * Minimal shape of a verified Accounting Worker (Q9-02) journal-entry or
 * report the Budget Planning Worker is willing to consume. Declared locally
 * (rather than imported from accounting-worker) to keep the modules
 * decoupled — the Budget Planning Worker integrates with the Accounting
 * Worker via dependency injection only.
 */
export type InjectedAccountingReport = Record<string, unknown>;

/**
 * Minimal shape of a verified Cashflow Worker (Q9-03) report/view the
 * Budget Planning Worker is willing to consume. Declared locally to keep
 * the two modules decoupled — the Budget Planning Worker integrates with
 * the Cashflow Worker via dependency injection only.
 */
export type InjectedCashflowReport = Record<string, unknown>;
export type InjectedCashflowView = Record<string, unknown>;

/**
 * A verified actual-spending record injected directly (e.g. by a caller
 * that already resolved real spend from Q9-02/Q9-03) or fetched through
 * dependency injection. Never fabricated by the Budget Planning Worker —
 * when absent, actual expenditure is recorded as zero with an outstanding
 * issue, never invented.
 */
export type InjectedSpendingActual = {
  budgetId?: string | null;
  category?: BudgetCategory | string | null;
  period?: string | null;
  amountMinor: number;
  currency?: string | null;
  timestamp?: string | null;
  sourceRefs?: string[];
};

/** Business or project a budget is scoped to — real identifiers only, never fabricated. */
export type BudgetSubject = {
  businessId: string | null;
  projectId: string | null;
  name: string | null;
};

/** Append-only revision entry preserved whenever a budget's planned amount, category, or period changes. */
export type BudgetRevisionEntry = {
  revisionNumber: number;
  timestamp: string;
  changedFields: string[];
  previousPlannedAmount: MoneyMinor | null;
  previousBudgetCategory: BudgetCategory | null;
  previousBudgetPeriod: BudgetPeriod | null;
  previousApprovalStatus: ApprovalStatus | null;
  reason: string | null;
  fabricated: false;
};

/** Authoritative Budget Structure record — the Budget Planning Worker's core domain object. */
export type BudgetRecord = {
  budgetId: string;
  budgetOwner: string | null;
  businessOrProject: BudgetSubject;
  budgetCategory: BudgetCategory;
  budgetPeriod: BudgetPeriod;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  plannedAmount: MoneyMinor;
  actualExpenditure: MoneyMinor;
  remainingBudget: MoneyMinor;
  /** Integer-derived from basis points ((actual*10000)/planned)/100 — never a floating multiplication. */
  budgetUtilisationPercentage: number;
  varianceAmount: MoneyMinor;
  variancePercentage: number | null;
  approvalStatus: ApprovalStatus;
  supportingNotes: string[];
  currency: string;
  capitalProjectId: string | null;
  capitalBusinessId: string | null;
  revisionNumber: number;
  revisionHistory: BudgetRevisionEntry[];
  actualExpenditureEvidencePresent: boolean;
  fabricated: false;
  traceabilityRefs: string[];
  createdAt: string;
  updatedAt: string;
};

/** A single, evidence-based variance observation — never invented. */
export type VarianceFinding = {
  findingId: string;
  signal: VarianceSignal;
  severity: VarianceSeverity;
  description: string;
  budgetId: string;
  category?: BudgetCategory | null;
  period?: string | null;
  amountMinor?: MoneyMinor;
  percent?: number | null;
  sourceRefs: string[];
  fabricated: false;
};

/** An evidence-based recommendation to adjust a budget — never invents spending or approves it. */
export type BudgetAdjustmentRecommendation = {
  recommendationId: string;
  budgetId: string;
  action: RecommendationAction;
  rationale: string;
  suggestedDeltaMinor?: MoneyMinor;
  evidenceRefs: string[];
  fabricated: false;
};

export type BudgetVarianceSummary = {
  totalVarianceMinor: MoneyMinor;
  totalVariancePercent: number | null;
  overspendingCount: number;
  underspendingCount: number;
  depletionRiskCount: number;
  findings: VarianceFinding[];
  fabricated: false;
};

export type BpwValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/** Machine-readable Budget Planning Report (Q9-04) — consumable by Q9-05 and later. */
export type BudgetPlanningReport = {
  reportId: string;
  timestamp: string;
  capitalProjectId: string | null;
  budgetPeriod: BudgetPeriod;
  budgetScope: BudgetScope;
  budgetCategories: BudgetCategory[];
  plannedBudget: MoneyMinor;
  actualSpending: MoneyMinor;
  remainingBudget: MoneyMinor;
  budgetUtilisation: number;
  varianceSummary: BudgetVarianceSummary;
  budgetRisks: VarianceFinding[];
  adjustmentRecommendations: BudgetAdjustmentRecommendation[];
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  capitalBusinessId: string;
  budgets: BudgetRecord[];
  validation: BpwValidationReport | null;
  runTimestamp: string;
  consumableByQ905: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  preserveCompleteTraceability: true;
  preserveHistoricalBudgetRevisions: true;
  neverFabricateBudgetValuesOrSpendingData: true;
  neverApproveExpenditure: true;
  neverExecutePayments: true;
  neverForecastRevenue: true;
  neverReplaceProfitabilityWorker: true;
  neverModifyAccountingRecords: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ905OrLater: true;
};

export type BpwInput = {
  capitalBusinessId?: string | null;
  capitalProjectId?: string | null;
  budgetId?: string | null;
  budgetOwner?: string | null;
  businessId?: string | null;
  projectId?: string | null;
  name?: string | null;
  budgetCategory?: BudgetCategory | string | null;
  budgetPeriod?: BudgetPeriod | string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  plannedAmount?: number | string | null;
  plannedAmountMinor?: number | null;
  currency?: Currency | string | null;
  actualExpenditure?: number | string | null;
  actualExpenditureMinor?: number | null;
  approvalStatus?: ApprovalStatus | string | null;
  supportingNotes?: string | string[] | null;
  scope?: BudgetScope | string | null;
  accountingReports?: InjectedAccountingReport[] | null;
  cashflowReports?: InjectedCashflowReport[] | null;
  cashflowViews?: InjectedCashflowView[] | null;
  /** Verified actuals injected directly — the only legitimate source of actual spending besides DI. */
  spendingActuals?: InjectedSpendingActual[] | null;
  pillowCommandConfirmed?: boolean | null;
  validated?: boolean;
  reason?: string | null;
  missionId?: string | null;
  /** Forbidden boundary attempts — always rejected. */
  fabricateBudgetValuesOrSpendingData?: boolean;
  approveExpenditure?: boolean;
  executePayments?: boolean;
  forecastRevenue?: boolean;
  replaceProfitabilityWorker?: boolean;
  modifyAccountingRecords?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  implementQ905OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget | string;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type BudgetPlanningWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  budgetCategories: string[];
  budgetPeriods: string[];
  approvalStatuses: string[];
  varianceSignals: string[];
  currencies: string[];
  budgets: BudgetRecord[];
  variances: VarianceFinding[];
  recommendations: BudgetAdjustmentRecommendation[];
  reports: BudgetPlanningReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateBudgetValuesOrSpendingData: true;
  neverApproveExpenditure: true;
  neverExecutePayments: true;
  neverForecastRevenue: true;
  neverReplaceProfitabilityWorker: true;
  neverModifyAccountingRecords: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ905OrLater: true;
};

export type BudgetPlanningWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-BPW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: BpwCapability[];
  totalBudgets: number;
  totalVariances: number;
  lastApprovalStatus: ApprovalStatus | null;
  lastBusinessId: string | null;
  lastReportId: string | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

/** Structural, non-binding consumable contract for the Profitability Worker (Q9-05). */
export type Q905ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "budget-planning-worker";
  missionId: "Q9-04";
  consumerMissionId: "Q9-05";
  exposedFields: string[];
  budgetCategoryCatalog: string[];
  budgetPeriodCatalog: string[];
  approvalStatusCatalog: string[];
  varianceSignalCatalog: string[];
  currencyCatalog: string[];
  notes: string[];
  neverImplementQ905OrLater: true;
  structuralSignalOnly: true;
};

export type BpwRunReport = {
  bpwRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_project_budget"
    | "create_business_budget"
    | "create_advertising_budget"
    | "create_infrastructure_budget"
    | "create_budget"
    | "track_budget_utilisation"
    | "detect_budget_overruns"
    | "detect_underutilised_budgets"
    | "compare_actual_vs_budget"
    | "recommend_budget_adjustments"
    | "produce_budget_planning_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: BudgetPlanningWorkerEngineRecord;
  catalog: BudgetPlanningWorkerCatalog | null;
  budgets: BudgetRecord[];
  budget: BudgetRecord | null;
  variances: VarianceFinding[];
  recommendations: BudgetAdjustmentRecommendation[];
  latestReport: BudgetPlanningReport | null;
  integrations: IntegrationHandshake[];
  validation: BpwValidationReport;
  durationMs: number;
  metadataVersion: string;
  notes: string[];
};

export type BudgetPlanningWorkerState = {
  engineVersion: "PILLOW-BPW-001";
  missionId: "Q9-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: BudgetPlanningWorkerConfiguration;
  latestReport: BpwRunReport | null;
  engineRecord: BudgetPlanningWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalBudgets: number;
    totalVariances: number;
    lastApprovalStatus: ApprovalStatus | null;
    lastBusinessId: string | null;
    notes: string[];
  };
};

export type BudgetPlanningWorkerCockpitSnapshot = {
  missionId: "Q9-04";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalBudgets: number;
  totalVariances: number;
  lastApprovalStatus: ApprovalStatus | null;
  latestCapitalBusinessId: string | null;
  workerId: string;
  neverFabricateBudgetValuesOrSpendingData: true;
  neverApproveExpenditure: true;
  neverExecutePayments: true;
  neverForecastRevenue: true;
  neverReplaceProfitabilityWorker: true;
  neverModifyAccountingRecords: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ905OrLater: true;
  consumableByQ905: true;
};

export type WorkerIdentity = {
  workerId: string;
  workerName: string;
  workerType: string;
  department: string;
  factory: string;
  role: string;
  reportingLine: string[];
  skillProfile: string[];
  approvedTools: string[];
  authorityLevel: string;
};
