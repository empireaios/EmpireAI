import { MSR_METADATA_VERSION } from "./paths.js";
import { nextMsrId } from "./mission-store.js";
import type { MissionStore } from "./mission-store.js";
import type { MsrIntegrationCoordinator } from "./integrations.js";
import type { MissionInstance, MsrInput } from "./types.js";

export type ExecutionResult = {
  handlerInvoked: boolean;
  orchestrationInvoked: boolean;
  succeeded: boolean;
  notes: string[];
};

export class ExecutionCoordinator {
  run(
    store: MissionStore,
    integrations: MsrIntegrationCoordinator,
    mission: MissionInstance,
    input: MsrInput,
  ): ExecutionResult {
    const notes: string[] = [];
    let handlerInvoked = false;
    let orchestrationInvoked = false;

    const por = integrations.getDependencies().pillowOrchestrationRuntime;
    if (por?.invokeWorker && mission.workers.length > 0) {
      por.invokeWorker({
        pillowConfirmed: input.pillowConfirmed,
        grandKingApproved: input.grandKingApproved,
        validated: input.validated ?? true,
        workers: mission.workers.map((workerId) => ({
          workerId,
          factoryKey: "pillow-mission",
          action: "execute",
        })),
      });
      orchestrationInvoked = true;
      notes.push("Pillow Orchestration Runtime invokeWorker called via DI — structural delegation only");
    } else {
      notes.push("No POR DI handler — structural execution record only");
    }

    const registry = integrations.getDependencies().workerRegistry;
    if (registry?.invokeWorker && mission.workers.length > 0) {
      registry.invokeWorker({ workers: mission.workers, missionId: mission.missionId });
      handlerInvoked = true;
      notes.push("Worker registry invokeWorker called via DI");
    }

    store.appendTimeline({
      entryId: nextMsrId(`${mission.missionId}-exec`),
      timestamp: new Date().toISOString(),
      label: `execute:${mission.missionId}`,
      state: "Running",
      notes: [...notes, "Mission Runtime never replaces worker or orchestration logic"],
    });

    const succeeded = input.forceFail !== true;
    return { handlerInvoked, orchestrationInvoked, succeeded, notes };
  }
}
