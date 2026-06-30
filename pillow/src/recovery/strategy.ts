import type { MissionDiagnosis, RecoveryStrategy } from "./types.js";

export function determineRecoveryStrategy(
  diagnosis: MissionDiagnosis,
): { strategy: RecoveryStrategy; resumeTarget: string } {
  if (
    diagnosis.executiveAuditStatus === "produced" &&
    diagnosis.validationStatus === "passed"
  ) {
    return {
      strategy: "mission_already_complete",
      resumeTarget: "executive_audit",
    };
  }

  if (diagnosis.validationStatus === "passed" && diagnosis.executiveAuditStatus === "missing") {
    return {
      strategy: "resume_executive_audit",
      resumeTarget: "executive_audit",
    };
  }

  if (
    diagnosis.currentState === "validation" ||
    diagnosis.acceptanceCriteria.find((c) => c.id === "implementation")?.completed
  ) {
    const implDone = diagnosis.acceptanceCriteria.find((c) => c.id === "implementation")?.completed;
    const valDone = diagnosis.acceptanceCriteria.find((c) => c.id === "validation")?.completed;
    if (implDone && !valDone) {
      return { strategy: "resume_validation", resumeTarget: "validation" };
    }
  }

  if (diagnosis.issueKind === "architecture" && diagnosis.incompleteCriteriaCount === diagnosis.acceptanceCriteria.length) {
    return {
      strategy: "recovery_impossible",
      resumeTarget: diagnosis.currentState,
    };
  }

  const firstIncomplete = diagnosis.acceptanceCriteria.find((c) => !c.completed);
  if (!firstIncomplete) {
    return {
      strategy: "mission_already_complete",
      resumeTarget: "completed",
    };
  }

  if (firstIncomplete.id === "validation") {
    return { strategy: "resume_validation", resumeTarget: "validation" };
  }
  if (firstIncomplete.id === "executive_audit") {
    return { strategy: "resume_executive_audit", resumeTarget: "executive_audit" };
  }

  return { strategy: "resume_implementation", resumeTarget: "implementation" };
}
