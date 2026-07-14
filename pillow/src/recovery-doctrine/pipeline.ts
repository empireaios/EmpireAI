import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RecoveryManagerEngine } from "../recovery/engine.js";
import { inspectRepositoryState } from "../recovery/inspector.js";
import { diagnoseMissionState } from "../recovery/diagnosis.js";
import { determineRecoveryStrategy } from "../recovery/strategy.js";
import type { RecoveryTrigger } from "../recovery/types.js";
import type { StallSignal, SupervisedMission } from "../supervisor/types.js";
import { computeRecoveryConfidence, selectAutonomousActions } from "./autonomous-actions.js";
import { classifyFailure } from "./failure-classifier.js";
import { selectEscalationLevel } from "./escalation.js";
import { RECOVERY_LIMITS } from "./paths.js";
import type {
  RecoveryMissionFailureRequest,
  RecoveryOutcomeReport,
  RecoveryPipelineResult,
  RecoveryPipelineStep,
} from "./types.js";

function step(
  id: RecoveryPipelineStep["id"],
  label: string,
  status: RecoveryPipelineStep["status"],
  detail: string,
): RecoveryPipelineStep {
  return { id, label, status, detail };
}

/** Execute full P4-05 recovery pipeline for a failed mission. */
export async function executeRecoveryPipeline(input: {
  bootstrap: EmpireBootstrapContext;
  recoveryManager: RecoveryManagerEngine;
  request: RecoveryMissionFailureRequest;
}): Promise<RecoveryPipelineResult> {
  const { bootstrap, recoveryManager, request } = input;
  const { mission, trigger, stallSignals, grandKingOverride } = request;
  const steps: RecoveryPipelineStep[] = [];

  steps.push(
    step("failure_detected", "Failure Detected", "completed", `Trigger: ${trigger}`),
  );

  const inspection = await inspectRepositoryState(bootstrap.repositoryRoot);
  const diagnosis = diagnoseMissionState(mission, trigger, stallSignals);
  const classification = classifyFailure({
    trigger,
    issueKind: diagnosis.issueKind,
    stallSignals,
    repositoryIntegrityOk: inspection.repositoryIntegrityOk,
    recoveryAttempts: mission.recoveryAttempts,
  });

  steps.push(
    step(
      "failure_classification",
      "Failure Classification",
      "completed",
      classification,
    ),
  );

  steps.push(
    step(
      "evidence_collection",
      "Evidence Collection",
      "completed",
      `${inspection.modifiedFiles.length} modified · ${inspection.createdFiles.length} created · integrity: ${inspection.repositoryIntegrityOk ? "ok" : "conflict"}`,
    ),
  );

  const { strategy, resumeTarget } = determineRecoveryStrategy(diagnosis);
  const rootCause = `${diagnosis.issueKind} — ${diagnosis.incompleteCriteriaCount} incomplete criteria · validation: ${diagnosis.validationStatus}`;

  steps.push(
    step("root_cause_analysis", "Root Cause Analysis", "completed", rootCause),
  );

  steps.push(
    step(
      "recovery_strategy_selection",
      "Recovery Strategy Selection",
      "completed",
      `${strategy} → ${resumeTarget}`,
    ),
  );

  const autonomousActions = selectAutonomousActions(classification);
  const recoveryConfidence = computeRecoveryConfidence({
    classification,
    repositoryIntegrityOk: inspection.repositoryIntegrityOk,
    recoveryAttempts: mission.recoveryAttempts,
    validationPassed: mission.validationCompleted,
  });

  const escalation = selectEscalationLevel({
    classification,
    recoveryConfidence,
    productionRiskHigh: classification === "production",
    requiresIrreversibleAction: strategy === "recovery_impossible",
    constitutionalConflict: classification === "architecture" && !inspection.repositoryIntegrityOk,
    grandKingOverride,
  });

  const validationPassed =
    recoveryConfidence >= RECOVERY_LIMITS.recoveryConfidenceThreshold &&
    !escalation.escalated &&
    strategy !== "recovery_impossible";

  steps.push(
    step(
      "recovery_validation",
      "Recovery Validation",
      validationPassed ? "completed" : "failed",
      `Confidence ${(recoveryConfidence * 100).toFixed(0)}% · escalation: ${escalation.level}`,
    ),
  );

  let execution = null;
  let recovered = false;
  let resumeState: SupervisedMission["state"] | null = null;

  if (validationPassed) {
    execution = await recoveryManager.executeRecovery({
      mission,
      trigger,
      stallSignals,
    });
    recovered = execution.recovered;
    resumeState = execution.resumeState;

    steps.push(
      step(
        "recovery_execution",
        "Recovery Execution",
        recovered ? "completed" : "failed",
        execution.recommendation,
      ),
    );

    steps.push(
      step(
        "verification",
        "Verification",
        recovered ? "completed" : "failed",
        recovered
          ? `Resumed at ${resumeState} · outcome: ${execution.record.outcome}`
          : "Recovery did not complete safely",
      ),
    );
  } else {
    steps.push(
      step(
        "recovery_execution",
        "Recovery Execution",
        "skipped",
        escalation.reason,
      ),
    );
    steps.push(
      step("verification", "Verification", "skipped", "Blocked pending escalation"),
    );
  }

  const lessonsLearned = buildLessonsLearned(classification, execution?.record ?? null, escalation.level);
  steps.push(
    step("lessons_learned", "Lessons Learned", "completed", lessonsLearned),
  );

  const visionNote =
    classification === "architecture"
      ? "Architecture weakness — consider Vision Accumulation if structural"
      : "No structural vision update required";
  steps.push(
    step("vision_accumulation", "Vision Accumulation", "completed", visionNote),
  );

  const report = buildOutcomeReport({
    mission,
    classification,
    execution,
    recovered,
    escalationLevel: escalation.level,
    lessonsLearned,
  });

  return {
    pipelineVersion: "P4-05",
    missionId: mission.id,
    trigger,
    classification,
    rootCause,
    recoveryConfidence,
    escalationLevel: escalation.level,
    escalated: escalation.escalated,
    autonomousActions,
    steps,
    execution,
    recovered,
    resumeState,
    report,
    completedAt: new Date().toISOString(),
  };
}

function buildLessonsLearned(
  classification: string,
  record: import("../recovery/types.js").RecoveryRecord | null,
  escalationLevel: string,
): string {
  const parts = [`Classification: ${classification}`, `Escalation: ${escalationLevel}`];
  if (record) {
    parts.push(`Strategy: ${record.strategy}`, `Outcome: ${record.outcome}`);
  }
  return parts.join(" · ");
}

function buildOutcomeReport(input: {
  mission: SupervisedMission;
  classification: string;
  execution: import("../recovery/types.js").RecoveryExecutionResult | null;
  recovered: boolean;
  escalationLevel: string;
  lessonsLearned: string;
}): RecoveryOutcomeReport {
  const record = input.execution?.record;
  return {
    summary: input.recovered
      ? `Mission ${input.mission.id} recovered via P4-05 pipeline`
      : `Mission ${input.mission.id} blocked — escalation to ${input.escalationLevel}`,
    filesModified: record?.preservedWork ?? [],
    architectureImpact:
      input.classification === "architecture" ? "Review architecture alignment" : "None recorded",
    repositoryImpact: record?.inspection.diffSummary ?? "Inspected — work preserved",
    productionImpact:
      input.classification === "production" ? "Verify Production Truth before resume" : "Not scoped",
    testsExecuted: record?.validation
      ? `typecheck: ${record.validation.typecheckPassed ? "pass" : "fail"} · build: ${record.validation.buildPassed ? "pass" : "fail"}`
      : "Not executed",
    acceptanceStatus: input.recovered ? "Recovery succeeded — resume mission" : "Escalated",
    remainingRisks: record?.warnings ?? [],
    lessonsLearned: input.lessonsLearned,
    recommendedNextRoadmapItem: "P4-06 — Browser Truth",
  };
}
