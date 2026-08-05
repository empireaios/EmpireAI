import { appendPorLog } from "./por-logging.js";
import { POR_METADATA_VERSION } from "./paths.js";
import { nextPorId } from "./orchestration-store.js";
import type { OrchestrationStore } from "./orchestration-store.js";
import type { PorIntegrationCoordinator } from "./integrations.js";
import type { InvocationResult, PorInput, WorkflowInvocationDescriptor } from "./types.js";
import { WorkerInvocationManager } from "./worker-invocation-manager.js";
import { ToolInvocationManager } from "./tool-invocation-manager.js";

export class WorkflowOrchestrator {
  private readonly workerManager = new WorkerInvocationManager();
  private readonly toolManager = new ToolInvocationManager();

  orchestrate(
    store: OrchestrationStore,
    integrations: PorIntegrationCoordinator,
    sessionId: string,
    requestId: string,
    descriptor: WorkflowInvocationDescriptor,
    input: PorInput,
  ): InvocationResult {
    const invocationId = nextPorId("por-inv-workflow");
    const timestamp = new Date().toISOString();
    const stepResults: string[] = [];

    for (const step of descriptor.steps) {
      if (step.kind === "tool") {
        const result = this.toolManager.invoke(store, integrations, sessionId, requestId, {
          toolId: step.targetId,
          action: step.action,
        }, input);
        stepResults.push(`${step.stepId}:${result.status}`);
      } else {
        const result = this.workerManager.invoke(store, integrations, sessionId, requestId, {
          workerId: step.targetId,
          factoryKey: "unknown",
          action: step.action,
        }, input);
        stepResults.push(`${step.stepId}:${result.status}`);
      }
    }

    const allSucceeded = stepResults.every((s) => s.endsWith(":succeeded"));
    const anyBlocked = stepResults.some((s) => s.endsWith(":blocked") || s.endsWith(":failed"));
    const status = anyBlocked ? "failed" : allSucceeded && stepResults.length > 0 ? "succeeded" : "structural_recorded";

    const result: InvocationResult = {
      invocationId,
      kind: "workflow",
      status,
      timestamp,
      handlerInvoked: false,
      fabricated: false,
      evidence: [`workflow:${descriptor.workflowId}`, ...stepResults],
      notes: [
        `Workflow ${descriptor.workflowId} orchestrated with ${descriptor.steps.length} steps`,
        "Workflow orchestration records step outcomes — never replaces worker/tool implementations",
      ],
      metadataVersion: POR_METADATA_VERSION,
      structuralSignalOnly: true,
    };

    store.saveInvocation({
      invocationId,
      kind: "workflow",
      sessionId,
      requestId,
      timestamp,
      descriptor: { ...descriptor },
      metadataVersion: POR_METADATA_VERSION,
      structuralSignalOnly: true,
      neverFabricateExecutionResults: true,
    });
    store.saveResult(result);
    appendPorLog({ event: "orchestrate_workflow", details: `${descriptor.workflowId}:${status}` });
    return result;
  }
}
