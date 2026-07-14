import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { inferCurrentPhase, inferCurrentStep, computeOverallProgressPercent } from "../supervisor/health-classifier.js";
import { INTERROGATION_DOMAINS } from "./paths.js";
import type {
  BuilderTelemetrySnapshot,
  InterrogationResult,
  MissionTimelineEntry,
  SupervisorInterrogationReport,
} from "./types.js";

export function buildDefaultTelemetry(): BuilderTelemetrySnapshot {
  const at = new Date().toISOString();
  return {
    capturedAt: at,
    currentMission: null,
    currentRoadmapItem: null,
    currentPhase: null,
    currentStep: null,
    currentActivity: null,
    missionState: null,
    overallProgress: 0,
    stageProgress: 0,
    estimatedRemainingTimeMs: null,
    elapsedTimeMs: 0,
    currentFile: null,
    filesModified: [],
    repositoryActivity: null,
    currentBranch: null,
    currentDependency: null,
    currentQueue: null,
    currentWorker: "builder",
    validationState: "not_started",
    productionState: "unknown",
    recoveryState: "none",
    currentErrors: [],
    currentWarnings: [],
    heartbeatAt: null,
    executionHealth: "healthy",
  };
}

export function deriveExecutionHealth(input: {
  errors: string[];
  warnings: string[];
  missionState: string | null;
  healthScore?: number;
}): BuilderTelemetrySnapshot["executionHealth"] {
  if (input.errors.length > 0 || input.missionState === "failed" || input.missionState === "blocked") {
    return "critical";
  }
  if (input.warnings.length > 0 || (input.healthScore !== undefined && input.healthScore < 50)) {
    return "degraded";
  }
  if (input.healthScore !== undefined && input.healthScore < 75) {
    return "attention";
  }
  return "healthy";
}

export function buildTelemetryFromSupervisor(input: {
  bootstrap: EmpireBootstrapContext;
  telemetry: BuilderTelemetrySnapshot;
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  filesModified?: string[];
  currentFile?: string | null;
  errors?: string[];
  warnings?: string[];
  now?: () => number;
}): BuilderTelemetrySnapshot {
  const now = input.now ?? (() => Date.now());
  const supervisor = input.bootstrap.repositoryHealth;
  const active = input.telemetry;

  let mission = null as import("../supervisor/types.js").SupervisedMission | null;
  try {
    /* surfaces attach after init — caller passes enriched telemetry */
  } catch {
    /* optional */
  }

  void mission;

  const capturedAt = new Date(now()).toISOString();
  const errors = input.errors ?? active.currentErrors;
  const warnings = input.warnings ?? active.currentWarnings;

  return {
    ...active,
    capturedAt,
    currentMission: input.missionTitle ?? active.currentMission,
    currentRoadmapItem: input.roadmapItem ?? active.currentRoadmapItem,
    filesModified: input.filesModified ?? active.filesModified,
    currentFile: input.currentFile ?? active.currentFile,
    currentErrors: errors,
    currentWarnings: warnings,
    repositoryActivity:
      active.repositoryActivity ??
      (supervisor.healthy ? "Repository healthy" : "Repository degraded"),
    currentBranch: active.currentBranch ?? "main",
    executionHealth: deriveExecutionHealth({
      errors,
      warnings,
      missionState: active.missionState,
    }),
    heartbeatAt: active.heartbeatAt ?? capturedAt,
  };
}

export function executeSupervisorInterrogation(input: {
  telemetry: BuilderTelemetrySnapshot;
  missionId?: string | null;
  now?: () => number;
}): SupervisorInterrogationReport {
  const now = input.now ?? (() => Date.now());
  const at = new Date(now()).toISOString();
  const t = input.telemetry;

  const domainDetail = (domain: (typeof INTERROGATION_DOMAINS)[number]): InterrogationResult => {
    switch (domain) {
      case "mission_status":
        return {
          domain,
          status: t.currentMission ? "verified" : "unknown",
          detail: t.currentMission ?? "No active mission",
          observedAt: at,
        };
      case "execution_status":
        return {
          domain,
          status: t.missionState ? "verified" : "degraded",
          detail: `${t.missionState ?? "idle"} · ${t.overallProgress}% overall`,
          observedAt: at,
        };
      case "repository_status":
        return {
          domain,
          status: t.repositoryActivity ? "verified" : "unknown",
          detail: t.repositoryActivity ?? "No repository activity reported",
          observedAt: at,
        };
      case "validation_status":
        return {
          domain,
          status: t.validationState !== "not_started" ? "verified" : "degraded",
          detail: t.validationState,
          observedAt: at,
        };
      case "recovery_status":
        return {
          domain,
          status: t.recoveryState !== "none" ? "verified" : "verified",
          detail: t.recoveryState,
          observedAt: at,
        };
      case "progress_status":
        return {
          domain,
          status: t.overallProgress > 0 ? "verified" : "degraded",
          detail: `Overall ${t.overallProgress}% · stage ${t.stageProgress}%`,
          observedAt: at,
        };
      case "dependency_status":
        return {
          domain,
          status: t.currentDependency ? "verified" : "unknown",
          detail: t.currentDependency ?? "No dependency tracked",
          observedAt: at,
        };
      case "worker_status":
        return {
          domain,
          status: "verified",
          detail: t.currentWorker,
          observedAt: at,
        };
      case "queue_status":
        return {
          domain,
          status: t.currentQueue ? "verified" : "unknown",
          detail: t.currentQueue ?? "Queue empty",
          observedAt: at,
        };
      case "heartbeat_status":
        return {
          domain,
          status: t.heartbeatAt ? "verified" : "degraded",
          detail: t.heartbeatAt ? `Last heartbeat ${t.heartbeatAt}` : "No heartbeat received",
          observedAt: at,
        };
      case "current_risks":
        return {
          domain,
          status: t.currentErrors.length > 0 ? "degraded" : "verified",
          detail: t.currentErrors.join("; ") || "No errors",
          observedAt: at,
        };
      case "current_bottlenecks":
        return {
          domain,
          status: t.currentWarnings.length > 0 ? "degraded" : "verified",
          detail: t.currentWarnings.join("; ") || "No bottlenecks",
          observedAt: at,
        };
      default:
        return { domain, status: "unknown", detail: "Unobserved", observedAt: at };
    }
  };

  const results = INTERROGATION_DOMAINS.map(domainDetail);
  const risks = t.currentErrors.slice();
  const bottlenecks = t.currentWarnings.slice();
  if (t.executionHealth === "degraded" || t.executionHealth === "critical") {
    risks.push(`Execution health: ${t.executionHealth}`);
  }

  const grandKingSummary = t.currentMission
    ? `Builder Monitor: ${t.currentMission} · ${t.currentStep ?? t.missionState ?? "active"} · ${t.overallProgress}% · heartbeat ${t.heartbeatAt ? "ok" : "pending"}`
    : "Builder Monitor: idle — awaiting Builder telemetry";

  return {
    interrogatedAt: at,
    missionId: input.missionId ?? null,
    results,
    risks,
    bottlenecks,
    telemetry: t,
    grandKingSummary,
  };
}

export function buildTimelineEntry(input: {
  report: SupervisorInterrogationReport;
  supervisorObservation: string;
}): MissionTimelineEntry {
  const t = input.report.telemetry;
  return {
    at: input.report.interrogatedAt,
    observedState: t.missionState ?? "idle",
    progress: t.overallProgress,
    etaMs: t.estimatedRemainingTimeMs,
    repositoryActivity: t.repositoryActivity,
    recoveryActivity: t.recoveryState !== "none" ? t.recoveryState : null,
    validationActivity: t.validationState,
    supervisorObservation: input.supervisorObservation,
  };
}

export function telemetryFromSupervisedMission(input: {
  mission: import("../supervisor/types.js").SupervisedMission;
  roadmapItem?: string | null;
  filesModified?: string[];
  validationState?: string;
  recoveryState?: string;
  now?: () => number;
}): BuilderTelemetrySnapshot {
  const now = input.now ?? (() => Date.now());
  const m = input.mission;
  const elapsed = now() - Date.parse(m.launchedAt);
  const overall = computeOverallProgressPercent(m);
  const errors = m.health.isDeadAgent
    ? ["Dead agent detected"]
    : m.health.stallSignals.map((s) => s.message);
  const warnings: string[] = [];
  if (m.health.isSlowMission) warnings.push("Slow validation in progress");
  if (m.health.riskLevel === "medium" || m.health.riskLevel === "high") {
    warnings.push(`Risk level: ${m.health.riskLevel}`);
  }

  return {
    capturedAt: new Date(now()).toISOString(),
    currentMission: m.title,
    currentRoadmapItem: input.roadmapItem ?? m.id,
    currentPhase: inferCurrentPhase(m),
    currentStep: inferCurrentStep(m),
    currentActivity: m.heartbeats.at(-1)?.detail ?? m.progress.at(-1)?.detail ?? null,
    missionState: m.state,
    overallProgress: overall,
    stageProgress: Math.min(100, overall + 10),
    estimatedRemainingTimeMs: overall > 0 ? Math.round(elapsed * (100 / overall - 1)) : null,
    elapsedTimeMs: elapsed,
    currentFile: input.filesModified?.[0] ?? null,
    filesModified: input.filesModified ?? [],
    repositoryActivity:
      m.progress.length > 0
        ? `${m.progress.length} progress events`
        : "Awaiting repository activity",
    currentBranch: "main",
    currentDependency: m.dependencies[0] ?? null,
    currentQueue: null,
    currentWorker: "builder",
    validationState:
      input.validationState ??
      (m.validationCompleted ? "completed" : m.state === "validation" ? "in_progress" : "not_started"),
    productionState: m.state === "production_verification" ? "verifying" : "standby",
    recoveryState:
      input.recoveryState ??
      (m.recoveryAttempts > 0 || m.state === "recovery" ? "active" : "none"),
    currentErrors: errors,
    currentWarnings: warnings,
    heartbeatAt: m.health.lastHeartbeatAt,
    executionHealth: deriveExecutionHealth({
      errors,
      warnings,
      missionState: m.state,
      healthScore: m.health.score,
    }),
  };
}
