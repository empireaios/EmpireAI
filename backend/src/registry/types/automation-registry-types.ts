/**
 * G5-01 — Automation registry row schemas (REG-AUTOMATION-*).
 * Constitutional foundation for Business Automation — registry-driven, no hardcoded business.
 */

import { z } from "zod";

/** G5-00 definition lifecycle — automation registry rows only. */
export const AUTOMATION_REGISTRY_LIFECYCLE = [
  "DRAFT",
  "VALIDATED",
  "PUBLISHED",
  "DEPRECATED",
  "RETIRED",
] as const;

export type AutomationRegistryLifecycle = (typeof AUTOMATION_REGISTRY_LIFECYCLE)[number];

export const AUTOMATION_WORKSPACE_SCOPES = ["global", "workspace", "deployment"] as const;

export type AutomationWorkspaceScope = (typeof AUTOMATION_WORKSPACE_SCOPES)[number];

export const AUTOMATION_TRIGGER_TYPES = [
  "decision",
  "schedule",
  "event",
  "manual",
  "registry",
] as const;

export type AutomationTriggerType = (typeof AUTOMATION_TRIGGER_TYPES)[number];

export const AUTOMATION_EXECUTOR_TYPES = [
  "brain_dispatch",
  "business_engine",
  "g3_refresh",
  "pillow_notify",
  "ekls_record",
  "plugin",
] as const;

export type AutomationExecutorType = (typeof AUTOMATION_EXECUTOR_TYPES)[number];

export const AUTOMATION_APPROVAL_TIERS = ["A0", "A1", "A2", "A3"] as const;

export type AutomationApprovalTier = (typeof AUTOMATION_APPROVAL_TIERS)[number];

export const AUTOMATION_SCHEDULE_KINDS = ["cron", "slot", "manifest"] as const;

export type AutomationScheduleKind = (typeof AUTOMATION_SCHEDULE_KINDS)[number];

export const AUTOMATION_NOTIFICATION_CHANNELS = ["gc03", "pillow", "ekls", "webhook"] as const;

export type AutomationNotificationChannel = (typeof AUTOMATION_NOTIFICATION_CHANNELS)[number];

export const AUTOMATION_REPORT_TYPES = ["executive", "operational", "audit"] as const;

export type AutomationReportType = (typeof AUTOMATION_REPORT_TYPES)[number];

export const AUTOMATION_PLUGIN_KINDS = [
  "automation_trigger",
  "automation_policy",
  "automation_scheduler",
  "automation_executor",
  "automation_recovery",
  "automation_notification",
  "automation_monitor",
] as const;

export type AutomationPluginKind = (typeof AUTOMATION_PLUGIN_KINDS)[number];

const semverPattern = /^\d+\.\d+\.\d+$/;

/** Required fields on every automation registry row (G5-01). */
export const automationRegistryRowBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  status: z.enum(AUTOMATION_REGISTRY_LIFECYCLE),
  version: z.string().regex(semverPattern, "version must be semver (e.g. 1.0.0)"),
  owner: z.string().min(1),
  dependencies: z.array(z.string()),
  capabilities: z.array(z.string()),
  configuration: z.record(z.unknown()),
  validation: z.object({
    schemaVersion: z.string().min(1),
    rules: z.array(z.string()).optional(),
  }),
  pluginSupport: z.object({
    allowPluginRegistration: z.boolean(),
    pluginKind: z.enum(AUTOMATION_PLUGIN_KINDS).optional(),
    pluginId: z.string().optional(),
  }),
  workspaceScope: z.object({
    scope: z.enum(AUTOMATION_WORKSPACE_SCOPES),
    workspaceId: z.string().optional(),
    deploymentProfileId: z.string().optional(),
  }),
  futureCompatibility: z.object({
    minSchemaVersion: z.string().min(1),
    extensionFields: z.record(z.unknown()).optional(),
  }),
});

export type AutomationRegistryRowBase = z.infer<typeof automationRegistryRowBaseSchema>;

export const automationWorkflowRefSchema = z.object({
  id: z.string().min(1),
  version: z.string().regex(semverPattern),
});

export const automationWorkflowStepSchema = z.object({
  stepId: z.string().min(1),
  executorType: z.enum(AUTOMATION_EXECUTOR_TYPES),
  executorRef: z.string().min(1),
  dependsOn: z.array(z.string()).optional(),
  irreversible: z.boolean().optional(),
  idempotent: z.boolean().optional(),
  rollbackStepId: z.string().optional(),
});

export const automationTriggerRowSchema = automationRegistryRowBaseSchema.extend({
  triggerType: z.enum(AUTOMATION_TRIGGER_TYPES),
  workflowRef: automationWorkflowRefSchema,
  filterExpression: z.string().optional(),
  policyRef: z.string().optional(),
  approvalRef: z.string().optional(),
});

export const automationWorkflowRowSchema = automationRegistryRowBaseSchema.extend({
  steps: z.array(automationWorkflowStepSchema).min(1),
  policyRef: z.string().optional(),
  approvalRef: z.string().optional(),
});

export const automationScheduleRowSchema = automationRegistryRowBaseSchema.extend({
  scheduleKind: z.enum(AUTOMATION_SCHEDULE_KINDS),
  expression: z.string().min(1),
  workflowRef: automationWorkflowRefSchema,
  timezone: z.string().optional(),
  policyRef: z.string().optional(),
});

export const automationPolicyRetrySchema = z.object({
  maxAttempts: z.number().int().min(0),
  backoffMs: z.number().int().min(0),
  retryableErrors: z.array(z.string()).optional(),
  nonRetryableErrors: z.array(z.string()).optional(),
});

export const automationPolicyEscalationRuleSchema = z.object({
  ruleId: z.string().min(1),
  condition: z.string().min(1),
  targetTier: z.enum(AUTOMATION_APPROVAL_TIERS),
});

export const automationPolicySlaSchema = z.object({
  stepId: z.string().min(1),
  maxDurationMs: z.number().int().min(1),
});

export const automationPolicyRowSchema = automationRegistryRowBaseSchema.extend({
  retry: automationPolicyRetrySchema,
  escalation: z.object({
    rules: z.array(automationPolicyEscalationRuleSchema),
  }),
  sla: z.array(automationPolicySlaSchema).optional(),
  notificationRefs: z.array(z.string()).optional(),
});

export const automationApprovalRoutingRuleSchema = z.object({
  ruleId: z.string().min(1),
  condition: z.string().min(1),
  tier: z.enum(AUTOMATION_APPROVAL_TIERS),
});

export const automationApprovalRowSchema = automationRegistryRowBaseSchema.extend({
  tier: z.enum(AUTOMATION_APPROVAL_TIERS),
  routingRules: z.array(automationApprovalRoutingRuleSchema).min(1),
  pillowBridge: z.boolean(),
  policyRef: z.string().optional(),
});

export const automationExecutorRowSchema = automationRegistryRowBaseSchema.extend({
  executorType: z.enum(AUTOMATION_EXECUTOR_TYPES),
  executorRef: z.string().min(1),
  moduleBinding: z.string().optional(),
  capabilityTags: z.array(z.string()).optional(),
});

export const automationRecoveryStrategySchema = z.object({
  strategyId: z.string().min(1),
  kind: z.enum(["retry", "rollback", "escalate", "halt"]),
  condition: z.string().optional(),
});

export const automationRecoveryRowSchema = automationRegistryRowBaseSchema.extend({
  strategies: z.array(automationRecoveryStrategySchema).min(1),
  rollbackMap: z.record(z.string()),
  maxAttempts: z.number().int().min(0).optional(),
  workflowRef: automationWorkflowRefSchema.optional(),
});

export const automationNotificationRowSchema = automationRegistryRowBaseSchema.extend({
  channel: z.enum(AUTOMATION_NOTIFICATION_CHANNELS),
  templateRef: z.string().optional(),
  escalationBinding: z.string().optional(),
});

export const automationReportRowSchema = automationRegistryRowBaseSchema.extend({
  reportType: z.enum(AUTOMATION_REPORT_TYPES),
  hooks: z.array(z.string()),
});

export const automationMonitorRowSchema = automationRegistryRowBaseSchema.extend({
  slaBindings: z.array(z.string()),
  stuckRunThresholdMs: z.number().int().min(1),
  healthChecks: z.array(z.string()),
  policyRef: z.string().optional(),
});

export type AutomationTriggerRow = z.infer<typeof automationTriggerRowSchema>;
export type AutomationWorkflowRow = z.infer<typeof automationWorkflowRowSchema>;
export type AutomationScheduleRow = z.infer<typeof automationScheduleRowSchema>;
export type AutomationPolicyRow = z.infer<typeof automationPolicyRowSchema>;
export type AutomationApprovalRow = z.infer<typeof automationApprovalRowSchema>;
export type AutomationExecutorRow = z.infer<typeof automationExecutorRowSchema>;
export type AutomationRecoveryRow = z.infer<typeof automationRecoveryRowSchema>;
export type AutomationNotificationRow = z.infer<typeof automationNotificationRowSchema>;
export type AutomationReportRow = z.infer<typeof automationReportRowSchema>;
export type AutomationMonitorRow = z.infer<typeof automationMonitorRowSchema>;

export type AutomationRegistryRow =
  | AutomationTriggerRow
  | AutomationWorkflowRow
  | AutomationScheduleRow
  | AutomationPolicyRow
  | AutomationApprovalRow
  | AutomationExecutorRow
  | AutomationRecoveryRow
  | AutomationNotificationRow
  | AutomationReportRow
  | AutomationMonitorRow;

export const AUTOMATION_REGISTRY_VERSION = "g5-01-v1";
