import { randomUUID } from "node:crypto";

import type {
  CursorBridgePhase,
  CursorMissionRecord,
  CursorPresenceState,
} from "./types.js";
import type { SqlitePillowApprovalRepository } from "./repository/sqlite-pillow-approval-repository.js";

const HEARTBEAT_TIMEOUT_MS = 120_000;
const MISSION_TIMEOUT_MS = 30 * 60_000;

/** Tracks Cursor worker presence and mission lifecycle signals (PILLOW-017). */
export class CursorHeartbeatService {
  private cursorOnline = false;
  private lastCursorHeartbeatAt: string | null = null;

  constructor(private readonly repository: SqlitePillowApprovalRepository) {}

  recordCursorHeartbeat(at = new Date().toISOString()): void {
    this.cursorOnline = true;
    this.lastCursorHeartbeatAt = at;
  }

  markCursorOffline(): void {
    this.cursorOnline = false;
  }

  isCursorOnline(now = Date.now()): boolean {
    if (!this.lastCursorHeartbeatAt) return false;
    return (
      this.cursorOnline &&
      now - Date.parse(this.lastCursorHeartbeatAt) <= HEARTBEAT_TIMEOUT_MS
    );
  }

  resolvePresence(
    record: CursorMissionRecord | null,
    now = Date.now(),
  ): CursorPresenceState {
    if (!this.isCursorOnline(now)) return "CursorOffline";

    if (!record) {
      return this.isCursorOnline(now) ? "CursorOnline" : "CursorOffline";
    }

    switch (record.phase) {
      case "running":
      case "dispatched":
        return "MissionRunning";
      case "idle":
      case "queued":
        return "MissionIdle";
      case "failed":
      case "timeout":
        return "MissionFailed";
      case "completed":
        return "MissionCompleted";
      case "recovery":
        return "MissionRunning";
      default:
        return "CursorOnline";
    }
  }

  detectTimeout(record: CursorMissionRecord, now = Date.now()): boolean {
    if (!record.dispatchedAt) return false;
    if (record.phase === "completed" || record.phase === "failed") {
      return false;
    }
    const lastSignal = record.lastHeartbeatAt ?? record.dispatchedAt;
    return now - Date.parse(lastSignal) > MISSION_TIMEOUT_MS;
  }

  updateMissionPresence(
    record: CursorMissionRecord,
    now = Date.now(),
  ): CursorMissionRecord {
    const presence = this.resolvePresence(record, now);
    return {
      ...record,
      presence,
      updatedAt: new Date(now).toISOString(),
    };
  }

  listMissionRecords(workspaceId: string): CursorMissionRecord[] {
    return this.repository.listMissions(workspaceId);
  }

  getLastCursorHeartbeatAt(): string | null {
    return this.lastCursorHeartbeatAt;
  }

  snapshotCounts(workspaceId: string): {
    queued: number;
    running: number;
    completed: number;
    failed: number;
  } {
    const missions = this.repository.listMissions(workspaceId, { limit: 500 });
    const countPhase = (phases: CursorBridgePhase[]) =>
      missions.filter((mission) => phases.includes(mission.phase)).length;

    return {
      queued: countPhase(["queued"]),
      running: countPhase(["dispatched", "running", "recovery", "idle"]),
      completed: countPhase(["completed"]),
      failed: countPhase(["failed", "timeout"]),
    };
  }
}

export function newMissionRecord(input: {
  missionId: string;
  workspaceId: string;
  approvalId: string | null;
  title: string;
  dryRun: boolean;
}): CursorMissionRecord {
  const now = new Date().toISOString();
  return {
    missionId: input.missionId,
    workspaceId: input.workspaceId,
    approvalId: input.approvalId,
    phase: "queued",
    presence: "MissionIdle",
    title: input.title,
    artifactPath: null,
    dryRun: input.dryRun,
    dispatchedAt: null,
    completedAt: null,
    lastHeartbeatAt: null,
    lastError: null,
    recoveryAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function newRecoveryEntry(
  missionId: string,
  workspaceId: string,
  trigger: "timeout" | "failure" | "stall" | "manual",
  outcome: "triggered" | "recovered" | "failed",
  metadata: Record<string, unknown> = {},
) {
  return {
    recoveryId: randomUUID(),
    missionId,
    workspaceId,
    trigger,
    outcome,
    timestamp: new Date().toISOString(),
    metadata,
  };
}
