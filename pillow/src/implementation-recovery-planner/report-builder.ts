import {
  IMPLEMENTATION_RECOVERY_PLANNER_REPORT_VERSION,
  IRPLN_METADATA_VERSION,
} from "./paths.js";
import type {
  BoundaryValidation,
  ComponentFinding,
  GovernanceValidation,
  InterruptedMissionInput,
  IrplnValidation,
  RecoveryPlan,
  RecoveryPrerequisite,
  RecoveryReport,
  RecoverySpecification,
  Q1305ContractConsumed,
  RepositorySnapshot,
} from "./types.js";

export function buildReport(params: {
  reportId: string;
  workerId: string;
  mission: InterruptedMissionInput;
  repositorySnapshot: RepositorySnapshot;
  completed: ComponentFinding[];
  partial: ComponentFinding[];
  missing: ComponentFinding[];
  conflicts: ComponentFinding[];
  recoveryStrategy: string[];
  validationStrategy: string[];
  acceptanceCriteria: string[];
  riskSummary: string[];
  plans: RecoveryPlan[];
  recoverySpecifications: RecoverySpecification[];
  boundaryValidation: BoundaryValidation;
  governanceValidation: GovernanceValidation;
  validation: IrplnValidation;
  confidenceScore: number;
  q1305ContractConsumed: Q1305ContractConsumed;
  recoveryPrerequisite: RecoveryPrerequisite;
  supportingEvidence: string[];
  historyRefs: string[];
}): RecoveryReport {
  const timestamp = new Date().toISOString();
  const plan = params.plans[0] ?? null;

  return {
    reportId: params.reportId,
    reportVersion: IMPLEMENTATION_RECOVERY_PLANNER_REPORT_VERSION,
    metadataVersion: IRPLN_METADATA_VERSION,
    engineId: "PILLOW-IRPLN-001",
    timestamp,
    runTimestamp: timestamp,
    workerId: params.workerId,
    missionId: "Q13-05",
    missionSummary: {
      missionId: params.mission.missionId,
      missionName: params.mission.missionName ?? "Implementation Recovery Planner",
      deliverable: params.mission.deliverable ?? "Implementation Recovery Planner module",
      programme: params.mission.programme ?? "Q13",
      interruptionReason: params.mission.interruptionReason,
      classification: params.mission.classification,
    },
    repositoryAuditSummary: params.repositorySnapshot,
    recoveryAnalysis: {
      completedCount: params.completed.length,
      partialCount: params.partial.length,
      missingCount: params.missing.length,
      conflictCount: params.conflicts.length,
      estimatedRecoveryScope: plan?.estimatedRecoveryScope ?? null,
    },
    completedWorkSummary: [...params.completed],
    partialWorkSummary: [...params.partial],
    missingWorkSummary: [...params.missing],
    conflictSummary: [...params.conflicts],
    recoveryStrategy: [...params.recoveryStrategy],
    validationStrategy: [...params.validationStrategy],
    acceptanceCriteria: [...params.acceptanceCriteria],
    riskSummary: [...params.riskSummary],
    confidenceScore: params.confidenceScore,
    plans: params.plans.map((p) => JSON.parse(JSON.stringify(p))),
    recoverySpecifications: params.recoverySpecifications.map((s) => JSON.parse(JSON.stringify(s))),
    boundaryValidation: params.boundaryValidation,
    governanceValidation: params.governanceValidation,
    recoveryPrerequisite: params.recoveryPrerequisite,
    q1305ContractConsumed: params.q1305ContractConsumed,
    consumableByQ1306: Boolean(plan) && params.validation.decision !== "failed",
    neverImplementQ1306OrLater: true,
    neverExecuteRecovery: true,
    neverModifyRepository: true,
    neverOverwriteVerifiedImplementations: true,
    neverDeleteProductionCodeWithoutEvidence: true,
    neverRestartCompletedWorkUnnecessarily: true,
    neverFabricateRepositoryFindings: true,
    neverBypassGovernance: true,
    recoveryPlanningOnly: true,
    preserveRecoveryHistory: true,
    supportingEvidence: [...params.supportingEvidence],
    traceabilityRefs: [
      "q13-05:implementation-recovery-planner",
      `report:${params.reportId}`,
      `mission:${params.mission.missionId}`,
    ],
    validation: params.validation,
    historyRefs: [...params.historyRefs],
  };
}

export function buildCatalog(
  workerId: string,
  reports: RecoveryReport[],
  plans: RecoveryPlan[],
  integrations: import("./types.js").IntegrationHandshake[],
  recoveryHistoryCount: number,
) {
  return {
    workerId,
    reports: reports.map((r) => ({
      reportId: r.reportId,
      timestamp: r.timestamp,
      confidenceScore: r.confidenceScore,
    })),
    plans: plans.map((p) => ({
      recoveryId: p.recoveryId,
      missionId: p.missionId,
      timestamp: p.timestamp,
    })),
    integrations: integrations.map((i) => ({ ...i })),
    recoveryHistoryCount,
  };
}
