import type { BuilderTelemetrySnapshot, MissionTimelineEntry } from "../builder-monitor/types.js";
import type { BuilderConsoleView } from "./types.js";

type BuilderCockpit = {
  currentMission?: string;
  currentStep?: string;
  currentActivity?: string;
  progress?: string;
  overallProgressPercent?: number;
  elapsedTimeMs?: number;
  estimatedRemainingTimeMs?: number | null;
  heartbeat?: string;
  repositoryActivity?: string;
  filesModified?: string[];
  validationStatus?: string;
  recoveryStatus?: string;
  executionHealth?: string;
  recentEvents?: Array<{ at: string; kind: string; detail: string }>;
  timeline?: MissionTimelineEntry[];
  grandKingSummary?: string;
  analysis?: { recommendations?: string[] };
};

function formatMs(ms: number | null | undefined): string {
  if (ms == null) return "—";
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  return `${min}m ${sec % 60}s`;
}

function categorizeEvent(kind: string): BuilderConsoleView["missionTimeline"][number]["category"] {
  if (/recovery/i.test(kind)) return "recovery";
  if (/valid/i.test(kind)) return "validation";
  if (/repo|file|commit|branch/i.test(kind)) return "repository";
  if (/complete|done|finish/i.test(kind)) return "completion";
  if (/step|progress/i.test(kind)) return "step";
  if (/start|mission/i.test(kind)) return "mission";
  return "step";
}

export function assembleBuilderConsoleView(input: {
  telemetry: BuilderTelemetrySnapshot;
  builderCockpit?: BuilderCockpit;
  supervisor?: Record<string, unknown>;
  eta?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  recovery?: Record<string, unknown>;
}): BuilderConsoleView {
  const t = input.telemetry;
  const cockpit = input.builderCockpit ?? {};
  const supervisor = input.supervisor ?? {};
  const eta = input.eta ?? {};
  const ecc = input.ecc ?? {};
  const recovery = input.recovery ?? {};

  const overallProgress = t.overallProgress ?? cockpit.overallProgressPercent ?? 0;
  const velocity =
    typeof eta.executionVelocity === "string"
      ? eta.executionVelocity
      : overallProgress > 0 && t.elapsedTimeMs > 0
        ? `${(overallProgress / (t.elapsedTimeMs / 60000)).toFixed(1)}%/min`
        : "—";

  const timelineFromEvents = (cockpit.recentEvents ?? []).map((e) => ({
    at: e.at,
    category: categorizeEvent(e.kind),
    label: e.kind.replace(/_/g, " "),
    detail: e.detail,
  }));

  const timelineFromMission = (cockpit.timeline ?? []).map((entry) => ({
    at: entry.at,
    category: entry.recoveryActivity
      ? ("recovery" as const)
      : entry.validationActivity
        ? ("validation" as const)
        : entry.repositoryActivity
          ? ("repository" as const)
          : ("step" as const),
    label: entry.observedState,
    detail: [
      entry.supervisorObservation,
      entry.repositoryActivity,
      entry.validationActivity,
      entry.recoveryActivity,
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  const missionTimeline = [...timelineFromMission, ...timelineFromEvents].slice(-20);

  const validationState = t.validationState ?? String(cockpit.validationStatus ?? "not_started");
  const recoveryState = t.recoveryState ?? String(cockpit.recoveryStatus ?? "none");

  return {
    architectureVersion: "P7-05",
    computedAt: new Date().toISOString(),
    grandKingSummary:
      cockpit.grandKingSummary ??
      String(supervisor.grandKingSummary ?? "Builder Console — awaiting live telemetry"),
    liveExecution: {
      currentMission: t.currentMission ?? cockpit.currentMission ?? "No active mission",
      currentRoadmapItem: t.currentRoadmapItem ?? "—",
      currentPhase: t.currentPhase ?? String(supervisor.currentPhase ?? "—"),
      missionPurpose: "Constitutional engineering execution via Cursor Bridge",
      missionState: t.missionState ?? String(supervisor.executionState ?? "idle"),
      currentStep: t.currentStep ?? cockpit.currentStep ?? "—",
      currentActivity: t.currentActivity ?? cockpit.currentActivity ?? "—",
      overallProgress,
      stageProgress: t.stageProgress ?? 0,
      elapsedTimeMs: t.elapsedTimeMs ?? cockpit.elapsedTimeMs ?? 0,
      estimatedRemainingTimeMs:
        t.estimatedRemainingTimeMs ?? cockpit.estimatedRemainingTimeMs ?? null,
      executionVelocity: velocity,
      currentRepository: t.repositoryActivity ?? cockpit.repositoryActivity ?? "EmpireAI",
      currentBranch: t.currentBranch,
      filesModified: t.filesModified ?? cockpit.filesModified ?? [],
      validationStatus: validationState,
      recoveryStatus: recoveryState,
      heartbeatAt: t.heartbeatAt ?? (cockpit.heartbeat !== "No heartbeat" ? cockpit.heartbeat ?? null : null),
      executionHealth: t.executionHealth ?? String(cockpit.executionHealth ?? "healthy"),
      currentRisks: [
        ...t.currentErrors,
        ...(Array.isArray(supervisor.currentRisks) ? (supervisor.currentRisks as string[]) : []),
      ],
      currentWarnings: [
        ...t.currentWarnings,
        ...(Array.isArray(supervisor.warnings) ? (supervisor.warnings as string[]) : []),
      ],
    },
    missionTimeline,
    repositoryActivity: {
      filesCreated: [],
      filesModified: t.filesModified ?? [],
      filesDeleted: [],
      commits: [],
      branches: t.currentBranch ? [t.currentBranch] : [],
      repositoryHealth: t.repositoryActivity ?? "Monitoring",
      pendingValidation: validationState,
      currentFile: t.currentFile,
    },
    validation: {
      architectureReview: validationState.includes("arch") ? validationState : "Pending mission validation",
      repositoryReview: t.filesModified.length > 0 ? `${t.filesModified.length} files in scope` : "No pending diff",
      testing: validationState.includes("test") ? validationState : String(supervisor.validationStatus ?? "Scheduled"),
      browserTruth: "Browser Truth · Guardian path",
      productionValidation: t.productionState ?? "standby",
      grandKingAcceptance: "Required on constitutional missions",
      currentStatus: validationState,
    },
    recovery: {
      recoveryStatus: recoveryState,
      recoveryAttempts: Number(recovery.recoveryAttempts ?? 0),
      recoveryHistory: Array.isArray(recovery.recoveryHistory)
        ? (recovery.recoveryHistory as string[])
        : [],
      currentIncident:
        typeof recovery.currentIncident === "string" ? recovery.currentIncident : null,
      currentEscalation:
        typeof recovery.currentEscalation === "string" ? recovery.currentEscalation : null,
      recoveryConfidence:
        typeof recovery.recoveryConfidence === "string"
          ? recovery.recoveryConfidence
          : recoveryState === "none"
            ? "Nominal"
            : "Recovery doctrine active",
    },
    pillow: {
      recommendations: cockpit.analysis?.recommendations ?? [],
      engineeringImprovements: [
        "Maintain Builder telemetry heartbeat during missions",
        "Route all missions through Cursor Bridge gate",
      ],
      architectureImprovements: ["Constitutional hierarchy verified before dispatch"],
      missionImprovements: ["Supervisor interrogation on progress stalls"],
      executionWarnings: t.currentWarnings,
    },
    supervisor: {
      executionState: String(supervisor.executionState ?? t.missionState ?? "ready"),
      missionHealth: String(supervisor.missionHealth ?? t.executionHealth ?? "healthy"),
      progress: String(supervisor.progress ?? `${overallProgress}%`),
      currentRisks: Array.isArray(supervisor.currentRisks)
        ? (supervisor.currentRisks as string[])
        : t.currentErrors,
      eta: formatMs(
        typeof eta.estimatedRemainingTimeMs === "number"
          ? eta.estimatedRemainingTimeMs
          : t.estimatedRemainingTimeMs,
      ),
      heartbeat: t.heartbeatAt ?? String(cockpit.heartbeat ?? "—"),
      grandKingSummary: String(supervisor.grandKingSummary ?? cockpit.grandKingSummary ?? ""),
    },
    ecc: {
      missionQueue: Array.isArray(ecc.executionQueue)
        ? (ecc.executionQueue as Array<{ title?: string }>).map((q) => q.title ?? "Mission").slice(0, 5)
        : [String(ecc.currentMission ?? t.currentMission ?? "None")],
      executionPriority: String(ecc.priority ?? "Constitutional order"),
      dependencyStatus: String(eta.dependencyStatus ?? ecc.dependencies ?? "Resolved"),
      resourceAllocation: "Builder worker · Cursor Bridge",
      coordinationSummary: String(ecc.grandKingSummary ?? "ECC coordinates execution priority"),
    },
  };
}

export function buildFallbackBuilderConsoleView(): BuilderConsoleView {
  const at = new Date().toISOString();
  return assembleBuilderConsoleView({
    telemetry: {
      capturedAt: at,
      currentMission: null,
      currentRoadmapItem: "P7-05",
      currentPhase: null,
      currentStep: null,
      currentActivity: null,
      missionState: "standby",
      overallProgress: 0,
      stageProgress: 0,
      estimatedRemainingTimeMs: null,
      elapsedTimeMs: 0,
      currentFile: null,
      filesModified: [],
      repositoryActivity: "Awaiting Pillow session",
      currentBranch: null,
      currentDependency: null,
      currentQueue: null,
      currentWorker: "builder",
      validationState: "not_started",
      productionState: "standby",
      recoveryState: "none",
      currentErrors: [],
      currentWarnings: [],
      heartbeatAt: null,
      executionHealth: "healthy",
    },
    builderCockpit: {
      grandKingSummary: "Start Pillow session for live Builder telemetry",
    },
  });
}
