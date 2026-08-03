import type {
  ACCOUNT_TYPES,
  ACCW_CAPABILITIES,
  AUDIT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  ENTRY_TYPES,
  CURRENCIES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AccountingWorkerConfiguration } from "./configuration.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type EntryType = (typeof ENTRY_TYPES)[number];
export type Currency = (typeof CURRENCIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type AccwCapability = (typeof ACCW_CAPABILITIES)[number];

/** Machine-readable ledger account — real chart-of-accounts record, never fabricated. */
export type LedgerAccount = {
  accountId: string;
  businessId: string;
  accountType: AccountType | string;
  name: string;
  currency: Currency | string;
  balance: number;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  fabricated: false;
};

/** One side (or balanced pair) of a journal posting. */
export type LedgerLine = {
  accountId: string;
  debit: number;
  credit: number;
  currency: Currency | string;
  memo?: string | null;
};

/** Immutable, append-only journal entry / financial event. */
export type JournalEntry = {
  entryId: string;
  entryType: EntryType | string;
  businessId: string;
  accountingPeriod: string;
  timestamp: string;
  description: string;
  currency: Currency | string;
  lines: LedgerLine[];
  fabricated: false;
  immutable: true;
  traceabilityRefs: string[];
};

/** Alias — a posted JournalEntry is the canonical FinancialEvent record. */
export type FinancialEvent = JournalEntry;

export type AssetRecord = {
  assetId: string;
  businessId: string;
  amount: number;
  currency: Currency | string;
  category: string;
  notes: string;
  timestamp: string;
  fabricated: false;
};

export type LiabilityRecord = {
  liabilityId: string;
  businessId: string;
  amount: number;
  currency: Currency | string;
  category: string;
  notes: string;
  timestamp: string;
  fabricated: false;
};

export type CurrencyTotal = {
  currency: Currency | string;
  total: number;
  fabricated: false;
};

export type BusinessTotal = {
  businessId: string;
  total: number;
  fabricated: false;
};

/** Totals computed strictly from observed ledger data — never fabricated/estimated. */
export type FinancialSummary = {
  totalsByCurrency: CurrencyTotal[];
  totalsByBusiness: BusinessTotal[];
  grandTotal: number;
  fabricated: false;
  evidencePresent: boolean;
};

export type EquitySummary = {
  totalEquity: number;
  currency: Currency | string;
  byBusiness: BusinessTotal[];
  fabricated: false;
};

export type LedgerBalance = {
  balanced: boolean;
  totalDebits: number;
  totalCredits: number;
  difference: number;
  currency: Currency | string;
};

/** In-memory working session for a single business's ledger orchestration. */
export type AccountingSession = {
  sessionId: string;
  businessId: string;
  accounts: LedgerAccount[];
  entries: JournalEntry[];
  assets: AssetRecord[];
  liabilities: LiabilityRecord[];
  equitySummary: EquitySummary;
  createdAt: string;
  updatedAt: string;
};

export type AccwValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/** Machine-readable Accounting Report (Q9-02) — consumable by Q9-03 and later. */
export type AccountingReport = {
  reportId: string;
  timestamp: string;
  accountingPeriod: string;
  incomeSummary: FinancialSummary;
  expenseSummary: FinancialSummary;
  assetSummary: FinancialSummary;
  liabilitySummary: FinancialSummary;
  ledgerBalance: LedgerBalance;
  financialEvents: JournalEntry[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  capitalBusinessId: string;
  capitalProjectId: string | null;
  equitySummary: EquitySummary;
  accountBalances: LedgerAccount[];
  validation: AccwValidationReport | null;
  runTimestamp: string;
  consumableByQ903: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  preserveCompleteTraceability: true;
  preserveImmutableAccountingHistory: true;
  neverFabricateAccountingRecords: true;
  neverForecastFinances: true;
  neverApproveInvestments: true;
  neverReplaceBudgetPlanningWorker: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ903OrLater: true;
};

export type AccwInput = {
  capitalBusinessId?: string | null;
  capitalProjectId?: string | null;
  businessId?: string | null;
  accountingPeriod?: string | null;
  currency?: Currency | string | null;
  amount?: number | null;
  accountName?: string | null;
  accountId?: string | null;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  description?: string | null;
  notes?: string | null;
  category?: string | null;
  entryType?: EntryType | string | null;
  lines?: LedgerLine[] | null;
  pillowCommandConfirmed?: boolean | null;
  validated?: boolean;
  missionId?: string | null;
  /** Forbidden boundary attempts — always rejected. */
  fabricateAccountingRecords?: boolean;
  forecastFinances?: boolean;
  approveInvestments?: boolean;
  replaceBudgetPlanningWorker?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  implementQ903OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget | string;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type AccountingWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  accountTypes: string[];
  entryTypes: string[];
  currencies: string[];
  accounts: LedgerAccount[];
  entries: JournalEntry[];
  reports: AccountingReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateAccountingRecords: true;
  neverForecastFinances: true;
  neverApproveInvestments: true;
  neverReplaceBudgetPlanningWorker: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ903OrLater: true;
};

export type AccountingWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-ACCW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: AccwCapability[];
  totalEntries: number;
  totalAccounts: number;
  lastLedgerBalanced: boolean | null;
  lastBusinessId: string | null;
  lastReportId: string | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type Q903ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "accounting-worker";
  missionId: "Q9-02";
  consumerMissionId: "Q9-03";
  exposedFields: string[];
  accountTypeCatalog: string[];
  entryTypeCatalog: string[];
  currencyCatalog: string[];
  notes: string[];
  neverImplementQ903OrLater: true;
  structuralSignalOnly: true;
};

export type AccwRunReport = {
  accwRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "record_income"
    | "record_expense"
    | "maintain_asset"
    | "maintain_liability"
    | "record_transfer"
    | "post_journal_entry"
    | "maintain_general_ledger"
    | "generate_accounting_summary"
    | "produce_accounting_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: AccountingWorkerEngineRecord;
  catalog: AccountingWorkerCatalog | null;
  entry: JournalEntry | null;
  accounts: LedgerAccount[];
  assets: AssetRecord[];
  liabilities: LiabilityRecord[];
  summary: FinancialSummary | null;
  latestReport: AccountingReport | null;
  integrations: IntegrationHandshake[];
  validation: AccwValidationReport;
  durationMs: number;
  metadataVersion: string;
  notes: string[];
};

export type AccountingWorkerState = {
  engineVersion: "PILLOW-ACCW-001";
  missionId: "Q9-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: AccountingWorkerConfiguration;
  latestReport: AccwRunReport | null;
  engineRecord: AccountingWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalEntries: number;
    totalAccounts: number;
    lastLedgerBalanced: boolean | null;
    lastBusinessId: string | null;
    notes: string[];
  };
};

export type AccountingWorkerCockpitSnapshot = {
  missionId: "Q9-02";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalEntries: number;
  totalAccounts: number;
  lastLedgerBalanced: boolean | null;
  latestCapitalBusinessId: string | null;
  workerId: string;
  neverFabricateAccountingRecords: true;
  neverForecastFinances: true;
  neverApproveInvestments: true;
  neverReplaceBudgetPlanningWorker: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ903OrLater: true;
  consumableByQ903: true;
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
