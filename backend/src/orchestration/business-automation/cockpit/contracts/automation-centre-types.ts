/**
 * G5-07 — Cockpit Automation Centre view contracts (Brain payload types).
 */

export type AutomationCentreHealth = "HEALTHY" | "WARNING" | "FAILED" | "UNKNOWN";

export type AutomationCentreKpi = {
  id: string;
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
  status: string;
};

export type AutomationAttentionItem = {
  id: string;
  label: string;
  severity: "critical" | "warning" | "info";
  href: string | null;
  automationId?: string;
};

export type AutomationWorkflowStatusRow = {
  automationId: string;
  executionId?: string;
  queueId?: string;
  workflowId: string;
  triggerId: string;
  currentState: string;
  queueState?: string;
  correlationId: string;
  updatedAt: string;
};

export type AutomationRegistryHealthRow = {
  registryId: string;
  registryType: string;
  name: string;
  status: "healthy" | "warning" | "unknown";
  detail: string;
};

export type AutomationActivityEvent = {
  eventId: string;
  kind: string;
  title: string;
  summary: string;
  timestamp: string;
  automationId?: string;
  correlationId?: string;
};

export type AutomationNotificationRow = {
  notificationRegistryId: string;
  channel: string;
  templateRef: string;
  status: string;
};

export type AutomationCentreOverview = {
  health: AutomationCentreHealth;
  runningCount: number;
  queuedCount: number;
  scheduledCount: number;
  completedCount: number;
  failedCount: number;
  recoveringCount: number;
  approvalPendingCount: number;
};

export type AutomationCentreView = {
  computedAt: string;
  workspaceId: string;
  screenId: "SCR-303";
  dataMode: "live" | "sandbox";
  overview: AutomationCentreOverview;
  kpis: AutomationCentreKpi[];
  attentionItems: AutomationAttentionItem[];
  runningWorkflows: AutomationWorkflowStatusRow[];
  queuedWorkflows: AutomationWorkflowStatusRow[];
  scheduledWorkflows: AutomationWorkflowStatusRow[];
  completedWorkflows: AutomationWorkflowStatusRow[];
  failedWorkflows: AutomationWorkflowStatusRow[];
  approvalQueue: Array<{
    approvalId: string;
    workflowId: string;
    triggerId: string;
    approvalTier: string;
    approvalState: string;
    summary: string;
    requestedAt: string;
    expiryAt?: string;
    correlationId: string;
  }>;
  recoveryOperations: Array<{
    recoveryId: string;
    executionId: string;
    recoveryState: string;
    failureCategory: string;
    failureCause: string;
  }>;
  schedulerSummary: {
    dueCount: number;
    retryingCount: number;
    recoveredCount: number;
  };
  registryHealth: AutomationRegistryHealthRow[];
  recentActivity: AutomationActivityEvent[];
  notifications: AutomationNotificationRow[];
  relationshipLinks: Array<{ label: string; href: string; module: string }>;
  pluginWidgets: Array<{ pluginId: string; title: string; summary: string }>;
  installedPlugins: Array<{
    pluginId: string;
    pluginName: string;
    version: string;
    category: string;
    lifecycleState: string;
    healthStatus: string;
    capabilities: string[];
    lastActivityAt?: string;
  }>;
};

export type WorkflowTimelinePhase =
  | "trigger"
  | "validation"
  | "approval"
  | "scheduling"
  | "queue"
  | "execution"
  | "completion"
  | "recovery"
  | "rollback"
  | "final_outcome";

export type WorkflowTimelineEvent = {
  phase: WorkflowTimelinePhase;
  label: string;
  state: "completed" | "active" | "pending" | "failed" | "skipped";
  timestamp?: string;
  detail?: string;
};

export type AutomationDetailView = {
  computedAt: string;
  automationId: string;
  executionId?: string;
  queueId?: string;
  workflowId: string;
  workflowVersion?: string;
  triggerId: string;
  currentState: string;
  approvalStatus: string;
  decisionSource?: string;
  correlationId: string;
  registryReferences: Record<string, unknown>;
  businessEngines: Array<{ stepId: string; executorType: string; executorRef: string }>;
  recoveryStatus?: {
    recoveryState: string;
    failureCategory?: string;
    failureCause?: string;
    rollbackId?: string;
  };
  supportingEvidence?: Record<string, unknown>;
  eklsLearning: {
    lessonsLearnedHref: string | null;
    historicalOutcomes: Array<{ label: string; timestamp: string }>;
    similarAutomations: string[];
    decisionHistory: Array<{ label: string; timestamp: string }>;
    learningId?: string;
    lessonsLearned?: string[];
    outcomeSummary?: string;
  };
  timeline: WorkflowTimelineEvent[];
  availableActions: Array<{
    action: string;
    label: string;
    pillowGoverned: true;
    enabled: boolean;
  }>;
};

export type AutomationTimelineView = {
  computedAt: string;
  automationId: string;
  executionId?: string;
  phases: WorkflowTimelinePhase[];
  events: WorkflowTimelineEvent[];
};
