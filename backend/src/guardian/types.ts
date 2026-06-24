export type SubsystemId =
  | "orchestrator"
  | "agent-manager"
  | "task-queue"
  | "memory-system"
  | "event-bus"
  | "decision-engine"
  | "workflow-engine"
  | "tool-registry"
  | "llm-layer"
  | "scheduler"
  | "background-workers"
  | "audit-logs"
  | "database";

export type HealthStatus = "healthy" | "degraded" | "failed" | "skipped";

export type SubsystemHealth = {
  id: SubsystemId;
  status: HealthStatus;
  message: string;
  checkedAt: string;
  latencyMs?: number;
  metadata?: Record<string, unknown>;
};

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export type RiskRecord = {
  id: string;
  severity: RiskSeverity;
  subsystem: SubsystemId | "guardian" | "system";
  code: string;
  message: string;
  correlationId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  resolvedAt?: string;
};

export type RecoveryStep = {
  order: number;
  action: string;
  rationale: string;
  rollback?: string;
};

export type RecoveryPlan = {
  id: string;
  riskId: string;
  title: string;
  steps: RecoveryStep[];
  rollbackSteps: RecoveryStep[];
  createdAt: string;
};

export type GuardianVerdict = {
  allowed: boolean;
  reason: string;
  code: string;
  riskId?: string;
  recoveryPlanId?: string;
};

export type GuardianHealthReport = {
  overall: HealthStatus;
  checkedAt: string;
  subsystems: SubsystemHealth[];
  openRisks: number;
  databaseIntegrity: "ok" | "failed" | "unknown";
  summary: string;
};

export type GuardianAssessmentContext = {
  module: string;
  action: string;
  workspaceId: string;
  companyId?: string;
  payload: Record<string, unknown>;
  correlationId?: string;
  toolAuthorityLevel?: string;
};
