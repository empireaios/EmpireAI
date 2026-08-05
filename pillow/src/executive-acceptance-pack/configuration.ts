import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { EAPRT_METADATA_VERSION, EXECUTIVE_ACCEPTANCE_PACK_IDENTITY, INTEGRATION_TARGETS } from "./paths.js";
import type { ExecutiveAcceptancePackReport } from "./types.js";

export type ExecutiveAcceptancePackConfiguration = {
  enabled: boolean;
  aggregationEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: ExecutiveAcceptancePackReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q11-09 hard boundaries — force-locked true. */
  neverFabricateAcceptanceEvidence: true;
  neverHideFailedAudits: true;
  neverApproveProductionDeployment: true;
  neverOverrideFailedCertifications: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1110OrLater: true;
  preserveCompleteTraceability: true;
  preserveImmutablePackHistory: true;
  preserveAuditHistory: true;
  deterministicPackBehaviour: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_EXECUTIVE_ACCEPTANCE_PACK_CONFIGURATION: ExecutiveAcceptancePackConfiguration = {
  enabled: true,
  aggregationEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: EXECUTIVE_ACCEPTANCE_PACK_IDENTITY.workerId,
  workerName: EXECUTIVE_ACCEPTANCE_PACK_IDENTITY.workerName,
  factory: EXECUTIVE_ACCEPTANCE_PACK_IDENTITY.factory,
  department: EXECUTIVE_ACCEPTANCE_PACK_IDENTITY.department,
  role: EXECUTIVE_ACCEPTANCE_PACK_IDENTITY.role,
  reportingLine: [...EXECUTIVE_ACCEPTANCE_PACK_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateAcceptanceEvidence: true,
  neverHideFailedAudits: true,
  neverApproveProductionDeployment: true,
  neverOverrideFailedCertifications: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1110OrLater: true,
  preserveCompleteTraceability: true,
  preserveImmutablePackHistory: true,
  preserveAuditHistory: true,
  deterministicPackBehaviour: true,
  structuralSignalOnly: true,
  evidenceBasedOnly: true,
  maskSensitiveValues: true,
};

export function buildExecutiveAcceptancePackConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExecutiveAcceptancePackConfiguration> = {},
): ExecutiveAcceptancePackConfiguration {
  let file: Partial<ExecutiveAcceptancePackConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "executive-acceptance-pack.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.EXECUTIVE_ACCEPTANCE_PACK_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.EXECUTIVE_ACCEPTANCE_PACK_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_EXECUTIVE_ACCEPTANCE_PACK_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_EXECUTIVE_ACCEPTANCE_PACK_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ?? file.reportingLine ?? DEFAULT_EXECUTIVE_ACCEPTANCE_PACK_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricateAcceptanceEvidence: true,
    neverHideFailedAudits: true,
    neverApproveProductionDeployment: true,
    neverOverrideFailedCertifications: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1110OrLater: true,
    preserveCompleteTraceability: true,
    preserveImmutablePackHistory: true,
    preserveAuditHistory: true,
    deterministicPackBehaviour: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: ExecutiveAcceptancePackReport): ExecutiveAcceptancePackReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    executiveChecklist: report.executiveChecklist.map((item) => ({ ...item, evidence: [...item.evidence] })),
    metadataVersion: report.metadataVersion || EAPRT_METADATA_VERSION,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveImmutablePackHistory: true,
    preserveAuditHistory: true,
    deterministicPackBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateAcceptanceEvidence: true,
    neverHideFailedAudits: true,
    neverApproveProductionDeployment: true,
    neverOverrideFailedCertifications: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1110OrLater: true,
    ninthQ11Gate: true,
  };
}
