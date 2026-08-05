import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { INTEGRATION_TARGETS, SECART_METADATA_VERSION, SECURITY_AUDIT_IDENTITY } from "./paths.js";
import type { SecurityAuditReport } from "./types.js";

export type SecurityAuditConfiguration = {
  enabled: boolean;
  discoveryEnabled: boolean;
  secretProbingEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: SecurityAuditReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q11-05 hard boundaries — force-locked true. */
  neverFabricateSecurityEvidence: true;
  neverCertifyInsecureImplementations: true;
  neverExposeSecretsDuringAuditing: true;
  neverAssumeImplementation: true;
  neverModifySecurityImplementations: true;
  neverRepairFailedSecurityComponents: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1106OrLater: true;
  preserveCompleteTraceability: true;
  preserveImmutableAuditHistory: true;
  preserveAuditHistory: true;
  deterministicAuditBehaviour: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_SECURITY_AUDIT_CONFIGURATION: SecurityAuditConfiguration = {
  enabled: true,
  discoveryEnabled: true,
  secretProbingEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: SECURITY_AUDIT_IDENTITY.workerId,
  workerName: SECURITY_AUDIT_IDENTITY.workerName,
  factory: SECURITY_AUDIT_IDENTITY.factory,
  department: SECURITY_AUDIT_IDENTITY.department,
  role: SECURITY_AUDIT_IDENTITY.role,
  reportingLine: [...SECURITY_AUDIT_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateSecurityEvidence: true,
  neverCertifyInsecureImplementations: true,
  neverExposeSecretsDuringAuditing: true,
  neverAssumeImplementation: true,
  neverModifySecurityImplementations: true,
  neverRepairFailedSecurityComponents: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1106OrLater: true,
  preserveCompleteTraceability: true,
  preserveImmutableAuditHistory: true,
  preserveAuditHistory: true,
  deterministicAuditBehaviour: true,
  structuralSignalOnly: true,
  evidenceBasedOnly: true,
  maskSensitiveValues: true,
};

export function buildSecurityAuditConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SecurityAuditConfiguration> = {},
): SecurityAuditConfiguration {
  let file: Partial<SecurityAuditConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "security-audit.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.SECURITY_AUDIT_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.SECURITY_AUDIT_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_SECURITY_AUDIT_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_SECURITY_AUDIT_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ?? file.reportingLine ?? DEFAULT_SECURITY_AUDIT_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricateSecurityEvidence: true,
    neverCertifyInsecureImplementations: true,
    neverExposeSecretsDuringAuditing: true,
    neverAssumeImplementation: true,
    neverModifySecurityImplementations: true,
    neverRepairFailedSecurityComponents: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1106OrLater: true,
    preserveCompleteTraceability: true,
    preserveImmutableAuditHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: SecurityAuditReport): SecurityAuditReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingRisks: [...report.outstandingRisks],
    criticalFindings: [...report.criticalFindings],
    traceabilityRefs: [...report.traceabilityRefs],
    componentInventory: [...report.componentInventory],
    assessments: [...report.assessments],
    findings: [...report.findings],
    metadataVersion: report.metadataVersion || SECART_METADATA_VERSION,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveImmutableAuditHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateSecurityEvidence: true,
    neverCertifyInsecureImplementations: true,
    neverExposeSecretsDuringAuditing: true,
    neverAssumeImplementation: true,
    neverModifySecurityImplementations: true,
    neverRepairFailedSecurityComponents: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1106OrLater: true,
    fifthQ11Gate: true,
  };
}
