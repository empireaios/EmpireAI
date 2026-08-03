import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  DOCUMENT_KINDS,
  INTEGRATION_TARGETS,
  REMINDER_KINDS,
  TAX_SUPPORT_CATEGORIES,
  TAX_SUPPORT_WORKER_IDENTITY,
} from "./paths.js";
import type { DocumentKind } from "./types.js";

export type FilingReminderScheduleEntry = {
  kind: (typeof REMINDER_KINDS)[number];
  /** Days after period end when the reminder is due. */
  offsetDaysAfterPeriodEnd: number;
  title: string;
};

export type TaxSupportWorkerConfiguration = {
  enabled: boolean;
  taxSupportRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  taxSupportCategories: string[];
  documentKinds: string[];
  reminderKinds: string[];
  currencies: string[];
  defaultCurrency: string;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  /** Document kinds expected for a complete support pack — signals only. */
  requiredDocumentKinds: DocumentKind[];
  filingReminderSchedule: FilingReminderScheduleEntry[];
  /** Absolute minor-units threshold for high-value professional-review flags. */
  highValueTransactionThresholdMinor: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
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
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  factualRecordsDistinctFromReminders: true;
};

const DEFAULT_SCHEDULE: FilingReminderScheduleEntry[] = [
  {
    kind: "period_close",
    offsetDaysAfterPeriodEnd: 0,
    title: "Period close — gather tax-support records",
  },
  {
    kind: "document_gathering",
    offsetDaysAfterPeriodEnd: 14,
    title: "Document gathering checkpoint",
  },
  {
    kind: "professional_review",
    offsetDaysAfterPeriodEnd: 30,
    title: "Professional review checkpoint",
  },
  {
    kind: "filing_window",
    offsetDaysAfterPeriodEnd: 45,
    title: "Filing window reminder (schedule only — not advice)",
  },
];

export const DEFAULT_TAX_SUPPORT_WORKER_CONFIGURATION: TaxSupportWorkerConfiguration = {
  enabled: true,
  taxSupportRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  taxSupportCategories: [...TAX_SUPPORT_CATEGORIES],
  documentKinds: [...DOCUMENT_KINDS],
  reminderKinds: [...REMINDER_KINDS],
  currencies: [...CURRENCIES],
  defaultCurrency: DEFAULT_CURRENCY,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: TAX_SUPPORT_WORKER_IDENTITY.workerId,
  workerName: TAX_SUPPORT_WORKER_IDENTITY.workerName,
  factory: TAX_SUPPORT_WORKER_IDENTITY.factory,
  department: TAX_SUPPORT_WORKER_IDENTITY.department,
  role: TAX_SUPPORT_WORKER_IDENTITY.role,
  reportingLine: [...TAX_SUPPORT_WORKER_IDENTITY.reportingLine],
  requiredDocumentKinds: ["invoice", "receipt", "bank_statement"],
  filingReminderSchedule: DEFAULT_SCHEDULE,
  highValueTransactionThresholdMinor: 1_000_000,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
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
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  factualRecordsDistinctFromReminders: true,
};

export function buildTaxSupportWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<TaxSupportWorkerConfiguration> = {},
): TaxSupportWorkerConfiguration {
  let file: Partial<TaxSupportWorkerConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "tax-support-worker.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.TAX_SUPPORT_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.TAX_SUPPORT_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (
    key: "taxSupportCategories" | "documentKinds" | "reminderKinds" | "currencies" | "integrationTargets",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_TAX_SUPPORT_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_TAX_SUPPORT_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    taxSupportCategories: mergeList("taxSupportCategories"),
    documentKinds: mergeList("documentKinds"),
    reminderKinds: mergeList("reminderKinds"),
    currencies: mergeList("currencies"),
    integrationTargets: mergeList("integrationTargets"),
    defaultCurrency:
      overrides.defaultCurrency ?? file.defaultCurrency ?? DEFAULT_TAX_SUPPORT_WORKER_CONFIGURATION.defaultCurrency,
    reportingLine: [
      ...(overrides.reportingLine ?? file.reportingLine ?? DEFAULT_TAX_SUPPORT_WORKER_CONFIGURATION.reportingLine),
    ],
    requiredDocumentKinds: [
      ...(overrides.requiredDocumentKinds ??
        file.requiredDocumentKinds ??
        DEFAULT_TAX_SUPPORT_WORKER_CONFIGURATION.requiredDocumentKinds),
    ],
    filingReminderSchedule: [
      ...(overrides.filingReminderSchedule ??
        file.filingReminderSchedule ??
        DEFAULT_TAX_SUPPORT_WORKER_CONFIGURATION.filingReminderSchedule),
    ],
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
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
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    factualRecordsDistinctFromReminders: true,
  };
}
