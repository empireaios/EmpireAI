import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MONITORING_RUNTIME_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";

export type MonitoringRuntimeConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  monitoringRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  errorCountThreshold: number;
  latencyMsThreshold: number;
  availabilityThreshold: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q10-10 hard boundaries — force-locked true. */
  neverFabricateHealthInformation: true;
  neverSuppressCriticalAlerts: true;
  neverReplaceRecoverySystems: true;
  neverAutomaticallyRepairFailures: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1011OrLater: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExecuteBusinessLogic: true;
  preserveCompleteTraceability: true;
  preserveMonitoringHistory: true;
  preserveAuditHistory: true;
  deterministicHealthCalculations: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_MONITORING_RUNTIME_CONFIGURATION: MonitoringRuntimeConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  monitoringRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: MONITORING_RUNTIME_IDENTITY.workerId,
  workerName: MONITORING_RUNTIME_IDENTITY.workerName,
  factory: MONITORING_RUNTIME_IDENTITY.factory,
  department: MONITORING_RUNTIME_IDENTITY.department,
  role: MONITORING_RUNTIME_IDENTITY.role,
  reportingLine: [...MONITORING_RUNTIME_IDENTITY.reportingLine],
  errorCountThreshold: 3,
  latencyMsThreshold: 1000,
  availabilityThreshold: 80,
  loggingLevel: "info",
  neverFabricateHealthInformation: true,
  neverSuppressCriticalAlerts: true,
  neverReplaceRecoverySystems: true,
  neverAutomaticallyRepairFailures: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ1011OrLater: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverExecuteBusinessLogic: true,
  preserveCompleteTraceability: true,
  preserveMonitoringHistory: true,
  preserveAuditHistory: true,
  deterministicHealthCalculations: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildMonitoringRuntimeConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MonitoringRuntimeConfiguration> = {},
): MonitoringRuntimeConfiguration {
  let file: Partial<MonitoringRuntimeConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "monitoring-runtime.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }

  const mergeList = () =>
    Array.from(
      new Set([
        ...DEFAULT_MONITORING_RUNTIME_CONFIGURATION.integrationTargets,
        ...(file.integrationTargets ?? []),
        ...(overrides.integrationTargets ?? []),
      ]),
    );

  return {
    ...DEFAULT_MONITORING_RUNTIME_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList(),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_MONITORING_RUNTIME_CONFIGURATION.reportingLine),
    ],
    neverFabricateHealthInformation: true,
    neverSuppressCriticalAlerts: true,
    neverReplaceRecoverySystems: true,
    neverAutomaticallyRepairFailures: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ1011OrLater: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExecuteBusinessLogic: true,
    preserveCompleteTraceability: true,
    preserveMonitoringHistory: true,
    preserveAuditHistory: true,
    deterministicHealthCalculations: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
