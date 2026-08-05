import { MSR_METADATA_VERSION } from "./paths.js";
import { nextMsrId } from "./mission-store.js";
import type { MissionRuntimeConfiguration } from "./configuration.js";
import type { MissionStore } from "./mission-store.js";
import type { MissionInstance, RetryRecord } from "./types.js";

export class RetryManager {
  canRetry(mission: MissionInstance, config: MissionRuntimeConfiguration): boolean {
    return mission.retryCount < config.maxRetries;
  }

  recordRetry(
    store: MissionStore,
    mission: MissionInstance,
    fromState: MissionInstance["currentStatus"],
    toState: MissionInstance["currentStatus"],
    reason: string,
  ): RetryRecord {
    const retry: RetryRecord = {
      retryId: nextMsrId("msr-retry"),
      missionId: mission.missionId,
      attempt: mission.retryCount + 1,
      timestamp: new Date().toISOString(),
      fromState,
      toState,
      reason,
      metadataVersion: MSR_METADATA_VERSION,
    };
    store.saveRetry(retry);
    return retry;
  }
}
