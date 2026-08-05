import type { CommandDispatchProbeResult, WorkerHandle } from "./types.js";

type InvokeWorkerCapable = WorkerHandle & { invokeWorker?: (...args: unknown[]) => unknown };

/**
 * Structural, presence-only command dispatch verification. Probes
 * pillowOrchestrationRuntime.invokeWorker presence when injected — it never
 * calls invokeWorker (that would execute real worker business logic). For
 * every discovered worker it produces a structural command verification
 * record (commandId) from presence/capability evidence only.
 */
export function probeCommandDispatch(
  workerId: string,
  orchestration: InvokeWorkerCapable | null | undefined,
): CommandDispatchProbeResult {
  const commandId = `cmd-pcart-${workerId}`;
  const capable = Boolean(orchestration) && typeof orchestration!.invokeWorker === "function";
  return {
    workerId,
    commandId,
    dispatchStatus: capable ? "Passed" : "Missing",
    evidence: capable
      ? "pillowOrchestrationRuntime.invokeWorker present — presence/capability evidence only, no business logic executed"
      : "No injected pillowOrchestrationRuntime.invokeWorker — structural command verification record produced without executing business logic",
  };
}
