import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REQUIRED_SECURITY_COMPONENT_KEYS, SECURITY_AUDIT_SYSTEM_PATH } from "./paths.js";
import type { SecurityAuditConfiguration } from "./configuration.js";
import type { SecurityAuditDependencies } from "./integrations.js";
import type {
  GovernanceSummary,
  ReadinessClassification,
  SecurityAssessment,
  SecurityDimensionSummary,
  SecurityReadinessSummary,
} from "./types.js";

const BOUNDARY_LOCK_KEYS = [
  "neverFabricateSecurityEvidence",
  "neverCertifyInsecureImplementations",
  "neverExposeSecretsDuringAuditing",
  "neverAssumeImplementation",
  "neverModifySecurityImplementations",
  "neverRepairFailedSecurityComponents",
  "neverBypassPillowGovernance",
  "neverBypassGrandKingApproval",
  "neverOverrideApprovedArchitecture",
  "neverOverridePillow",
  "neverOverrideGrandKing",
  "neverImplementQ1106OrLater",
  "preserveCompleteTraceability",
  "preserveImmutableAuditHistory",
  "preserveAuditHistory",
  "deterministicAuditBehaviour",
  "structuralSignalOnly",
  "evidenceBasedOnly",
  "maskSensitiveValues",
] as const;

function isRequiredComponentBound(componentId: string, deps: SecurityAuditDependencies): boolean {
  switch (componentId) {
    case "authentication-worker":
      return !!deps.authenticationWorker;
    case "authorization-worker":
      return !!deps.authorizationWorker;
    case "api-runtime":
      return !!deps.apiRuntime;
    default:
      return false;
  }
}

export function evaluateGovernanceSummary(
  root: string,
  config: SecurityAuditConfiguration,
  deps: SecurityAuditDependencies,
): GovernanceSummary {
  const selfPath = join(root, SECURITY_AUDIT_SYSTEM_PATH);
  const selfDocPresent = existsSync(selfPath);
  const selfText = selfDocPresent ? readFileSync(selfPath, "utf8") : "";
  const containsExpectedLabel = selfText.includes("Security Audit");
  const boundaryLocksHonoured = BOUNDARY_LOCK_KEYS.every(
    (key) => (config as unknown as Record<string, unknown>)[key] === true,
  );
  const requiredComponentsBoundCount = REQUIRED_SECURITY_COMPONENT_KEYS.filter((key) =>
    isRequiredComponentBound(key, deps),
  ).length;
  const compliant = selfDocPresent && containsExpectedLabel && boundaryLocksHonoured;
  return {
    compliant,
    grandKingApprovalRequired: true,
    securityAuditRequired: true,
    selfDocPresent,
    selfDocPath: SECURITY_AUDIT_SYSTEM_PATH,
    boundaryLocksHonoured,
    requiredComponentsBoundCount,
    totalRequiredComponents: REQUIRED_SECURITY_COMPONENT_KEYS.length,
    evidence: [
      `selfDocPresent=${selfDocPresent}`,
      `containsExpectedLabel=${containsExpectedLabel}`,
      `boundaryLocksHonoured=${boundaryLocksHonoured}`,
      `requiredComponentsBoundCount=${requiredComponentsBoundCount}/${REQUIRED_SECURITY_COMPONENT_KEYS.length}`,
    ],
  };
}

function summarizeDimension(
  dimension: SecurityDimensionSummary["dimension"],
  matrix: SecurityAssessment[],
  select: (row: SecurityAssessment) => string,
): SecurityDimensionSummary {
  const passedCount = matrix.filter((r) => select(r) === "Passed").length;
  const partialCount = matrix.filter((r) => select(r) === "Partial").length;
  const failedCount = matrix.filter((r) => select(r) === "Failed").length;
  const missingCount = matrix.filter((r) => select(r) === "Missing").length;
  return {
    dimension,
    passedCount,
    partialCount,
    failedCount,
    missingCount,
    totalComponents: matrix.length,
    evidence: [`${dimension}: passed=${passedCount} partial=${partialCount} failed=${failedCount} missing=${missingCount} of ${matrix.length}`],
  };
}

export function evaluateAuthenticationSummary(matrix: SecurityAssessment[]): SecurityDimensionSummary {
  return summarizeDimension("authentication", matrix, (r) => r.authenticationStatus);
}

export function evaluateAuthorizationSummary(matrix: SecurityAssessment[]): SecurityDimensionSummary {
  return summarizeDimension("authorization", matrix, (r) => r.authorizationStatus);
}

export function evaluateSecretManagementSummary(matrix: SecurityAssessment[]): SecurityDimensionSummary {
  return summarizeDimension("secretManagement", matrix, (r) => r.secretStatus);
}

export function evaluateApiSecuritySummary(matrix: SecurityAssessment[]): SecurityDimensionSummary {
  return summarizeDimension("apiSecurity", matrix, (r) => r.apiSecurityStatus);
}

export function evaluateDataProtectionSummary(matrix: SecurityAssessment[]): SecurityDimensionSummary {
  return summarizeDimension("dataProtection", matrix, (r) => r.dataProtectionStatus);
}

export function evaluateRuntimeSecuritySummary(matrix: SecurityAssessment[]): SecurityDimensionSummary {
  return summarizeDimension("runtimeSecurity", matrix, (r) => r.runtimeSecurityStatus);
}

export function evaluateOperationalSecuritySummary(matrix: SecurityAssessment[]): SecurityDimensionSummary {
  return summarizeDimension("operationalSecurity", matrix, (r) => r.operationalSecurityStatus);
}

const READINESS_SCORE_BY_CLASSIFICATION: Record<ReadinessClassification, number> = {
  certified: 1,
  partially_certified: 0.5,
  deferred: 0.25,
  blocked: 0,
  failed: 0,
  missing: 0,
};

export function evaluateSecurityReadinessSummary(matrix: SecurityAssessment[]): SecurityReadinessSummary {
  const certifiedCount = matrix.filter((r) => r.readinessClassification === "certified").length;
  const partiallyCertifiedCount = matrix.filter((r) => r.readinessClassification === "partially_certified").length;
  const failedCount = matrix.filter((r) => r.readinessClassification === "failed").length;
  const missingCount = matrix.filter((r) => r.readinessClassification === "missing").length;
  const blockedCount = matrix.filter((r) => r.readinessClassification === "blocked").length;
  const deferredCount = matrix.filter((r) => r.readinessClassification === "deferred").length;

  const overallReadinessScore =
    matrix.length === 0
      ? 0
      : Math.round(
          (matrix.reduce((sum, r) => sum + READINESS_SCORE_BY_CLASSIFICATION[r.readinessClassification], 0) /
            matrix.length) *
            100,
        ) / 100;

  const allCertified = matrix.length > 0 && matrix.every((r) => r.readinessClassification === "certified");

  return {
    computedAt: new Date().toISOString(),
    totalComponents: matrix.length,
    certifiedCount,
    partiallyCertifiedCount,
    failedCount,
    missingCount,
    blockedCount,
    deferredCount,
    overallReadinessScore,
    allCertified,
    notes: allCertified
      ? ["All catalogued security components observed certified"]
      : matrix.length === 0
        ? ["No security components discovered — no security handles injected"]
        : matrix
            .filter((r) => r.readinessClassification !== "certified")
            .map((r) => `${r.componentId} is ${r.readinessClassification}`),
    evidence: matrix.map((r) => `${r.componentId}:${r.readinessClassification}`),
  };
}
