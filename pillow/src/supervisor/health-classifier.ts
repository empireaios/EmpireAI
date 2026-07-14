import type { MissionHealthClassification, SupervisedMission } from "./types.js";

/** Classify mission health for Grand King visibility (P6-03). */
export function classifyMissionHealthStatus(
  mission: SupervisedMission,
): MissionHealthClassification {
  if (mission.state === "completed" && mission.outcome === "success") {
    return "completed";
  }

  if (mission.state === "blocked" || mission.state === "failed") {
    return "blocked";
  }

  if (
    mission.state === "recovery" ||
    mission.state === "recovering" ||
    mission.recoveryAttempts > 0
  ) {
    return mission.health.isDeadAgent ? "critical" : "recovering";
  }

  if (mission.health.isDeadAgent || mission.health.riskLevel === "critical") {
    return "critical";
  }

  if (mission.health.isSlowMission || mission.health.stallSignals.length > 0) {
    return mission.health.riskLevel === "high" ? "delayed" : "attention_required";
  }

  if (mission.health.riskLevel === "high") {
    return "delayed";
  }

  if (mission.health.riskLevel === "medium") {
    return "attention_required";
  }

  return "healthy";
}

export function inferCurrentStep(mission: SupervisedMission): string {
  const lastProgress = mission.progress.at(-1);
  if (lastProgress) {
    return `${lastProgress.kind}: ${lastProgress.detail.slice(0, 80)}`;
  }
  const lastHeartbeat = mission.heartbeats.at(-1);
  if (lastHeartbeat) {
    return `${lastHeartbeat.kind}: ${lastHeartbeat.detail.slice(0, 80)}`;
  }
  return `State: ${mission.state}`;
}

export function inferCurrentPhase(mission: SupervisedMission): string {
  switch (mission.state) {
    case "queued":
    case "preparing":
    case "synchronizing":
    case "reviewing":
    case "planning":
    case "repository_inspection":
      return "Preparation";
    case "implementing":
    case "implementation":
      return "Implementation";
    case "testing":
    case "validating":
    case "validation":
      return "Validation";
    case "production_verification":
      return "Production Verification";
    case "executive_audit":
      return "Executive Audit";
    case "recovery":
    case "recovering":
      return "Recovery";
    case "awaiting_grand_king":
      return "Awaiting Grand King";
    case "completed":
      return "Completed";
    case "blocked":
    case "failed":
      return "Blocked";
    case "cancelled":
      return "Cancelled";
    default:
      return "Execution";
  }
}

export function computeOverallProgressPercent(mission: SupervisedMission): number {
  const stateProgress: Record<string, number> = {
    queued: 5,
    preparing: 10,
    synchronizing: 12,
    reviewing: 14,
    planning: 16,
    repository_inspection: 18,
    implementing: 40,
    implementation: 45,
    testing: 60,
    validating: 65,
    validation: 70,
    production_verification: 80,
    executive_audit: 88,
    awaiting_grand_king: 92,
    recovery: 50,
    recovering: 50,
    completed: 100,
    blocked: 0,
    failed: 0,
    cancelled: 0,
  };
  const base = stateProgress[mission.state] ?? 25;
  const progressBoost = Math.min(15, mission.progress.length * 2);
  const healthPenalty =
    mission.health.riskLevel === "critical"
      ? 20
      : mission.health.riskLevel === "high"
        ? 10
        : 0;
  return Math.max(0, Math.min(100, base + progressBoost - healthPenalty));
}
