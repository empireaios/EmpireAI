import type { BuilderTelemetrySnapshot } from "../builder-monitor/types.js";
import type { SupervisedMission } from "../supervisor/types.js";
import { AUTONOMOUS_RECOVERY_LIMITS } from "./paths.js";
import { getRecoveryStrategy } from "./strategy-registry.js";
import type {
  DetectedFailure,
  RecoveryDetectionSignal,
  RecoveryEscalationLevel,
  RecoveryStrategyId,
} from "./types.js";

const HEARTBEAT_STALE_MS = 120_000;
const STALL_PROGRESS_THRESHOLD_MS = 300_000;

export function detectFailureSignals(input: {
  telemetry: BuilderTelemetrySnapshot | null;
  activeMission: SupervisedMission | null;
  now?: () => number;
}): DetectedFailure[] {
  const now = input.now ?? (() => Date.now());
  const failures: DetectedFailure[] = [];
  const t = input.telemetry;
  const m = input.activeMission;
  const at = new Date(now()).toISOString();
  const missionId = m?.id ?? t?.currentRoadmapItem ?? null;
  const missionTitle = m?.title ?? t?.currentMission ?? null;

  if (t?.heartbeatAt) {
    const heartbeatAge = now() - Date.parse(t.heartbeatAt);
    if (heartbeatAge > HEARTBEAT_STALE_MS) {
      failures.push(buildFailure("heartbeat_loss", at, missionId, missionTitle, [
        `No heartbeat for ${Math.round(heartbeatAge / 1000)}s`,
      ], "high"));
    }
  } else if (m && t?.currentMission) {
    failures.push(buildFailure("heartbeat_loss", at, missionId, missionTitle, [
      "No Builder heartbeat recorded",
    ], "medium"));
  }

  if (
    m?.state === "blocked" ||
    m?.state === "recovering" ||
    (m && m.durationMs > STALL_PROGRESS_THRESHOLD_MS && t?.overallProgress === 0)
  ) {
    failures.push(buildFailure("mission_stall", at, missionId, missionTitle, [
      `Mission stalled · state: ${m?.state ?? "unknown"}`,
    ], "high"));
  }

  if (t?.validationState === "failed" || t?.currentErrors.length) {
    failures.push(buildFailure("validation_failure", at, missionId, missionTitle, [
      t?.currentErrors[0] ?? "Validation failed",
    ], "medium"));
  }

  if (t?.recoveryState === "active" || t?.recoveryState === "failed") {
    failures.push(buildFailure("runtime_failure", at, missionId, missionTitle, [
      `Recovery state: ${t.recoveryState}`,
    ], "medium"));
  }

  if (t?.executionHealth === "critical") {
    failures.push(buildFailure("runtime_failure", at, missionId, missionTitle, [
      "Execution health critical",
    ], "critical"));
  }

  if (t?.currentDependency) {
    failures.push(buildFailure("dependency_failure", at, missionId, missionTitle, [
      `Blocking dependency: ${t.currentDependency}`,
    ], "medium"));
  }

  if (t?.productionState === "failed") {
    failures.push(buildFailure("production_failure", at, missionId, missionTitle, [
      "Production verification failed",
    ], "high"));
  }

  if (
    m &&
    m.durationMs > AUTONOMOUS_RECOVERY_LIMITS.recoveryTimeoutMs &&
    (m.state === "implementing" || m.state === "implementation")
  ) {
    failures.push(buildFailure("execution_timeout", at, missionId, missionTitle, [
      `Execution exceeded ${AUTONOMOUS_RECOVERY_LIMITS.recoveryTimeoutMs / 1000}s`,
    ], "high"));
  }

  if (failures.length === 0 && t?.currentWarnings.length) {
    failures.push(buildFailure("unknown_failure", at, missionId, missionTitle, t.currentWarnings, "low"));
  }

  return failures;
}

function buildFailure(
  signal: RecoveryDetectionSignal,
  detectedAt: string,
  missionId: string | null,
  missionTitle: string | null,
  evidence: string[],
  severity: DetectedFailure["severity"],
): DetectedFailure {
  return {
    signal,
    detectedAt,
    missionId,
    missionTitle,
    evidence,
    severity,
    recoverable: severity !== "critical" || signal !== "production_failure",
  };
}

export function selectRecoveryStrategy(failure: DetectedFailure): RecoveryStrategyId {
  switch (failure.signal) {
    case "heartbeat_loss":
    case "worker_failure":
      return "restart_worker";
    case "mission_stall":
    case "execution_timeout":
      return "resume";
    case "validation_failure":
      return "retry";
    case "dependency_failure":
      return "pause_mission";
    case "queue_failure":
      return "restart_queue";
    case "repository_failure":
      return "rollback_safe_changes";
    case "runtime_failure":
      return "reload_context";
    case "infrastructure_failure":
      return "rebuild_execution_state";
    case "production_failure":
      return "escalate";
    default:
      return failure.recoverable ? "continue_mission" : "escalate";
  }
}

export function evaluateAutonomousRecoverySafety(input: {
  failure: DetectedFailure;
  strategy: RecoveryStrategyId;
  confidence: number;
  recoveryAttempts: number;
}): { safe: boolean; reason: string; escalationLevel: RecoveryEscalationLevel } {
  const strategy = getRecoveryStrategy(input.strategy);
  const maxAttempts = strategy?.maximumAttempts ?? AUTONOMOUS_RECOVERY_LIMITS.maxRetryAttempts;

  if (input.strategy === "escalate" || input.strategy === "rollback_safe_changes") {
    return {
      safe: false,
      reason: "Irreversible or escalation strategy — requires Grand King or Pillow approval",
      escalationLevel: input.strategy === "rollback_safe_changes" ? "grand_king" : "pillow",
    };
  }

  if (input.recoveryAttempts >= maxAttempts) {
    return {
      safe: false,
      reason: `Maximum recovery attempts (${maxAttempts}) exceeded`,
      escalationLevel: "supervisor",
    };
  }

  if (input.confidence < AUTONOMOUS_RECOVERY_LIMITS.manualApprovalThreshold) {
    return {
      safe: false,
      reason: `Recovery confidence ${(input.confidence * 100).toFixed(0)}% below manual approval threshold`,
      escalationLevel: "grand_king",
    };
  }

  if (input.confidence >= AUTONOMOUS_RECOVERY_LIMITS.recoveryConfidenceThreshold && input.failure.recoverable) {
    return {
      safe: true,
      reason: "Constitutional integrity preserved — autonomous recovery authorized",
      escalationLevel: "supervisor",
    };
  }

  return {
    safe: input.confidence >= AUTONOMOUS_RECOVERY_LIMITS.recoveryConfidenceThreshold,
    reason: input.confidence >= AUTONOMOUS_RECOVERY_LIMITS.recoveryConfidenceThreshold
      ? "Confidence threshold met"
      : "Recovery confidence below autonomous threshold",
    escalationLevel: "pillow",
  };
}

export function mapSignalToRecoveryTrigger(
  signal: RecoveryDetectionSignal,
): import("../recovery/types.js").RecoveryTrigger {
  switch (signal) {
    case "heartbeat_loss":
    case "worker_failure":
      return "dead_agent";
    case "mission_stall":
    case "execution_timeout":
      return "stalled_mission";
    case "validation_failure":
      return "interrupted_validation";
    case "repository_failure":
      return "repository_interruption";
    default:
      return "supervisor_invocation";
  }
}
