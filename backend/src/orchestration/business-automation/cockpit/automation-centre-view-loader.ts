/**
 * G5-07 — Cockpit Automation Centre view loader (Brain aggregation — no business logic).
 */

import type { AutomationRun } from "../contracts/orchestrator-types.js";
import type { QueuedAutomationRequest } from "../contracts/scheduler-types.js";
import { listRecoveryAuditEvents } from "../audit/recovery-audit-recorder.js";
import { getAutomationRecoveryStatus } from "../services/recovery-service.js";
import { getCockpitAutomationRecoveryStatus } from "../services/recovery-service.js";
import { getEklsOutcomeIntegration } from "../outcome/ekls-outcome-integration.js";
import { getAutomationPluginHost } from "../plugins/automation-plugin-host.js";
import { getCockpitAutomationApprovalStatus } from "../services/approval-router-service.js";
import { getAutomationRunSnapshot, getAutomationRunStatus } from "../services/orchestrator-service.js";
import { getAutomationQueueSnapshot } from "../services/scheduler-service.js";
import { getAutomationTriggerStatus } from "../services/trigger-engine-service.js";
import { automationCentrePluginRegistry } from "./automation-centre-plugin-registry.js";
import {
  resolveAutomationCentreNotifications,
  resolveAutomationCentreRegistryHealth,
} from "./automation-centre-registry-resolver.js";
import type {
  AutomationAttentionItem,
  AutomationCentreHealth,
  AutomationCentreKpi,
  AutomationCentreOverview,
  AutomationCentreView,
  AutomationDetailView,
  AutomationTimelineView,
  AutomationWorkflowStatusRow,
  WorkflowTimelineEvent,
  WorkflowTimelinePhase,
} from "./contracts/automation-centre-types.js";

const TIMELINE_PHASES: WorkflowTimelinePhase[] = [
  "trigger",
  "validation",
  "approval",
  "scheduling",
  "queue",
  "execution",
  "completion",
  "recovery",
  "rollback",
  "final_outcome",
];

function nowIso(): string {
  return new Date().toISOString();
}

function mapQueueRow(entry: QueuedAutomationRequest): AutomationWorkflowStatusRow {
  return {
    automationId: entry.queueId,
    queueId: entry.queueId,
    workflowId: entry.workflowId,
    triggerId: entry.triggerId,
    currentState: entry.executionState,
    queueState: entry.executionState,
    correlationId: entry.correlationId,
    updatedAt: entry.scheduledTime,
  };
}

function mapRunRow(run: AutomationRun): AutomationWorkflowStatusRow {
  return {
    automationId: run.executionId,
    executionId: run.executionId,
    queueId: run.queueId,
    workflowId: run.executionContext.workflowId,
    triggerId: run.executionContext.triggerId,
    currentState: run.lifecycleState,
    correlationId: run.executionContext.correlationId,
    updatedAt: run.updatedAt,
  };
}

function resolveOverview(
  queueSnapshot: ReturnType<typeof getAutomationQueueSnapshot>,
  recoverySnapshot: ReturnType<typeof getCockpitAutomationRecoveryStatus>,
  approvalSnapshot: ReturnType<typeof getCockpitAutomationApprovalStatus>,
  runSnapshot: ReturnType<typeof getAutomationRunSnapshot>,
): AutomationCentreOverview {
  const byState = queueSnapshot.byState;
  const runningRuns = runSnapshot.runs.filter((run) =>
    ["execution_started", "step_executing", "step_waiting", "step_completed"].includes(
      run.lifecycleState,
    ),
  ).length;

  return {
    health: resolveHealth(queueSnapshot, recoverySnapshot, approvalSnapshot),
    runningCount: runningRuns + (byState.running ?? 0),
    queuedCount: (byState.queued ?? 0) + (byState.waiting ?? 0),
    scheduledCount: byState.scheduled ?? 0,
    completedCount: (byState.completed ?? 0) + runSnapshot.runs.filter((r) => r.lifecycleState === "workflow_completed").length,
    failedCount: (byState.failed ?? 0) + runSnapshot.runs.filter((r) => r.lifecycleState === "workflow_failed").length,
    recoveringCount: recoverySnapshot.activeRecoveries,
    approvalPendingCount: approvalSnapshot.pendingCount + approvalSnapshot.awaitingReviewCount,
  };
}

function resolveHealth(
  queueSnapshot: ReturnType<typeof getAutomationQueueSnapshot>,
  recoverySnapshot: ReturnType<typeof getCockpitAutomationRecoveryStatus>,
  approvalSnapshot: ReturnType<typeof getCockpitAutomationApprovalStatus>,
): AutomationCentreHealth {
  if ((queueSnapshot.byState.failed ?? 0) > 0 || recoverySnapshot.failedCount > 0) return "FAILED";
  if (recoverySnapshot.escalatedCount > 0 || recoverySnapshot.activeRecoveries > 0) return "WARNING";
  if (approvalSnapshot.awaitingReviewCount > 0) return "WARNING";
  if (queueSnapshot.totalCount > 0) return "HEALTHY";
  return "UNKNOWN";
}

function buildKpis(overview: AutomationCentreOverview): AutomationCentreKpi[] {
  return [
    { id: "running", label: "Running", value: String(overview.runningCount), trend: "neutral", status: "active" },
    { id: "queued", label: "Queued", value: String(overview.queuedCount), trend: "neutral", status: "pending" },
    { id: "scheduled", label: "Scheduled", value: String(overview.scheduledCount), trend: "neutral", status: "scheduled" },
    { id: "failed", label: "Failed", value: String(overview.failedCount), trend: overview.failedCount > 0 ? "down" : "neutral", status: overview.failedCount > 0 ? "critical" : "ok" },
    { id: "approvals", label: "Approvals", value: String(overview.approvalPendingCount), trend: "neutral", status: overview.approvalPendingCount > 0 ? "attention" : "ok" },
    { id: "recovery", label: "Recovering", value: String(overview.recoveringCount), trend: "neutral", status: overview.recoveringCount > 0 ? "attention" : "ok" },
  ];
}

function buildEklsLearningView(input: {
  executionId?: string;
  correlationId: string;
  workspaceId: string;
  workflowId?: string;
  runSnapshotExecutionIds?: string[];
}) {
  const learning = input.executionId
    ? getEklsOutcomeIntegration().getLearningByExecution(input.executionId)
    : undefined;
  const related = input.executionId
    ? getEklsOutcomeIntegration().getRelatedExecutions(input.executionId)
    : [];

  return {
    lessonsLearnedHref: input.executionId
      ? `/cockpit/governance?topic=automation&executionId=${input.executionId}`
      : `/cockpit/governance?topic=automation&correlationId=${input.correlationId}`,
    historicalOutcomes: learning
      ? [{ label: learning.outcome, timestamp: learning.timestamp }]
      : [],
    similarAutomations: related.map((record) => record.executionId),
    decisionHistory: learning?.lessonsLearned.map((lesson) => ({
      label: lesson,
      timestamp: learning.timestamp,
    })) ?? [],
    learningId: learning?.learningId,
    lessonsLearned: learning?.lessonsLearned ?? [],
    outcomeSummary: learning?.failureSummary ?? learning?.recoverySummary,
  };
}

function buildAttentionItems(
  overview: AutomationCentreOverview,
  recoverySnapshot: ReturnType<typeof getCockpitAutomationRecoveryStatus>,
  approvalSnapshot: ReturnType<typeof getCockpitAutomationApprovalStatus>,
): AutomationAttentionItem[] {
  const items: AutomationAttentionItem[] = [];

  if (overview.failedCount > 0) {
    items.push({
      id: "failed-workflows",
      label: `${overview.failedCount} failed workflow(s) require review`,
      severity: "critical",
      href: null,
    });
  }

  if (overview.approvalPendingCount > 0) {
    items.push({
      id: "approval-queue",
      label: `${overview.approvalPendingCount} automation approval(s) awaiting executive decision`,
      severity: "warning",
      href: null,
    });
  }

  for (const record of recoverySnapshot.records.filter((r) => r.recoveryState === "escalated").slice(0, 3)) {
    items.push({
      id: `escalated-${record.recoveryId}`,
      label: `Escalated recovery: ${record.failureCause}`,
      severity: "critical",
      href: null,
      automationId: record.executionId,
    });
  }

  for (const card of approvalSnapshot.cards.slice(0, 3)) {
    items.push({
      id: `approval-${card.approvalId}`,
      label: `Approval required: ${card.summary}`,
      severity: "warning",
      href: null,
      automationId: card.approvalId,
    });
  }

  return items;
}

function buildActivity(
  workspaceId: string,
  triggerSnapshot: ReturnType<typeof getAutomationTriggerStatus>,
  recoverySnapshot: ReturnType<typeof getCockpitAutomationRecoveryStatus>,
): AutomationCentreView["recentActivity"] {
  const events: AutomationCentreView["recentActivity"] = [];

  for (const entry of triggerSnapshot.entries.slice(0, 8)) {
    events.push({
      eventId: `trigger-${entry.correlationId}`,
      kind: "trigger",
      title: entry.triggerId,
      summary: entry.reason,
      timestamp: entry.timestamp,
      correlationId: entry.correlationId,
    });
  }

  for (const record of recoverySnapshot.records.slice(0, 5)) {
    events.push({
      eventId: `recovery-${record.recoveryId}`,
      kind: "recovery",
      title: record.recoveryState,
      summary: record.failureCause,
      timestamp: record.updatedAt,
      automationId: record.executionId,
      correlationId: record.correlationId,
    });
  }

  const auditEvents = listRecoveryAuditEvents(workspaceId).slice(-5);
  for (const audit of auditEvents) {
    events.push({
      eventId: audit.eventId,
      kind: audit.eventType,
      title: audit.recoveryState,
      summary: audit.reason,
      timestamp: audit.recordedAt,
      automationId: audit.executionId,
      correlationId: audit.correlationId,
    });
  }

  return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 12);
}

export function loadAutomationCentreView(workspaceId: string): AutomationCentreView {
  const queueSnapshot = getAutomationQueueSnapshot(workspaceId);
  const runSnapshot = getAutomationRunSnapshot(workspaceId);
  const triggerSnapshot = getAutomationTriggerStatus(workspaceId);
  const approvalSnapshot = getCockpitAutomationApprovalStatus(workspaceId);
  const recoverySnapshot = getCockpitAutomationRecoveryStatus(workspaceId);

  const overview = resolveOverview(queueSnapshot, recoverySnapshot, approvalSnapshot, runSnapshot);
  const entries = queueSnapshot.entries;

  return {
    computedAt: nowIso(),
    workspaceId,
    screenId: "SCR-303",
    dataMode: "sandbox",
    overview,
    kpis: buildKpis(overview),
    attentionItems: buildAttentionItems(overview, recoverySnapshot, approvalSnapshot),
    runningWorkflows: [
      ...entries.filter((e) => e.executionState === "running").map(mapQueueRow),
      ...runSnapshot.runs
        .filter((run) => !["workflow_completed", "workflow_failed", "workflow_cancelled"].includes(run.lifecycleState))
        .map(mapRunRow),
    ].slice(0, 20),
    queuedWorkflows: entries
      .filter((e) => e.executionState === "queued" || e.executionState === "waiting")
      .map(mapQueueRow)
      .slice(0, 20),
    scheduledWorkflows: entries.filter((e) => e.executionState === "scheduled").map(mapQueueRow).slice(0, 20),
    completedWorkflows: [
      ...entries.filter((e) => e.executionState === "completed").map(mapQueueRow),
      ...runSnapshot.runs.filter((r) => r.lifecycleState === "workflow_completed").map(mapRunRow),
    ].slice(0, 20),
    failedWorkflows: [
      ...entries.filter((e) => e.executionState === "failed").map(mapQueueRow),
      ...runSnapshot.runs.filter((r) => r.lifecycleState === "workflow_failed").map(mapRunRow),
    ].slice(0, 20),
    approvalQueue: approvalSnapshot.cards.map((card) => ({
      approvalId: card.approvalId,
      workflowId: card.workflowId,
      triggerId: card.triggerId,
      approvalTier: card.approvalTier,
      approvalState: card.approvalState,
      summary: card.summary,
      requestedAt: card.requestedAt,
      expiryAt: card.expiryAt,
      correlationId: card.correlationId,
    })),
    recoveryOperations: recoverySnapshot.records.map((record) => ({
      recoveryId: record.recoveryId,
      executionId: record.executionId,
      recoveryState: record.recoveryState,
      failureCategory: record.failureCategory,
      failureCause: record.failureCause,
    })),
    schedulerSummary: {
      dueCount: entries.filter((e) => e.executionState === "scheduled").length,
      retryingCount: queueSnapshot.byState.retrying ?? 0,
      recoveredCount: queueSnapshot.byState.recovered ?? 0,
    },
    registryHealth: resolveAutomationCentreRegistryHealth(),
    recentActivity: buildActivity(workspaceId, triggerSnapshot, recoverySnapshot),
    notifications: resolveAutomationCentreNotifications(),
    relationshipLinks: [
      { label: "Executive Home", href: "/cockpit", module: "executive-home" },
      { label: "Relationship Graph", href: "/cockpit/relationship", module: "executive-relationship-graph" },
      { label: "Executive Intelligence", href: "/cockpit/intelligence/executive", module: "executive-intelligence-orchestrator" },
      { label: "Global AI Assistant", href: "/cockpit", module: "cockpit-global-assistant" },
    ],
    pluginWidgets: automationCentrePluginRegistry.listWidgetSummaries(workspaceId),
    installedPlugins: getAutomationPluginHost().listPluginSummaries(workspaceId),
  };
}

function buildTimelineForRun(run: AutomationRun, recovery?: ReturnType<typeof getAutomationRecoveryStatus>): WorkflowTimelineEvent[] {
  const events: WorkflowTimelineEvent[] = [
    { phase: "trigger", label: "Trigger received", state: "completed", detail: run.executionContext.triggerId },
    { phase: "validation", label: "Workflow validated", state: "completed" },
    {
      phase: "approval",
      label: "Approval gate",
      state: run.lifecycleState.includes("waiting") ? "active" : "completed",
    },
    { phase: "scheduling", label: "Scheduler handoff", state: "completed" },
    { phase: "queue", label: "Queue pickup", state: "completed", detail: run.queueId },
    {
      phase: "execution",
      label: "Step execution",
      state: run.lifecycleState === "workflow_failed" ? "failed" : run.lifecycleState === "workflow_completed" ? "completed" : "active",
      detail: run.activeStepId,
    },
  ];

  if (recovery?.found) {
    events.push({
      phase: "recovery",
      label: "Recovery evaluation",
      state: recovery.recoveryState === "recovered" ? "completed" : "active",
      detail: recovery.recoveryState,
    });
    if (recovery.rollbackId) {
      events.push({
        phase: "rollback",
        label: "Rollback applied",
        state: "completed",
        detail: recovery.rollbackId,
      });
    }
  } else {
    events.push({ phase: "recovery", label: "Recovery", state: "skipped" });
    events.push({ phase: "rollback", label: "Rollback", state: "skipped" });
  }

  events.push({
    phase: "completion",
    label: "Workflow completion",
    state: run.lifecycleState === "workflow_completed" ? "completed" : "pending",
  });

  events.push({
    phase: "final_outcome",
    label: run.lifecycleState,
    state: run.lifecycleState === "workflow_failed" ? "failed" : run.lifecycleState === "workflow_completed" ? "completed" : "pending",
    timestamp: run.updatedAt,
  });

  return events;
}

function buildAvailableActions(
  run?: AutomationRun,
  approvalState?: string,
): AutomationDetailView["availableActions"] {
  const actions: AutomationDetailView["availableActions"] = [];

  if (approvalState === "awaiting_review" || approvalState === "pending") {
    actions.push(
      { action: "approve", label: "Approve", pillowGoverned: true, enabled: true },
      { action: "reject", label: "Reject", pillowGoverned: true, enabled: true },
    );
  }

  if (run && !["workflow_completed", "workflow_failed", "workflow_cancelled"].includes(run.lifecycleState)) {
    actions.push(
      { action: "pause", label: "Pause", pillowGoverned: true, enabled: true },
      { action: "cancel", label: "Cancel", pillowGoverned: true, enabled: true },
    );
  }

  if (run?.lifecycleState === "workflow_failed" || run?.failedStepId) {
    actions.push(
      { action: "retry", label: "Retry", pillowGoverned: true, enabled: true },
      { action: "rollback", label: "Rollback", pillowGoverned: true, enabled: true },
    );
  }

  return actions;
}

export function loadAutomationDetailView(
  workspaceId: string,
  automationId: string,
): AutomationDetailView | null {
  const runStatus = getAutomationRunStatus(automationId);
  const runSnapshot = getAutomationRunSnapshot(workspaceId);
  const run = runSnapshot.runs.find((item) => item.executionId === automationId);

  if (!run && !runStatus.found) {
    const queueSnapshot = getAutomationQueueSnapshot(workspaceId);
    const queueEntry = queueSnapshot.entries.find((entry) => entry.queueId === automationId);
    if (!queueEntry) return null;

    return {
      computedAt: nowIso(),
      automationId,
      queueId: queueEntry.queueId,
      workflowId: queueEntry.workflowId,
      triggerId: queueEntry.triggerId,
      currentState: queueEntry.executionState,
      approvalStatus: queueEntry.approvalReference ?? "not_required",
      correlationId: queueEntry.correlationId,
      registryReferences: queueEntry.registryReferences as Record<string, unknown>,
      businessEngines: [],
      eklsLearning: buildEklsLearningView({
        correlationId: queueEntry.correlationId,
        workspaceId,
        workflowId: queueEntry.workflowId,
      }),
      timeline: [
        { phase: "trigger", label: "Trigger", state: "completed" },
        { phase: "scheduling", label: "Scheduled", state: "active", detail: queueEntry.scheduleMode },
        { phase: "queue", label: queueEntry.executionState, state: "active" },
        { phase: "final_outcome", label: "Pending execution", state: "pending" },
      ],
      availableActions: buildAvailableActions(undefined),
    };
  }

  if (!run) return null;

  const recovery = getAutomationRecoveryStatus(run.executionId);

  const businessEngines = run.workflow.steps.map((step) => ({
    stepId: step.stepId,
    executorType: step.executorType,
    executorRef: step.executorRef,
  }));

  return {
    computedAt: nowIso(),
    automationId: run.executionId,
    executionId: run.executionId,
    queueId: run.queueId,
    workflowId: run.executionContext.workflowId,
    workflowVersion: run.executionContext.workflowVersion,
    triggerId: run.executionContext.triggerId,
    currentState: run.lifecycleState,
    approvalStatus: run.executionContext.approvalReference ?? "not_required",
    decisionSource: run.executionContext.decisionReference,
    correlationId: run.executionContext.correlationId,
    registryReferences: run.executionContext.registryReferences as Record<string, unknown>,
    businessEngines,
    recoveryStatus: recovery.found
      ? {
          recoveryState: recovery.recoveryState,
          failureCategory: recovery.failureCategory,
          failureCause: recovery.failureCause,
          rollbackId: recovery.rollbackId,
        }
      : undefined,
    supportingEvidence: run.executionContext.registryReferences as Record<string, unknown>,
    eklsLearning: buildEklsLearningView({
      executionId: run.executionId,
      correlationId: run.executionContext.correlationId,
      workspaceId,
      workflowId: run.executionContext.workflowId,
    }),
    timeline: buildTimelineForRun(run, recovery),
    availableActions: buildAvailableActions(run, run.executionContext.approvalReference),
  };
}

export function loadAutomationTimelineView(
  workspaceId: string,
  automationId: string,
): AutomationTimelineView | null {
  const detail = loadAutomationDetailView(workspaceId, automationId);
  if (!detail) return null;

  return {
    computedAt: nowIso(),
    automationId,
    executionId: detail.executionId,
    phases: TIMELINE_PHASES,
    events: detail.timeline,
  };
}
