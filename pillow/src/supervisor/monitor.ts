import type {
  HeartbeatConfig,
  HeartbeatSignal,
  MissionHealth,
  MissionRiskLevel,
  ProgressEvent,
  StallSignal,
  SupervisedMission,
  CursorMissionState,
} from "./types.js";
import { doctrineRefForStall, matchDoctrineStall } from "./doctrine.js";

function riskFromScore(score: number): MissionRiskLevel {
  if (score >= 75) return "low";
  if (score >= 50) return "medium";
  if (score >= 25) return "high";
  return "critical";
}

export function createInitialHealth(now: string): MissionHealth {
  return {
    score: 100,
    riskLevel: "low",
    stallSignals: [],
    isDeadAgent: false,
    isSlowMission: false,
    lastProgressAt: now,
    lastHeartbeatAt: now,
    stateUnchangedMs: 0,
  };
}

export function evaluateMissionHealth(
  mission: SupervisedMission,
  config: HeartbeatConfig,
  nowMs: number,
): MissionHealth {
  const stallSignals: StallSignal[] = [];
  let score = 100;

  const lastHb = mission.heartbeats.at(-1);
  const lastProgress = mission.progress.at(-1);
  const lastHbMs = lastHb ? Date.parse(lastHb.at) : Date.parse(mission.launchedAt);
  const lastProgressMs = lastProgress
    ? Date.parse(lastProgress.at)
    : Date.parse(mission.launchedAt);
  const stateEnteredMs = Date.parse(mission.stateEnteredAt);
  const stateUnchangedMs = nowMs - stateEnteredMs;
  const heartbeatStaleMs = nowMs - lastHbMs;
  const progressStaleMs = nowMs - lastProgressMs;

  if (heartbeatStaleMs > config.heartbeatStaleMs) {
    score -= 15;
  }
  if (progressStaleMs > config.progressStaleMs) {
    score -= 20;
    stallSignals.push({
      kind: "no_repository_activity",
      detectedAt: new Date(nowMs).toISOString(),
      message: `No meaningful progress for ${Math.round(progressStaleMs / 1000)}s`,
      doctrineRef: doctrineRefForStall("no_repository_activity"),
    });
  }
  if (stateUnchangedMs > config.stateStaleMs) {
    score -= 25;
    stallSignals.push({
      kind: "no_state_change",
      detectedAt: new Date(nowMs).toISOString(),
      message: `State '${mission.state}' unchanged for ${Math.round(stateUnchangedMs / 1000)}s`,
      doctrineRef: doctrineRefForStall("no_state_change"),
    });
  }

  if (mission.state === "validation" && stateUnchangedMs > config.progressStaleMs) {
    score -= 10;
    stallSignals.push({
      kind: "no_validation_progress",
      detectedAt: new Date(nowMs).toISOString(),
      message: "Validation phase without progress signals",
      doctrineRef: doctrineRefForStall("no_validation_progress"),
    });
  }

  for (const hb of mission.heartbeats.slice(-5)) {
    const doctrineKind = matchDoctrineStall(hb.detail);
    if (doctrineKind) {
      score -= 30;
      stallSignals.push({
        kind: doctrineKind,
        detectedAt: hb.at,
        message: hb.detail,
        doctrineRef: doctrineRefForStall(doctrineKind),
      });
    }
  }

  const isSlowMission =
    mission.state === "validation" &&
    stateUnchangedMs > config.slowValidationMs &&
    heartbeatStaleMs < config.deadAgentMs;

  const isDeadAgent =
    !isSlowMission &&
    (heartbeatStaleMs > config.deadAgentMs ||
      (stallSignals.length >= 2 && progressStaleMs > config.deadAgentMs));

  if (isDeadAgent) score = Math.min(score, 10);
  if (isSlowMission) score = Math.max(score, 40);

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    riskLevel: riskFromScore(score),
    stallSignals,
    isDeadAgent,
    isSlowMission,
    lastProgressAt: lastProgress?.at ?? null,
    lastHeartbeatAt: lastHb?.at ?? null,
    stateUnchangedMs,
  };
}

export function hasQualifyingStall(health: MissionHealth): boolean {
  return (
    health.isDeadAgent ||
    health.stallSignals.some((s) =>
      [
        "waiting_background_process",
        "waiting_detached_process",
        "waiting_npm",
        "waiting_build",
        "reconnecting",
        "taking_longer_than_expected",
      ].includes(s.kind),
    ) ||
    (health.riskLevel === "critical" && health.stallSignals.length > 0)
  );
}

export function recordHeartbeat(
  mission: SupervisedMission,
  signal: Omit<HeartbeatSignal, "at">,
  at: string,
): SupervisedMission {
  return {
    ...mission,
    updatedAt: at,
    heartbeats: [...mission.heartbeats, { ...signal, at }],
  };
}

export function recordProgress(
  mission: SupervisedMission,
  event: Omit<ProgressEvent, "at">,
  at: string,
): SupervisedMission {
  return {
    ...mission,
    updatedAt: at,
    progress: [...mission.progress, { ...event, at }],
  };
}

export function transitionMissionState(
  mission: SupervisedMission,
  state: CursorMissionState,
  at: string,
): SupervisedMission {
  return {
    ...mission,
    state,
    updatedAt: at,
    stateEnteredAt: at,
    heartbeats: [
      ...mission.heartbeats,
      {
        at,
        kind: "state_transition",
        detail: `Transitioned to ${state}`,
      },
    ],
  };
}
