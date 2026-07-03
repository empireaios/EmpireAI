/**
 * G5-04 — Canonical Workflow Orchestrator (coordination only — no business logic).
 */

import { randomUUID } from "node:crypto";
import type {
  AutomationRun,
  ExecutionContext,
  OrchestratorAdvanceOptions,
  OrchestratorPickupOptions,
  StepExecutionRecord,
  WorkflowLifecycleState,
} from "../contracts/orchestrator-types.js";
import { recordOrchestratorAuditEvent } from "../audit/orchestrator-audit-recorder.js";
import { getExecutionBroker } from "../broker/execution-broker.js";
import {
  validateAdvanceRequest,
  validatePickupRequest,
} from "../governance/orchestrator-pillow-governance.js";
import { getAutomationQueue } from "../queue/automation-queue.js";
import { resolveWorkflowDefinition, validateWorkflowDependencies } from "./dag-resolver.js";
import { orchestratorPluginRegistry } from "./orchestrator-plugin-registry.js";
import { getAutomationRunStore } from "../state/automation-run-store.js";
import { getPillowApprovalRouter } from "../approval/pillow-approval-router.js";
import { getRecoveryEngine } from "../recovery/recovery-engine.js";
import { getEklsOutcomeIntegration } from "../outcome/ekls-outcome-integration.js";
import { evaluateRegistryFilterExpression } from "../triggers/trigger-filter-evaluator.js";

function nowIso(): string {
  return new Date().toISOString();
}

function captureEklsOutcomeLearning(
  run: AutomationRun,
  actorId: string,
  lifecycleState: WorkflowLifecycleState,
): void {
  getEklsOutcomeIntegration().captureTerminalOutcome({ run, actorId, lifecycleState });
}

function initialStepRecords(run: AutomationRun): StepExecutionRecord[] {
  return run.workflow.steps.map((step) => ({
    stepId: step.stepId,
    state: "pending",
    executorType: step.executorType,
    executorRef: step.executorRef,
  }));
}

function updateLifecycle(run: AutomationRun, lifecycleState: WorkflowLifecycleState): void {
  run.lifecycleState = lifecycleState;
  run.executionContext.executionState = lifecycleState;
  run.updatedAt = nowIso();
}

export class WorkflowOrchestrator {
  private readonly queue = getAutomationQueue();
  private readonly runStore = getAutomationRunStore();
  private readonly broker = getExecutionBroker();

  pickupWaiting(options: OrchestratorPickupOptions): AutomationRun {
    const queueEntry = options.queueId
      ? this.queue.getById(options.queueId)
      : this.queue.list({ executionState: "waiting" })[0];

    if (!queueEntry) {
      throw new Error("No waiting automation request available for orchestrator pickup");
    }

    const governance = validatePickupRequest(queueEntry, options);
    if (!governance.eligible) {
      throw new Error(`Orchestrator pickup rejected: ${governance.reason}`);
    }

    const workflow = resolveWorkflowDefinition({
      workflowId: queueEntry.workflowId,
      workflowVersion: queueEntry.workflowVersion,
      policyRegistryId: queueEntry.policyRegistryId,
      recoveryRegistryId: queueEntry.recoveryRegistryId,
    });
    validateWorkflowDependencies(workflow);

    const executionId = randomUUID();
    const executionContext: ExecutionContext = {
      executionId,
      workflowId: queueEntry.workflowId,
      workflowVersion: queueEntry.workflowVersion,
      triggerId: queueEntry.triggerId,
      queueId: queueEntry.queueId,
      workspaceId: queueEntry.workspaceId,
      companyId: queueEntry.companyId,
      brandId: queueEntry.brandId,
      environment: "production",
      decisionReference: queueEntry.decisionReference,
      approvalReference: queueEntry.approvalReference,
      correlationId: queueEntry.correlationId,
      executionState: "workflow_loaded",
      registryReferences: queueEntry.registryReferences,
      policyRegistryId: queueEntry.policyRegistryId ?? workflow.policyRegistryId,
      recoveryRegistryId: queueEntry.recoveryRegistryId ?? workflow.recoveryRegistryId,
      pillowGovernance: true,
    };

    const run: AutomationRun = {
      executionId,
      queueId: queueEntry.queueId,
      lifecycleState: "workflow_loaded",
      executionContext,
      workflow,
      steps: [],
      completedStepIds: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      pillowGovernance: true,
    };

    run.steps = initialStepRecords(run);
    updateLifecycle(run, "workflow_validated");
    updateLifecycle(run, "workflow_ready");
    updateLifecycle(run, "execution_started");

    this.runStore.save(run);
    this.queue.updateState(queueEntry.queueId, "running");

    recordOrchestratorAuditEvent({
      eventType: "workflow_execution",
      workspaceId: run.executionContext.workspaceId,
      actorId: options.actorId,
      executionId: run.executionId,
      queueId: run.queueId,
      workflowId: run.executionContext.workflowId,
      correlationId: run.executionContext.correlationId,
      lifecycleState: run.lifecycleState,
      reason: "Workflow loaded, validated, and execution started from waiting queue entry",
      evidence: {
        workflowVersion: run.executionContext.workflowVersion,
        stepCount: run.workflow.steps.length,
      },
    });

    return run;
  }

  async advanceRun(executionId: string, options: OrchestratorAdvanceOptions): Promise<AutomationRun> {
    const run = this.runStore.getById(executionId);
    if (!run) {
      throw new Error(`Automation run not found: ${executionId}`);
    }

    const governance = validateAdvanceRequest(run, options);
    if (!governance.eligible) {
      throw new Error(`Run advance rejected: ${governance.reason}`);
    }

    const nextStep = this.resolveNextStep(run);
    if (!nextStep) {
      updateLifecycle(run, "workflow_completed");
      this.queue.updateState(run.queueId, "completed");
      this.runStore.save(run);

      recordOrchestratorAuditEvent({
        eventType: "execution_outcome",
        workspaceId: run.executionContext.workspaceId,
        actorId: options.actorId,
        executionId: run.executionId,
        queueId: run.queueId,
        workflowId: run.executionContext.workflowId,
        correlationId: run.executionContext.correlationId,
        lifecycleState: "workflow_completed",
        reason: "All workflow steps completed",
      });

      captureEklsOutcomeLearning(run, options.actorId, "workflow_completed");

      return run;
    }

    if (nextStep.condition) {
      const allowed = evaluateRegistryFilterExpression(nextStep.condition, {
        executionId: run.executionId,
        completedStepCount: run.completedStepIds.length,
      });
      if (!allowed) {
        const record = run.steps.find((step) => step.stepId === nextStep.stepId);
        if (record) record.state = "skipped";
        run.completedStepIds.push(nextStep.stepId);
        this.runStore.save(run);
        return this.advanceRun(executionId, options);
      }
    }

    run.activeStepId = nextStep.stepId;
    updateLifecycle(run, "step_executing");
    const stepRecord = run.steps.find((step) => step.stepId === nextStep.stepId)!;
    stepRecord.state = "executing";
    stepRecord.startedAt = nowIso();
    getRecoveryEngine().capturePreStepSnapshot(run);
    this.runStore.save(run);

    const result = await this.broker.executeStep({
      run,
      step: nextStep,
      actorId: options.actorId,
      payload: orchestratorPluginRegistry.applyEnrichers(
        run,
        nextStep,
        this.broker.buildExecutionPayload(run.executionContext),
      ),
    });

    return this.handleStepResult(run, nextStep, result, options);
  }

  private async handleStepResult(
    run: AutomationRun,
    step: (typeof run.workflow.steps)[number],
    result: Awaited<ReturnType<typeof this.broker.executeStep>>,
    options: OrchestratorAdvanceOptions,
  ): Promise<AutomationRun> {
    const stepRecord = run.steps.find((record) => record.stepId === step.stepId)!;
    stepRecord.brainDispatchId = result.brainDispatchId;
    stepRecord.completedAt = nowIso();
    stepRecord.result = result.result;

    for (const observer of orchestratorPluginRegistry.listObservers()) {
      observer.onStepCompleted?.({ run, step, result });
    }

    if (result.status === "waiting") {
      stepRecord.state = "waiting";
      updateLifecycle(run, "step_waiting");
      this.runStore.save(run);

      if (result.errorClass === "APPROVAL_REQUIRED") {
        await getPillowApprovalRouter().pauseExecutionForApproval({
          executionId: run.executionId,
          actorId: options.actorId,
          approvalRegistryId: run.workflow.approvalRegistryId,
          policyRegistryId: run.executionContext.policyRegistryId,
          workflowId: run.executionContext.workflowId,
          triggerId: run.executionContext.triggerId,
          workspaceId: run.executionContext.workspaceId,
          companyId: run.executionContext.companyId,
          brandId: run.executionContext.brandId,
          correlationId: run.executionContext.correlationId,
          decisionReference: run.executionContext.decisionReference,
        });
      }

      return run;
    }

    if (!result.success) {
      stepRecord.state = "failed";
      stepRecord.errorClass = result.errorClass;
      stepRecord.errorMessage = result.errorMessage;
      run.failedStepId = step.stepId;
      updateLifecycle(run, "step_failed");

      recordOrchestratorAuditEvent({
        eventType: "failure_event",
        workspaceId: run.executionContext.workspaceId,
        actorId: options.actorId,
        executionId: run.executionId,
        queueId: run.queueId,
        workflowId: run.executionContext.workflowId,
        stepId: step.stepId,
        correlationId: run.executionContext.correlationId,
        lifecycleState: "step_failed",
        reason: result.errorMessage ?? "Step execution failed",
        evidence: { errorClass: result.errorClass, brainDispatchId: result.brainDispatchId },
      });

      const recoveryOutcome = await getRecoveryEngine().handleExecutionFailure({
        run,
        failedStepId: step.stepId,
        errorClass: result.errorClass,
        errorMessage: result.errorMessage,
        actorId: options.actorId,
      });

      if (recoveryOutcome.resumed) {
        const refreshed = this.runStore.getById(run.executionId)!;
        return this.advanceRun(refreshed.executionId, options);
      }

      if (recoveryOutcome.recoveryState === "retrying" || recoveryOutcome.recoveryState === "escalated") {
        this.runStore.save(run);
        return run;
      }

      updateLifecycle(run, "workflow_failed");
      this.queue.updateState(run.queueId, "failed");
      this.runStore.save(run);

      recordOrchestratorAuditEvent({
        eventType: "execution_outcome",
        workspaceId: run.executionContext.workspaceId,
        actorId: options.actorId,
        executionId: run.executionId,
        queueId: run.queueId,
        workflowId: run.executionContext.workflowId,
        correlationId: run.executionContext.correlationId,
        lifecycleState: "workflow_failed",
        reason: "Workflow failed after step failure",
      });

      captureEklsOutcomeLearning(run, options.actorId, "workflow_failed");

      return run;
    }

    stepRecord.state = "completed";
    run.completedStepIds.push(step.stepId);
    run.activeStepId = undefined;
    updateLifecycle(run, "step_completed");
    this.runStore.save(run);

    recordOrchestratorAuditEvent({
      eventType: "step_completion",
      workspaceId: run.executionContext.workspaceId,
      actorId: options.actorId,
      executionId: run.executionId,
      queueId: run.queueId,
      workflowId: run.executionContext.workflowId,
      stepId: step.stepId,
      correlationId: run.executionContext.correlationId,
      lifecycleState: "step_completed",
      reason: "Step completed via Brain dispatch",
      evidence: { brainDispatchId: result.brainDispatchId },
    });

    recordOrchestratorAuditEvent({
      eventType: "execution_evidence",
      workspaceId: run.executionContext.workspaceId,
      actorId: options.actorId,
      executionId: run.executionId,
      queueId: run.queueId,
      workflowId: run.executionContext.workflowId,
      stepId: step.stepId,
      correlationId: run.executionContext.correlationId,
      lifecycleState: "step_completed",
      reason: "Execution evidence recorded",
      evidence: { result: result.result, brainDispatchId: result.brainDispatchId },
    });

    const refreshed = this.runStore.getById(run.executionId)!;
    return this.advanceRun(refreshed.executionId, options);
  }

  private resolveNextStep(run: AutomationRun): (typeof run.workflow.steps)[number] | undefined {
    const candidateOrder = [
      ...run.workflow.executionOrder,
      ...run.workflow.steps
        .map((step) => step.stepId)
        .filter((stepId) => !run.workflow.executionOrder.includes(stepId)),
    ];

    for (const stepId of candidateOrder) {
      if (run.completedStepIds.includes(stepId)) continue;
      const step = run.workflow.steps.find((item) => item.stepId === stepId);
      if (!step) continue;
      const depsMet = step.dependsOn.every((dep) => run.completedStepIds.includes(dep));
      if (!depsMet) continue;
      const record = run.steps.find((item) => item.stepId === stepId);
      if (record?.state === "skipped") {
        run.completedStepIds.push(stepId);
        continue;
      }
      if (record?.state === "completed") continue;
      return step;
    }
    return undefined;
  }

  cancelRun(executionId: string, actorId: string): AutomationRun {
    const run = this.runStore.getById(executionId);
    if (!run) throw new Error(`Automation run not found: ${executionId}`);

    updateLifecycle(run, "workflow_cancelled");
    this.queue.updateState(run.queueId, "cancelled");
    this.runStore.save(run);

    recordOrchestratorAuditEvent({
      eventType: "execution_outcome",
      workspaceId: run.executionContext.workspaceId,
      actorId,
      executionId: run.executionId,
      queueId: run.queueId,
      workflowId: run.executionContext.workflowId,
      correlationId: run.executionContext.correlationId,
      lifecycleState: "workflow_cancelled",
      reason: "Workflow cancelled via orchestrator governance",
    });

    captureEklsOutcomeLearning(run, actorId, "workflow_cancelled");

    return run;
  }

  pauseRun(executionId: string, actorId: string): AutomationRun {
    const run = this.runStore.getById(executionId);
    if (!run) throw new Error(`Automation run not found: ${executionId}`);

    updateLifecycle(run, "step_waiting");
    this.queue.updateState(run.queueId, "paused");
    this.runStore.save(run);

    recordOrchestratorAuditEvent({
      eventType: "execution_evidence",
      workspaceId: run.executionContext.workspaceId,
      actorId,
      executionId: run.executionId,
      queueId: run.queueId,
      workflowId: run.executionContext.workflowId,
      correlationId: run.executionContext.correlationId,
      lifecycleState: "step_waiting",
      reason: "Workflow paused — queue state updated",
    });

    return run;
  }

  getRun(executionId: string): AutomationRun | undefined {
    return this.runStore.getById(executionId);
  }

  resetForTests(): void {
    this.runStore.resetForTests();
  }
}

let sharedOrchestrator: WorkflowOrchestrator | undefined;

export function getWorkflowOrchestrator(): WorkflowOrchestrator {
  if (!sharedOrchestrator) {
    sharedOrchestrator = new WorkflowOrchestrator();
  }
  return sharedOrchestrator;
}

export function resetWorkflowOrchestratorForTests(): void {
  sharedOrchestrator = undefined;
}
