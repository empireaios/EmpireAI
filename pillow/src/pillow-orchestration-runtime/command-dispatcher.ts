import type { PillowOrchestrationRuntimeConfiguration } from "./configuration.js";
import type { OrchestrationStore } from "./orchestration-store.js";
import type { PorIntegrationCoordinator } from "./integrations.js";
import type { ApprovalAction, InvocationResult, PorInput } from "./types.js";
import { ApprovalCoordinator } from "./approval-coordinator.js";
import { ReportCoordinator } from "./report-coordinator.js";
import { ToolInvocationManager } from "./tool-invocation-manager.js";
import { WorkerInvocationManager } from "./worker-invocation-manager.js";
import { WorkflowOrchestrator } from "./workflow-orchestrator.js";

export type DispatchOutcome = {
  workerResults: InvocationResult[];
  toolResults: InvocationResult[];
  workflowResults: InvocationResult[];
  approvalActions: ApprovalAction[];
  reportResults: InvocationResult[];
};

export class CommandDispatcher {
  private readonly workerManager = new WorkerInvocationManager();
  private readonly toolManager = new ToolInvocationManager();
  private readonly workflowOrchestrator = new WorkflowOrchestrator();
  private readonly approvalCoordinator = new ApprovalCoordinator();
  private readonly reportCoordinator = new ReportCoordinator();

  dispatch(
    store: OrchestrationStore,
    integrations: PorIntegrationCoordinator,
    sessionId: string,
    requestId: string,
    input: PorInput,
    _config: PillowOrchestrationRuntimeConfiguration,
  ): DispatchOutcome {
    const workerResults: InvocationResult[] = [];
    const toolResults: InvocationResult[] = [];
    const workflowResults: InvocationResult[] = [];
    const approvalActions: ApprovalAction[] = [];
    const reportResults: InvocationResult[] = [];

    for (const worker of input.workers ?? []) {
      workerResults.push(
        this.workerManager.invoke(store, integrations, sessionId, requestId, worker, input),
      );
    }

    for (const tool of input.tools ?? []) {
      toolResults.push(
        this.toolManager.invoke(store, integrations, sessionId, requestId, tool, input),
      );
    }

    for (const workflow of input.workflows ?? []) {
      workflowResults.push(
        this.workflowOrchestrator.orchestrate(store, integrations, sessionId, requestId, workflow, input),
      );
    }

    for (const approval of input.approvalRequests ?? []) {
      approvalActions.push(this.approvalCoordinator.route(store, integrations, approval, input));
    }

    for (const report of input.reportRequests ?? []) {
      reportResults.push(
        this.reportCoordinator.retrieve(store, integrations, sessionId, requestId, report, input),
      );
    }

    return { workerResults, toolResults, workflowResults, approvalActions, reportResults };
  }
}
