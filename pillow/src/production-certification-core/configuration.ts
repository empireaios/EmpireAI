import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { INTEGRATION_TARGETS, PCCRT_METADATA_VERSION, PRODUCTION_CERTIFICATION_CORE_IDENTITY } from "./paths.js";
import type { ProductionCertificationReport } from "./types.js";

export type ProductionCertificationCoreConfiguration = {
  enabled: boolean;
  discoveryEnabled: boolean;
  runtimeProbingEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: ProductionCertificationReport[];
  seedWorkerCount: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q11-01 hard boundaries — force-locked true. */
  neverFabricateCertificationEvidence: true;
  neverCertifyMissingCapabilities: true;
  neverAssumeImplementation: true;
  neverImplementMissingCapabilities: true;
  neverModifyProductionLogic: true;
  neverReplaceIndividualAuditProgrammes: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1102OrLater: true;
  preserveCompleteTraceability: true;
  preserveImmutableCertificationHistory: true;
  preserveCertificationHistory: true;
  preserveAuditHistory: true;
  deterministicCertification: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_PRODUCTION_CERTIFICATION_CORE_CONFIGURATION: ProductionCertificationCoreConfiguration =
  {
    enabled: true,
    discoveryEnabled: true,
    runtimeProbingEnabled: true,
    executiveReportingEnabled: true,
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: PRODUCTION_CERTIFICATION_CORE_IDENTITY.workerId,
    workerName: PRODUCTION_CERTIFICATION_CORE_IDENTITY.workerName,
    factory: PRODUCTION_CERTIFICATION_CORE_IDENTITY.factory,
    department: PRODUCTION_CERTIFICATION_CORE_IDENTITY.department,
    role: PRODUCTION_CERTIFICATION_CORE_IDENTITY.role,
    reportingLine: [...PRODUCTION_CERTIFICATION_CORE_IDENTITY.reportingLine],
    seedReports: [],
    seedWorkerCount: 0,
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverFabricateCertificationEvidence: true,
    neverCertifyMissingCapabilities: true,
    neverAssumeImplementation: true,
    neverImplementMissingCapabilities: true,
    neverModifyProductionLogic: true,
    neverReplaceIndividualAuditProgrammes: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1102OrLater: true,
    preserveCompleteTraceability: true,
    preserveImmutableCertificationHistory: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    deterministicCertification: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    maskSensitiveValues: true,
  };

export function buildProductionCertificationCoreConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ProductionCertificationCoreConfiguration> = {},
): ProductionCertificationCoreConfiguration {
  let file: Partial<ProductionCertificationCoreConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "production-certification-core.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.PRODUCTION_CERTIFICATION_CORE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.PRODUCTION_CERTIFICATION_CORE_RETRY_ATTEMPTS ?? "",
    10,
  );

  return {
    ...DEFAULT_PRODUCTION_CERTIFICATION_CORE_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_PRODUCTION_CERTIFICATION_CORE_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_PRODUCTION_CERTIFICATION_CORE_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricateCertificationEvidence: true,
    neverCertifyMissingCapabilities: true,
    neverAssumeImplementation: true,
    neverImplementMissingCapabilities: true,
    neverModifyProductionLogic: true,
    neverReplaceIndividualAuditProgrammes: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1102OrLater: true,
    preserveCompleteTraceability: true,
    preserveImmutableCertificationHistory: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    deterministicCertification: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: ProductionCertificationReport): ProductionCertificationReport {
  return {
    ...report,
    outstandingRisks: [...report.outstandingRisks],
    failedItems: [...report.failedItems],
    traceabilityRefs: [...report.traceabilityRefs],
    certificationResults: [...report.certificationResults],
    programmeInventory: [...report.programmeInventory],
    metadataVersion: report.metadataVersion || PCCRT_METADATA_VERSION,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveImmutableCertificationHistory: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    deterministicCertification: true,
    maskSensitiveValues: true,
    neverFabricateCertificationEvidence: true,
    neverCertifyMissingCapabilities: true,
    neverAssumeImplementation: true,
    neverImplementMissingCapabilities: true,
    neverModifyProductionLogic: true,
    neverReplaceIndividualAuditProgrammes: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1102OrLater: true,
    finalQ11CoreGate: true,
  };
}
