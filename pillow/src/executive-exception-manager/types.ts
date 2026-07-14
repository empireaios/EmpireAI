/** PILLOW-EEXC-001 — Executive Exception Manager types (E5-08). */

import type {
  EXECUTIVE_EXCEPTION_PIPELINE,
  EXCEPTION_PRINCIPLES,
  GOVERNED_EXCEPTION_DOMAINS,
  EXCEPTION_CLASSIFICATIONS,
  EXCEPTION_ANALYSIS_DOMAINS,
  PILLOW_EXCEPTION_EVALUATIONS,
  EXCEPTION_SEVERITY_LEVELS,
  EXCEPTION_LIFECYCLE_STATES,
  EXCEPTION_ESCALATION_LEVELS,
} from "./paths.js";

export type ExecutiveExceptionManagerVersion = "E5-08";

export type ExecutiveExceptionPipelinePhase = (typeof EXECUTIVE_EXCEPTION_PIPELINE)[number];
export type ExceptionPrinciple = (typeof EXCEPTION_PRINCIPLES)[number];
export type GovernedExceptionDomain = (typeof GOVERNED_EXCEPTION_DOMAINS)[number];
export type ExceptionClassification = (typeof EXCEPTION_CLASSIFICATIONS)[number];
export type ExceptionAnalysisDomain = (typeof EXCEPTION_ANALYSIS_DOMAINS)[number];
export type PillowExceptionEvaluation = (typeof PILLOW_EXCEPTION_EVALUATIONS)[number];
export type ExceptionSeverityLevel = (typeof EXCEPTION_SEVERITY_LEVELS)[number];
export type ExceptionLifecycleState = (typeof EXCEPTION_LIFECYCLE_STATES)[number];
export type ExceptionEscalationLevel = (typeof EXCEPTION_ESCALATION_LEVELS)[number];

export type ExceptionPolicyRecord = {
  policyId: string;
  title: string;
  description: string;
  domain: GovernedExceptionDomain;
  version: string;
  enabled: boolean;
  maxDurationDays: number;
  requiresExecutiveApproval: boolean;
  autoEscalationHours: number;
  severity: ExceptionSeverityLevel;
  owner: string;
  metadata: Record<string, string>;
};

export type EscalationWorkflowEntry = {
  escalationId: string;
  exceptionId: string;
  level: ExceptionEscalationLevel;
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

export type ExceptionRegistrationRequest = {
  title: string;
  category: GovernedExceptionDomain;
  reason: string;
  businessJustification: string;
  requestedBy: string;
  durationDays?: number;
  riskLevel?: ExceptionSeverityLevel;
};

export type ExceptionRegistrationResponse = {
  exceptionId: string;
  status: ExceptionLifecycleState;
  requiresApproval: boolean;
  expirationDate: string;
  message: string;
};

export type ExceptionApprovalRequest = {
  exceptionId: string;
  approvedBy: string;
  approved: boolean;
  notes?: string;
};

export type ExecutiveExceptionPipelineStep = {
  phase: ExecutiveExceptionPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExceptionRecord = {
  exceptionId: string;
  exceptionTitle: string;
  category: GovernedExceptionDomain;
  origin: string;
  reason: string;
  businessJustification: string;
  applicablePolicy: string;
  applicableConstitution: string;
  approvingAuthority: string;
  businessImpact: string;
  strategicImpact: string;
  riskLevel: string;
  classification: ExceptionClassification;
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
  category: GovernedExceptionDomain;
  approvingAuthority: string;
  riskLevel: string;
  expirationDate: string;
  status: string;
};

export type PendingApprovalEntry = {
  approvalId: string;
  exceptionId: string;
  title: string;
  category: GovernedExceptionDomain;
  reason: string;
  riskLevel: string;
  requestedBy: string;
  status: string;
};

export type ExceptionTimelineEntry = {
  timelineId: string;
  exceptionId: string;
  event: string;
  category: GovernedExceptionDomain;
  authority: string;
  status: string;
  timestamp: string;
};

export type ExpirationScheduleEntry = {
  scheduleId: string;
  exceptionId: string;
  title: string;
  category: GovernedExceptionDomain;
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
  domain: ExceptionAnalysisDomain;
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
  domain: PillowExceptionEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveExceptionManager = {
  engineVersion: ExecutiveExceptionManagerVersion;
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
  exceptionPrinciples: ExceptionPrinciple[];
  governedDomains: GovernedExceptionDomain[];
  pillowAdvisory: string[];
  integrations: {
    enterpriseGovernanceFramework: string;
    executiveConstitutionalMonitor: string;
    enterpriseAuditEngine: string;
    executiveComplianceEngine: string;
    executiveEthicsEngine: string;
    executiveAccountabilityEngine: string;
    executiveTransparencyEngine: string;
    executiveIntelligenceProgramme: string;
    executiveDecisionEngine: string;
    financialExecutiveProgramme: string;
    executivePolicyEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  exceptionPolicies: ExceptionPolicyRecord[];
  escalationWorkflows: EscalationWorkflowEntry[];
  recoveryWorkflows: RecoveryWorkflowEntry[];
  exceptionAuditHistory: ExceptionAuditLogEntry[];
  monitoringStatus: ExceptionMonitoringStatus;
  executiveReport: ExceptionExecutiveReport;
  metrics: ExceptionMetrics;
  healthStatus: ExceptionHealthStatus;
  readyForE509: boolean;
};
