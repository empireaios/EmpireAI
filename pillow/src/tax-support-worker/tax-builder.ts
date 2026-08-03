import type { TaxSupportWorkerConfiguration } from "./configuration.js";
import {
  DOCUMENT_KINDS,
  REMINDER_KINDS,
  TAX_SUPPORT_CATEGORIES,
  TAX_SUPPORT_REPORT_VERSION,
  TAX_SUPPORT_WORKER_IDENTITY,
  TSW_CAPABILITIES,
  TSW_METADATA_VERSION,
} from "./paths.js";
import {
  nextDocumentId,
  nextEngineRecordId,
  nextRecordId,
  nextReportId,
} from "./tax-store.js";
import type {
  ExpenseSummary,
  FilingReminder,
  IncomeSummary,
  IntegrationHandshake,
  MissingDocumentationItem,
  OperationalState,
  ProfessionalReviewFlag,
  Q908ConsumableContract,
  TaxCategorySummaryEntry,
  TaxSupportDocument,
  TaxSupportRecord,
  TaxSupportReport,
  TaxSupportTransaction,
  TaxSupportWorkerCatalog,
  TaxSupportWorkerEngineRecord,
  TswCapability,
  ValidationResult,
} from "./types.js";

export function buildTaxSupportDocument(input: {
  kind: TaxSupportDocument["kind"];
  businessId: string;
  reportingPeriod: string;
  sourceRef: string;
}): TaxSupportDocument {
  return {
    documentId: nextDocumentId(),
    kind: input.kind,
    businessId: input.businessId,
    reportingPeriod: input.reportingPeriod,
    sourceRef: input.sourceRef,
    present: true,
    fabricated: false,
  };
}

export function buildOrganisedRecord(params: {
  businessId: string;
  reportingPeriod: string;
  currency: string;
  transactions: TaxSupportTransaction[];
  documents: TaxSupportDocument[];
}): TaxSupportRecord {
  return {
    recordId: nextRecordId(),
    businessId: params.businessId,
    reportingPeriod: params.reportingPeriod,
    currency: params.currency,
    transactions: params.transactions.map((t) => ({ ...t, fabricated: false, recordKind: "factual_financial_record" })),
    documents: params.documents.map((d) => ({ ...d })),
    sourceRefs: [
      ...params.transactions.map((t) => t.sourceRef),
      ...params.documents.map((d) => d.sourceRef),
    ],
    organisedAt: new Date().toISOString(),
    fabricated: false,
  };
}

export function buildTaxSupportReport(params: {
  capitalBusinessId: string;
  capitalProjectId: string;
  reportingPeriod: string;
  currency: string;
  jurisdictionExtensionPoint: string | null;
  incomeSummary: IncomeSummary;
  expenseSummary: ExpenseSummary;
  taxCategories: TaxCategorySummaryEntry[];
  supportingRecords: TaxSupportRecord[];
  missingDocumentation: MissingDocumentationItem[];
  filingReminders: FilingReminder[];
  professionalReviewFlags: ProfessionalReviewFlag[];
  supportingEvidence: string[];
  outstandingIssues: string[];
  confidenceScore: number;
  validation: ValidationResult;
  config: TaxSupportWorkerConfiguration;
}): TaxSupportReport {
  return {
    reportId: nextReportId(),
    timestamp: new Date().toISOString(),
    capitalProjectId: params.capitalProjectId,
    reportingPeriod: params.reportingPeriod,
    incomeSummary: params.incomeSummary,
    expenseSummary: params.expenseSummary,
    taxCategories: params.taxCategories,
    supportingRecords: params.supportingRecords,
    missingDocumentation: params.missingDocumentation,
    filingReminders: params.filingReminders,
    professionalReviewFlags: params.professionalReviewFlags,
    supportingEvidence: [...params.supportingEvidence],
    auditStatus: "pending",
    outstandingIssues: [...params.outstandingIssues],
    confidenceScore: params.confidenceScore,
    metadataVersion: TSW_METADATA_VERSION,
    reportVersion: TAX_SUPPORT_REPORT_VERSION,
    workerId: params.config.workerId,
    capitalBusinessId: params.capitalBusinessId,
    currency: params.currency,
    jurisdictionExtensionPoint: params.jurisdictionExtensionPoint,
    validation: params.validation,
    runTimestamp: new Date().toISOString(),
    consumableByQ908: true,
    submittedThroughExecutiveReportingRuntime: false,
    executiveReportId: null,
    traceabilityRefs: [...params.supportingEvidence],
    neverProvideLegalOrTaxAdvice: true,
    neverFabricateTaxCalculationsOrObligations: true,
    neverSubmitFilingsAutomatically: true,
    neverReplaceAccountantsOrTaxProfessionals: true,
    neverModifyAccountingRecords: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ908OrLater: true,
    preserveCompleteTraceability: true,
    preserveTaxSupportHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    factualRecordsDistinctFromReminders: true,
  };
}

export function buildQ908ConsumableContract(config: TaxSupportWorkerConfiguration): Q908ConsumableContract {
  return {
    contractId: `tsw-q908-contract-${TSW_METADATA_VERSION}`,
    contractVersion: TSW_METADATA_VERSION,
    producedBy: "tax-support-worker",
    missionId: "Q9-07",
    consumerMissionId: "Q9-08",
    exposedFields: [
      "reportId",
      "timestamp",
      "capitalProjectId",
      "reportingPeriod",
      "incomeSummary",
      "expenseSummary",
      "taxCategories",
      "supportingRecords",
      "missingDocumentation",
      "filingReminders",
      "professionalReviewFlags",
      "supportingEvidence",
      "auditStatus",
      "outstandingIssues",
      "confidenceScore",
      "metadataVersion",
    ],
    taxSupportCategoryCatalog: [...TAX_SUPPORT_CATEGORIES],
    documentKindCatalog: [...DOCUMENT_KINDS],
    reminderKindCatalog: [...REMINDER_KINDS],
    currencyCatalog: [...config.currencies],
    notes: [
      "Tax Support Worker (Q9-07) prepares tax-support data, records, and reminders from verified financial evidence only — it never provides legal or tax advice, never fabricates tax calculations or obligations, and never submits filings automatically.",
      "Income/expense summaries and tax-category totals are factual aggregations of verified tagged records, clearly distinct from filing reminders and professional-review flags.",
      "Q9-08 (Investment Planning Worker) and later workers must consume this contract rather than reimplement Q9-07 tax-support logic.",
    ],
    neverImplementQ908OrLater: true,
    structuralSignalOnly: true,
  };
}

export function buildCatalog(config: TaxSupportWorkerConfiguration): TaxSupportWorkerCatalog {
  return {
    catalogVersion: TSW_METADATA_VERSION,
    taxSupportCategories: [...config.taxSupportCategories],
    documentKinds: [...config.documentKinds],
    reminderKinds: [...config.reminderKinds],
    currencies: [...config.currencies],
    capabilities: [...TSW_CAPABILITIES] as TswCapability[],
    requiredDocumentKinds: [...config.requiredDocumentKinds],
  };
}

export function buildEngineRecord(params: {
  operationalState: OperationalState;
  healthStatus: TaxSupportWorkerEngineRecord["healthStatus"];
  validationStatus: TaxSupportWorkerEngineRecord["validationStatus"];
  totalRecords: number;
  totalReminders: number;
  totalMissingDocs: number;
  totalFlags: number;
  lastBusinessId: string | null;
  lastReportingPeriod: string | null;
  handshakes: IntegrationHandshake[];
}): TaxSupportWorkerEngineRecord {
  const bound = (target: string) =>
    params.handshakes.some((h) => h.target === target && h.status === "bound");
  return {
    engineRecordId: nextEngineRecordId(),
    timestamp: new Date().toISOString(),
    engineId: TAX_SUPPORT_WORKER_IDENTITY.workerId,
    engineVersion: "PILLOW-TSW-001",
    currentOperationalState: params.operationalState,
    healthStatus: params.healthStatus,
    validationStatus: params.validationStatus,
    supportedCapabilities: [...TSW_CAPABILITIES] as TswCapability[],
    totalRecords: params.totalRecords,
    totalReminders: params.totalReminders,
    totalMissingDocs: params.totalMissingDocs,
    totalFlags: params.totalFlags,
    lastBusinessId: params.lastBusinessId,
    lastReportingPeriod: params.lastReportingPeriod,
    dependencyPresence: {
      capitalFactoryCore: bound("capital_factory_core"),
      accountingWorker: bound("accounting_worker"),
      cashflowWorker: bound("cashflow_worker"),
      profitabilityWorker: bound("profitability_worker"),
      forecastingWorker: bound("forecasting_worker"),
    },
    metadataVersion: TSW_METADATA_VERSION,
  };
}
