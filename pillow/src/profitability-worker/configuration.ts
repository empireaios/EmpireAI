import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ANALYSIS_SCOPES,
  COST_CATEGORIES,
  CURRENCIES,
  DEFAULT_CURRENCY,
  FEE_TYPES,
  INTEGRATION_TARGETS,
  PROFITABILITY_WORKER_IDENTITY,
} from "./paths.js";
import type { FinancialLineItem } from "./types.js";

export type ProfitabilityWorkerConfiguration = {
  enabled: boolean;
  profitabilityRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  costCategories: string[];
  feeTypes: string[];
  analysisScopes: string[];
  currencies: string[];
  defaultCurrency: string;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedFinancialLineItems: FinancialLineItem[];
  /** Number of top revenue/cost categories surfaced as profit/loss drivers. */
  driverTopN: number;
  /** Minimum absolute basis-points share of net revenue for a category to qualify as a driver. */
  driverMinimumPercentOfNetBps: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q9-05 hard boundaries — force-locked true. */
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
  preserveCompleteTraceability: true;
  preserveHistoricalProfitabilityReports: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_PROFITABILITY_WORKER_CONFIGURATION: ProfitabilityWorkerConfiguration = {
  enabled: true,
  profitabilityRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  costCategories: [...COST_CATEGORIES],
  feeTypes: [...FEE_TYPES],
  analysisScopes: [...ANALYSIS_SCOPES],
  currencies: [...CURRENCIES],
  defaultCurrency: DEFAULT_CURRENCY,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: PROFITABILITY_WORKER_IDENTITY.workerId,
  workerName: PROFITABILITY_WORKER_IDENTITY.workerName,
  factory: PROFITABILITY_WORKER_IDENTITY.factory,
  department: PROFITABILITY_WORKER_IDENTITY.department,
  role: PROFITABILITY_WORKER_IDENTITY.role,
  reportingLine: [...PROFITABILITY_WORKER_IDENTITY.reportingLine],
  seedFinancialLineItems: [],
  driverTopN: 5,
  driverMinimumPercentOfNetBps: 100,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateRevenueCostFeeRefundOrProfitabilityFigures: true,
  neverForecastFutureProfitability: true,
  neverApproveSpending: true,
  neverExecuteFinancialTransactions: true,
  neverReplaceForecastingWorker: true,
  neverModifyAccountingRecords: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ906OrLater: true,
  preserveCompleteTraceability: true,
  preserveHistoricalProfitabilityReports: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildProfitabilityWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ProfitabilityWorkerConfiguration> = {},
): ProfitabilityWorkerConfiguration {
  let file: Partial<ProfitabilityWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "profitability-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.PROFITABILITY_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.PROFITABILITY_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "costCategories" | "feeTypes" | "analysisScopes" | "currencies" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_PROFITABILITY_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_PROFITABILITY_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    costCategories: mergeList("costCategories"),
    feeTypes: mergeList("feeTypes"),
    analysisScopes: mergeList("analysisScopes"),
    currencies: mergeList("currencies"),
    integrationTargets: mergeList("integrationTargets"),
    defaultCurrency:
      overrides.defaultCurrency ??
      file.defaultCurrency ??
      DEFAULT_PROFITABILITY_WORKER_CONFIGURATION.defaultCurrency,
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_PROFITABILITY_WORKER_CONFIGURATION.reportingLine),
    ],
    seedFinancialLineItems: (overrides.seedFinancialLineItems ?? file.seedFinancialLineItems ?? []).map(
      lockLineItem,
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverFabricateRevenueCostFeeRefundOrProfitabilityFigures: true,
    neverForecastFutureProfitability: true,
    neverApproveSpending: true,
    neverExecuteFinancialTransactions: true,
    neverReplaceForecastingWorker: true,
    neverModifyAccountingRecords: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ906OrLater: true,
    preserveCompleteTraceability: true,
    preserveHistoricalProfitabilityReports: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockLineItem(item: FinancialLineItem): FinancialLineItem {
  return { ...item, fabricated: false };
}
