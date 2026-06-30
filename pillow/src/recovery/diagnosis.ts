import type { StallSignal, SupervisedMission } from "../supervisor/types.js";
import { matchDoctrineStall } from "../supervisor/doctrine.js";
import type {
  AcceptanceCriteriaStatus,
  MissionDiagnosis,
  RecoveryIssueKind,
  RecoveryTrigger,
} from "./types.js";

function inferIssueKind(
  mission: SupervisedMission,
  trigger: RecoveryTrigger,
  stallSignals: StallSignal[],
): RecoveryIssueKind {
  if (trigger === "repository_interruption") return "repository";
  if (trigger === "interrupted_validation" || mission.state === "validation") {
    return "validation";
  }
  if (
    trigger === "dead_agent" ||
    trigger === "unexpected_cursor_termination" ||
    stallSignals.some((s) => matchDoctrineStall(s.message))
  ) {
    return "cursor";
  }
  if (mission.dependencies.some((d) => d.includes("ARCHITECTURE"))) {
    return "architecture";
  }
  return "mission";
}

function buildAcceptanceCriteria(mission: SupervisedMission): AcceptanceCriteriaStatus[] {
  const criteria: AcceptanceCriteriaStatus[] = [];

  if (mission.progress.some((p) => p.kind === "repository_analysis")) {
    criteria.push({
      id: "repository_analysis",
      label: "Repository analysis",
      completed: true,
    });
  } else if (["implementation", "validation", "executive_audit", "completed"].includes(mission.state)) {
    criteria.push({
      id: "repository_analysis",
      label: "Repository analysis",
      completed: true,
    });
  } else {
    criteria.push({
      id: "repository_analysis",
      label: "Repository analysis",
      completed: false,
    });
  }

  criteria.push({
    id: "implementation",
    label: "Implementation complete",
    completed: ["validation", "executive_audit", "completed"].includes(mission.state) ||
      mission.progress.some((p) => p.kind === "file_modified" || p.kind === "file_created"),
  });

  criteria.push({
    id: "validation",
    label: "Validation executed",
    completed: mission.validationCompleted ||
      mission.progress.some((p) => p.kind === "validation_executed"),
  });

  criteria.push({
    id: "executive_audit",
    label: "Executive Audit produced",
    completed: mission.executiveAuditProduced ||
      mission.progress.some((p) => p.kind === "executive_audit_generated"),
  });

  return criteria;
}

export function diagnoseMissionState(
  mission: SupervisedMission,
  trigger: RecoveryTrigger,
  stallSignals: StallSignal[] = [],
): MissionDiagnosis {
  const acceptanceCriteria = buildAcceptanceCriteria(mission);
  const completedCriteriaCount = acceptanceCriteria.filter((c) => c.completed).length;
  const incompleteCriteriaCount = acceptanceCriteria.length - completedCriteriaCount;

  let validationStatus: MissionDiagnosis["validationStatus"] = "not_run";
  if (mission.validationCompleted) validationStatus = "passed";
  else if (mission.state === "validation" && mission.health.stallSignals.length > 0) {
    validationStatus = "unknown";
  }

  let executiveAuditStatus: MissionDiagnosis["executiveAuditStatus"] = "missing";
  if (mission.executiveAuditProduced) executiveAuditStatus = "produced";

  return {
    missionId: mission.id,
    title: mission.title,
    objective: mission.objective,
    currentState: mission.state,
    validationStatus,
    executiveAuditStatus,
    acceptanceCriteria,
    completedCriteriaCount,
    incompleteCriteriaCount,
    issueKind: inferIssueKind(mission, trigger, stallSignals),
  };
}
