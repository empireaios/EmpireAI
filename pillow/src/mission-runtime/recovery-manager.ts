import { MSR_METADATA_VERSION } from "./paths.js";
import { nextMsrId } from "./mission-store.js";
import { isInterruptedState } from "./lifecycle-engine.js";
import type { MissionStore } from "./mission-store.js";
import type { CheckpointManager } from "./checkpoint-manager.js";
import type { MissionInstance, RecoveryRecord } from "./types.js";

export class RecoveryManager {
  canRecover(mission: MissionInstance): boolean {
    return isInterruptedState(mission.currentStatus);
  }

  recover(
    store: MissionStore,
    checkpointManager: CheckpointManager,
    mission: MissionInstance,
    reason: string,
  ): { recovery: RecoveryRecord; checkpointId: string | null } {
    const checkpoints = store.listCheckpoints(mission.missionId);
    const latest = checkpoints.at(-1) ?? null;
    const recovery: RecoveryRecord = {
      recoveryId: nextMsrId("msr-recovery"),
      missionId: mission.missionId,
      timestamp: new Date().toISOString(),
      fromState: mission.currentStatus,
      toState: "Recovered",
      checkpointId: latest?.checkpointId ?? null,
      reason,
      metadataVersion: MSR_METADATA_VERSION,
    };
    store.saveRecovery(recovery);
    if (!latest) {
      checkpointManager.create(store, mission, "recovery-auto", mission.currentStatus, {
        recoveredFrom: mission.currentStatus,
      });
    }
    store.appendTimeline({
      entryId: nextMsrId(`${mission.missionId}-recovery`),
      timestamp: recovery.timestamp,
      label: `recover:${mission.missionId}`,
      state: "Recovered",
      notes: [reason, latest ? `Restored from checkpoint ${latest.checkpointId}` : "No prior checkpoint"],
    });
    return { recovery, checkpointId: latest?.checkpointId ?? null };
  }
}
