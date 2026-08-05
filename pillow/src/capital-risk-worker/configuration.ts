import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  INTEGRATION_TARGETS,
  CAPITAL_RISK_WORKER_IDENTITY,
  RISK_CATEGORIES,
  SEVERITY_LEVELS,
  ESCALATION_LEVELS,
  RESOLUTION_STATUSES,
} from "./paths.js";

export type CapitalRiskWorkerConfiguration = {
  enabled: boolean;
  capitalRiskRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  riskCategories: string[];
  severityLevels: string[];
  escalationLevels: string[];
  resolutionStatuses: string[];
  currencies: string[];
  defaultCurrency: string;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  budgetOverrunBps: number;
  cashShortageMinor: number;
  liquidityDaysWarning: number;
  marginDeclineBps: number;
  underperformingRoiBps: number;
  capitalConcentrationBps: number;
  revenueDeclineBps: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverApproveFinancialDecisions: true;
  neverExecuteInvestments: true;
  neverMoveCapital: true;
  neverModifyAccountingRecords: true;
  neverFabricateRisksOrEvidence: true;
  neverAutomaticallyExecuteMitigation: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ911OrLater: true;
  preserveCompleteTraceability: true;
  preserveRiskHistory: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  observedRisksDistinctFromPredictions: true;
};

export const DEFAULT_CAPITAL_RISK_WORKER_CONFIGURATION: CapitalRiskWorkerConfiguration = {
  enabled: true,
  capitalRiskRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  riskCategories: [...RISK_CATEGORIES],
  severityLevels: [...SEVERITY_LEVELS],
  escalationLevels: [...ESCALATION_LEVELS],
  resolutionStatuses: [...RESOLUTION_STATUSES],
  currencies: [...CURRENCIES],
  defaultCurrency: DEFAULT_CURRENCY,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: CAPITAL_RISK_WORKER_IDENTITY.workerId,
  workerName: CAPITAL_RISK_WORKER_IDENTITY.workerName,
  factory: CAPITAL_RISK_WORKER_IDENTITY.factory,
  department: CAPITAL_RISK_WORKER_IDENTITY.department,
  role: CAPITAL_RISK_WORKER_IDENTITY.role,
  reportingLine: [...CAPITAL_RISK_WORKER_IDENTITY.reportingLine],
  budgetOverrunBps: 500,
  cashShortageMinor: 100_000,
  liquidityDaysWarning: 30,
  marginDeclineBps: 200,
  underperformingRoiBps: 500,
  capitalConcentrationBps: 7000,
  revenueDeclineBps: 500,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverApproveFinancialDecisions: true,
  neverExecuteInvestments: true,
  neverMoveCapital: true,
  neverModifyAccountingRecords: true,
  neverFabricateRisksOrEvidence: true,
  neverAutomaticallyExecuteMitigation: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ911OrLater: true,
  preserveCompleteTraceability: true,
  preserveRiskHistory: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  observedRisksDistinctFromPredictions: true,
};

export function buildCapitalRiskWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CapitalRiskWorkerConfiguration> = {},
): CapitalRiskWorkerConfiguration {
  let file: Partial<CapitalRiskWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "capital-risk-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.CAPITAL_RISK_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.CAPITAL_RISK_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (
    key: "riskCategories" | "severityLevels" | "escalationLevels" | "resolutionStatuses" | "currencies" | "integrationTargets",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_CAPITAL_RISK_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_CAPITAL_RISK_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    riskCategories: mergeList("riskCategories"),
    severityLevels: mergeList("severityLevels"),
    escalationLevels: mergeList("escalationLevels"),
    resolutionStatuses: mergeList("resolutionStatuses"),
    currencies: mergeList("currencies"),
    integrationTargets: mergeList("integrationTargets"),
    defaultCurrency:
      overrides.defaultCurrency ?? file.defaultCurrency ?? DEFAULT_CAPITAL_RISK_WORKER_CONFIGURATION.defaultCurrency,
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_CAPITAL_RISK_WORKER_CONFIGURATION.reportingLine),
    ],
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverApproveFinancialDecisions: true,
    neverExecuteInvestments: true,
    neverMoveCapital: true,
    neverModifyAccountingRecords: true,
    neverFabricateRisksOrEvidence: true,
    neverAutomaticallyExecuteMitigation: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ911OrLater: true,
    preserveCompleteTraceability: true,
    preserveRiskHistory: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    observedRisksDistinctFromPredictions: true,
  };
}
