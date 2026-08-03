import type {
  AUDIT_STATUSES,
  CURRENCIES,
  DOCUMENT_KINDS,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  REMINDER_KINDS,
  REVIEW_FLAG_REASONS,
  TAX_SUPPORT_CATEGORIES,
  TSW_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { TaxSupportWorkerConfiguration } from "./configuration.js";
import type { MoneyMinor } from "./money.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type TaxSupportCategory = (typeof TAX_SUPPORT_CATEGORIES)[number];
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];
export type ReminderKind = (typeof REMINDER_KINDS)[number];
export type ReviewFlagReason = (typeof REVIEW_FLAG_REASONS)[number];
export type Currency = (typeof CURRENCIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type TswCapability = (typeof TSW_CAPABILITIES)[number];

export type InjectedLedgerLine = {
  accountId: string;
  debit: number;
  credit: number;
  currency?: string | null;
  /** Optional verified tax-support category supplied by upstream — never invented here. */
  taxSupportCategory?: TaxSupportCategory | null;
};

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

export type InjectedCashflowReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  reportingPeriod?: string | null;
  netCashflow?: { currency: string; minorUnits: number } | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

export type InjectedProfitabilityReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  reportingPeriod?: string | null;
  grossProfit?: { currency: string; minorUnits: number } | null;
  operatingProfit?: { currency: string; minorUnits: number } | null;
  netProfit?: { currency: string; minorUnits: number } | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

export type InjectedForecastingReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  forecastPeriod?: string | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

/**
 * Verified tax-support transaction — the sole substrate for income/expense
 * organisation. Must arrive already tagged with a real category by the
 * verified upstream source. Amounts are factual financial records only;
 * they never imply a tax obligation.
 */
export type TaxSupportTransaction = {
  transactionId: string;
  category: TaxSupportCategory;
  amountMinor: number;
  currency: string;
  businessId: string;
  reportingPeriod: string;
  sourceRef: string;
  description?: string | null;
  /** Factual record flag — never a recommendation. */
  recordKind: "factual_financial_record";
  fabricated: false;
};

export type TaxSupportDocument = {
  documentId: string;
  kind: DocumentKind;
  businessId: string;
  reportingPeriod: string;
  sourceRef: string;
  present: true;
  fabricated: false;
};

export type TaxSupportRecord = {
  recordId: string;
  businessId: string;
  reportingPeriod: string;
  currency: string;
  transactions: TaxSupportTransaction[];
  documents: TaxSupportDocument[];
  sourceRefs: string[];
  organisedAt: string;
  fabricated: false;
};

export type IncomeSummary = {
  totalIncome: MoneyMinor;
  revenueIncome: MoneyMinor;
  otherIncome: MoneyMinor;
  transactionCount: number;
  /** Factual aggregation of verified income-tagged records — not tax advice. */
  recordKind: "factual_financial_record";
  fabricated: false;
};

export type ExpenseSummary = {
  totalExpenses: MoneyMinor;
  cogs: MoneyMinor;
  opex: MoneyMinor;
  payroll: MoneyMinor;
  advertising: MoneyMinor;
  fees: MoneyMinor;
  transactionCount: number;
  recordKind: "factual_financial_record";
  fabricated: false;
};

export type TaxCategorySummaryEntry = {
  category: TaxSupportCategory;
  total: MoneyMinor;
  transactionCount: number;
  recordKind: "factual_financial_record";
  fabricated: false;
};

export type MissingDocumentationItem = {
  missingId: string;
  kind: DocumentKind;
  businessId: string;
  reportingPeriod: string;
  reason: string;
  /** Reminder/support signal — not a legal requirement determination. */
  signalKind: "missing_documentation_signal";
  fabricated: false;
};

export type FilingReminder = {
  reminderId: string;
  kind: ReminderKind;
  businessId: string;
  reportingPeriod: string;
  dueDate: string;
  title: string;
  description: string;
  /** Explicitly not legal/tax advice and not an instruction to file. */
  signalKind: "filing_reminder_schedule";
  isAdvice: false;
  isFilingInstruction: false;
  fabricated: false;
};

export type ProfessionalReviewFlag = {
  flagId: string;
  reason: ReviewFlagReason;
  businessId: string;
  reportingPeriod: string;
  severity: "info" | "attention" | "elevated";
  description: string;
  evidenceRefs: string[];
  /** Requires human/professional review — never automatic advice. */
  signalKind: "professional_review_flag";
  isAdvice: false;
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

export type TaxSupportReport = {
  reportId: string;
  timestamp: string;
  capitalProjectId: string;
  reportingPeriod: string;
  incomeSummary: IncomeSummary;
  expenseSummary: ExpenseSummary;
  taxCategories: TaxCategorySummaryEntry[];
  supportingRecords: TaxSupportRecord[];
  missingDocumentation: MissingDocumentationItem[];
  filingReminders: FilingReminder[];
  professionalReviewFlags: ProfessionalReviewFlag[];
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: typeof import("./paths.js").TSW_METADATA_VERSION;
  reportVersion: typeof import("./paths.js").TAX_SUPPORT_REPORT_VERSION;
  workerId: string;
  capitalBusinessId: string;
  currency: string;
  jurisdictionExtensionPoint: string | null;
  validation: ValidationResult;
  runTimestamp: string;
  consumableByQ908: true;
  submittedThroughExecutiveReportingRuntime: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  neverProvideLegalOrTaxAdvice: true;
  neverFabricateTaxCalculationsOrObligations: true;
  neverSubmitFilingsAutomatically: true;
  neverReplaceAccountantsOrTaxProfessionals: true;
  neverModifyAccountingRecords: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ908OrLater: true;
  preserveCompleteTraceability: true;
  preserveTaxSupportHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  factualRecordsDistinctFromReminders: true;
};

export type Q908ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "tax-support-worker";
  missionId: "Q9-07";
  consumerMissionId: "Q9-08";
  exposedFields: string[];
  taxSupportCategoryCatalog: string[];
  documentKindCatalog: string[];
  reminderKindCatalog: string[];
  currencyCatalog: string[];
  notes: string[];
  neverImplementQ908OrLater: true;
  structuralSignalOnly: true;
};

export type TaxSupportWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-TSW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: TswCapability[];
  totalRecords: number;
  totalReminders: number;
  totalMissingDocs: number;
  totalFlags: number;
  lastBusinessId: string | null;
  lastReportingPeriod: string | null;
  dependencyPresence: {
    capitalFactoryCore: boolean;
    accountingWorker: boolean;
    cashflowWorker: boolean;
    profitabilityWorker: boolean;
    forecastingWorker: boolean;
  };
  metadataVersion: typeof import("./paths.js").TSW_METADATA_VERSION;
};

export type TaxSupportWorkerCatalog = {
  catalogVersion: string;
  taxSupportCategories: string[];
  documentKinds: string[];
  reminderKinds: string[];
  currencies: string[];
  capabilities: TswCapability[];
  requiredDocumentKinds: string[];
};

export type TswInput = {
  capitalBusinessId?: string | null;
  capitalProjectId?: string | null;
  reportingPeriod?: string | null;
  currency?: string | null;
  /** Optional jurisdiction extension key — never implies a tax calculation. */
  jurisdictionExtensionPoint?: string | null;
  transactions?: TaxSupportTransaction[] | null;
  documents?: Array<{
    kind: DocumentKind;
    sourceRef: string;
    reportingPeriod?: string | null;
    businessId?: string | null;
  }> | null;
  periodEndDate?: string | null;
  validated?: boolean | null;
  forceFail?: boolean | null;
};

export type TswAction =
  | "connect"
  | "consume_accounting"
  | "consume_cashflow"
  | "consume_profitability"
  | "consume_forecasting"
  | "organise_records"
  | "prepare_income_summary"
  | "prepare_expense_summary"
  | "detect_missing_documentation"
  | "generate_filing_reminders"
  | "flag_professional_review"
  | "produce_tax_support_report"
  | "submit_report"
  | "list"
  | "validate"
  | "diagnostics";

export type TswRunReport = {
  action: TswAction;
  validation: ValidationResult;
  runTimestamp: string;
  capitalBusinessId?: string | null;
  reportingPeriod?: string | null;
  organisedRecord?: TaxSupportRecord | null;
  incomeSummary?: IncomeSummary | null;
  expenseSummary?: ExpenseSummary | null;
  missingDocumentation?: MissingDocumentationItem[] | null;
  filingReminders?: FilingReminder[] | null;
  professionalReviewFlags?: ProfessionalReviewFlag[] | null;
  taxSupportReport?: TaxSupportReport | null;
  handshakes?: IntegrationHandshake[] | null;
  details?: string | null;
};

export type TaxSupportWorkerState = {
  engineVersion: "PILLOW-TSW-001";
  missionId: "Q9-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: TaxSupportWorkerConfiguration;
  latestReport: TaxSupportReport | null;
  engineRecord: TaxSupportWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalRecords: number;
    totalReminders: number;
    totalMissingDocs: number;
    lastBusinessId: string | null;
    notes: string[];
  };
};

export type TaxSupportWorkerCockpitSnapshot = {
  missionId: "Q9-07";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalRecords: number;
  totalReminders: number;
  totalMissingDocs: number;
  latestCapitalBusinessId: string | null;
  workerId: string;
  neverProvideLegalOrTaxAdvice: true;
  neverFabricateTaxCalculationsOrObligations: true;
  neverSubmitFilingsAutomatically: true;
  neverReplaceAccountantsOrTaxProfessionals: true;
  neverModifyAccountingRecords: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ908OrLater: true;
  consumableByQ908: true;
};
