import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { INTEGRATION_TARGETS, PERFART_METADATA_VERSION, PERFORMANCE_AUDIT_IDENTITY } from "./paths.js";
import type { PerformanceAuditReport } from "./types.js";

export type PerformanceAuditConfiguration = {
  enabled: boolean;
  discoveryEnabled: boolean;
  benchmarkingEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: PerformanceAuditReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Deterministic evidence thresholds — documented, never invented per-run. */
  responseTimeThresholdMs: number;
  errorRateThreshold: number;
  memoryUsageThresholdMb: number;
  scalabilityConcurrency: number;
  stabilityProbeRepeats: number;
  stabilityVarianceThresholdMs: number;
  /** Q11-06 hard boundaries — force-locked true. */
  neverFabricatePerformanceEvidence: true;
  neverCertifyUntestedPerformance: true;
  neverOptimizeOrModifyProductionSystems: true;
  neverAssumeImplementation: true;
  neverModifyPerformanceImplementations: true;
  neverRepairFailedPerformanceComponents: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1107OrLater: true;
  preserveCompleteTraceability: true;
  preserveImmutableBenchmarkHistory: true;
  preserveAuditHistory: true;
  deterministicAuditBehaviour: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_PERFORMANCE_AUDIT_CONFIGURATION: PerformanceAuditConfiguration = {
  enabled: true,
  discoveryEnabled: true,
  benchmarkingEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: PERFORMANCE_AUDIT_IDENTITY.workerId,
  workerName: PERFORMANCE_AUDIT_IDENTITY.workerName,
  factory: PERFORMANCE_AUDIT_IDENTITY.factory,
  department: PERFORMANCE_AUDIT_IDENTITY.department,
  role: PERFORMANCE_AUDIT_IDENTITY.role,
  reportingLine: [...PERFORMANCE_AUDIT_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  responseTimeThresholdMs: 250,
  errorRateThreshold: 0.05,
  memoryUsageThresholdMb: 512,
  scalabilityConcurrency: 10,
  stabilityProbeRepeats: 3,
  stabilityVarianceThresholdMs: 100,
  neverFabricatePerformanceEvidence: true,
  neverCertifyUntestedPerformance: true,
  neverOptimizeOrModifyProductionSystems: true,
  neverAssumeImplementation: true,
  neverModifyPerformanceImplementations: true,
  neverRepairFailedPerformanceComponents: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1107OrLater: true,
  preserveCompleteTraceability: true,
  preserveImmutableBenchmarkHistory: true,
  preserveAuditHistory: true,
  deterministicAuditBehaviour: true,
  structuralSignalOnly: true,
  evidenceBasedOnly: true,
  maskSensitiveValues: true,
};

export function buildPerformanceAuditConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PerformanceAuditConfiguration> = {},
): PerformanceAuditConfiguration {
  let file: Partial<PerformanceAuditConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "performance-audit.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.PERFORMANCE_AUDIT_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.PERFORMANCE_AUDIT_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_PERFORMANCE_AUDIT_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_PERFORMANCE_AUDIT_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ?? file.reportingLine ?? DEFAULT_PERFORMANCE_AUDIT_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricatePerformanceEvidence: true,
    neverCertifyUntestedPerformance: true,
    neverOptimizeOrModifyProductionSystems: true,
    neverAssumeImplementation: true,
    neverModifyPerformanceImplementations: true,
    neverRepairFailedPerformanceComponents: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1107OrLater: true,
    preserveCompleteTraceability: true,
    preserveImmutableBenchmarkHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: PerformanceAuditReport): PerformanceAuditReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    componentInventory: [...report.componentInventory],
    assessments: [...report.assessments],
    findings: [...report.findings],
    metadataVersion: report.metadataVersion || PERFART_METADATA_VERSION,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveImmutableBenchmarkHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    maskSensitiveValues: true,
    neverFabricatePerformanceEvidence: true,
    neverCertifyUntestedPerformance: true,
    neverOptimizeOrModifyProductionSystems: true,
    neverAssumeImplementation: true,
    neverModifyPerformanceImplementations: true,
    neverRepairFailedPerformanceComponents: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1107OrLater: true,
    sixthQ11Gate: true,
  };
}
