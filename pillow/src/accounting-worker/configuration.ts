import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ACCOUNT_TYPES,
  ACCOUNTING_WORKER_IDENTITY,
  CURRENCIES,
  DEFAULT_CURRENCY,
  ENTRY_TYPES,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { JournalEntry, LedgerAccount } from "./types.js";

export type AccountingWorkerConfiguration = {
  enabled: boolean;
  ledgerRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  accountTypes: string[];
  entryTypes: string[];
  currencies: string[];
  defaultCurrency: string;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedAccounts: LedgerAccount[];
  seedEntries: JournalEntry[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q9-02 hard boundaries — force-locked true. */
  neverFabricateAccountingRecords: true;
  neverForecastFinances: true;
  neverApproveInvestments: true;
  neverReplaceBudgetPlanningWorker: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ903OrLater: true;
  preserveCompleteTraceability: true;
  preserveImmutableAccountingHistory: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_ACCOUNTING_WORKER_CONFIGURATION: AccountingWorkerConfiguration = {
  enabled: true,
  ledgerRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  accountTypes: [...ACCOUNT_TYPES],
  entryTypes: [...ENTRY_TYPES],
  currencies: [...CURRENCIES],
  defaultCurrency: DEFAULT_CURRENCY,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: ACCOUNTING_WORKER_IDENTITY.workerId,
  workerName: ACCOUNTING_WORKER_IDENTITY.workerName,
  factory: ACCOUNTING_WORKER_IDENTITY.factory,
  department: ACCOUNTING_WORKER_IDENTITY.department,
  role: ACCOUNTING_WORKER_IDENTITY.role,
  reportingLine: [...ACCOUNTING_WORKER_IDENTITY.reportingLine],
  seedAccounts: [],
  seedEntries: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateAccountingRecords: true,
  neverForecastFinances: true,
  neverApproveInvestments: true,
  neverReplaceBudgetPlanningWorker: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ903OrLater: true,
  preserveCompleteTraceability: true,
  preserveImmutableAccountingHistory: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildAccountingWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AccountingWorkerConfiguration> = {},
): AccountingWorkerConfiguration {
  let file: Partial<AccountingWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "accounting-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.ACCOUNTING_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.ACCOUNTING_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (
    key: "accountTypes" | "entryTypes" | "currencies" | "integrationTargets",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_ACCOUNTING_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_ACCOUNTING_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    accountTypes: mergeList("accountTypes"),
    entryTypes: mergeList("entryTypes"),
    currencies: mergeList("currencies"),
    integrationTargets: mergeList("integrationTargets"),
    defaultCurrency:
      overrides.defaultCurrency ??
      file.defaultCurrency ??
      DEFAULT_ACCOUNTING_WORKER_CONFIGURATION.defaultCurrency,
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_ACCOUNTING_WORKER_CONFIGURATION.reportingLine),
    ],
    seedAccounts: (overrides.seedAccounts ?? file.seedAccounts ?? []).map(lockAccount),
    seedEntries: (overrides.seedEntries ?? file.seedEntries ?? []).map(lockEntry),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverFabricateAccountingRecords: true,
    neverForecastFinances: true,
    neverApproveInvestments: true,
    neverReplaceBudgetPlanningWorker: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ903OrLater: true,
    preserveCompleteTraceability: true,
    preserveImmutableAccountingHistory: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockAccount(account: LedgerAccount): LedgerAccount {
  return {
    ...account,
    metadata: { ...account.metadata },
    fabricated: false,
  };
}

function lockEntry(entry: JournalEntry): JournalEntry {
  return {
    ...entry,
    lines: entry.lines.map((line) => ({ ...line })),
    traceabilityRefs: [...entry.traceabilityRefs],
    fabricated: false,
    immutable: true,
  };
}
