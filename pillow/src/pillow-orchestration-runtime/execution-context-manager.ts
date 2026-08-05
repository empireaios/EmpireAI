import { POR_METADATA_VERSION } from "./paths.js";
import { nextPorId } from "./orchestration-store.js";
import type { OrchestrationStore } from "./orchestration-store.js";
import type { PorIntegrationCoordinator } from "./integrations.js";
import type { ExecutionTimelineEntry, PorInput } from "./types.js";

export type ExecutionContextRecord = {
  contextId: string;
  sessionId: string;
  requestId: string;
  createdAt: string;
  propagatedFromSrtc: boolean;
  traceabilityRefs: string[];
  metadataVersion: string;
  structuralSignalOnly: true;
};

export class ExecutionContextManager {
  propagate(
    store: OrchestrationStore,
    integrations: PorIntegrationCoordinator,
    sessionId: string,
    requestId: string,
    input: PorInput,
  ): ExecutionContextRecord {
    const deps = integrations.getDependencies();
    const srtc = deps.sharedRuntimeCore;
    let contextId = nextPorId("por-ctx");
    let propagatedFromSrtc = false;
    const traceabilityRefs = ["q10-02", "pillow-orchestration-runtime"];

    if (srtc?.createExecutionContext) {
      const srtcResult = srtc.createExecutionContext(input) as { executionContext?: { contextId?: string } } | null;
      if (srtcResult?.executionContext?.contextId) {
        contextId = srtcResult.executionContext.contextId;
        propagatedFromSrtc = true;
        traceabilityRefs.push("shared-runtime-core", contextId);
      }
    }

    const record: ExecutionContextRecord = {
      contextId,
      sessionId,
      requestId,
      createdAt: new Date().toISOString(),
      propagatedFromSrtc,
      traceabilityRefs,
      metadataVersion: POR_METADATA_VERSION,
      structuralSignalOnly: true,
    };

    store.appendEvent({
      entryId: nextPorId("por-event"),
      timestamp: record.createdAt,
      kind: "session",
      label: "execution_context_propagated",
      status: propagatedFromSrtc ? "succeeded" : "structural_recorded",
      notes: propagatedFromSrtc
        ? ["Execution context propagated from Shared Runtime Core"]
        : ["Local execution context created — SRTC unavailable"],
    });

    return record;
  }
}
