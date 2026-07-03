/**
 * G5-02 — Automation Trigger Engine (single entry point for Business Automation).
 */

import { loadExecutiveIntelligenceOrchestratorViewForWorkspace } from "../../../domain/services/executive-intelligence-orchestrator-views.js";
import type { AutomationPolicyRow, AutomationTriggerRow } from "../../../registry/types/automation-registry-types.js";
import {
  REG_AUTOMATION_POLICY,
  REG_AUTOMATION_TRIGGER,
} from "../../../registry/types/registry-ids.js";
import { recordTriggerAuditEvent } from "../audit/trigger-audit-recorder.js";
import type {
  AutomationRequest,
  CockpitTriggerStatusSnapshot,
  TriggerCategory,
  TriggerContext,
  TriggerEvaluation,
  TriggerEvaluationOutcome,
  TriggerIntakeRequest,
} from "../contracts/trigger-types.js";
import type { TriggerEngineContract, TriggerEvaluationContext } from "../contracts/trigger-engine-contract.js";
import { validateAutomationTriggerGovernance } from "../governance/automation-pillow-governance.js";
import { resolveAutomationRegistry } from "../registry/automation-registry-resolver.js";
import { dispatchToWorkflowScheduler, peekSchedulerQueue } from "../scheduler/workflow-scheduler-dispatch.js";
import { routeApprovalRequirement } from "./approval-router.js";
import { getPillowApprovalRouter } from "../approval/pillow-approval-router.js";
import { evaluateExecutiveDecisionGate } from "./decision-gate-evaluator.js";
import { registryTypesForCategory } from "./trigger-category-map.js";
import { triggerPluginRegistry } from "./trigger-plugin-registry.js";

const cockpitStatusByWorkspace = new Map<string, CockpitTriggerStatusSnapshot["entries"]>();

function publishedTriggerRows(category?: TriggerCategory): AutomationTriggerRow[] {
  const rows = resolveAutomationRegistry({}, REG_AUTOMATION_TRIGGER).rows as AutomationTriggerRow[];
  const published = rows.filter((row) => row.status === "VALIDATED" || row.status === "PUBLISHED");
  if (!category) return published;
  const types = registryTypesForCategory(category);
  return published.filter((row) => types.includes(row.triggerType));
}

function resolvePolicyRow(policyRef?: string): AutomationPolicyRow | undefined {
  if (!policyRef) return undefined;
  const rows = resolveAutomationRegistry({}, REG_AUTOMATION_POLICY).rows as AutomationPolicyRow[];
  return rows.find((row) => row.id === policyRef);
}

function buildTriggerContext(input: {
  intake: TriggerIntakeRequest;
  triggerRow: AutomationTriggerRow;
  approvalState: TriggerContext["approvalState"];
  decisionReference?: string;
  decisionSnapshot?: TriggerContext["decisionSnapshot"];
}): TriggerContext {
  return {
    triggerId: input.triggerRow.id,
    source: input.intake.category,
    workspaceId: input.intake.workspaceId,
    companyId: input.intake.companyId,
    brandId: input.intake.brandId,
    environment: input.intake.environment ?? "production",
    decisionReference: input.decisionReference,
    registryReferences: {
      triggerId: input.triggerRow.id,
      triggerVersion: input.triggerRow.version,
      workflowId: input.triggerRow.workflowRef.id,
      workflowVersion: input.triggerRow.workflowRef.version,
      policyId: input.triggerRow.policyRef,
      approvalId: input.triggerRow.approvalRef,
    },
    timestamp: new Date().toISOString(),
    priority: input.intake.priority ?? "normal",
    correlationId: input.intake.correlationId,
    approvalState: input.approvalState,
    decisionSnapshot: input.decisionSnapshot,
  };
}

function pushCockpitEntry(workspaceId: string, entry: CockpitTriggerStatusSnapshot["entries"][number]): void {
  const list = cockpitStatusByWorkspace.get(workspaceId) ?? [];
  list.unshift(entry);
  cockpitStatusByWorkspace.set(workspaceId, list.slice(0, 100));
}

function evaluationFromGate(input: {
  intake: TriggerIntakeRequest;
  triggerRow: AutomationTriggerRow;
  outcome: TriggerEvaluationOutcome;
  reason: string;
  triggerContext?: TriggerContext;
  automationRequest?: AutomationRequest;
  decisionReference?: string;
  approvalRouting?: ReturnType<typeof routeApprovalRequirement>;
  approvalId?: string;
}): TriggerEvaluation {
  pushCockpitEntry(input.intake.workspaceId, {
    triggerId: input.triggerRow.id,
    category: input.intake.category,
    outcome: input.outcome,
    approvalState: input.approvalRouting?.approvalState ?? input.triggerContext?.approvalState ?? "rejected",
    correlationId: input.intake.correlationId,
    timestamp: new Date().toISOString(),
    reason: input.reason,
  });

  return {
    triggerId: input.triggerRow.id,
    category: input.intake.category,
    outcome: input.outcome,
    reason: input.reason,
    triggerContext: input.triggerContext,
    automationRequest: input.automationRequest,
    decisionReference: input.decisionReference,
    approvalRouting: input.approvalRouting,
    approvalId: input.approvalId,
  };
}

export class TriggerEngine implements TriggerEngineContract {
  async evaluateTriggers(context: TriggerEvaluationContext): Promise<TriggerEvaluation[]> {
    const governance = validateAutomationTriggerGovernance(context);
    if (!governance.eligible) {
      return [];
    }

    const triggers = publishedTriggerRows("executive_decision");
    const evaluations: TriggerEvaluation[] = [];

    for (const triggerRow of triggers) {
      const gate = evaluateExecutiveDecisionGate({
        workspaceId: context.workspaceId,
        filterExpression: triggerRow.filterExpression,
      });

      recordTriggerAuditEvent({
        eventType: "decision_reference",
        workspaceId: context.workspaceId,
        actorId: context.actorId,
        triggerId: triggerRow.id,
        category: "executive_decision",
        correlationId: context.correlationId,
        decisionReference: gate.decisionReference,
        reason: gate.reason,
      });

      if (!gate.passed) {
        evaluations.push({
          triggerId: triggerRow.id,
          category: "executive_decision",
          outcome: gate.stopped ? "rejected" : "held",
          reason: gate.reason,
          decisionReference: gate.decisionReference,
        });
        continue;
      }

      const approvalRouting = routeApprovalRequirement({
        approvalRef: triggerRow.approvalRef,
      });

      evaluations.push({
        triggerId: triggerRow.id,
        category: "executive_decision",
        outcome: approvalRouting.required ? "approval_required" : "accepted",
        reason: approvalRouting.reason,
        decisionReference: gate.decisionReference,
        approvalRouting,
      });
    }

    return evaluations;
  }

  async receiveTrigger(intake: TriggerIntakeRequest): Promise<TriggerEvaluation> {
    recordTriggerAuditEvent({
      eventType: "trigger_received",
      workspaceId: intake.workspaceId,
      actorId: intake.actorId,
      triggerId: intake.registryTriggerId ?? "pending-resolution",
      category: intake.category,
      correlationId: intake.correlationId,
      reason: `Trigger received — category ${intake.category}`,
    });

    const governance = validateAutomationTriggerGovernance(intake);
    if (!governance.eligible) {
      recordTriggerAuditEvent({
        eventType: "trigger_rejected",
        workspaceId: intake.workspaceId,
        actorId: intake.actorId,
        triggerId: intake.registryTriggerId ?? "governance-rejected",
        category: intake.category,
        correlationId: intake.correlationId,
        reason: governance.reason,
      });
      return {
        triggerId: intake.registryTriggerId ?? "governance-rejected",
        category: intake.category,
        outcome: "rejected",
        reason: governance.reason,
      };
    }

    const pluginTriggerIds = triggerPluginRegistry.resolveProviderTriggerIds(intake);
    const allPublished = publishedTriggerRows();
    const candidateRows = publishedTriggerRows(intake.category);
    const triggerRow =
      (intake.registryTriggerId
        ? allPublished.find((row) => row.id === intake.registryTriggerId)
        : candidateRows[0]) ??
      (pluginTriggerIds.length
        ? allPublished.find((row) => pluginTriggerIds.includes(row.id))
        : undefined);

    if (!triggerRow) {
      const reason = `No registry trigger resolved for category ${intake.category}`;
      recordTriggerAuditEvent({
        eventType: "trigger_rejected",
        workspaceId: intake.workspaceId,
        actorId: intake.actorId,
        triggerId: "unresolved",
        category: intake.category,
        correlationId: intake.correlationId,
        reason,
      });
      return {
        triggerId: "unresolved",
        category: intake.category,
        outcome: "rejected",
        reason,
      };
    }

    resolvePolicyRow(triggerRow.policyRef);

    const preliminaryContext = buildTriggerContext({
      intake,
      triggerRow,
      approvalState: "not_required",
    });
    const earlyPluginValidation = triggerPluginRegistry.runValidators(intake, preliminaryContext);
    if (!earlyPluginValidation.valid) {
      recordTriggerAuditEvent({
        eventType: "trigger_rejected",
        workspaceId: intake.workspaceId,
        actorId: intake.actorId,
        triggerId: triggerRow.id,
        category: intake.category,
        correlationId: intake.correlationId,
        reason: earlyPluginValidation.reason,
      });
      return evaluationFromGate({
        intake,
        triggerRow,
        outcome: "rejected",
        reason: earlyPluginValidation.reason,
        triggerContext: preliminaryContext,
      });
    }

    let decisionReference: string | undefined;
    let decisionSnapshot: TriggerContext["decisionSnapshot"];

    if (triggerRow.triggerType === "decision" || intake.category === "executive_decision") {
      const gate = evaluateExecutiveDecisionGate({
        workspaceId: intake.workspaceId,
        filterExpression: triggerRow.filterExpression,
      });
      decisionReference = gate.decisionReference;
      const orchestratorView = loadExecutiveIntelligenceOrchestratorViewForWorkspace(intake.workspaceId);
      const snap = orchestratorView.unifiedService.decisionSnapshot;
      decisionSnapshot = {
        finalRecommendation: snap.finalRecommendation,
        decisionConfidence: snap.decisionConfidence,
        executiveRecommendation: snap.executiveRecommendation,
      };

      recordTriggerAuditEvent({
        eventType: "decision_reference",
        workspaceId: intake.workspaceId,
        actorId: intake.actorId,
        triggerId: triggerRow.id,
        category: intake.category,
        correlationId: intake.correlationId,
        decisionReference,
        reason: gate.reason,
      });

      if (!gate.passed) {
        recordTriggerAuditEvent({
          eventType: "trigger_rejected",
          workspaceId: intake.workspaceId,
          actorId: intake.actorId,
          triggerId: triggerRow.id,
          category: intake.category,
          correlationId: intake.correlationId,
          decisionReference,
          reason: gate.reason,
        });
        return evaluationFromGate({
          intake,
          triggerRow,
          outcome: gate.stopped ? "rejected" : "held",
          reason: gate.reason,
          decisionReference,
        });
      }
    }

    const approvalRouting = routeApprovalRequirement({
      approvalRef: triggerRow.approvalRef,
      payload: intake.payload,
    });

    if (approvalRouting.approvalState === "rejected") {
      recordTriggerAuditEvent({
        eventType: "trigger_rejected",
        workspaceId: intake.workspaceId,
        actorId: intake.actorId,
        triggerId: triggerRow.id,
        category: intake.category,
        correlationId: intake.correlationId,
        approvalState: approvalRouting.approvalState,
        reason: approvalRouting.reason,
      });
      return evaluationFromGate({
        intake,
        triggerRow,
        outcome: "rejected",
        reason: approvalRouting.reason,
        approvalRouting,
      });
    }

    let triggerContext = buildTriggerContext({
      intake,
      triggerRow,
      approvalState: approvalRouting.approvalState,
      decisionReference,
      decisionSnapshot,
    });

    triggerContext = triggerPluginRegistry.applyEnrichers(triggerContext, intake);

    if (approvalRouting.required) {
      const approvalRequest = await getPillowApprovalRouter().submitFromTriggerContext({
        actorId: intake.actorId,
        pillowGovernance: true,
        approvalRegistryId: triggerRow.approvalRef,
        policyRegistryId: triggerRow.policyRef,
        workflowId: triggerRow.workflowRef.id,
        workflowVersion: triggerRow.workflowRef.version,
        triggerId: triggerRow.id,
        workspaceId: intake.workspaceId,
        companyId: intake.companyId,
        brandId: intake.brandId,
        correlationId: intake.correlationId,
        decisionReference,
        payload: intake.payload,
        triggerContext,
        approvalRouting,
        supportingEvidence: {
          workflowRef: triggerRow.workflowRef,
          category: intake.category,
        },
      });

      recordTriggerAuditEvent({
        eventType: "approval_required",
        workspaceId: intake.workspaceId,
        actorId: intake.actorId,
        triggerId: triggerRow.id,
        category: intake.category,
        correlationId: intake.correlationId,
        approvalState: approvalRouting.approvalState,
        reason: approvalRouting.reason,
      });
      return evaluationFromGate({
        intake,
        triggerRow,
        outcome: "approval_required",
        reason: approvalRouting.reason,
        triggerContext,
        approvalRouting,
        decisionReference,
        approvalId: approvalRequest.approvalId,
      });
    }

    const automationRequest = dispatchToWorkflowScheduler(
      {
        triggerContext,
        workflowRef: triggerRow.workflowRef,
        registryRefs: triggerContext.registryReferences,
        approvalRouting,
        correlationId: intake.correlationId,
      },
      {
        actorId: intake.actorId,
        killSwitchActive: intake.killSwitchActive,
      },
    );

    recordTriggerAuditEvent({
      eventType: "trigger_accepted",
      workspaceId: intake.workspaceId,
      actorId: intake.actorId,
      triggerId: triggerRow.id,
      category: intake.category,
      correlationId: intake.correlationId,
      decisionReference,
      approvalState: approvalRouting.approvalState,
      reason: "Trigger accepted — dispatched to workflow scheduler queue",
    });

    return evaluationFromGate({
      intake,
      triggerRow,
      outcome: "accepted",
      reason: "Trigger accepted — automation request queued for G5-03 scheduler",
      triggerContext,
      automationRequest,
      decisionReference,
      approvalRouting,
    });
  }

  getCockpitTriggerStatus(workspaceId: string): CockpitTriggerStatusSnapshot {
    return {
      workspaceId,
      entries: cockpitStatusByWorkspace.get(workspaceId) ?? [],
      queuedRequestCount: peekSchedulerQueue(workspaceId).length,
      generatedAt: new Date().toISOString(),
    };
  }
}

let sharedEngine: TriggerEngine | undefined;

export function getTriggerEngine(): TriggerEngine {
  if (!sharedEngine) {
    sharedEngine = new TriggerEngine();
  }
  return sharedEngine;
}

export function resetTriggerEngineForTests(): void {
  sharedEngine = undefined;
  cockpitStatusByWorkspace.clear();
}

export function resetCockpitTriggerStatusForTests(): void {
  cockpitStatusByWorkspace.clear();
}
