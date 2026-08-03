import type {
  ANALYSIS_SCOPES,
  AUDIT_STATUSES,
  COST_CATEGORIES,
  CURRENCIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  FEE_TYPES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  PRFW_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ProfitabilityWorkerConfiguration } from "./configuration.js";
import type { MoneyMinor } from "./money.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type CostCategory = (typeof COST_CATEGORIES)[number];
export type FeeType = (typeof FEE_TYPES)[number];
export type AnalysisScope = (typeof ANALYSIS_SCOPES)[number];
export type Currency = (typeof CURRENCIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type PrfwCapability = (typeof PRFW_CAPABILITIES)[number];

/**
 * Minimal shape of a verified Accounting Worker (Q9-02) ledger line the
 * Profitability Worker is willing to consume. Declared locally (rather than
 * imported from accounting-worker) to keep the modules decoupled — the
 * Profitability Worker integrates with the Accounting Worker via dependency
 * injection only. Raw ledger debit/credit lines carry no profit-and-loss
 * category of their own; the Profitability Worker never infers a chart-of-
 * accounts category mapping from them. They are consumed and preserved for
 * traceability/evidence purposes only — `FinancialLineItem` (below) is the
 * sole substrate for actual profit-and-loss math.
 */
export type InjectedLedgerLine = {
  accountId: string;
  debit: number;
  credit: number;
  currency?: string | null;
};

/** Minimal shape of a verified, immutable Accounting Worker journal entry. */
export type InjectedAccountingEntry = {
  entryId: string;
  entryType: string;
  businessId: string;
  accountingPeriod: string;
  timestamp: string;
  currency: string;
  lines: InjectedLedgerLine[];
  traceabilityRefs?: string[];
};

/**
 * Minimal, DI-decoupled summary fields of a verified Cashflow Worker (Q9-03)
 * report consumed for contextual traceability only — never a source of
 * profit-and-loss figures.
 */
export type InjectedCashflowReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  reportingPeriod?: string | null;
  netCashflow?: { currency: string; minorUnits: number } | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

/**
 * Minimal, DI-decoupled summary fields of a verified Budget Planning Worker
 * (Q9-04) report consumed for contextual traceability only — never a source
 * of profit-and-loss figures.
 */
export type InjectedBudgetReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  budgetPeriod?: string | null;
  plannedBudget?: { currency: string; minorUnits: number } | null;
  actualSpending?: { currency: string; minorUnits: number } | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

/**
 * A single, real, categorised profit-and-loss line item — the sole
 * authoritative substrate for all Profitability Worker calculations. Must
 * arrive already tagged with a real `category` by the verified upstream
 * source (direct caller input or an integrated worker) — the Profitability
 * Worker never invents a category, an amount, or a `realised` flag.
 */
export type FinancialLineItem = {
  category: CostCategory;
  /** Integer minor units (e.g. cents). Always non-negative — direction is implied by `category`. */
  amountMinor: number;
  currency: string;
  businessId?: string | null;
  projectId?: string | null;
  productId?: string | null;
  sourceRef: string;
  /** true = confirmed/actual figure; false = explicitly flagged estimate by the upstream source — never invented by this worker. */
  realised: boolean;
  fabricated: false;
};

export type RevenueSummary = {
  grossRevenue: MoneyMinor;
  discounts: MoneyMinor;
  refunds: MoneyMinor;
  netRevenue: MoneyMinor;
  lineItemCount: number;
  fabricated: false;
};

export type CostSummary = {
  cogs: MoneyMinor;
  operatingExpenses: MoneyMinor;
  advertisingCosts: MoneyMinor;
  sharedCostAllocation: MoneyMinor;
  totalCosts: MoneyMinor;
  fabricated: false;
};

export type FeeSummary = {
  platformFees: MoneyMinor;
  paymentFees: MoneyMinor;
  totalFees: MoneyMinor;
  fabricated: false;
};

export type RefundSummary = {
  refunds: MoneyMinor;
  refundCount: number;
  fabricated: false;
};

export type TaxSummary = {
  taxProvisions: MoneyMinor;
  /** Basis points rate actually used to derive taxProvisions when no explicit tax line items were present — never a silently-invented default. */
  taxRateBpsUsed: number | null;
  /** True only when taxProvisions was derived from taxRateBps rather than explicit realised tax line items. */
  estimated: boolean;
  fabricated: false;
};

export type ProfitMargins = {
  grossMarginPercent: number | null;
  operatingMarginPercent: number | null;
  netMarginPercent: number | null;
  fabricated: false;
};

/** Full deterministic profit-and-loss breakdown for one scope/scopeId/reportingPeriod. */
export type ProfitabilityBreakdown = {
  grossRevenue: MoneyMinor;
  discounts: MoneyMinor;
  refunds: MoneyMinor;
  netRevenue: MoneyMinor;
  cogs: MoneyMinor;
  operatingExpenses: MoneyMinor;
  advertisingCosts: MoneyMinor;
  platformFees: MoneyMinor;
  paymentFees: MoneyMinor;
  taxProvisions: MoneyMinor;
  sharedCostAllocation: MoneyMinor;
  grossProfit: MoneyMinor;
  operatingProfit: MoneyMinor;
  netProfit: MoneyMinor;
  grossMarginPercent: number | null;
  operatingMarginPercent: number | null;
  netMarginPercent: number | null;
  currency: string;
  scope: AnalysisScope;
  scopeId: string;
  reportingPeriod: string;
  realisedOnly: boolean;
  fabricated: false;
  sourceRefs: string[];
};

/** A stored, identified profitability analysis for one scope — the breakdown plus a display name and identity. */
export type ProfitabilityAnalysis = ProfitabilityBreakdown & {
  analysisId: string;
  name: string | null;
  taxEstimated: boolean;
  outstandingIssues: string[];
};

export type DriverDirection = "positive" | "negative";

/** A single, evidence-based profit or loss contribution driver — never invented. */
export type ProfitabilityDriver = {
  driverId: string;
  label: string;
  category: CostCategory;
  amountMinor: MoneyMinor;
  percentOfNet: number | null;
  direction: DriverDirection;
  scope: AnalysisScope;
  scopeId: string;
  evidenceRefs: string[];
  fabricated: false;
};

/** A profit driver is a `ProfitabilityDriver` with `direction: "positive"`. */
export type ProfitDriver = ProfitabilityDriver;
/** A loss driver is a `ProfitabilityDriver` with `direction: "negative"`. */
export type LossDriver = ProfitabilityDriver;

export type ProfitabilityRanking = {
  rank: number;
  scope: AnalysisScope;
  scopeId: string;
  name: string | null;
  netProfit: MoneyMinor;
  netMarginPercent: number | null;
  fabricated: false;
};

export type PrfwValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/** Machine-readable Profitability Report (Q9-05) — consumable by Q9-06 (Forecasting Worker) and later. */
export type ProfitabilityReport = {
  reportId: string;
  timestamp: string;
  capitalProjectId: string | null;
  reportingPeriod: string;
  revenueSummary: RevenueSummary;
  costSummary: CostSummary;
  feeSummary: FeeSummary;
  refundSummary: RefundSummary;
  taxSummary: TaxSummary;
  grossProfit: MoneyMinor;
  operatingProfit: MoneyMinor;
  netProfit: MoneyMinor;
  profitMargins: ProfitMargins;
  profitabilityRankings: ProfitabilityRanking[];
  profitDrivers: ProfitDriver[];
  lossDrivers: LossDriver[];
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  capitalBusinessId: string;
  analyses: ProfitabilityAnalysis[];
  validation: PrfwValidationReport | null;
  runTimestamp: string;
  consumableByQ906: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  preserveCompleteTraceability: true;
  preserveHistoricalProfitabilityReports: true;
  neverFabricateRevenueCostFeeRefundOrProfitabilityFigures: true;
  neverForecastFutureProfitability: true;
  neverApproveSpending: true;
  neverExecuteFinancialTransactions: true;
  neverReplaceForecastingWorker: true;
  neverModifyAccountingRecords: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ906OrLater: true;
};

export type PrfwInput = {
  capitalBusinessId?: string | null;
  capitalProjectId?: string | null;
  businessId?: string | null;
  projectId?: string | null;
  productId?: string | null;
  reportingPeriod?: string | null;
  currency?: Currency | string | null;
  scope?: AnalysisScope | string | null;
  /** Verified Accounting Worker (Q9-02) entries — dependency injection or direct input; traceability/context only. */
  accountingEntries?: InjectedAccountingEntry[] | null;
  /** Verified Cashflow Worker (Q9-03) reports — dependency injection or direct input; traceability/context only. */
  cashflowReports?: InjectedCashflowReport[] | null;
  /** Verified Budget Planning Worker (Q9-04) reports — dependency injection or direct input; traceability/context only. */
  budgetReports?: InjectedBudgetReport[] | null;
  /** Verified, already-categorised profit-and-loss line items — the sole substrate for profit-and-loss math. */
  financialLineItems?: FinancialLineItem[] | null;
  /** Real shared operational cost pool to allocate across businesses/projects/products present in the data by net-revenue weight. */
  sharedCostPoolMinor?: number | null;
  /**
   * Explicit tax rate in basis points, used ONLY when no realised `tax`
   * category line items are present for the scope. Never invented by the
   * Profitability Worker — when absent and no tax line items exist, tax is
   * recorded as zero and flagged as an outstanding issue rather than
   * defaulted silently.
   */
  taxRateBps?: number | null;
  pillowCommandConfirmed?: boolean | null;
  validated?: boolean;
  missionId?: string | null;
  /** Forbidden boundary attempts — always rejected. */
  fabricateRevenueCostFeeRefundOrProfitabilityFigures?: boolean;
  forecastFutureProfitability?: boolean;
  approveSpending?: boolean;
  executeFinancialTransactions?: boolean;
  replaceForecastingWorker?: boolean;
  modifyAccountingRecords?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  implementQ906OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget | string;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type ProfitabilityWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  costCategories: string[];
  feeTypes: string[];
  analysisScopes: string[];
  currencies: string[];
  analyses: ProfitabilityAnalysis[];
  rankings: ProfitabilityRanking[];
  profitDrivers: ProfitDriver[];
  lossDrivers: LossDriver[];
  reports: ProfitabilityReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateRevenueCostFeeRefundOrProfitabilityFigures: true;
  neverForecastFutureProfitability: true;
  neverApproveSpending: true;
  neverExecuteFinancialTransactions: true;
  neverReplaceForecastingWorker: true;
  neverModifyAccountingRecords: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ906OrLater: true;
};

export type ProfitabilityWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-PRFW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PrfwCapability[];
  totalAnalyses: number;
  totalRankings: number;
  lastScope: AnalysisScope | null;
  lastBusinessId: string | null;
  lastReportId: string | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

/** Structural, non-binding consumable contract for the Forecasting Worker (Q9-06). */
export type Q906ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "profitability-worker";
  missionId: "Q9-05";
  consumerMissionId: "Q9-06";
  exposedFields: string[];
  costCategoryCatalog: string[];
  feeTypeCatalog: string[];
  analysisScopeCatalog: string[];
  currencyCatalog: string[];
  notes: string[];
  neverImplementQ906OrLater: true;
  structuralSignalOnly: true;
};

export type PrfwRunReport = {
  prfwRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "consume_accounting_records"
    | "consume_cashflow_reports"
    | "consume_budget_reports"
    | "calculate_gross_profit"
    | "calculate_operating_profit"
    | "calculate_net_profit"
    | "allocate_shared_operational_costs"
    | "analyse_profitability_by_business"
    | "analyse_profitability_by_product"
    | "analyse_profitability_by_project"
    | "identify_profit_drivers"
    | "identify_loss_drivers"
    | "rank_profitability"
    | "produce_profitability_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: ProfitabilityWorkerEngineRecord;
  catalog: ProfitabilityWorkerCatalog | null;
  analyses: ProfitabilityAnalysis[];
  analysis: ProfitabilityAnalysis | null;
  breakdown: ProfitabilityBreakdown | null;
  rankings: ProfitabilityRanking[];
  profitDrivers: ProfitDriver[];
  lossDrivers: LossDriver[];
  sharedCostAllocations: Array<{ scopeId: string; allocatedMinor: MoneyMinor }>;
  latestReport: ProfitabilityReport | null;
  integrations: IntegrationHandshake[];
  validation: PrfwValidationReport;
  durationMs: number;
  metadataVersion: string;
  notes: string[];
};

export type ProfitabilityWorkerState = {
  engineVersion: "PILLOW-PRFW-001";
  missionId: "Q9-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: ProfitabilityWorkerConfiguration;
  latestReport: PrfwRunReport | null;
  engineRecord: ProfitabilityWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalAnalyses: number;
    totalRankings: number;
    lastScope: AnalysisScope | null;
    lastBusinessId: string | null;
    notes: string[];
  };
};

export type ProfitabilityWorkerCockpitSnapshot = {
  missionId: "Q9-05";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalAnalyses: number;
  totalRankings: number;
  lastScope: AnalysisScope | null;
  latestCapitalBusinessId: string | null;
  workerId: string;
  neverFabricateRevenueCostFeeRefundOrProfitabilityFigures: true;
  neverForecastFutureProfitability: true;
  neverApproveSpending: true;
  neverExecuteFinancialTransactions: true;
  neverReplaceForecastingWorker: true;
  neverModifyAccountingRecords: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ906OrLater: true;
  consumableByQ906: true;
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
