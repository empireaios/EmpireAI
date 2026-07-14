/** E5-08 — Executive Exception Manager frontend types (mirrors Pillow PILLOW-EEXC-001). */

export type ExceptionRecord = {
  exceptionId: string;
  exceptionTitle: string;
  category: string;
  origin: string;
  reason: string;
  businessJustification: string;
  applicablePolicy: string;
  applicableConstitution: string;
  approvingAuthority: string;
  businessImpact: string;
  strategicImpact: string;
  riskLevel: string;
  classification: string;
  startDate: string;
  expirationDate: string;
  currentStatus: string;
  confidence: number;
  evidence: string[];
};

export type ActiveExceptionEntry = {
  activeId: string;
  exceptionId: string;
  title: string;
  category: string;
  approvingAuthority: string;
  riskLevel: string;
  expirationDate: string;
  status: string;
};

export type PendingApprovalEntry = {
  approvalId: string;
  exceptionId: string;
  title: string;
  category: string;
  reason: string;
  riskLevel: string;
  requestedBy: string;
  status: string;
};

export type ExceptionTimelineEntry = {
  timelineId: string;
  exceptionId: string;
  event: string;
  category: string;
  authority: string;
  status: string;
  timestamp: string;
};

export type ExpirationScheduleEntry = {
  scheduleId: string;
  exceptionId: string;
  title: string;
  category: string;
  expirationDate: string;
  daysRemaining: number;
  renewalRequired: boolean;
  status: string;
};

export type BusinessImpactEntry = {
  impactId: string;
  exceptionId: string;
  title: string;
  businessImpact: string;
  strategicImpact: string;
  riskLevel: string;
  status: string;
};

export type RiskAssessmentEntry = {
  assessmentId: string;
  exceptionId: string;
  title: string;
  riskLevel: string;
  riskExposure: string;
  mitigation: string;
  status: string;
};

export type ExceptionAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveExceptionRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowExceptionEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveExceptionPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type ExceptionPolicyRecord = {
  policyId: string;
  title: string;
  description: string;
  domain: string;
  version: string;
  enabled: boolean;
  maxDurationDays: number;
  requiresExecutiveApproval: boolean;
  autoEscalationHours: number;
  severity: string;
  owner: string;
};

export type EscalationWorkflowEntry = {
  escalationId: string;
  exceptionId: string;
  level: string;
  title: string;
  assignedTo: string;
  reason: string;
  status: string;
  timestamp: string;
};

export type RecoveryWorkflowEntry = {
  recoveryId: string;
  exceptionId: string;
  title: string;
  strategy: string;
  retryAllowed: boolean;
  fallbackAction: string;
  owner: string;
  progress: number;
  status: string;
};

export type ExceptionAuditLogEntry = {
  auditId: string;
  exceptionId: string;
  event: string;
  actor: string;
  previousStatus: string;
  newStatus: string;
  details: string;
  timestamp: string;
};

export type ExceptionMonitoringStatus = {
  backgroundMonitoring: string;
  unresolvedCount: number;
  expiringSoonCount: number;
  escalationPendingCount: number;
  lastScanAt: string;
  nextScanAt: string;
  alertThresholdDays: number;
};

export type ExceptionExecutiveReport = {
  currentStatus: string;
  activeExceptions: number;
  pendingApprovals: number;
  resolvedCount: number;
  executiveSummary: string;
  generatedAt: string;
};

export type ExceptionMetrics = {
  totalExceptions: number;
  activeCount: number;
  pendingCount: number;
  escalatedCount: number;
  resolvedCount: number;
  expiredCount: number;
  averageResolutionDays: number;
};

export type ExceptionHealthStatus = {
  status: string;
  healthScore: number;
  policyCount: number;
  enabledPolicyCount: number;
  auditEventCount: number;
  lastEventAt: string | null;
};

export type ExecutiveExceptionManager = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  exceptionHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeExceptionCount: number;
  pendingApprovalCount: number;
  expiringSoonCount: number;
  unauthorizedExceptionCount: number;
  exceptionRecordCount: number;
  activeExceptions: ActiveExceptionEntry[];
  pendingApprovals: PendingApprovalEntry[];
  exceptionTimeline: ExceptionTimelineEntry[];
  expirationSchedule: ExpirationScheduleEntry[];
  businessImpact: BusinessImpactEntry[];
  riskAssessment: RiskAssessmentEntry[];
  exceptionRecords: ExceptionRecord[];
  exceptionAnalysis: ExceptionAnalysisMetric[];
  executiveExceptionPipeline: ExecutiveExceptionPipelineStep[];
  recommendedActions: ExecutiveExceptionRecommendation[];
  pillowEvaluations: PillowExceptionEvaluationMetric[];
  exceptionPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  exceptionPolicies?: ExceptionPolicyRecord[];
  escalationWorkflows?: EscalationWorkflowEntry[];
  recoveryWorkflows?: RecoveryWorkflowEntry[];
  exceptionAuditHistory?: ExceptionAuditLogEntry[];
  monitoringStatus?: ExceptionMonitoringStatus;
  executiveReport?: ExceptionExecutiveReport;
  metrics?: ExceptionMetrics;
  healthStatus?: ExceptionHealthStatus;
  readyForE509: boolean;
};
