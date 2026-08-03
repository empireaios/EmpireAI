import type {
  AMOUNT_STATUSES,
  AUDIT_STATUSES,
  CASH_MOVEMENT_DIRECTIONS,
  CASHFLOW_SCOPES,
  CFW_CAPABILITIES,
  CURRENCIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  LIQUIDITY_STATUSES,
  OPERATIONAL_STATES,
  RECONCILIATION_STATUSES,
  REPORTING_FREQUENCIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CashflowWorkerConfiguration } from "./configuration.js";
import type { MoneyMinor } from "./money.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type CashMovementDirection = (typeof CASH_MOVEMENT_DIRECTIONS)[number];
export type AmountStatus = (typeof AMOUNT_STATUSES)[number];
export type ReportingFrequency = (typeof REPORTING_FREQUENCIES)[number];
export type CashflowScope = (typeof CASHFLOW_SCOPES)[number];
export type LiquidityStatus = (typeof LIQUIDITY_STATUSES)[number];
export type ReconciliationStatus = (typeof RECONCILIATION_STATUSES)[number];
export type Currency = (typeof CURRENCIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type CfwCapability = (typeof CFW_CAPABILITIES)[number];

/**
 * Minimal shape of a verified Accounting Worker (Q9-02) journal-entry line the
 * Cashflow Worker is willing to consume. Declared locally (rather than
 * imported from accounting-worker) to keep the two modules decoupled — the
 * Cashflow Worker integrates with the Accounting Worker via dependency
 * injection only.
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

/** Minimal shape of a verified Accounting Worker ledger account. */
export type InjectedLedgerAccount = {
  accountId: string;
  businessId: string;
  accountType: string;
  currency: string;
  balance?: number;
};

/** A single, real cash movement derived only from verified accounting records — never fabricated. */
export type CashMovement = {
  movementId: string;
  businessId: string;
  accountId: string;
  direction: CashMovementDirection;
  amountMinor: MoneyMinor;
  currency: string;
  category: string;
  timestamp: string;
  accountingPeriod: string;
  sourceEntryId: string | null;
  amountStatus: AmountStatus;
  fabricated: false;
  traceabilityRefs: string[];
};

export type CashAmountSummary = {
  totalMinor: MoneyMinor;
  recordedMinor: MoneyMinor;
  reconciledMinor: MoneyMinor;
  pendingMinor: MoneyMinor;
  disputedMinor: MoneyMinor;
  movementCount: number;
  byCategory: Array<{ category: string; totalMinor: MoneyMinor; fabricated: false }>;
  fabricated: false;
  evidencePresent: boolean;
};

export type TransfersSummary = {
  transferInTotal: MoneyMinor;
  transferOutTotal: MoneyMinor;
  netTransfers: MoneyMinor;
  transferCount: number;
  fabricated: false;
};

export type RestrictedCash = {
  amountMinor: MoneyMinor;
  evidencePresent: boolean;
  fabricated: false;
};

export type PeriodComparison = {
  priorPeriodLabel: string | null;
  priorNetCashflow: MoneyMinor | null;
  changeInNetCashflow: MoneyMinor | null;
  percentChange: number | null;
  evidencePresent: boolean;
};

/** A single deterministic reporting-period cashflow view for one scope. */
export type PeriodCashflowView = {
  viewId: string;
  reportingFrequency: ReportingFrequency;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  scope: CashflowScope;
  scopeId: string;
  currency: string;
  openingCashBalance: MoneyMinor;
  openingBalanceEvidencePresent: boolean;
  cashInflows: MoneyMinor;
  cashOutflows: MoneyMinor;
  netCashflow: MoneyMinor;
  transfersSummary: TransfersSummary;
  restrictedCash: RestrictedCash;
  availableCash: MoneyMinor;
  closingCashBalance: MoneyMinor;
  periodComparison: PeriodComparison;
  liquidityStatus: LiquidityStatus;
  reconciliationStatus: ReconciliationStatus;
  unreconciledMovements: CashMovement[];
  sourceRecordRefs: string[];
  fabricated: false;
};

/** Alias — a cash position is a materialised PeriodCashflowView for a scope/period. */
export type CashPosition = PeriodCashflowView;

export type CfwValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/** Machine-readable Cashflow Report (Q9-03) — consumable by Q9-04 and later. */
export type CashflowReport = {
  reportId: string;
  timestamp: string;
  capitalProjectId: string | null;
  reportingPeriod: string;
  reportingFrequency: ReportingFrequency;
  currency: string;
  openingCashBalance: MoneyMinor;
  cashInflowSummary: CashAmountSummary;
  cashOutflowSummary: CashAmountSummary;
  netCashflow: MoneyMinor;
  transfersSummary: TransfersSummary;
  restrictedCash: RestrictedCash;
  availableCash: MoneyMinor;
  closingCashBalance: MoneyMinor;
  periodComparison: PeriodComparison;
  liquidityStatus: LiquidityStatus;
  sourceRecordReferences: string[];
  reconciliationStatus: ReconciliationStatus;
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  capitalBusinessId: string;
  views: {
    daily: PeriodCashflowView[];
    weekly: PeriodCashflowView[];
    monthly: PeriodCashflowView[];
    annual: PeriodCashflowView[];
    custom: PeriodCashflowView[];
  };
  validation: CfwValidationReport | null;
  runTimestamp: string;
  consumableByQ904: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  preserveCompleteTraceability: true;
  preserveHistoricalReports: true;
  neverFabricateBalancesOrFlows: true;
  neverCreateBudgets: true;
  neverForecastFutureCashflow: true;
  neverCalculateCompleteBusinessProfitability: true;
  neverApproveSpending: true;
  neverMoveMoney: true;
  neverModifyVerifiedAccountingRecords: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ904OrLater: true;
};

export type CfwInput = {
  capitalBusinessId?: string | null;
  capitalProjectId?: string | null;
  businessId?: string | null;
  accountId?: string | null;
  factoryId?: string | null;
  scope?: CashflowScope | string | null;
  reportingFrequency?: ReportingFrequency | string | null;
  reportingPeriod?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  currency?: Currency | string | null;
  openingCashBalanceMinor?: number | null;
  restrictedCashMinor?: number | null;
  accountingReports?: unknown[] | null;
  accountingEntries?: InjectedAccountingEntry[] | null;
  accountingAccounts?: InjectedLedgerAccount[] | null;
  pillowCommandConfirmed?: boolean | null;
  validated?: boolean;
  missionId?: string | null;
  /** Forbidden boundary attempts — always rejected. */
  fabricateBalancesOrFlows?: boolean;
  createBudgets?: boolean;
  forecastFutureCashflow?: boolean;
  calculateCompleteBusinessProfitability?: boolean;
  approveSpending?: boolean;
  moveMoney?: boolean;
  modifyVerifiedAccountingRecords?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  implementQ904OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget | string;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type CashflowWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  reportingFrequencies: string[];
  liquidityStatuses: string[];
  reconciliationStatuses: string[];
  amountStatuses: string[];
  currencies: string[];
  movements: CashMovement[];
  views: PeriodCashflowView[];
  reports: CashflowReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateBalancesOrFlows: true;
  neverCreateBudgets: true;
  neverForecastFutureCashflow: true;
  neverCalculateCompleteBusinessProfitability: true;
  neverApproveSpending: true;
  neverMoveMoney: true;
  neverModifyVerifiedAccountingRecords: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ904OrLater: true;
};

export type CashflowWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-CFW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CfwCapability[];
  totalMovements: number;
  totalViews: number;
  lastReconciliationStatus: ReconciliationStatus | null;
  lastBusinessId: string | null;
  lastReportId: string | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

/** Structural, non-binding consumable contract for the Budget Planning Worker (Q9-04). */
export type Q904ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "cashflow-worker";
  missionId: "Q9-03";
  consumerMissionId: "Q9-04";
  exposedFields: string[];
  reportingFrequencyCatalog: string[];
  liquidityStatusCatalog: string[];
  reconciliationStatusCatalog: string[];
  currencyCatalog: string[];
  notes: string[];
  neverImplementQ904OrLater: true;
  structuralSignalOnly: true;
};

export type CfwRunReport = {
  cfwRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "consume_accounting_records"
    | "track_cash_inflows"
    | "track_cash_outflows"
    | "calculate_net_cashflow"
    | "maintain_opening_closing_balances"
    | "produce_daily_view"
    | "produce_weekly_view"
    | "produce_monthly_view"
    | "produce_annual_view"
    | "produce_custom_view"
    | "produce_business_view"
    | "produce_consolidated_view"
    | "identify_unreconciled_movements"
    | "compare_periods"
    | "produce_cashflow_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: CashflowWorkerEngineRecord;
  catalog: CashflowWorkerCatalog | null;
  movements: CashMovement[];
  view: PeriodCashflowView | null;
  views: PeriodCashflowView[];
  inflowSummary: CashAmountSummary | null;
  outflowSummary: CashAmountSummary | null;
  netCashflow: MoneyMinor | null;
  unreconciledMovements: CashMovement[];
  latestReport: CashflowReport | null;
  integrations: IntegrationHandshake[];
  validation: CfwValidationReport;
  durationMs: number;
  metadataVersion: string;
  notes: string[];
};

export type CashflowWorkerState = {
  engineVersion: "PILLOW-CFW-001";
  missionId: "Q9-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: CashflowWorkerConfiguration;
  latestReport: CfwRunReport | null;
  engineRecord: CashflowWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalMovements: number;
    totalViews: number;
    lastReconciliationStatus: ReconciliationStatus | null;
    lastBusinessId: string | null;
    notes: string[];
  };
};

export type CashflowWorkerCockpitSnapshot = {
  missionId: "Q9-03";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalMovements: number;
  totalViews: number;
  lastReconciliationStatus: ReconciliationStatus | null;
  latestCapitalBusinessId: string | null;
  workerId: string;
  neverFabricateBalancesOrFlows: true;
  neverCreateBudgets: true;
  neverForecastFutureCashflow: true;
  neverCalculateCompleteBusinessProfitability: true;
  neverApproveSpending: true;
  neverMoveMoney: true;
  neverModifyVerifiedAccountingRecords: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ904OrLater: true;
  consumableByQ904: true;
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
