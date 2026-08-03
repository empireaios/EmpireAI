import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CASHFLOW_WORKER_IDENTITY,
  CURRENCIES,
  DEFAULT_CURRENCY,
  INTEGRATION_TARGETS,
  REPORTING_FREQUENCIES,
} from "./paths.js";
import type { CashMovement } from "./types.js";

export type CashflowWorkerConfiguration = {
  enabled: boolean;
  cashflowRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  reportingFrequencies: string[];
  currencies: string[];
  defaultCurrency: string;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedMovements: CashMovement[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q9-03 hard boundaries — force-locked true. */
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
  preserveCompleteTraceability: true;
  preserveHistoricalReports: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_CASHFLOW_WORKER_CONFIGURATION: CashflowWorkerConfiguration = {
  enabled: true,
  cashflowRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  reportingFrequencies: [...REPORTING_FREQUENCIES],
  currencies: [...CURRENCIES],
  defaultCurrency: DEFAULT_CURRENCY,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: CASHFLOW_WORKER_IDENTITY.workerId,
  workerName: CASHFLOW_WORKER_IDENTITY.workerName,
  factory: CASHFLOW_WORKER_IDENTITY.factory,
  department: CASHFLOW_WORKER_IDENTITY.department,
  role: CASHFLOW_WORKER_IDENTITY.role,
  reportingLine: [...CASHFLOW_WORKER_IDENTITY.reportingLine],
  seedMovements: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateBalancesOrFlows: true,
  neverCreateBudgets: true,
  neverForecastFutureCashflow: true,
  neverCalculateCompleteBusinessProfitability: true,
  neverApproveSpending: true,
  neverMoveMoney: true,
  neverModifyVerifiedAccountingRecords: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ904OrLater: true,
  preserveCompleteTraceability: true,
  preserveHistoricalReports: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildCashflowWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CashflowWorkerConfiguration> = {},
): CashflowWorkerConfiguration {
  let file: Partial<CashflowWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "cashflow-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.CASHFLOW_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.CASHFLOW_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "reportingFrequencies" | "currencies" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_CASHFLOW_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_CASHFLOW_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    reportingFrequencies: mergeList("reportingFrequencies"),
    currencies: mergeList("currencies"),
    integrationTargets: mergeList("integrationTargets"),
    defaultCurrency:
      overrides.defaultCurrency ??
      file.defaultCurrency ??
      DEFAULT_CASHFLOW_WORKER_CONFIGURATION.defaultCurrency,
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_CASHFLOW_WORKER_CONFIGURATION.reportingLine),
    ],
    seedMovements: (overrides.seedMovements ?? file.seedMovements ?? []).map(lockMovement),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverFabricateBalancesOrFlows: true,
    neverCreateBudgets: true,
    neverForecastFutureCashflow: true,
    neverCalculateCompleteBusinessProfitability: true,
    neverApproveSpending: true,
    neverMoveMoney: true,
    neverModifyVerifiedAccountingRecords: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ904OrLater: true,
    preserveCompleteTraceability: true,
    preserveHistoricalReports: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockMovement(movement: CashMovement): CashMovement {
  return {
    ...movement,
    amountMinor: { ...movement.amountMinor },
    traceabilityRefs: [...movement.traceabilityRefs],
    fabricated: false,
  };
}
