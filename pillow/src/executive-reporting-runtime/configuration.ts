import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ENTITY_TYPES, REPORT_TYPES, REPORTING_FREQUENCIES } from "./paths.js";
import type { ReportRecord } from "./types.js";

export type ExecutiveReportingRuntimeConfiguration = {
  enabled: boolean;
  workerReportingEnabled: boolean;
  departmentReportingEnabled: boolean;
  factoryReportingEnabled: boolean;
  executiveReportingEnabled: boolean;
  aggregationRulesEnabled: boolean;
  summaryRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  reportTypes: string[];
  entityTypes: string[];
  reportingFrequencies: string[];
  seedReports: ReportRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-26 hard boundaries — force-locked true. */
  neverExecuteWorkerLogic: true;
  neverReplaceMonitoringRuntime: true;
  neverReplaceMissionCoordination: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveReportingTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SEED_REPORTS: ReportRecord[] = [];

export const DEFAULT_EXECUTIVE_REPORTING_RUNTIME_CONFIGURATION: ExecutiveReportingRuntimeConfiguration =
  {
    enabled: true,
    workerReportingEnabled: true,
    departmentReportingEnabled: true,
    factoryReportingEnabled: true,
    executiveReportingEnabled: true,
    aggregationRulesEnabled: true,
    summaryRulesEnabled: true,
    validationRulesEnabled: true,
    reportTypes: [...REPORT_TYPES],
    entityTypes: [...ENTITY_TYPES],
    reportingFrequencies: [...REPORTING_FREQUENCIES],
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverExecuteWorkerLogic: true,
    neverReplaceMonitoringRuntime: true,
    neverReplaceMissionCoordination: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveReportingTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildExecutiveReportingRuntimeConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExecutiveReportingRuntimeConfiguration> = {},
): ExecutiveReportingRuntimeConfiguration {
  let file: Partial<ExecutiveReportingRuntimeConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "executive-reporting-runtime.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.EXECUTIVE_REPORTING_RUNTIME_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.EXECUTIVE_REPORTING_RUNTIME_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergedTypes = Array.from(
    new Set([
      ...DEFAULT_EXECUTIVE_REPORTING_RUNTIME_CONFIGURATION.reportTypes,
      ...(file.reportTypes ?? []),
      ...(overrides.reportTypes ?? []),
    ]),
  );
  const mergedEntities = Array.from(
    new Set([
      ...DEFAULT_EXECUTIVE_REPORTING_RUNTIME_CONFIGURATION.entityTypes,
      ...(file.entityTypes ?? []),
      ...(overrides.entityTypes ?? []),
    ]),
  );
  const mergedFrequencies = Array.from(
    new Set([
      ...DEFAULT_EXECUTIVE_REPORTING_RUNTIME_CONFIGURATION.reportingFrequencies,
      ...(file.reportingFrequencies ?? []),
      ...(overrides.reportingFrequencies ?? []),
    ]),
  );

  return {
    ...DEFAULT_EXECUTIVE_REPORTING_RUNTIME_CONFIGURATION,
    ...file,
    ...overrides,
    reportTypes: mergedTypes,
    entityTypes: mergedEntities,
    reportingFrequencies: mergedFrequencies,
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((r) => ({
      ...r,
      blockers: [...r.blockers],
      risks: [...r.risks],
      evidence: [...r.evidence],
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerLogic: true,
    neverReplaceMonitoringRuntime: true,
    neverReplaceMissionCoordination: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveReportingTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
