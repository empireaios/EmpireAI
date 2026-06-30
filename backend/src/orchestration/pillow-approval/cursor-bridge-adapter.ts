import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { PillowSession } from "@empireai/pillow";
import type { CursorMissionDocument } from "@empireai/pillow";
import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import { logger } from "../../config/logger.js";
import {
  CursorHeartbeatService,
  newMissionRecord,
  newRecoveryEntry,
} from "./cursor-heartbeat-service.js";
import type { SqlitePillowApprovalRepository } from "./repository/sqlite-pillow-approval-repository.js";
import type {
  CursorBridgeStatus,
  CursorMissionRecord,
  DispatchCursorMissionInput,
  DispatchHistoryEntry,
} from "./types.js";

export class CursorBridgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CursorBridgeError";
  }
}

export interface CursorBridgeOptions {
  dryRunLaunch?: boolean;
  repositoryRoot: string;
}

/**
 * PILLOW-017 Cursor Bridge — queues and monitors Cursor missions via Pillow Supervisor.
 * Default dry-run: records handoff artifacts without spawning external processes.
 */
export class CursorBridgeAdapter {
  private readonly dryRunLaunch: boolean;
  private readonly repositoryRoot: string;

  constructor(
    private readonly getSession: () => PillowSession | null,
    private readonly repository: SqlitePillowApprovalRepository,
    private readonly heartbeat: CursorHeartbeatService,
    options: CursorBridgeOptions,
    private readonly auditLogger?: AuditLogger,
  ) {
    this.dryRunLaunch = options.dryRunLaunch ?? true;
    this.repositoryRoot = options.repositoryRoot;
  }

  queueMission(input: {
    workspaceId: string;
    approvalId: string | null;
    document: CursorMissionDocument;
    dryRun?: boolean;
  }): CursorMissionRecord {
    const dryRun = input.dryRun ?? this.dryRunLaunch;
    const record = newMissionRecord({
      missionId: input.document.missionId,
      workspaceId: input.workspaceId,
      approvalId: input.approvalId,
      title: input.document.title,
      dryRun,
    });

    const artifactPath = this.writeMissionArtifact(input.document, dryRun);
    record.artifactPath = artifactPath;
    this.repository.saveMission(record);
    this.recordDispatch({
      missionId: record.missionId,
      workspaceId: input.workspaceId,
      approvalId: input.approvalId,
      actor: "cursor-bridge",
      dryRun,
      artifactPath,
      result: "queued",
      metadata: { title: input.document.title },
    });

    return record;
  }

  dispatchMission(input: DispatchCursorMissionInput): {
    record: CursorMissionRecord;
    launched: boolean;
  } {
    const session = this.getSession();
    if (!session) {
      throw new CursorBridgeError("Pillow session not running");
    }

    const dryRun = input.dryRun ?? this.dryRunLaunch;
    let record =
      (input.missionId
        ? this.repository.getMission(input.missionId)
        : null) ?? null;

    let document: CursorMissionDocument | null = null;
    if (record) {
      document = this.resolveDocument(session, record.missionId);
    } else if (input.approvalId) {
      document = session.planner.generateNextMission() ?? null;
      if (!document) {
        throw new CursorBridgeError("No planned mission available to dispatch");
      }
      record = this.queueMission({
        workspaceId: input.workspaceId,
        approvalId: input.approvalId,
        document,
        dryRun,
      });
    } else {
      document = session.planner.generateNextMission();
      if (!document) {
        throw new CursorBridgeError("missionId or approvalId required for dispatch");
      }
      record = this.queueMission({
        workspaceId: input.workspaceId,
        approvalId: null,
        document,
        dryRun,
      });
    }

    if (!document) {
      document = this.resolveDocument(session, record.missionId);
    }
    if (!document) {
      throw new CursorBridgeError(`Mission document not found: ${record.missionId}`);
    }

    const objectiveAction = {
      title: document.title,
      summary: document.objective ?? document.title,
      missionId: document.missionId,
      grandKingOverride: input.grandKingOverride,
    };
    if (!session.autonomousRuntime.shouldDispatchToCursor(objectiveAction)) {
      session.objective.routeToVault(objectiveAction);
      throw new CursorBridgeError(
        "blocked_by_current_objective: Mission not aligned with Finish EmpireAI Version 1",
      );
    }

    const launch = session.supervisor.launchMission({ document });
    const now = new Date().toISOString();

    record = {
      ...record,
      phase: dryRun ? "dispatched" : "running",
      presence: "MissionRunning",
      dispatchedAt: now,
      lastHeartbeatAt: now,
      updatedAt: now,
    };
    this.repository.saveMission(record);
    this.heartbeat.recordCursorHeartbeat(now);

    this.recordDispatch({
      missionId: record.missionId,
      workspaceId: input.workspaceId,
      approvalId: input.approvalId ?? record.approvalId,
      actor: input.actor,
      dryRun,
      artifactPath: record.artifactPath,
      result: "dispatched",
      metadata: {
        launched: launch.launched,
        supervisorState: launch.mission.state,
      },
    });

    this.auditLogger?.write({
      action: "pillow.cursor.dispatch",
      actor: input.actor,
      workspaceId: input.workspaceId,
      correlationId: input.correlationId,
      metadata: {
        missionId: record.missionId,
        dryRun,
        approvalId: input.approvalId ?? record.approvalId,
      },
    });

    logger.info(
      { missionId: record.missionId, dryRun },
      "Cursor bridge mission dispatched (PILLOW-017)",
    );

    return { record, launched: launch.launched };
  }

  recordMissionHeartbeat(
    missionId: string,
    detail: string,
    kind:
      | "repository_inspection"
      | "validation"
      | "executive_audit"
      | "state_transition" = "state_transition",
  ): CursorMissionRecord | null {
    const session = this.getSession();
    if (!session) return null;

    session.supervisor.recordMissionHeartbeat(missionId, kind, detail);
    this.heartbeat.recordCursorHeartbeat();

    const record = this.repository.getMission(missionId);
    if (!record) return null;

    const updated: CursorMissionRecord = {
      ...record,
      phase: record.phase === "dispatched" ? "running" : record.phase,
      presence: "MissionRunning",
      lastHeartbeatAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.repository.saveMission(updated);
    return updated;
  }

  markMissionCompleted(missionId: string, detail = "Mission completed"): CursorMissionRecord | null {
    const session = this.getSession();
    if (!session) return null;

    session.supervisor.recordMissionProgress(missionId, {
      kind: "executive_audit_generated",
      detail,
    });
    session.supervisor.transitionMission(missionId, "completed");

    const record = this.repository.getMission(missionId);
    if (!record) return null;

    const now = new Date().toISOString();
    const updated: CursorMissionRecord = {
      ...record,
      phase: "completed",
      presence: "MissionCompleted",
      completedAt: now,
      lastHeartbeatAt: now,
      updatedAt: now,
    };
    this.repository.saveMission(updated);
    return updated;
  }

  markMissionFailed(
    missionId: string,
    error: string,
    triggerRecovery = true,
  ): CursorMissionRecord | null {
    const session = this.getSession();
    if (!session) return null;

    session.supervisor.transitionMission(missionId, "failed");

    const record = this.repository.getMission(missionId);
    if (!record) return null;

    const updated: CursorMissionRecord = {
      ...record,
      phase: "failed",
      presence: "MissionFailed",
      lastError: error,
      updatedAt: new Date().toISOString(),
    };
    this.repository.saveMission(updated);

    if (triggerRecovery) {
      this.triggerRecovery(missionId, record.workspaceId, "failure", error);
    }

    return updated;
  }

  async monitorActiveMissions(workspaceId: string): Promise<{
    timedOut: string[];
    recovered: string[];
  }> {
    const timedOut: string[] = [];
    const recovered: string[] = [];
    const missions = this.repository.listMissions(workspaceId, { limit: 100 });

    for (const mission of missions) {
      if (this.heartbeat.detectTimeout(mission)) {
        timedOut.push(mission.missionId);
        const updated: CursorMissionRecord = {
          ...mission,
          phase: "timeout",
          presence: "MissionFailed",
          lastError: "Mission heartbeat timeout",
          updatedAt: new Date().toISOString(),
        };
        this.repository.saveMission(updated);
        this.triggerRecovery(mission.missionId, workspaceId, "timeout", updated.lastError!);
      }
    }

    const session = this.getSession();
    if (session) {
      const tick = await session.supervisor.tick();
      if (tick.recoveriesInvoked > 0) {
        for (const mission of missions) {
          if (mission.phase === "running" || mission.phase === "dispatched") {
            recovered.push(mission.missionId);
          }
        }
      }
    }

    return { timedOut, recovered };
  }

  triggerRecovery(
    missionId: string,
    workspaceId: string,
    trigger: "timeout" | "failure" | "stall" | "manual",
    reason: string,
  ): void {
    const record = this.repository.getMission(missionId);
    if (!record) return;

    const entry = newRecoveryEntry(missionId, workspaceId, trigger, "triggered", {
      reason,
    });
    this.repository.appendRecovery(entry);

    const updated: CursorMissionRecord = {
      ...record,
      phase: "recovery",
      presence: "MissionRunning",
      recoveryAttempts: record.recoveryAttempts + 1,
      lastError: reason,
      updatedAt: new Date().toISOString(),
    };
    this.repository.saveMission(updated);

    this.auditLogger?.write({
      action: "pillow.cursor.recovery",
      actor: "cursor-bridge",
      workspaceId,
      correlationId: entry.recoveryId,
      metadata: { missionId, trigger, reason },
    });
  }

  recordCursorPresence(): void {
    this.heartbeat.recordCursorHeartbeat();
  }

  getStatus(workspaceId: string): CursorBridgeStatus {
    const counts = this.heartbeat.snapshotCounts(workspaceId);
    const missions = this.repository.listMissions(workspaceId, { limit: 50 });
    const active =
      missions.find((mission) =>
        ["dispatched", "running", "recovery", "idle"].includes(mission.phase),
      ) ?? null;

    const cursorOnline = this.heartbeat.isCursorOnline();
    const presence = this.heartbeat.resolvePresence(active);

    return {
      presence,
      cursorOnline,
      activeMissionId: active?.missionId ?? null,
      activePhase: active?.phase ?? null,
      lastHeartbeatAt: this.heartbeat.getLastCursorHeartbeatAt(),
      queuedCount: counts.queued,
      runningCount: counts.running,
      completedCount: counts.completed,
      failedCount: counts.failed,
      dryRunLaunch: this.dryRunLaunch,
      missionId: "PILLOW-017",
    };
  }

  listDispatchHistory(workspaceId: string, limit?: number) {
    return this.repository.listDispatchHistory(workspaceId, limit);
  }

  listRecoveryHistory(workspaceId: string, limit?: number) {
    return this.repository.listRecoveryHistory(workspaceId, limit);
  }

  listMissionBoard(workspaceId: string) {
    const missions = this.repository.listMissions(workspaceId, { limit: 200 });
    return {
      running: missions.filter((mission) =>
        ["dispatched", "running", "recovery", "idle"].includes(mission.phase),
      ),
      completed: missions.filter((mission) => mission.phase === "completed"),
      failed: missions.filter((mission) =>
        ["failed", "timeout"].includes(mission.phase),
      ),
      queued: missions.filter((mission) => mission.phase === "queued"),
    };
  }

  listObjectiveMissionQueue(workspaceId: string) {
    const missions = this.repository.listMissions(workspaceId, { limit: 200 });
    const session = this.getSession();
    if (!session?.objective) {
      const board = this.listMissionBoard(workspaceId);
      return {
        activeObjectiveWork: board.running,
        waitingObjectiveWork: board.queued,
        deferredImprovementVault: [],
        blocked: board.failed,
        completed: board.completed,
      };
    }

    const classified = session.objective.classifyMissionQueue(
      missions.map((mission) => ({
        missionId: mission.missionId,
        title: mission.title,
        phase: mission.phase,
      })),
    );

    const mapItems = (items: typeof classified.activeObjectiveWork) =>
      items.map((item) => {
        const record = missions.find((m) => m.missionId === item.missionId);
        return record ?? { missionId: item.missionId, title: item.title, phase: item.phase ?? "queued" };
      });

    return {
      activeObjectiveWork: mapItems(classified.activeObjectiveWork),
      waitingObjectiveWork: mapItems(classified.waitingObjectiveWork),
      deferredImprovementVault: mapItems(classified.deferredImprovementVault),
      blocked: mapItems(classified.blocked),
      completed: mapItems(classified.completed),
    };
  }

  getMission(missionId: string): CursorMissionRecord | null {
    return this.repository.getMission(missionId);
  }

  private resolveDocument(
    session: PillowSession,
    missionId: string,
  ): CursorMissionDocument | null {
    const generated = session.planner.generateNextMission();
    if (generated?.missionId === missionId) return generated;
    const plan = session.planner.getPlan();
    const candidate = plan.nextMission;
    if (candidate?.id === missionId) {
      return session.planner.generateMission(candidate.id);
    }
    return generated;
  }

  private writeMissionArtifact(
    document: CursorMissionDocument,
    dryRun: boolean,
  ): string {
    const dir = path.join(this.repositoryRoot, ".cursor", "missions", "pending");
    fs.mkdirSync(dir, { recursive: true });
    const artifactPath = path.join(dir, `${document.missionId}.md`);
    const header = dryRun
      ? "<!-- PILLOW-017 dry-run handoff — no external Cursor process spawned -->\n\n"
      : "";
    fs.writeFileSync(artifactPath, `${header}${document.formatted}`, "utf8");
    return artifactPath;
  }

  private recordDispatch(input: Omit<DispatchHistoryEntry, "dispatchId" | "timestamp">): void {
    const entry: DispatchHistoryEntry = {
      dispatchId: randomUUID(),
      timestamp: new Date().toISOString(),
      ...input,
    };
    this.repository.appendDispatch(entry);
  }
}
