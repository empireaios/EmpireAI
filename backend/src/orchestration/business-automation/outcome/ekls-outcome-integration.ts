/**
 * G5-08 — Canonical EKLS Outcome Integration (Pillow-governed — no business logic).
 */

import { randomUUID } from "node:crypto";
import type { AutomationRun, WorkflowLifecycleState } from "../contracts/orchestrator-types.js";
import type {
  AutomationLearningRecord,
  AutomationOutcomeKind,
  AutomationLearningSearchResult,
} from "../contracts/ekls-outcome-types.js";
import { listApprovalAuditEvents } from "../audit/approval-audit-recorder.js";
import { listOrchestratorAuditEvents } from "../audit/orchestrator-audit-recorder.js";
import { listRecoveryAuditEvents } from "../audit/recovery-audit-recorder.js";
import { listTriggerAuditEvents } from "../audit/trigger-audit-recorder.js";
import {
  validateEklsOutcomeGovernance,
  validateLearningRecordQuality,
} from "../governance/ekls-outcome-pillow-governance.js";
import { getAutomationOutcomeStore } from "./automation-outcome-store.js";
import { resolveOutcomePolicy } from "./outcome-policy-resolver.js";
import { outcomePluginRegistry } from "./outcome-plugin-registry.js";
import { recordAutomationOperationsEklsObservation } from "../../grand-king-business-automation-operations/ekls/automation-operations-ekls-integration.js";

function nowIso(): string {
  return new Date().toISOString();
}

function mapLifecycleToOutcome(lifecycle: WorkflowLifecycleState): AutomationOutcomeKind {
  if (lifecycle === "workflow_completed") return "completed";
  if (lifecycle === "workflow_recovered") return "recovered";
  if (lifecycle === "workflow_cancelled") return "cancelled";
  return "failed";
}

function parseEngineModule(executorRef: string): string | undefined {
  const colonIndex = executorRef.indexOf(":");
  if (colonIndex <= 0) return executorRef || undefined;
  return executorRef.slice(0, colonIndex);
}

function buildExecutionTimeline(run: AutomationRun): AutomationLearningRecord["executionTimeline"] {
  const orchestratorEvents = listOrchestratorAuditEvents(run.executionContext.workspaceId).filter(
    (event) => event.executionId === run.executionId,
  );

  const timeline: AutomationLearningRecord["executionTimeline"] = [
    { phase: "trigger", label: run.executionContext.triggerId, timestamp: run.createdAt },
  ];

  for (const event of orchestratorEvents) {
    timeline.push({
      phase: event.eventType,
      label: event.lifecycleState,
      timestamp: event.recordedAt,
      detail: event.reason,
    });
  }

  return timeline;
}

function buildSupportingEvidence(run: AutomationRun): Record<string, unknown> {
  const workspaceId = run.executionContext.workspaceId;
  const executionId = run.executionId;

  const triggerEvents = listTriggerAuditEvents(workspaceId).filter(
    (event) => event.correlationId === run.executionContext.correlationId,
  );
  const approvalEvents = listApprovalAuditEvents(workspaceId).filter(
    (event) => event.correlationId === run.executionContext.correlationId,
  );
  const recoveryEvents = listRecoveryAuditEvents(workspaceId).filter(
    (event) => event.executionId === executionId,
  );
  const orchestratorEvents = listOrchestratorAuditEvents(workspaceId).filter(
    (event) => event.executionId === executionId,
  );

  const evidence: Record<string, unknown> = {
    workflowOutcome: run.lifecycleState,
    completedStepIds: run.completedStepIds,
    registryReferences: run.executionContext.registryReferences,
    triggerEvidence: triggerEvents.map((event) => ({
      eventType: event.eventType,
      reason: event.reason,
      recordedAt: event.recordedAt,
    })),
    approvalEvidence: approvalEvents.map((event) => ({
      eventType: event.eventType,
      approvalState: event.approvalState,
      reason: event.reason,
    })),
    recoveryEvidence: recoveryEvents.map((event) => ({
      eventType: event.eventType,
      reason: event.reason,
      evidence: event.evidence,
    })),
    executionEvidence: orchestratorEvents.map((event) => ({
      eventType: event.eventType,
      lifecycleState: event.lifecycleState,
      reason: event.reason,
    })),
  };

  return outcomePluginRegistry.applyEvidenceEnrichers(run, evidence);
}

function deriveExecutiveAiRefs(
  businessEngines: AutomationLearningRecord["businessEngines"],
): string[] {
  const modules = new Set<string>();
  for (const engine of businessEngines) {
    if (engine.module) modules.add(engine.module);
  }
  return [...modules];
}

export class EklsOutcomeIntegration {
  private readonly store = getAutomationOutcomeStore();

  captureTerminalOutcome(input: {
    run: AutomationRun;
    actorId: string;
    lifecycleState: WorkflowLifecycleState;
  }): AutomationLearningRecord | { skipped: true; reason: string } {
    const existing = this.store.getByExecutionId(input.run.executionId);
    if (existing) {
      return { skipped: true, reason: "Learning record already captured for execution" };
    }

    const governance = validateEklsOutcomeGovernance({
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.run.executionContext.workspaceId,
      companyId: input.run.executionContext.companyId,
      operation: "store",
    });

    if (!governance.allowed) {
      return { skipped: true, reason: governance.reason };
    }

    const outcome = mapLifecycleToOutcome(input.lifecycleState);
    const policy = resolveOutcomePolicy({
      workflowId: input.run.executionContext.workflowId,
      policyRegistryId: input.run.executionContext.policyRegistryId,
    });

    const businessEngines = input.run.workflow.steps.map((step) => ({
      stepId: step.stepId,
      executorType: step.executorType,
      executorRef: step.executorRef,
      module: parseEngineModule(step.executorRef),
    }));

    const pluginKnowledge = outcomePluginRegistry.applyKnowledgeProviders(input.run, outcome);
    const analysis = outcomePluginRegistry.applyOutcomeAnalysers(input.run, outcome);

    const recoveryEvents = listRecoveryAuditEvents(input.run.executionContext.workspaceId).filter(
      (event) => event.executionId === input.run.executionId,
    );

    const failureSummary =
      analysis.failureSummary ??
      (outcome === "failed"
        ? recoveryEvents.find((event) => event.eventType === "failure_history")?.reason
        : undefined);

    const recoverySummary =
      analysis.recoverySummary ??
      recoveryEvents.find((event) => event.eventType === "rollback_history")?.reason;

    const lessonsLearned = [
      ...pluginKnowledge.lessonsLearned,
      ...analysis.lessonsLearned,
    ];
    if (outcome === "completed") {
      lessonsLearned.push("Workflow completed successfully via registry orchestration");
    }
    if (recoverySummary) {
      lessonsLearned.push(`Recovery applied: ${recoverySummary}`);
    }

    let record: AutomationLearningRecord = {
      learningId: randomUUID(),
      workflowId: input.run.executionContext.workflowId,
      workflowVersion: input.run.executionContext.workflowVersion,
      executionId: input.run.executionId,
      decisionReference: input.run.executionContext.decisionReference,
      approvalReference: input.run.executionContext.approvalReference,
      workspaceId: input.run.executionContext.workspaceId,
      companyId: input.run.executionContext.companyId,
      brandId: input.run.executionContext.brandId,
      businessEngines,
      executionTimeline: buildExecutionTimeline(input.run),
      outcome,
      supportingEvidence: buildSupportingEvidence(input.run),
      performanceMetrics: {
        completedStepCount: input.run.completedStepIds.length,
        totalStepCount: input.run.workflow.steps.length,
        durationMs: Date.parse(input.run.updatedAt) - Date.parse(input.run.createdAt),
      },
      failureSummary,
      recoverySummary,
      lessonsLearned,
      operationalInsights: pluginKnowledge.operationalInsights,
      confidence: pluginKnowledge.confidence,
      timestamp: nowIso(),
      correlationId: input.run.executionContext.correlationId,
      triggerId: input.run.executionContext.triggerId,
      queueId: input.run.queueId,
      lifecycleState: "store",
      reportHookIds: policy.reportHooks,
      executiveAiRefs: deriveExecutiveAiRefs(businessEngines),
      pillowGovernance: true,
      eklsObjectType: "outcome",
      version: 1,
    };

    record = outcomePluginRegistry.applyLearningEnrichers(record);

    const quality = validateLearningRecordQuality(record);
    if (!quality.allowed) {
      return { skipped: true, reason: quality.reason };
    }

    record.lifecycleState = "index";
    this.store.save(record);

    recordAutomationOperationsEklsObservation({
      actorId: input.actorId ?? "system:ekls-outcome",
      workspaceId: record.workspaceId,
      automationOperationId: record.executionId,
      ownerId: "g5-ekls-outcome-integration",
      kind: "automation_operation_learning",
      summary: `EKLS outcome indexed for ${record.workflowId} (${record.outcome})`,
      pillowGovernance: true,
    });

    return record;
  }

  getLearningByExecution(executionId: string): AutomationLearningRecord | undefined {
    return this.store.getByExecutionId(executionId);
  }

  searchLearning(input: {
    workspaceId: string;
    actorId: string;
    workflowId?: string;
    executionId?: string;
  }): AutomationLearningSearchResult {
    const governance = validateEklsOutcomeGovernance({
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      operation: "search",
    });

    if (!governance.allowed) {
      return {
        workspaceId: input.workspaceId,
        totalCount: 0,
        records: [],
        generatedAt: nowIso(),
      };
    }

    let records = this.store.list(input.workspaceId, input.workflowId);
    if (input.executionId) {
      const record = this.store.getByExecutionId(input.executionId);
      records = record ? [record] : [];
    }

    return {
      workspaceId: input.workspaceId,
      totalCount: records.length,
      records,
      generatedAt: nowIso(),
    };
  }

  getRelatedExecutions(executionId: string): AutomationLearningRecord[] {
    const record = this.store.getByExecutionId(executionId);
    if (!record) return [];
    return this.store.findSimilar(record);
  }

  resetForTests(): void {
    this.store.resetForTests();
  }
}

let sharedIntegration: EklsOutcomeIntegration | undefined;

export function getEklsOutcomeIntegration(): EklsOutcomeIntegration {
  if (!sharedIntegration) {
    sharedIntegration = new EklsOutcomeIntegration();
  }
  return sharedIntegration;
}

export function resetEklsOutcomeIntegrationForTests(): void {
  sharedIntegration = undefined;
}
