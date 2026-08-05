import { appendPorLog } from "./por-logging.js";
import { POR_METADATA_VERSION } from "./paths.js";
import { nextPorId } from "./orchestration-store.js";
import type { OrchestrationStore } from "./orchestration-store.js";
import type { PorIntegrationCoordinator } from "./integrations.js";
import type { InvocationResult, PorInput, WorkerInvocationDescriptor } from "./types.js";

export class WorkerInvocationManager {
  invoke(
    store: OrchestrationStore,
    integrations: PorIntegrationCoordinator,
    sessionId: string,
    requestId: string,
    descriptor: WorkerInvocationDescriptor,
    input: PorInput,
  ): InvocationResult {
    const invocationId = nextPorId("por-inv-worker");
    const timestamp = new Date().toISOString();
    const deps = integrations.getDependencies();
    const handler = deps.workerRegistry?.invokeWorker;

    store.saveInvocation({
      invocationId,
      kind: "worker",
      sessionId,
      requestId,
      timestamp,
      descriptor: { ...descriptor },
      metadataVersion: POR_METADATA_VERSION,
      structuralSignalOnly: true,
      neverFabricateExecutionResults: true,
    });

    if (handler) {
      const handlerResult = handler({ ...descriptor, sessionId, requestId }) as Record<string, unknown> | null;
      const succeeded = handlerResult?.success === true || handlerResult?.status === "succeeded";
      const result: InvocationResult = {
        invocationId,
        kind: "worker",
        status: succeeded ? "succeeded" : "structural_recorded",
        timestamp,
        handlerInvoked: true,
        fabricated: false,
        evidence: [`worker_handler_invoked:${descriptor.workerId}`, `action:${descriptor.action}`],
        notes: succeeded
          ? [`Worker ${descriptor.workerId} invoked via DI handler`]
          : [`Worker ${descriptor.workerId} handler returned non-success — recorded structurally`],
        metadataVersion: POR_METADATA_VERSION,
        neverReplaceWorkerImplementations: true,
        structuralSignalOnly: true,
      };
      store.saveResult(result);
      appendPorLog({ event: "invoke_worker", details: `${descriptor.workerId}:${result.status}` });
      return result;
    }

    const result: InvocationResult = {
      invocationId,
      kind: "worker",
      status: "structural_recorded",
      timestamp,
      handlerInvoked: false,
      fabricated: false,
      evidence: [
        `worker_structural:${descriptor.workerId}`,
        `factory:${descriptor.factoryKey}`,
        `action:${descriptor.action}`,
      ],
      notes: [
        `Structural worker invocation recorded for ${descriptor.workerId} — no DI handler available`,
        "Never fabricates live execution success without handler",
      ],
      metadataVersion: POR_METADATA_VERSION,
      neverReplaceWorkerImplementations: true,
      structuralSignalOnly: true,
    };
    store.saveResult(result);
    appendPorLog({ event: "invoke_worker_structural", details: descriptor.workerId });
    return result;
  }
}
