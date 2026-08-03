import type { BusinessBuildMissionRecord } from "./types.js";

/** Authoritative in-memory Empire Builder Factory store — create containers only. */
export class MissionStore {
  private missions = new Map<string, BusinessBuildMissionRecord>();
  private latestMissionId: string | null = null;

  seed(missions: BusinessBuildMissionRecord[]) {
    this.missions.clear();
    this.latestMissionId = null;
    for (const mission of missions) {
      this.missions.set(mission.businessBuildMissionId, clone(mission));
      this.latestMissionId = mission.businessBuildMissionId;
    }
  }

  count() {
    return this.missions.size;
  }

  list() {
    return [...this.missions.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(missionId: string) {
    const mission = this.missions.get(missionId);
    return mission ? clone(mission) : null;
  }

  getLatestMissionId() {
    return this.latestMissionId;
  }

  save(mission: BusinessBuildMissionRecord) {
    this.missions.set(mission.businessBuildMissionId, clone(mission));
    this.latestMissionId = mission.businessBuildMissionId;
    return clone(mission);
  }
}

function clone(mission: BusinessBuildMissionRecord): BusinessBuildMissionRecord {
  return { ...mission };
}
