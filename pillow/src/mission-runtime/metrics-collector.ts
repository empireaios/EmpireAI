import type { MissionStore } from "./mission-store.js";
import type { MissionInstance } from "./types.js";

export type MissionMetrics = {
  totalMissions: number;
  byStatus: Record<string, number>;
  averageProgress: number;
  totalRetries: number;
  totalRecoveries: number;
  totalCheckpoints: number;
};

export class MetricsCollector {
  collect(store: MissionStore): MissionMetrics {
    const missions = store.listMissions();
    const byStatus: Record<string, number> = {};
    let progressSum = 0;

    for (const m of missions) {
      byStatus[m.currentStatus] = (byStatus[m.currentStatus] ?? 0) + 1;
      progressSum += m.progress;
    }

    return {
      totalMissions: missions.length,
      byStatus,
      averageProgress: missions.length ? progressSum / missions.length : 0,
      totalRetries: store.listRetries().length,
      totalRecoveries: store.listRecoveries().length,
      totalCheckpoints: store.listCheckpoints().length,
    };
  }

  progressFor(mission: MissionInstance): number {
    switch (mission.currentStatus) {
      case "Created":
        return 0;
      case "Queued":
        return 10;
      case "Ready":
        return 20;
      case "Running":
      case "Waiting":
      case "Retrying":
      case "Recovered":
        return 50;
      case "Paused":
        return 45;
      case "Resumed":
        return 55;
      case "Completed":
        return 100;
      case "Failed":
        return 40;
      case "Cancelled":
        return 0;
      case "Archived":
        return 100;
      default:
        return mission.progress;
    }
  }
}
