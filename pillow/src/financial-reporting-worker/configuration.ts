import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  DASHBOARD_WIDGET_KINDS,
  INTEGRATION_TARGETS,
  FINANCIAL_REPORTING_WORKER_IDENTITY,
  REPORT_SECTION_KINDS,
} from "./paths.js";

export type FinancialReportingWorkerConfiguration = {
  enabled: boolean;
  financialReportingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  reportSectionKinds: string[];
  dashboardWidgetKinds: string[];
  currencies: string[];
  defaultCurrency: string;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverExecuteFinancialTransactions: true;
  neverApproveFinancialDecisions: true;
  neverModifyAccountingRecords: true;
  neverFabricateFinancialFigures: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ910OrLater: true;
  preserveCompleteTraceability: true;
  preserveReportHistory: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  measuredDataDistinctFromProjections: true;
};

export const DEFAULT_FINANCIAL_REPORTING_WORKER_CONFIGURATION: FinancialReportingWorkerConfiguration = {
  enabled: true,
  financialReportingRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  reportSectionKinds: [...REPORT_SECTION_KINDS],
  dashboardWidgetKinds: [...DASHBOARD_WIDGET_KINDS],
  currencies: [...CURRENCIES],
  defaultCurrency: DEFAULT_CURRENCY,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: FINANCIAL_REPORTING_WORKER_IDENTITY.workerId,
  workerName: FINANCIAL_REPORTING_WORKER_IDENTITY.workerName,
  factory: FINANCIAL_REPORTING_WORKER_IDENTITY.factory,
  department: FINANCIAL_REPORTING_WORKER_IDENTITY.department,
  role: FINANCIAL_REPORTING_WORKER_IDENTITY.role,
  reportingLine: [...FINANCIAL_REPORTING_WORKER_IDENTITY.reportingLine],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteFinancialTransactions: true,
  neverApproveFinancialDecisions: true,
  neverModifyAccountingRecords: true,
  neverFabricateFinancialFigures: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ910OrLater: true,
  preserveCompleteTraceability: true,
  preserveReportHistory: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  measuredDataDistinctFromProjections: true,
};

export function buildFinancialReportingWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<FinancialReportingWorkerConfiguration> = {},
): FinancialReportingWorkerConfiguration {
  let file: Partial<FinancialReportingWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "financial-reporting-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.FINANCIAL_REPORTING_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.FINANCIAL_REPORTING_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (
    key: "reportSectionKinds" | "dashboardWidgetKinds" | "currencies" | "integrationTargets",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_FINANCIAL_REPORTING_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_FINANCIAL_REPORTING_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    reportSectionKinds: mergeList("reportSectionKinds"),
    dashboardWidgetKinds: mergeList("dashboardWidgetKinds"),
    currencies: mergeList("currencies"),
    integrationTargets: mergeList("integrationTargets"),
    defaultCurrency:
      overrides.defaultCurrency ?? file.defaultCurrency ?? DEFAULT_FINANCIAL_REPORTING_WORKER_CONFIGURATION.defaultCurrency,
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_FINANCIAL_REPORTING_WORKER_CONFIGURATION.reportingLine),
    ],
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteFinancialTransactions: true,
    neverApproveFinancialDecisions: true,
    neverModifyAccountingRecords: true,
    neverFabricateFinancialFigures: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ910OrLater: true,
    preserveCompleteTraceability: true,
    preserveReportHistory: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    measuredDataDistinctFromProjections: true,
  };
}
