import type { MissionPlannerEngine } from "../planner/engine.js";
import type { RepositoryMemoryState } from "../memory/types.js";
import type { DueDiligenceRecommendation } from "../due-diligence/types.js";
import type { DependencyCheck, MissionReadiness } from "./types.js";

export function verifyDependencies(
  observation: DueDiligenceRecommendation,
  memory: RepositoryMemoryState,
  planner?: MissionPlannerEngine,
): DependencyCheck[] {
  const checks: DependencyCheck[] = [];

  checks.push({
    id: "REPOSITORY_HEALTH",
    label: "Repository health baseline",
    satisfied: memory.domains.repositoryHealth.value.score >= 50,
    required: true,
  });

  checks.push({
    id: "BOOTSTRAP_READY",
    label: "Bootstrap artifacts present",
    satisfied: memory.domains.repositoryHealth.value.mandatoryPresent > 0,
    required: true,
  });

  const syncOk = memory.consistency.synchronized;
  checks.push({
    id: "SYNC_STATE",
    label: "Repository synchronization state",
    satisfied: syncOk,
    required: observation.kind === "repository_improvement",
  });

  if (planner) {
    const next = planner.determineNextMission();
    checks.push({
      id: "PLANNER_READY",
      label: "Mission Planner operational",
      satisfied: Boolean(next),
      required: false,
    });
  }

  if (observation.kind === "commercial_opportunity") {
    checks.push({
      id: "COMMERCIAL_PREREQ",
      label: "Commercial prerequisites documented",
      satisfied: observation.evidence.some((e) => /REAL-|PROOF/i.test(e)),
      required: false,
    });
  }

  return checks;
}

export function determineMissionReadiness(
  observation: DueDiligenceRecommendation,
  checks: DependencyCheck[],
  memory: RepositoryMemoryState,
): MissionReadiness {
  const requiredFailed = checks.filter((c) => c.required && !c.satisfied);
  if (requiredFailed.length > 0) {
    if (requiredFailed.some((c) => c.id === "SYNC_STATE")) {
      return "requires_repository_synchronization";
    }
    return "blocked_by_dependencies";
  }

  if (
    !memory.consistency.synchronized &&
    observation.kind === "repository_improvement"
  ) {
    return "requires_repository_synchronization";
  }

  if (
    observation.kind === "architecture_improvement" &&
    observation.priority === "critical"
  ) {
    return "requires_architecture_review";
  }

  if (observation.priority === "critical" || observation.priority === "high") {
    return "requires_grand_king_decision";
  }

  if (observation.estimatedImpact === "low" && observation.priority === "future") {
    return "requires_further_investigation";
  }

  const optionalFailed = checks.filter((c) => !c.required && !c.satisfied);
  if (optionalFailed.length > 2) {
    return "requires_further_investigation";
  }

  return "ready_for_implementation";
}

export function buildMissionSequence(
  readiness: MissionReadiness,
  domain: string,
): string[] {
  const sequence = ["Grand King Approval"];

  if (readiness === "requires_repository_synchronization") {
    sequence.unshift("Repository Synchronizer Preview + Approval");
  }
  if (readiness === "requires_architecture_review") {
    sequence.unshift("Architecture Review");
  }
  if (readiness === "ready_for_implementation") {
    sequence.push("Mission Planner → Cursor Supervisor → Execution");
  }

  sequence.push("Executive Audit Reviewer → Repository Synchronizer");

  if (domain.includes("pillow")) {
    sequence.splice(1, 0, "PILLOW Part 7 sequence alignment");
  }

  return sequence;
}
