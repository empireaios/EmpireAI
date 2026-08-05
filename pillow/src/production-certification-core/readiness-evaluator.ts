import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PRODUCTION_CERTIFICATION_CORE_SYSTEM_PATH } from "./paths.js";
import type { ProductionCertificationCoreConfiguration } from "./configuration.js";
import type { ProductionCertificationCoreDependencies } from "./integrations.js";
import type {
  CertificationResult,
  EvidenceSummary,
  FactoryDiscoveryResult,
  GovernanceResults,
  ReadinessSummary,
  ReportingResults,
  RuntimeDiscoveryResult,
  WorkerDiscoveryResult,
} from "./types.js";

const BOUNDARY_LOCK_KEYS = [
  "neverFabricateCertificationEvidence",
  "neverCertifyMissingCapabilities",
  "neverAssumeImplementation",
  "neverImplementMissingCapabilities",
  "neverModifyProductionLogic",
  "neverReplaceIndividualAuditProgrammes",
  "neverBypassPillowGovernance",
  "neverBypassGrandKingApproval",
  "neverOverrideApprovedArchitecture",
  "neverOverridePillow",
  "neverOverrideGrandKing",
  "neverImplementQ1102OrLater",
  "preserveCompleteTraceability",
  "preserveImmutableCertificationHistory",
  "preserveCertificationHistory",
  "preserveAuditHistory",
  "deterministicCertification",
  "structuralSignalOnly",
  "evidenceBasedOnly",
  "maskSensitiveValues",
] as const;

export function evaluateGovernanceResults(
  root: string,
  config: ProductionCertificationCoreConfiguration,
): GovernanceResults {
  const selfPath = join(root, PRODUCTION_CERTIFICATION_CORE_SYSTEM_PATH);
  const selfDocPresent = existsSync(selfPath);
  const selfText = selfDocPresent ? readFileSync(selfPath, "utf8") : "";
  const containsExpectedLabel = selfText.includes("Production Certification Core");
  const boundaryLocksHonoured = BOUNDARY_LOCK_KEYS.every(
    (key) => (config as unknown as Record<string, unknown>)[key] === true,
  );
  const compliant = selfDocPresent && containsExpectedLabel && boundaryLocksHonoured;
  return {
    compliant,
    grandKingApprovalRequired: true,
    pillowCommandRequired: true,
    selfDocPresent,
    selfDocPath: PRODUCTION_CERTIFICATION_CORE_SYSTEM_PATH,
    boundaryLocksHonoured,
    evidence: [
      `selfDocPresent=${selfDocPresent}`,
      `containsExpectedLabel=${containsExpectedLabel}`,
      `boundaryLocksHonoured=${boundaryLocksHonoured}`,
    ],
  };
}

export function evaluateReportingResults(
  deps: ProductionCertificationCoreDependencies,
): ReportingResults {
  const executiveReportingAvailable =
    !!deps.executiveReportingRuntime && typeof deps.executiveReportingRuntime.submitWorkerReport === "function";
  return {
    verified: executiveReportingAvailable,
    executiveReportingAvailable,
    evidence: [`executiveReportingRuntime injected=${executiveReportingAvailable}`],
  };
}

export function buildFactorySummary(discovery: FactoryDiscoveryResult) {
  return {
    totalCatalog: discovery.totalCatalog,
    discoveredCount: discovery.discoveredCount,
    evidence: discovery.evidence,
  };
}

export function buildWorkerSummary(discovery: WorkerDiscoveryResult) {
  return {
    discoveredCount: discovery.discoveredCount,
    registryInjected: discovery.registryInjected,
    evidence: discovery.evidence,
  };
}

export function buildRuntimeSummary(discovery: RuntimeDiscoveryResult) {
  return {
    totalCatalog: discovery.totalCatalog,
    discoveredCount: discovery.discoveredCount,
    evidence: discovery.evidence,
  };
}

export function evaluateReadinessSummary(matrix: CertificationResult[]): ReadinessSummary {
  const certifiedCount = matrix.filter((r) => r.certificationStatus === "Certified").length;
  const partiallyCertifiedCount = matrix.filter((r) => r.certificationStatus === "Partially Certified").length;
  const failedCount = matrix.filter((r) => r.certificationStatus === "Failed Certification").length;
  const blockedCount = matrix.filter((r) => r.certificationStatus === "Blocked").length;
  const deferredCount = matrix.filter((r) => r.certificationStatus === "Deferred").length;
  const registeredCount = matrix.filter((r) => r.certificationStatus === "Registered").length;
  const discoveredCount = matrix.filter((r) => r.certificationStatus === "Discovered").length;
  const pendingCount = matrix.filter((r) => r.certificationStatus === "Pending").length;

  const overallReadinessScore =
    matrix.length === 0
      ? 0
      : Math.round((matrix.reduce((sum, r) => sum + r.readinessScore, 0) / matrix.length) * 100) / 100;

  const ready = matrix.every(
    (r) =>
      r.certificationStatus === "Certified" ||
      r.certificationStatus === "Registered" ||
      r.certificationStatus === "Discovered",
  );

  return {
    computedAt: new Date().toISOString(),
    totalItems: matrix.length,
    certifiedCount,
    partiallyCertifiedCount,
    failedCount,
    blockedCount,
    deferredCount,
    registeredCount,
    discoveredCount,
    pendingCount,
    overallReadinessScore,
    ready,
    notes: ready
      ? ["All certification programmes and discovered components observed Certified, Discovered, or Registered"]
      : matrix
          .filter(
            (r) =>
              r.certificationStatus !== "Certified" &&
              r.certificationStatus !== "Registered" &&
              r.certificationStatus !== "Discovered",
          )
          .map((r) => `${r.programmeId} (${r.componentId}) is ${r.certificationStatus}`),
    evidence: matrix.map((r) => `${r.componentId}:${r.certificationStatus}`),
  };
}

export function buildEvidenceSummary(matrix: CertificationResult[]): EvidenceSummary {
  const byComponentType: Record<string, number> = {};
  for (const row of matrix) {
    byComponentType[row.componentType] = (byComponentType[row.componentType] ?? 0) + 1;
  }
  return {
    totalRows: matrix.length,
    byComponentType,
    evidence: matrix.map((r) => `${r.certificationId}: ${r.componentType}/${r.componentId} -> ${r.certificationStatus}`),
  };
}
