import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PLMRT_METADATA_VERSION, POST_LAUNCH_MONITORING_IDENTITY, INTEGRATION_TARGETS } from "./paths.js";
import type { PostLaunchMonitoringReport } from "./types.js";

export type PostLaunchMonitoringConfiguration = {
  enabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: PostLaunchMonitoringReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q11-11 hard boundaries — force-locked true. */
  neverFabricateProductionEvidence: true;
  neverSuppressCriticalIncidents: true;
  neverHideFailures: true;
  neverAutoModifyProduction: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1112OrLater: true;
  preserveCompleteTraceability: true;
  preserveMonitoringHistory: true;
  preserveAuditHistory: true;
  deterministicMonitoringBehaviour: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_POST_LAUNCH_MONITORING_CONFIGURATION: PostLaunchMonitoringConfiguration = {
  enabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: POST_LAUNCH_MONITORING_IDENTITY.workerId,
  workerName: POST_LAUNCH_MONITORING_IDENTITY.workerName,
  factory: POST_LAUNCH_MONITORING_IDENTITY.factory,
  department: POST_LAUNCH_MONITORING_IDENTITY.department,
  role: POST_LAUNCH_MONITORING_IDENTITY.role,
  reportingLine: [...POST_LAUNCH_MONITORING_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateProductionEvidence: true,
  neverSuppressCriticalIncidents: true,
  neverHideFailures: true,
  neverAutoModifyProduction: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1112OrLater: true,
  preserveCompleteTraceability: true,
  preserveMonitoringHistory: true,
  preserveAuditHistory: true,
  deterministicMonitoringBehaviour: true,
  structuralSignalOnly: true,
  evidenceBasedOnly: true,
  maskSensitiveValues: true,
};

export function buildPostLaunchMonitoringConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PostLaunchMonitoringConfiguration> = {},
): PostLaunchMonitoringConfiguration {
  let file: Partial<PostLaunchMonitoringConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "post-launch-monitoring.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.POST_LAUNCH_MONITORING_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.POST_LAUNCH_MONITORING_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_POST_LAUNCH_MONITORING_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_POST_LAUNCH_MONITORING_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ?? file.reportingLine ?? DEFAULT_POST_LAUNCH_MONITORING_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricateProductionEvidence: true,
    neverSuppressCriticalIncidents: true,
    neverHideFailures: true,
    neverAutoModifyProduction: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1112OrLater: true,
    preserveCompleteTraceability: true,
    preserveMonitoringHistory: true,
    preserveAuditHistory: true,
    deterministicMonitoringBehaviour: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: PostLaunchMonitoringReport): PostLaunchMonitoringReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingRisks: [...report.outstandingRisks],
    traceabilityRefs: [...report.traceabilityRefs],
    assessments: report.assessments.map((a) => ({ ...a, supportingEvidence: [...a.supportingEvidence] })),
    metadataVersion: report.metadataVersion || PLMRT_METADATA_VERSION,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveMonitoringHistory: true,
    preserveAuditHistory: true,
    deterministicMonitoringBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateProductionEvidence: true,
    neverSuppressCriticalIncidents: true,
    neverHideFailures: true,
    neverAutoModifyProduction: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1112OrLater: true,
  };
}
