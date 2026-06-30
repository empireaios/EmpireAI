import type { CursorMissionDocument } from "../planner/types.js";
import { createInitialHealth } from "./monitor.js";
import type {
  MissionRegistrySnapshot,
  SupervisedMission,
  CursorMissionState,
} from "./types.js";

export class MissionRegistry {
  private missions = new Map<string, SupervisedMission>();
  private activeId: string | null = null;

  register(
    document: CursorMissionDocument,
    at: string,
    initialState: CursorMissionState = "queued",
  ): SupervisedMission {
    const mission: SupervisedMission = {
      id: document.missionId,
      title: document.title,
      state: initialState,
      launchedAt: at,
      updatedAt: at,
      stateEnteredAt: at,
      durationMs: 0,
      heartbeats: [],
      progress: [],
      health: createInitialHealth(at),
      dependencies: document.dependencies.map((d) => d.id),
      outcome: "pending",
      executiveAuditProduced: false,
      validationCompleted: false,
      recoveryAttempts: 0,
      missionAuthority: document.authority,
      objective: document.objective,
    };
    this.missions.set(mission.id, mission);
    return mission;
  }

  get(id: string): SupervisedMission | undefined {
    return this.missions.get(id);
  }

  update(mission: SupervisedMission): void {
    this.missions.set(mission.id, mission);
  }

  setActive(id: string | null): void {
    this.activeId = id;
  }

  getActive(): SupervisedMission | null {
    if (!this.activeId) return null;
    return this.missions.get(this.activeId) ?? null;
  }

  snapshot(nowMs: number): MissionRegistrySnapshot {
    const all = [...this.missions.values()].map((m) => ({
      ...m,
      durationMs: nowMs - Date.parse(m.launchedAt),
    }));

    const terminal = (states: CursorMissionState[]) =>
      all.filter((m) => states.includes(m.state));

    const completed = all.filter(
      (m) => m.state === "completed" && m.outcome === "success",
    );
    const failed = all.filter(
      (m) => m.state === "failed" || m.outcome === "failed",
    );
    const recovered = all.filter(
      (m) => m.outcome === "recovered" || m.recoveryAttempts > 0,
    );
    const queued = all.filter((m) => m.state === "queued");
    const active =
      all.find((m) => m.id === this.activeId) ??
      all.find((m) =>
        [
          "preparing",
          "repository_inspection",
          "implementation",
          "validation",
          "executive_audit",
          "recovery",
        ].includes(m.state),
      ) ??
      null;

    return {
      activeMission: active,
      queued,
      completed,
      failed,
      recovered,
      history: all.sort(
        (a, b) => Date.parse(b.launchedAt) - Date.parse(a.launchedAt),
      ),
    };
  }
}

export function createMissionRegistry(): MissionRegistry {
  return new MissionRegistry();
}
