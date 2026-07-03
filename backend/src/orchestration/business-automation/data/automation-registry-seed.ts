/**
 * G5-01 — Foundation automation registry seed rows.
 * Structural examples only — no hardcoded countries, marketplaces, suppliers, products, or brands.
 * Imported exclusively by registry/sources/automation-source.ts (EA-004).
 */

import type {
  AutomationApprovalRow,
  AutomationExecutorRow,
  AutomationMonitorRow,
  AutomationNotificationRow,
  AutomationPolicyRow,
  AutomationRecoveryRow,
  AutomationReportRow,
  AutomationScheduleRow,
  AutomationTriggerRow,
  AutomationWorkflowRow,
} from "../../../registry/types/automation-registry-types.js";

const baseRow = {
  status: "VALIDATED" as const,
  version: "1.0.0",
  owner: "pillow:governance",
  dependencies: [] as string[],
  capabilities: ["foundation"],
  configuration: {},
  validation: { schemaVersion: "g5-01-v1", rules: ["foundation-seed"] },
  pluginSupport: { allowPluginRegistration: true },
  workspaceScope: { scope: "global" as const },
  futureCompatibility: { minSchemaVersion: "g5-01-v1" },
};

export const AUTOMATION_WORKFLOW_SEED_ROWS: AutomationWorkflowRow[] = [
  {
    ...baseRow,
    id: "wf-foundation-decision-orchestration",
    name: "Foundation Decision Orchestration",
    description:
      "G5-01 foundation workflow — generic decision-to-dispatch DAG without domain hardcoding",
    dependencies: ["pol-foundation-default", "exec-foundation-brain-dispatch"],
    capabilities: ["decision-trigger", "brain-dispatch"],
    steps: [
      {
        stepId: "refresh-intelligence",
        executorType: "g3_refresh",
        executorRef: "executive-intelligence-orchestrator:load",
        idempotent: true,
      },
      {
        stepId: "validate-decision",
        executorType: "brain_dispatch",
        executorRef: "decision-gate:validate",
        dependsOn: ["refresh-intelligence"],
        idempotent: true,
      },
      {
        stepId: "execute-approved-action",
        executorType: "brain_dispatch",
        executorRef: "execution-broker:dispatch",
        dependsOn: ["validate-decision"],
        irreversible: false,
        idempotent: true,
        rollbackStepId: "compensate-action",
      },
      {
        stepId: "compensate-action",
        executorType: "brain_dispatch",
        executorRef: "execution-broker:compensate",
        idempotent: true,
      },
    ],
    policyRef: "pol-foundation-default",
    approvalRef: "appr-foundation-tier-a1",
  },
];

export const AUTOMATION_TRIGGER_SEED_ROWS: AutomationTriggerRow[] = [
  {
    ...baseRow,
    id: "trg-foundation-decision-gate",
    name: "Foundation Decision Gate Trigger",
    description: "Fires when G3-10 business-automation consumer delivers PROCEED recommendation",
    dependencies: ["wf-foundation-decision-orchestration"],
    triggerType: "decision",
    workflowRef: { id: "wf-foundation-decision-orchestration", version: "1.0.0" },
    filterExpression: "finalRecommendation IN ('PROCEED','PROCEED_WITH_CAUTION')",
    policyRef: "pol-foundation-default",
    approvalRef: "appr-foundation-tier-a1",
  },
];

export const AUTOMATION_SCHEDULE_SEED_ROWS: AutomationScheduleRow[] = [
  {
    ...baseRow,
    id: "sch-foundation-hourly-slot",
    name: "Foundation Hourly Schedule Slot",
    description: "Generic hourly cadence slot — workflow resolved from registry at runtime",
    dependencies: ["wf-foundation-decision-orchestration"],
    scheduleKind: "slot",
    expression: "hourly",
    workflowRef: { id: "wf-foundation-decision-orchestration", version: "1.0.0" },
    timezone: "UTC",
    policyRef: "pol-foundation-default",
    configuration: {
      scheduleMode: "recurring",
      intervalMs: 3_600_000,
    },
  },
];

export const AUTOMATION_POLICY_SEED_ROWS: AutomationPolicyRow[] = [
  {
    ...baseRow,
    id: "pol-foundation-default",
    name: "Foundation Default Automation Policy",
    description: "Retry, escalation, and SLA defaults for G5-01 foundation workflows",
    dependencies: ["ntf-foundation-gc03-alert"],
    retry: {
      maxAttempts: 3,
      backoffMs: 5000,
      retryableErrors: ["TRANSIENT_BRAIN_ERROR", "TIMEOUT"],
      nonRetryableErrors: ["GUARDIAN_BLOCK", "APPROVAL_REJECTED", "DECISION_HOLD"],
    },
    escalation: {
      rules: [
        {
          ruleId: "esc-foundation-stuck-run",
          condition: "run.state == EXECUTING && run.durationMs > sla.maxDurationMs",
          targetTier: "A2",
        },
      ],
    },
    sla: [{ stepId: "execute-approved-action", maxDurationMs: 300_000 }],
    notificationRefs: ["ntf-foundation-gc03-alert"],
  },
];

export const AUTOMATION_APPROVAL_SEED_ROWS: AutomationApprovalRow[] = [
  {
    ...baseRow,
    id: "appr-foundation-tier-a1",
    name: "Foundation Tier A1 Approval",
    description: "Pillow-governed approval routing for foundation workflows",
    dependencies: ["pol-foundation-default"],
    tier: "A1",
    routingRules: [
      {
        ruleId: "route-irreversible-steps",
        condition: "step.irreversible == true",
        tier: "A2",
      },
      {
        ruleId: "route-default",
        condition: "default",
        tier: "A1",
      },
    ],
    pillowBridge: true,
    policyRef: "pol-foundation-default",
    configuration: {
      expiryMs: 86_400_000,
      notificationRefs: ["ntf-foundation-gc03-alert"],
    },
  },
];

export const AUTOMATION_EXECUTOR_SEED_ROWS: AutomationExecutorRow[] = [
  {
    ...baseRow,
    id: "exec-foundation-brain-dispatch",
    name: "Foundation Brain Dispatch Executor",
    description: "Generic Brain dispatch executor binding — module:action resolved at runtime",
    dependencies: [],
    executorType: "brain_dispatch",
    executorRef: "execution-broker:dispatch",
    moduleBinding: "brain:dispatch",
    capabilityTags: ["dispatch", "foundation"],
  },
  {
    ...baseRow,
    id: "exec-foundation-g3-refresh",
    name: "Foundation G3 Refresh Executor",
    description: "Executive intelligence refresh executor — no engine hardcoding",
    dependencies: [],
    executorType: "g3_refresh",
    executorRef: "executive-intelligence-orchestrator:load",
    moduleBinding: "executive-intelligence-orchestrator:load",
    capabilityTags: ["g3_refresh", "foundation"],
  },
  {
    ...baseRow,
    id: "exec-foundation-marketplace-engine",
    name: "Foundation Marketplace Engine Executor",
    description: "Business engine dispatch binding for marketplace infrastructure — Brain-mediated only",
    dependencies: [],
    executorType: "business_engine",
    executorRef: "marketplace-infrastructure-engine:list",
    moduleBinding: "marketplace-infrastructure-engine:list",
    capabilityTags: ["marketplace", "foundation"],
  },
];

export const AUTOMATION_RECOVERY_SEED_ROWS: AutomationRecoveryRow[] = [
  {
    ...baseRow,
    id: "rec-foundation-default",
    name: "Foundation Default Recovery",
    description: "Retry and rollback strategies for foundation workflows",
    dependencies: ["wf-foundation-decision-orchestration"],
    strategies: [
      { strategyId: "str-retry-transient", kind: "retry", condition: "error.class == TRANSIENT" },
      { strategyId: "str-rollback-mapped", kind: "rollback", condition: "rollbackMap.has(stepId)" },
      { strategyId: "str-escalate-unrecoverable", kind: "escalate", condition: "attempts >= maxAttempts" },
    ],
    rollbackMap: {
      "execute-approved-action": "compensate-action",
    },
    maxAttempts: 3,
    workflowRef: { id: "wf-foundation-decision-orchestration", version: "1.0.0" },
  },
];

export const AUTOMATION_NOTIFICATION_SEED_ROWS: AutomationNotificationRow[] = [
  {
    ...baseRow,
    id: "ntf-foundation-gc03-alert",
    name: "Foundation GC-03 Alert Notification",
    description: "Automation run state notifications via GC-03 — no channel hardcoding in core",
    dependencies: [],
    channel: "gc03",
    templateRef: "automation-run-state-change",
    escalationBinding: "pol-foundation-default",
  },
];

export const AUTOMATION_REPORT_SEED_ROWS: AutomationReportRow[] = [
  {
    ...baseRow,
    id: "rpt-foundation-executive-summary",
    name: "Foundation Executive Automation Report",
    description: "Executive report hook for automation run completion",
    dependencies: ["wf-foundation-decision-orchestration"],
    reportType: "executive",
    hooks: ["executive-audit:automation-run-complete"],
  },
];

export const AUTOMATION_MONITOR_SEED_ROWS: AutomationMonitorRow[] = [
  {
    ...baseRow,
    id: "mon-foundation-run-health",
    name: "Foundation Run Health Monitor",
    description: "Stuck-run detection and SLA binding for foundation workflows",
    dependencies: ["pol-foundation-default", "wf-foundation-decision-orchestration"],
    slaBindings: ["pol-foundation-default"],
    stuckRunThresholdMs: 600_000,
    healthChecks: ["run-state", "step-latency", "approval-queue-depth"],
    policyRef: "pol-foundation-default",
  },
];
