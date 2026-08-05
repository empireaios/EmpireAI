import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BUSINESS_FACTORY_AUDIT_SYSTEM_PATH } from "./paths.js";
import type { BusinessFactoryAuditConfiguration } from "./configuration.js";
import type { BusinessFactoryAuditDependencies } from "./integrations.js";
import type {
  BusinessFactoryAssessment,
  FactoryReadinessSummary,
  GovernanceSummary,
  ReadinessClassification,
  RuntimeSummary,
  WorkflowSummary,
} from "./types.js";

const BOUNDARY_LOCK_KEYS = [
  "neverFabricateAuditEvidence",
  "neverCertifyIncompleteWorkflows",
  "neverCertifyMissingIntegrations",
  "neverAssumeImplementation",
  "neverModifyFactoryImplementations",
  "neverRepairFailedFactories",
  "neverBypassPillowGovernance",
  "neverBypassGrandKingApproval",
  "neverOverrideApprovedArchitecture",
  "neverOverridePillow",
  "neverOverrideGrandKing",
  "neverImplementQ1105OrLater",
  "preserveCompleteTraceability",
  "preserveImmutableAuditHistory",
  "preserveAuditHistory",
  "deterministicAuditBehaviour",
  "structuralSignalOnly",
  "evidenceBasedOnly",
  "maskSensitiveValues",
] as const;

export function evaluateGovernanceSummary(
  root: string,
  config: BusinessFactoryAuditConfiguration,
  matrix: BusinessFactoryAssessment[],
): GovernanceSummary {
  const selfPath = join(root, BUSINESS_FACTORY_AUDIT_SYSTEM_PATH);
  const selfDocPresent = existsSync(selfPath);
  const selfText = selfDocPresent ? readFileSync(selfPath, "utf8") : "";
  const containsExpectedLabel = selfText.includes("Business Factory Audit");
  const boundaryLocksHonoured = BOUNDARY_LOCK_KEYS.every(
    (key) => (config as unknown as Record<string, unknown>)[key] === true,
  );
  const governedFactoryCount = matrix.filter(
    (row) => row.governanceStatus === "Passed" || row.governanceStatus === "Partial",
  ).length;
  const compliant = selfDocPresent && containsExpectedLabel && boundaryLocksHonoured;
  return {
    compliant,
    grandKingApprovalRequired: true,
    businessFactoryAuditRequired: true,
    selfDocPresent,
    selfDocPath: BUSINESS_FACTORY_AUDIT_SYSTEM_PATH,
    boundaryLocksHonoured,
    governedFactoryCount,
    totalFactories: matrix.length,
    evidence: [
      `selfDocPresent=${selfDocPresent}`,
      `containsExpectedLabel=${containsExpectedLabel}`,
      `boundaryLocksHonoured=${boundaryLocksHonoured}`,
      `governedFactoryCount=${governedFactoryCount}/${matrix.length}`,
    ],
  };
}

export function evaluateWorkflowSummary(matrix: BusinessFactoryAssessment[]): WorkflowSummary {
  const workflowReadyFactoryCount = matrix.filter(
    (row) => row.workflowStatus === "Passed" || row.workflowStatus === "Partial",
  ).length;
  return {
    workflowReadyFactoryCount,
    totalFactories: matrix.length,
    evidence: [`workflowReadyFactoryCount=${workflowReadyFactoryCount}/${matrix.length}`],
  };
}

export function evaluateRuntimeSummary(
  deps: BusinessFactoryAuditDependencies,
  matrix: BusinessFactoryAssessment[],
): RuntimeSummary {
  const sharedRuntimeCoreBound = !!deps.sharedRuntimeCore;
  const runtimeIntegratedFactoryCount = matrix.filter(
    (row) => row.runtimeStatus === "Passed" || row.runtimeStatus === "Partial",
  ).length;
  return {
    runtimeIntegratedFactoryCount,
    totalFactories: matrix.length,
    sharedRuntimeCoreBound,
    evidence: [
      `sharedRuntimeCoreBound=${sharedRuntimeCoreBound}`,
      `runtimeIntegratedFactoryCount=${runtimeIntegratedFactoryCount}/${matrix.length}`,
    ],
  };
}

const READINESS_SCORE_BY_CLASSIFICATION: Record<ReadinessClassification, number> = {
  certified: 1,
  partially_certified: 0.5,
  deferred: 0.25,
  blocked: 0,
  failed: 0,
  missing: 0,
};

export function evaluateFactoryReadinessSummary(matrix: BusinessFactoryAssessment[]): FactoryReadinessSummary {
  const certifiedCount = matrix.filter((r) => r.readinessClassification === "certified").length;
  const partiallyCertifiedCount = matrix.filter(
    (r) => r.readinessClassification === "partially_certified",
  ).length;
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
    totalFactories: matrix.length,
    certifiedCount,
    partiallyCertifiedCount,
    failedCount,
    missingCount,
    blockedCount,
    deferredCount,
    overallReadinessScore,
    allCertified,
    notes: allCertified
      ? ["All discovered business factories observed certified"]
      : matrix.length === 0
        ? ["No factories discovered — Shared Runtime Core not injected or returned zero factories"]
        : matrix
            .filter((r) => r.readinessClassification !== "certified")
            .map((r) => `${r.factoryId} is ${r.readinessClassification}`),
    evidence: matrix.map((r) => `${r.factoryId}:${r.readinessClassification}`),
  };
}
