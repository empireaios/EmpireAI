import { MSR_METADATA_VERSION } from "./paths.js";
import { nextMsrId } from "./mission-store.js";
import type { MissionStore } from "./mission-store.js";
import type { Checkpoint, MissionInstance, MissionLifecycleState } from "./types.js";

export class CheckpointManager {
  create(
    store: MissionStore,
    mission: MissionInstance,
    label: string,
    state: MissionLifecycleState = mission.currentStatus,
    payload: Record<string, unknown> = {},
  ): Checkpoint {
    const checkpoint: Checkpoint = {
      checkpointId: nextMsrId("msr-chk"),
      missionId: mission.missionId,
      label,
      state,
      timestamp: new Date().toISOString(),
      payload: { ...payload, progress: mission.progress },
      metadataVersion: MSR_METADATA_VERSION,
    };
    store.saveCheckpoint(checkpoint);
    store.appendTimeline({
      entryId: nextMsrId(`${mission.missionId}-chk`),
      timestamp: checkpoint.timestamp,
      label: `checkpoint:${label}`,
      state,
      notes: [`Checkpoint saved at ${state}`],
    });
    return checkpoint;
  }

  listForMission(store: MissionStore, missionId: string) {
    return store.listCheckpoints(missionId);
  }
}
