import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  LBLP_METADATA_VERSION,
  LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY,
} from "./paths.js";
import type { LocalBusinessLaunchReport } from "./types.js";

export type LocalBusinessLaunchPackConfiguration = {
  enabled: boolean;
  assemblyRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: LocalBusinessLaunchReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q7-10 hard boundaries — force-locked true. */
  neverLaunchBusinessAutomatically: true;
  neverOverrideGovernance: true;
  neverReplaceCertification: true;
  neverClaimReadinessWithoutEvidence: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ711OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_LOCAL_BUSINESS_LAUNCH_PACK_CONFIGURATION: LocalBusinessLaunchPackConfiguration =
  {
    enabled: true,
    assemblyRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY.workerId,
    workerName: LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY.workerName,
    factory: LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY.factory,
    department: LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY.department,
    role: LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY.role,
    reportingLine: [...LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY.reportingLine],
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverLaunchBusinessAutomatically: true,
    neverOverrideGovernance: true,
    neverReplaceCertification: true,
    neverClaimReadinessWithoutEvidence: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ711OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };

export function buildLocalBusinessLaunchPackConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LocalBusinessLaunchPackConfiguration> = {},
): LocalBusinessLaunchPackConfiguration {
  let file: Partial<LocalBusinessLaunchPackConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "local-business-launch-pack.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.LOCAL_BUSINESS_LAUNCH_PACK_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.LOCAL_BUSINESS_LAUNCH_PACK_RETRY_ATTEMPTS ?? "",
    10,
  );

  return {
    ...DEFAULT_LOCAL_BUSINESS_LAUNCH_PACK_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_LOCAL_BUSINESS_LAUNCH_PACK_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_LOCAL_BUSINESS_LAUNCH_PACK_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) =>
      lockReport(report),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverLaunchBusinessAutomatically: true,
    neverOverrideGovernance: true,
    neverReplaceCertification: true,
    neverClaimReadinessWithoutEvidence: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ711OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: LocalBusinessLaunchReport): LocalBusinessLaunchReport {
  return {
    ...report,
    outstandingIssues: [...report.outstandingIssues],
    riskSummary: [...report.riskSummary],
    traceabilityRefs: [...report.traceabilityRefs],
    metadataVersion: report.metadataVersion || LBLP_METADATA_VERSION,
    consumableByQ711: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverLaunchBusinessAutomatically: true,
    neverOverrideGovernance: true,
    neverReplaceCertification: true,
    neverClaimReadinessWithoutEvidence: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ711OrLater: true,
  };
}
