import type { WorkforceOrchestratorConfiguration } from "./configuration.js";
import type { WorkforceOrchestratorInput, WorkerDescriptor } from "./types.js";

/** Selects suitable workers for an executive request. */
export class WorkerSelector {
  select(
    discovered: WorkerDescriptor[],
    input: WorkforceOrchestratorInput,
    configuration: WorkforceOrchestratorConfiguration,
  ): WorkerDescriptor[] {
    const max = Math.min(
      configuration.maxWorkers,
      input.maxWorkers ?? configuration.maxWorkers,
    );
    const min = configuration.minWorkers;

    const eligible = discovered
      .filter((w) => w.state === "available" || w.state === "waiting")
      .filter((w) => w.suitabilityScore >= 45);

    let selected = eligible.slice(0, Math.max(min, Math.min(max, eligible.length || min)));

    if (selected.length < min) {
      selected = discovered
        .filter((w) => w.state !== "offline" && w.state !== "failed")
        .slice(0, min)
        .map((w) => ({ ...w, capabilities: [...w.capabilities] }));
    }

    if (input.coordinationMode === "single" || (!input.coordinationMode && selected.length === 1)) {
      selected = selected.slice(0, 1);
    }

    return selected.map((w) => ({
      ...w,
      capabilities: [...w.capabilities],
      state: "busy" as const,
    }));
  }
}
