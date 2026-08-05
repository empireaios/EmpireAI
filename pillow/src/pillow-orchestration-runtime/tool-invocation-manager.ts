import { appendPorLog } from "./por-logging.js";
import { POR_METADATA_VERSION } from "./paths.js";
import { nextPorId } from "./orchestration-store.js";
import type { OrchestrationStore } from "./orchestration-store.js";
import type { PorIntegrationCoordinator } from "./integrations.js";
import type { InvocationResult, PorInput, ToolInvocationDescriptor } from "./types.js";

export class ToolInvocationManager {
  invoke(
    store: OrchestrationStore,
    integrations: PorIntegrationCoordinator,
    sessionId: string,
    requestId: string,
    descriptor: ToolInvocationDescriptor,
    _input: PorInput,
  ): InvocationResult {
    const invocationId = nextPorId("por-inv-tool");
    const timestamp = new Date().toISOString();
    const deps = integrations.getDependencies();
    const handler = deps.toolRegistry?.invokeTool ?? deps.workerRegistry?.invokeWorker;

    store.saveInvocation({
      invocationId,
      kind: "tool",
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
        kind: "tool",
        status: succeeded ? "succeeded" : "structural_recorded",
        timestamp,
        handlerInvoked: true,
        fabricated: false,
        evidence: [`tool_handler_invoked:${descriptor.toolId}`, `action:${descriptor.action}`],
        notes: succeeded
          ? [`Tool ${descriptor.toolId} invoked via DI handler`]
          : [`Tool ${descriptor.toolId} handler returned non-success — recorded structurally`],
        metadataVersion: POR_METADATA_VERSION,
        neverReplaceToolImplementations: true,
        structuralSignalOnly: true,
      };
      store.saveResult(result);
      appendPorLog({ event: "invoke_tool", details: `${descriptor.toolId}:${result.status}` });
      return result;
    }

    const result: InvocationResult = {
      invocationId,
      kind: "tool",
      status: "structural_recorded",
      timestamp,
      handlerInvoked: false,
      fabricated: false,
      evidence: [`tool_structural:${descriptor.toolId}`, `action:${descriptor.action}`],
      notes: [
        `Structural tool invocation recorded for ${descriptor.toolId} — no DI handler available`,
        "Never fabricates live execution success without handler",
      ],
      metadataVersion: POR_METADATA_VERSION,
      neverReplaceToolImplementations: true,
      structuralSignalOnly: true,
    };
    store.saveResult(result);
    appendPorLog({ event: "invoke_tool_structural", details: descriptor.toolId });
    return result;
  }
}
