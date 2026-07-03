/**
 * G5-04 — Execution Broker (Brain dispatch only — no business logic).
 */

import { randomUUID } from "node:crypto";
import type { OrchestratorDispatchRequest } from "../../../brain/types.js";
import type {
  AutomationRun,
  ExecutionContext,
  ResolvedWorkflowStep,
  StepResult,
} from "../contracts/orchestrator-types.js";
import { dispatchThroughBrain } from "./brain-dispatch-adapter.js";
import { resolveExecutorBinding } from "./executor-resolver.js";
import { orchestratorPluginRegistry } from "../orchestrator/orchestrator-plugin-registry.js";

export type ExecuteStepInput = {
  run: AutomationRun;
  step: ResolvedWorkflowStep;
  actorId: string;
  payload?: Record<string, unknown>;
};

export class ExecutionBroker {
  async executeStep(input: ExecuteStepInput): Promise<StepResult> {
    const { run, step, actorId, payload = {} } = input;
    const binding = resolveExecutorBinding(step);

    for (const validator of orchestratorPluginRegistry.listValidators()) {
      const verdict = validator.validate({ run, step, binding, actorId });
      if (!verdict.valid) {
        return {
          stepId: step.stepId,
          success: false,
          brainDispatchId: randomUUID(),
          status: "failed",
          errorClass: "VALIDATION_BLOCK",
          errorMessage: verdict.reason,
        };
      }
    }

    const brainDispatchId = `${run.executionContext.correlationId}:${step.stepId}:${randomUUID()}`;
    const dispatchRequest: OrchestratorDispatchRequest = {
      module: binding.module,
      action: binding.action,
      workspaceId: run.executionContext.workspaceId,
      companyId: run.executionContext.companyId,
      correlationId: brainDispatchId,
      payload: {
        ...payload,
        executionId: run.executionId,
        queueId: run.queueId,
        workflowId: run.executionContext.workflowId,
        workflowVersion: run.executionContext.workflowVersion,
        triggerId: run.executionContext.triggerId,
        stepId: step.stepId,
        executorType: step.executorType,
        executorRef: step.executorRef,
        executorRegistryId: binding.executorRegistryId,
        actorId,
        automationRun: true,
        pillowGovernance: true,
      },
    };

    const adapter = orchestratorPluginRegistry.resolveAdapter(step.executorType);
    if (adapter?.transformDispatch) {
      Object.assign(dispatchRequest, adapter.transformDispatch(dispatchRequest, run, step));
    }

    try {
      const dispatchResult = await dispatchThroughBrain(dispatchRequest);

      for (const observer of orchestratorPluginRegistry.listObservers()) {
        observer.onStepDispatched?.({ run, step, binding, dispatchRequest, dispatchResult });
      }

      if (dispatchResult.status === "requires_approval") {
        return {
          stepId: step.stepId,
          success: false,
          brainDispatchId: dispatchResult.correlationId,
          status: "waiting",
          result: dispatchResult.result,
          errorClass: "APPROVAL_REQUIRED",
          errorMessage: "Brain dispatch requires approval",
        };
      }

      if (dispatchResult.status === "queued") {
        return {
          stepId: step.stepId,
          success: true,
          brainDispatchId: dispatchResult.correlationId,
          status: "waiting",
          result: dispatchResult,
        };
      }

      return {
        stepId: step.stepId,
        success: true,
        brainDispatchId: dispatchResult.correlationId,
        status: "completed",
        result: dispatchResult.result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        stepId: step.stepId,
        success: false,
        brainDispatchId,
        status: "failed",
        errorClass: message.includes("Guardian") ? "GUARDIAN_BLOCK" : "BRAIN_DISPATCH_ERROR",
        errorMessage: message,
      };
    }
  }

  buildExecutionPayload(context: ExecutionContext): Record<string, unknown> {
    return {
      executionId: context.executionId,
      queueId: context.queueId,
      workflowId: context.workflowId,
      triggerId: context.triggerId,
      correlationId: context.correlationId,
      decisionReference: context.decisionReference,
      approvalReference: context.approvalReference,
      registryReferences: context.registryReferences,
      pillowGovernance: true,
    };
  }
}

let sharedBroker: ExecutionBroker | undefined;

export function getExecutionBroker(): ExecutionBroker {
  if (!sharedBroker) {
    sharedBroker = new ExecutionBroker();
  }
  return sharedBroker;
}

export function resetExecutionBrokerForTests(): void {
  sharedBroker = undefined;
}
