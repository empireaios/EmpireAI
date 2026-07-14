import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import {
  classifyMissionHealthStatus,
  computeOverallProgressPercent,
  inferCurrentPhase,
  inferCurrentStep,
} from "./health-classifier.js";
import type {
  MissionRegistrySnapshot,
  SupervisorSystemAssessment,
  SupervisorSystemRequest,
  SupervisorSystemSnapshot,
  SupervisedMission,
} from "./types.js";

export function buildSupervisorSystemSnapshot(input: {
  registry: MissionRegistrySnapshot;
  now?: () => number;
}): SupervisorSystemSnapshot {
  const active = input.registry.activeMission;
  const now = input.now ?? (() => Date.now());

  if (!active) {
    return {
      capturedAt: new Date(now()).toISOString(),
      activeMissionId: null,
      activeMissionTitle: null,
      missionHealth: "healthy",
      currentPhase: null,
      currentStep: null,
      currentActivity: null,
      overallProgressPercent: 0,
      executionState: "ready",
      activeDependencies: [],
      currentRisks: [],
      currentWarnings: [],
      recoveryStatus: null,
      validationStatus: null,
    };
  }

  const health = classifyMissionHealthStatus(active);
  const risks = active.health.stallSignals.map((s) => s.message);
  const warnings: string[] = [];
  if (active.health.isSlowMission) warnings.push("Slow mission — validation may be long-running");
  if (active.health.riskLevel === "medium") warnings.push("Medium risk — increased observation");

  return {
    capturedAt: new Date(now()).toISOString(),
    activeMissionId: active.id,
    activeMissionTitle: active.title,
    missionHealth: health,
    currentPhase: inferCurrentPhase(active),
    currentStep: inferCurrentStep(active),
    currentActivity: active.heartbeats.at(-1)?.detail ?? active.progress.at(-1)?.detail ?? null,
    overallProgressPercent: computeOverallProgressPercent(active),
    executionState: active.state,
    activeDependencies: active.dependencies,
    currentRisks: risks,
    currentWarnings: warnings,
    recoveryStatus:
      active.recoveryAttempts > 0
        ? `Recovery attempts: ${active.recoveryAttempts}`
        : active.state === "recovery" || active.state === "recovering"
          ? "Recovery in progress"
          : null,
    validationStatus: active.validationCompleted
      ? "Validation completed"
      : active.state === "validation" || active.state === "validating"
        ? "Validation in progress"
        : "Not started",
  };
}

export function executeSupervisorSystemAssessment(input: {
  bootstrap: EmpireBootstrapContext;
  registry: MissionRegistrySnapshot;
  request?: SupervisorSystemRequest;
  now?: () => number;
}): SupervisorSystemAssessment {
  const { registry, request = {} } = input;
  const snapshot = buildSupervisorSystemSnapshot({
    registry,
    now: input.now,
  });
  const active = registry.activeMission;
  const activeMissions = registry.history.filter((m) =>
    !["completed", "cancelled", "failed"].includes(m.state),
  ).length;

  const missionHealth = snapshot.missionHealth;
  const supervisionGrade =
    missionHealth === "critical" || missionHealth === "blocked"
      ? "blocked"
      : missionHealth === "delayed" || missionHealth === "attention_required"
        ? "degraded"
        : "observing";

  const observations: string[] = [
    `Active missions: ${activeMissions}`,
    snapshot.currentPhase
      ? `Phase: ${snapshot.currentPhase} · Step: ${snapshot.currentStep ?? "—"}`
      : "No active mission under supervision",
    `Progress: ${snapshot.overallProgressPercent}%`,
  ];

  if (active) {
    observations.push(`Execution health score: ${active.health.score}/100`);
    observations.push(`Risk level: ${active.health.riskLevel}`);
  }

  const recommendations: string[] = [];
  if (missionHealth === "critical") {
    recommendations.push("Critical mission health — invoke recovery doctrine or Grand King review");
  }
  if (missionHealth === "delayed") {
    recommendations.push("Mission delayed — verify Builder progress and dependencies");
  }
  if (snapshot.currentRisks.length > 0) {
    recommendations.push("Address stall signals before continuing execution");
  }
  recommendations.push("ECC consumes Supervisor events — Supervisor observes only");
  recommendations.push("Guardian monitors infrastructure — Supervisor monitors execution");

  const grandKingSummary = active
    ? `Supervisor: ${active.title} · ${missionHealth.replace(/_/g, " ")} · ${snapshot.overallProgressPercent}% · ${snapshot.currentStep ?? active.state}`
    : "Supervisor: no active mission — ready for next engineering execution";

  return {
    success: supervisionGrade !== "blocked",
    missionHealth,
    supervisionGrade,
    activeMissions,
    snapshot,
    observations,
    recommendations,
    grandKingSummary,
  };
}

export function mapStateToSupervisionEvent(
  mission: SupervisedMission,
  previousState?: string,
): import("./types.js").SupervisionEventKind | null {
  if (mission.state === "completed") return "mission_completed";
  if (mission.state === "blocked") return "mission_blocked";
  if (mission.state === "recovery" || mission.state === "recovering") {
    return previousState === "recovery" || previousState === "recovering"
      ? null
      : "recovery_started";
  }
  if (
    (mission.state === "validation" || mission.state === "validating") &&
    previousState !== "validation" &&
    previousState !== "validating"
  ) {
    return "validation_started";
  }
  if (mission.validationCompleted && previousState === "validation") {
    return "validation_completed";
  }
  return null;
}
