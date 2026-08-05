import type { MissionStore } from "./mission-store.js";
import type { DependencyRef, MissionInstance } from "./types.js";

export class DependencyResolver {
  resolve(store: MissionStore, mission: MissionInstance): DependencyRef[] {
    const refs: DependencyRef[] = [];

    if (mission.parentMissionId) {
      const parent = store.getMission(mission.parentMissionId);
      refs.push({
        missionId: mission.parentMissionId,
        mode: "parent",
        satisfied: parent?.currentStatus === "Completed" || parent?.currentStatus === "Running",
      });
    }

    for (const depId of mission.dependencyMissionIds) {
      const dep = store.getMission(depId);
      const satisfied =
        mission.mode === "parallel"
          ? dep?.currentStatus === "Completed" || dep?.currentStatus === "Running"
          : dep?.currentStatus === "Completed";
      refs.push({
        missionId: depId,
        mode: mission.mode === "parallel" ? "parallel" : "sequential",
        satisfied: satisfied === true,
      });
    }

    return refs;
  }

  isReady(store: MissionStore, mission: MissionInstance): boolean {
    const deps = this.resolve(store, mission);
    if (deps.length === 0) return true;
    return deps.every((d) => d.satisfied);
  }
}
