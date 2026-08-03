import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APPROVAL_STATUSES,
  BUDGET_CATEGORIES,
  BUDGET_PERIODS,
  BUDGET_PLANNING_WORKER_IDENTITY,
  CURRENCIES,
  DEFAULT_CURRENCY,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { BudgetRecord } from "./types.js";

export type BudgetPlanningWorkerConfiguration = {
  enabled: boolean;
  budgetRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  budgetCategories: string[];
  budgetPeriods: string[];
  approvalStatuses: string[];
  currencies: string[];
  defaultCurrency: string;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedBudgets: BudgetRecord[];
  /** Utilisation percentage at/above which a budget is flagged depletion_risk. */
  depletionRiskThresholdPercent: number;
  /** Utilisation percentage below which a budget is flagged underspending. */
  underutilisationThresholdPercent: number;
  /** Utilisation percentage below which underspending is flagged regardless of period elapsed. */
  severeUnderutilisationThresholdPercent: number;
  /** Utilisation percentage at/above which overspending severity escalates to "high". */
  overspendHighSeverityThresholdPercent: number;
  /** Utilisation percentage at/above which overspending severity escalates to "critical". */
  overspendCriticalSeverityThresholdPercent: number;
  /** Percentage-point deviation from the scope average variance that triggers significant_deviation. */
  significantDeviationThresholdPercent: number;
  /** Multiple of the historical average actual spend that triggers expenditure_spike. */
  expenditureSpikeMultiplier: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q9-04 hard boundaries — force-locked true. */
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
  preserveCompleteTraceability: true;
  preserveHistoricalBudgetRevisions: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_BUDGET_PLANNING_WORKER_CONFIGURATION: BudgetPlanningWorkerConfiguration = {
  enabled: true,
  budgetRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  budgetCategories: [...BUDGET_CATEGORIES],
  budgetPeriods: [...BUDGET_PERIODS],
  approvalStatuses: [...APPROVAL_STATUSES],
  currencies: [...CURRENCIES],
  defaultCurrency: DEFAULT_CURRENCY,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: BUDGET_PLANNING_WORKER_IDENTITY.workerId,
  workerName: BUDGET_PLANNING_WORKER_IDENTITY.workerName,
  factory: BUDGET_PLANNING_WORKER_IDENTITY.factory,
  department: BUDGET_PLANNING_WORKER_IDENTITY.department,
  role: BUDGET_PLANNING_WORKER_IDENTITY.role,
  reportingLine: [...BUDGET_PLANNING_WORKER_IDENTITY.reportingLine],
  seedBudgets: [],
  depletionRiskThresholdPercent: 90,
  underutilisationThresholdPercent: 50,
  severeUnderutilisationThresholdPercent: 10,
  overspendHighSeverityThresholdPercent: 120,
  overspendCriticalSeverityThresholdPercent: 150,
  significantDeviationThresholdPercent: 40,
  expenditureSpikeMultiplier: 2,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateBudgetValuesOrSpendingData: true,
  neverApproveExpenditure: true,
  neverExecutePayments: true,
  neverForecastRevenue: true,
  neverReplaceProfitabilityWorker: true,
  neverModifyAccountingRecords: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ905OrLater: true,
  preserveCompleteTraceability: true,
  preserveHistoricalBudgetRevisions: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildBudgetPlanningWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BudgetPlanningWorkerConfiguration> = {},
): BudgetPlanningWorkerConfiguration {
  let file: Partial<BudgetPlanningWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "budget-planning-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.BUDGET_PLANNING_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.BUDGET_PLANNING_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "budgetCategories" | "budgetPeriods" | "approvalStatuses" | "currencies" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_BUDGET_PLANNING_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_BUDGET_PLANNING_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    budgetCategories: mergeList("budgetCategories"),
    budgetPeriods: mergeList("budgetPeriods"),
    approvalStatuses: mergeList("approvalStatuses"),
    currencies: mergeList("currencies"),
    integrationTargets: mergeList("integrationTargets"),
    defaultCurrency:
      overrides.defaultCurrency ??
      file.defaultCurrency ??
      DEFAULT_BUDGET_PLANNING_WORKER_CONFIGURATION.defaultCurrency,
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_BUDGET_PLANNING_WORKER_CONFIGURATION.reportingLine),
    ],
    seedBudgets: (overrides.seedBudgets ?? file.seedBudgets ?? []).map(lockBudget),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverFabricateBudgetValuesOrSpendingData: true,
    neverApproveExpenditure: true,
    neverExecutePayments: true,
    neverForecastRevenue: true,
    neverReplaceProfitabilityWorker: true,
    neverModifyAccountingRecords: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ905OrLater: true,
    preserveCompleteTraceability: true,
    preserveHistoricalBudgetRevisions: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockBudget(budget: BudgetRecord): BudgetRecord {
  return {
    ...budget,
    plannedAmount: { ...budget.plannedAmount },
    actualExpenditure: { ...budget.actualExpenditure },
    remainingBudget: { ...budget.remainingBudget },
    varianceAmount: { ...budget.varianceAmount },
    businessOrProject: { ...budget.businessOrProject },
    revisionHistory: budget.revisionHistory.map((r) => ({
      ...r,
      previousPlannedAmount: r.previousPlannedAmount ? { ...r.previousPlannedAmount } : null,
    })),
    supportingNotes: [...budget.supportingNotes],
    traceabilityRefs: [...budget.traceabilityRefs],
    fabricated: false,
  };
}
