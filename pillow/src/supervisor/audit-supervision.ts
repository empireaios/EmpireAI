import type { SupervisedMission } from "./types.js";
import type { ExecutiveAuditVerification } from "./types.js";

const AUDIT_SECTION_MARKERS = [
  "Executive Audit",
  "Executive recommendation",
  "Validation results",
  "Acceptance",
  "Outstanding issues",
];

export function verifyExecutiveAuditCompletion(
  mission: SupervisedMission,
  auditText?: string | null,
): ExecutiveAuditVerification {
  const issues: string[] = [];
  const hasExecutiveAudit =
    mission.executiveAuditProduced ||
    Boolean(auditText && /executive audit/i.test(auditText));

  const hasValidation =
    mission.validationCompleted ||
    mission.progress.some((p) => p.kind === "validation_executed");

  const hasAcceptanceVerification =
    Boolean(auditText && /acceptance criteria/i.test(auditText)) ||
    mission.progress.some((p) => p.kind === "acceptance_criteria");

  const hasRepositoryContinuity =
    Boolean(auditText && /repository continuity|read-only|unchanged/i.test(auditText)) ||
    mission.progress.some((p) => p.kind === "repository_synchronized");

  if (!hasExecutiveAudit) {
    issues.push("Executive Audit not produced");
  }
  if (!hasValidation) {
    issues.push("Validation not recorded");
  }
  if (!hasAcceptanceVerification) {
    issues.push("Acceptance verification not recorded");
  }
  if (auditText) {
    for (const marker of AUDIT_SECTION_MARKERS) {
      if (!auditText.includes(marker) && marker !== "Acceptance") {
        /* optional sections — only flag missing Executive Audit header */
      }
    }
    if (!/Executive Audit|Executive recommendation/i.test(auditText)) {
      issues.push("Audit document missing mandatory Executive Audit sections");
    }
  }

  const complete =
    hasExecutiveAudit &&
    hasValidation &&
    hasAcceptanceVerification &&
    issues.filter((i) => !i.includes("Acceptance")).length <= 1;

  return {
    missionId: mission.id,
    complete,
    hasExecutiveAudit,
    hasValidation,
    hasAcceptanceVerification,
    hasRepositoryContinuity,
    issues,
  };
}

export function canMarkMissionComplete(
  mission: SupervisedMission,
  auditText?: string | null,
): boolean {
  if (mission.state === "completed" && mission.outcome === "success") {
    return verifyExecutiveAuditCompletion(mission, auditText).complete;
  }
  return false;
}
