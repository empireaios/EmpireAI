import type { MissionRuntimeHandle } from "./integrations.js";
import type { ScheduleDefinition } from "./types.js";

export type MissionTriggerResult = {
  triggerRef: string;
  probed: boolean;
  called: boolean;
  notes: string[];
};

/**
 * Structural trigger to Mission Runtime handle only.
 * NEVER executes business logic — records triggerRef.
 */
export class MissionTrigger {
  trigger(
    handle: MissionRuntimeHandle | undefined,
    schedule: ScheduleDefinition,
    nowIso: string,
  ): MissionTriggerResult {
    const triggerRef = `trig://schrt/mission/${schedule.scheduleId}@${nowIso}`;
    if (!handle) {
      return {
        triggerRef,
        probed: true,
        called: false,
        notes: ["mission_runtime unavailable — structural triggerRef recorded only"],
      };
    }

    let called = false;
    const notes: string[] = ["mission_runtime probed structurally"];

    if (typeof handle.createMission === "function") {
      handle.createMission({
        structuralSignalOnly: true,
        fabricated: false,
        scheduleId: schedule.scheduleId,
        missionId: schedule.missionId,
        triggerRef,
        source: "scheduling-runtime",
        neverReplaceMissionRuntime: true,
      });
      called = true;
      notes.push("createMission structural signal sent");
    }

    if (typeof handle.monitor === "function") {
      handle.monitor({
        structuralSignalOnly: true,
        scheduleId: schedule.scheduleId,
        missionId: schedule.missionId,
        triggerRef,
        source: "scheduling-runtime",
      });
      called = true;
      notes.push("monitor presence probed");
    }

    if (!called) {
      notes.push("mission_runtime present but no createMission/monitor — triggerRef only");
    }

    return { triggerRef, probed: true, called, notes };
  }
}
