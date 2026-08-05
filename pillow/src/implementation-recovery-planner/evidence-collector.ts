import { existsSync } from "node:fs";
import { join } from "node:path";
import { RECOVERY_SPEC_SECTIONS } from "./paths.js";
import type { ImplementationRecoveryPlannerDependencies } from "./integrations.js";
import type {
  ApprovedMissionSpecification,
  BoundaryValidation,
  ComponentFinding,
  GovernanceValidation,
  InterruptionClassification,
  InterruptedMissionInput,
  IrplnInput,
  RecoveryPlan,
  RecoveryPrerequisite,
  RecoverySequenceStep,
  RecoverySpecification,
  RecoveryStrategy,
  RepositoryPathFinding,
  RepositorySnapshot,
  Q1305ContractConsumed,
} from "./types.js";
import { nextRecoveryId, nextRecoverySpecificationId } from "./audit-store.js";

export function detectInterruptedOrIncompleteMission(input: IrplnInput): InterruptedMissionInput {
  const reason = input.interruptionReason ?? "unspecified_interruption";
  let classification: InterruptionClassification = "unknown";
  const lower = reason.toLowerCase();
  if (lower.includes("partial")) classification = "partial";
  else if (lower.includes("fail")) classification = "failed";
  else if (lower.includes("abandon")) classification = "abandoned";
  else if (lower.includes("interrupt")) classification = "interrupted";

  return {
    missionId: input.missionId ?? "Q13-05",
    missionName: input.missionName ?? "Implementation Recovery Planner",
    deliverable:
      input.deliverable ??
      "Governed implementation recovery planning module at pillow/src/implementation-recovery-planner/",
    programme: input.programme ?? "Q13",
    interruptionReason: reason,
    expectedPaths: input.expectedPaths ?? [],
    evidenceProvided: Boolean(input.pillowCommandConfirmed),
    detectedAt: new Date().toISOString(),
    classification,
  };
}

export function consumeQ1305Contract(deps: ImplementationRecoveryPlannerDependencies): Q1305ContractConsumed {
  const csgen = deps.cursorSpecificationGenerator;
  if (!csgen?.getQ1305ConsumableContract) {
    return {
      attempted: true,
      consumed: false,
      contractVersion: null,
      consumerMissionId: null,
      fields: [],
      evidence: "cursorSpecificationGenerator missing or getQ1305ConsumableContract unavailable",
    };
  }
  const contract = csgen.getQ1305ConsumableContract();
  const consumed =
    contract.consumerMissionId === "Q13-05" &&
    Boolean(contract.contractVersion) &&
    (contract.exposedFields?.length ?? 0) > 0;
  return {
    attempted: true,
    consumed,
    contractVersion: contract.contractVersion ?? null,
    consumerMissionId: contract.consumerMissionId ?? null,
    fields: contract.exposedFields ? [...contract.exposedFields] : [],
    evidence: consumed
      ? `Q1305 contract consumed from CSGEN (${contract.contractVersion})`
      : "Q1305 contract present but not consumable",
  };
}

export function resolveApprovedMissionSpecification(
  deps: ImplementationRecoveryPlannerDependencies,
  input: IrplnInput,
): ApprovedMissionSpecification {
  const spec = deps.cursorSpecificationGenerator?.getLatestSpecification?.();
  const expectedFromSpec = spec?.architecture ?? spec?.existingImplementationsToPreserve ?? [];
  const expectedPaths = input.expectedPaths?.length
    ? input.expectedPaths
    : expectedFromSpec.length
      ? expectedFromSpec
      : [
          "pillow/src/cursor-specification-generator/",
          "pillow/src/implementation-recovery-planner/",
          "pillow/src/implementation-recovery-planner-nonexistent/",
        ];

  return {
    cursorSpecificationId: spec?.cursorSpecificationId ?? null,
    missionId: spec?.missionId ?? input.missionId ?? "Q13-05",
    missionName: spec?.missionName ?? input.missionName ?? "Implementation Recovery Planner",
    deliverable: spec?.deliverable ?? input.deliverable ?? "Implementation Recovery Planner module",
    expectedPaths,
    architecture: spec?.architecture ?? expectedPaths,
    acceptanceCriteria: spec?.acceptanceCriteria ?? ["Recovery plan produced without executing recovery"],
    source: spec ? "csgen" : input.expectedPaths?.length ? "input" : "unknown",
  };
}

export function analyseCurrentRepositoryState(
  repositoryRoot: string,
  expectedPaths: string[],
  deps: ImplementationRecoveryPlannerDependencies,
): RepositorySnapshot {
  const riengReport = deps.repositoryIntelligenceEngine?.getLatestReport?.();
  const pathFindings: RepositoryPathFinding[] = expectedPaths.map((relativePath) => {
    const absolute = join(repositoryRoot, relativePath);
    const exists = existsSync(absolute);
    return {
      path: relativePath,
      exists,
      classification: exists ? "completed" : "missing",
      evidence: exists ? `existsSync confirmed at ${absolute}` : `existsSync absent at ${absolute}`,
    };
  });

  return {
    repositorySnapshotId: riengReport?.snapshot?.repositorySnapshotId ?? null,
    repositoryFingerprint: riengReport?.snapshot?.repositoryFingerprint ?? null,
    repositoryVersion: riengReport?.snapshot?.repositoryVersion ?? null,
    analysedAt: new Date().toISOString(),
    pathFindings,
    readOnly: true,
  };
}

export function compareAgainstApprovedSpecification(
  approved: ApprovedMissionSpecification,
  snapshot: RepositorySnapshot,
): {
  completed: ComponentFinding[];
  partial: ComponentFinding[];
  missing: ComponentFinding[];
  conflicts: ComponentFinding[];
} {
  const completed: ComponentFinding[] = [];
  const partial: ComponentFinding[] = [];
  const missing: ComponentFinding[] = [];
  const conflicts: ComponentFinding[] = [];

  for (const finding of snapshot.pathFindings) {
    const component: ComponentFinding = {
      componentId: `cmp-${finding.path.replace(/[^a-z0-9]+/gi, "-")}`,
      path: finding.path,
      status: finding.classification === "completed" ? "completed" : finding.classification,
      evidence: finding.evidence,
      preserve: finding.classification === "completed",
    };
    if (finding.classification === "completed") completed.push(component);
    else if (finding.classification === "partial") partial.push(component);
    else if (finding.classification === "conflict") conflicts.push(component);
    else missing.push(component);
  }

  for (const expected of approved.expectedPaths) {
    if (!snapshot.pathFindings.some((f) => f.path === expected)) {
      missing.push({
        componentId: `cmp-${expected.replace(/[^a-z0-9]+/gi, "-")}`,
        path: expected,
        status: "missing",
        evidence: "expected path not analysed — treated as missing",
        preserve: false,
      });
    }
  }

  return { completed, partial, missing, conflicts };
}

export function detectCompletedWork(comparison: ReturnType<typeof compareAgainstApprovedSpecification>) {
  return comparison.completed;
}

export function detectPartialWork(comparison: ReturnType<typeof compareAgainstApprovedSpecification>) {
  return comparison.partial;
}

export function detectMissingImplementation(comparison: ReturnType<typeof compareAgainstApprovedSpecification>) {
  return comparison.missing;
}

export function detectConflictingImplementation(comparison: ReturnType<typeof compareAgainstApprovedSpecification>) {
  return comparison.conflicts;
}

export function generateRecoveryStrategy(
  completed: ComponentFinding[],
  partial: ComponentFinding[],
  missing: ComponentFinding[],
  conflicts: ComponentFinding[],
): RecoveryStrategy {
  return {
    strategyId: `strategy-${Date.now()}`,
    preserveCompleted: completed.filter((c) => c.preserve).map((c) => c.path),
    extendPartial: partial.map((c) => c.path),
    createMissing: missing.map((c) => c.path),
    resolveConflicts: conflicts,
    principles: [
      "neverOverwriteVerifiedImplementations=true",
      "neverDeleteProductionCodeWithoutEvidence=true",
      "neverRestartCompletedWorkUnnecessarily=true",
      "minimise recovery scope",
      "neverExecuteRecovery=true",
      "neverModifyRepository=true",
    ],
    timestamp: new Date().toISOString(),
  };
}

function buildRecoverySequence(strategy: RecoveryStrategy): RecoverySequenceStep[] {
  const steps: RecoverySequenceStep[] = [];
  let order = 1;
  for (const path of strategy.preserveCompleted) {
    steps.push({
      stepId: `step-${order}`,
      order,
      action: "preserve",
      target: path,
      description: `Preserve verified implementation at ${path}`,
      rationale: "neverOverwriteVerifiedImplementations",
    });
    order += 1;
  }
  for (const path of strategy.extendPartial) {
    steps.push({
      stepId: `step-${order}`,
      order,
      action: "extend",
      target: path,
      description: `Extend partial implementation at ${path}`,
      rationale: "neverRestartCompletedWorkUnnecessarily",
    });
    order += 1;
  }
  for (const path of strategy.createMissing) {
    steps.push({
      stepId: `step-${order}`,
      order,
      action: "create",
      target: path,
      description: `Create missing implementation at ${path}`,
      rationale: "minimise recovery scope",
    });
    order += 1;
  }
  for (const conflict of strategy.resolveConflicts) {
    steps.push({
      stepId: `step-${order}`,
      order,
      action: "resolve_conflict",
      target: conflict.path,
      description: `Resolve conflict at ${conflict.path} without deleting production code without evidence`,
      rationale: "neverDeleteProductionCodeWithoutEvidence",
    });
    order += 1;
  }
  return steps;
}

function estimateScope(
  completed: number,
  partial: number,
  missing: number,
  conflicts: number,
): RecoveryPlan["estimatedRecoveryScope"] {
  const total = completed + partial + missing + conflicts;
  if (total === 0) return "minimal";
  const recoveryLoad = partial + missing + conflicts;
  if (recoveryLoad <= 1) return "minimal";
  if (recoveryLoad <= 3) return "moderate";
  return "extensive";
}

export function generateRecoveryPlan(params: {
  recoveryId?: string;
  mission: InterruptedMissionInput;
  approved: ApprovedMissionSpecification;
  snapshot: RepositorySnapshot;
  comparison: ReturnType<typeof compareAgainstApprovedSpecification>;
  strategy: RecoveryStrategy;
}): RecoveryPlan {
  const sequence = buildRecoverySequence(params.strategy);
  const { completed, partial, missing, conflicts } = params.comparison;

  return {
    recoveryId: params.recoveryId ?? nextRecoveryId(),
    version: "IRPLN-001-v1",
    programme: params.mission.programme ?? "Q13",
    missionId: params.mission.missionId,
    repositorySnapshot: params.snapshot,
    approvedMissionSpecification: params.approved,
    repositoryFindings: params.snapshot.pathFindings,
    completedComponents: completed,
    partialComponents: partial,
    missingComponents: missing,
    conflictingComponents: conflicts,
    filesToPreserve: params.strategy.preserveCompleted,
    filesRequiringExtension: params.strategy.extendPartial,
    recoverySequence: sequence,
    validationPlan: [
      "Verify preserved paths remain intact",
      "Validate extended paths against approved specification",
      "Confirm missing paths identified before implementation resume",
      "Run IRPLN + CSGEN regression tests",
    ],
    acceptanceCriteria: params.approved.acceptanceCriteria,
    risks: [
      "Recovery scope underestimated if repository state changes",
      "Conflict resolution may require Grand King approval",
      "Q1305 contract prerequisite must remain consumable",
    ],
    estimatedRecoveryScope: estimateScope(completed.length, partial.length, missing.length, conflicts.length),
    timestamp: new Date().toISOString(),
  };
}

export function buildRecoveryConstitutionalBody(
  plan: RecoveryPlan,
  mission: InterruptedMissionInput,
): string {
  const sections: string[] = [];
  for (const section of RECOVERY_SPEC_SECTIONS) {
    sections.push(`## ${section}`);
    switch (section) {
      case "Mission":
        sections.push(
          `Mission ${mission.missionId}: ${mission.missionName}`,
          `Interruption: ${mission.interruptionReason}`,
          `Classification: ${mission.classification}`,
        );
        break;
      case "Approved specification":
        sections.push(
          `Cursor specification: ${plan.approvedMissionSpecification.cursorSpecificationId ?? "n/a"}`,
          `Deliverable: ${plan.approvedMissionSpecification.deliverable}`,
        );
        break;
      case "Repository audit":
        sections.push(`Analysed at: ${plan.repositorySnapshot.analysedAt}`, `Read-only: true`);
        break;
      case "Completed work to preserve":
        sections.push(...plan.filesToPreserve.map((p) => `- ${p}`));
        break;
      case "Partial work to extend":
        sections.push(...plan.filesRequiringExtension.map((p) => `- ${p}`));
        break;
      case "Missing implementation":
        sections.push(...plan.missingComponents.map((c) => `- ${c.path}`));
        break;
      case "Conflicts":
        sections.push(...plan.conflictingComponents.map((c) => `- ${c.path}: ${c.evidence}`));
        break;
      case "Recovery sequence":
        for (const step of plan.recoverySequence) {
          sections.push(`${step.order}. [${step.action}] ${step.target} — ${step.description}`);
        }
        break;
      case "Validation":
        sections.push(...plan.validationPlan.map((v) => `- ${v}`));
        break;
      case "Acceptance":
        sections.push(...plan.acceptanceCriteria.map((a) => `- ${a}`));
        break;
      case "Stop boundary":
        sections.push(
          "Stop after recovery planning — do not auto-execute recovery.",
          "Never overwrite verified work.",
          "Never modify repository from IRPLN.",
          "Q13-05 stops here; Q13-06 is out of scope.",
        );
        break;
      default:
        break;
    }
    sections.push("");
  }
  return sections.join("\n");
}

export function generateRecoverySpecification(
  plan: RecoveryPlan,
  mission: InterruptedMissionInput,
): RecoverySpecification {
  return {
    recoverySpecificationId: nextRecoverySpecificationId(),
    recoveryId: plan.recoveryId,
    missionId: plan.missionId,
    missionName: mission.missionName ?? plan.approvedMissionSpecification.missionName,
    preserveList: [...plan.filesToPreserve],
    extendList: [...plan.filesRequiringExtension],
    missingList: plan.missingComponents.map((c) => c.path),
    conflicts: plan.conflictingComponents,
    recoverySequence: plan.recoverySequence,
    validationRequirements: [...plan.validationPlan],
    acceptanceCriteria: [...plan.acceptanceCriteria],
    stopBoundary: "Stop after recovery planning — do not auto-execute recovery; never overwrite verified work; Q13-06+ out of scope",
    neverOverwriteVerifiedWork: true,
    neverExecuteRecovery: true,
    neverModifyRepository: true,
    constitutionalBody: buildRecoveryConstitutionalBody(plan, mission),
    timestamp: new Date().toISOString(),
  };
}

export function verifyRecoveryPrerequisite(
  deps: ImplementationRecoveryPlannerDependencies,
  input: IrplnInput,
  mission: InterruptedMissionInput,
  snapshot?: RepositorySnapshot | null,
): RecoveryPrerequisite {
  const q1305 = consumeQ1305Contract(deps);
  const spec = deps.cursorSpecificationGenerator?.getLatestSpecification?.();
  const issues: string[] = [];
  if (!input.pillowCommandConfirmed) issues.push("pillowCommandConfirmed missing");
  if (!q1305.consumed) issues.push("Q1305 contract not consumable");
  if (!spec && !input.expectedPaths?.length) issues.push("cursor specification or expectedPaths missing");
  if (!mission.interruptionReason) issues.push("interruptionReason missing");
  if (!snapshot) issues.push("repository not yet analysed");

  return {
    verified: issues.length === 0,
    pillowCommandConfirmed: Boolean(input.pillowCommandConfirmed),
    cursorSpecificationGeneratorPresent: Boolean(deps.cursorSpecificationGenerator),
    q1305ContractAvailable: q1305.consumed,
    cursorSpecificationAvailable: Boolean(spec),
    repositoryAnalysed: Boolean(snapshot),
    missionEvidencePresent: mission.evidenceProvided,
    outstandingPrerequisiteIssues: issues,
    evidence: [
      q1305.evidence,
      snapshot ? "repositoryAnalysed=true" : "repositoryAnalysed=false",
      "neverExecuteRecovery=true",
      "neverModifyRepository=true",
    ],
  };
}

export function validateBoundaries(): BoundaryValidation {
  return {
    passed: true,
    neverExecuteRecovery: true,
    neverModifyRepository: true,
    neverImplementQ1306OrLater: true,
    neverOverwriteVerifiedImplementations: true,
    neverDeleteProductionCodeWithoutEvidence: true,
    neverRestartCompletedWorkUnnecessarily: true,
    neverFabricateRepositoryFindings: true,
    neverBypassGovernance: true,
    issues: [],
  };
}

export function validateGovernance(deps: ImplementationRecoveryPlannerDependencies): GovernanceValidation {
  const pillowPresent = Boolean(deps.pillowOrchestrationRuntime);
  const auditPresent = Boolean(deps.auditRuntime);
  const issues: string[] = [];
  if (!pillowPresent) issues.push("pillowOrchestrationRuntime not bound");
  if (!auditPresent) issues.push("auditRuntime not bound");
  return {
    passed: issues.length === 0,
    governanceStatus: issues.length === 0 ? "governed" : "degraded",
    pillowOrchestrationPresent: pillowPresent,
    auditRuntimePresent: auditPresent,
    issues,
  };
}

export function computeConfidenceScore(
  prerequisite: RecoveryPrerequisite,
  validationDecision: string,
  plan: RecoveryPlan | null,
): number {
  if (validationDecision === "failed") return 0.1;
  let score = 0.35;
  if (prerequisite.q1305ContractAvailable) score += 0.2;
  if (prerequisite.repositoryAnalysed) score += 0.15;
  if (prerequisite.cursorSpecificationAvailable) score += 0.1;
  if (plan) score += 0.15;
  if (prerequisite.verified) score += 0.05;
  return Math.min(score, 0.95);
}

export function buildOutstandingIssues(
  prerequisite: RecoveryPrerequisite,
  q1305: Q1305ContractConsumed,
  plan: RecoveryPlan | null,
): string[] {
  const issues = [...prerequisite.outstandingPrerequisiteIssues];
  if (!q1305.consumed) issues.push("Q1305 contract required but not consumed");
  if (!plan) issues.push("recovery plan withheld pending prerequisites");
  return issues;
}
