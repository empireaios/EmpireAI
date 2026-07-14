/** E2-13 — Decision Audit Engine frontend types (mirrors Pillow PILLOW-DAE-001). */

export type DecisionAuditRecord = {
  auditId: string;
  decisionId: string;
  decisionType: string;
  domain: string;
  title: string;
  purpose: string;
  decisionContext: string;
  supportingEvidence: string[];
  recommendationHistory: string[];
  approvalHistory: string[];
  executionHistory: string[];
  outcome: string;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  repositoryImpact: string;
  owner: string;
  timestamp: string;
  confidence: number;
  auditStatus: string;
};

export type DecisionTimelineEntry = {
  order: number;
  auditId: string;
  decisionId: string;
  title: string;
  phase: string;
  event: string;
  timestamp: string;
  status: string;
};

export type AuditEvidenceEntry = {
  auditId: string;
  decisionId: string;
  title: string;
  evidence: string;
  verified: boolean;
  source: string;
};

export type ApprovalHistoryEntry = {
  auditId: string;
  decisionId: string;
  title: string;
  approver: string;
  authority: string;
  status: string;
  timestamp: string;
};

export type ExecutionHistoryEntry = {
  auditId: string;
  decisionId: string;
  title: string;
  action: string;
  executor: string;
  status: string;
  timestamp: string;
};

export type AuditVerificationMetric = {
  capability: string;
  label: string;
  status: string;
  score: number;
  summary: string;
};

export type AuditPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type DecisionAuditRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowAuditEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type DecisionAuditEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  auditHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  auditedDecisionCount: number;
  verifiedAuditCount: number;
  pendingAuditCount: number;
  recentDecisions: DecisionAuditRecord[];
  decisionTimeline: DecisionTimelineEntry[];
  auditEvidence: AuditEvidenceEntry[];
  approvalHistory: ApprovalHistoryEntry[];
  executionHistory: ExecutionHistoryEntry[];
  auditVerification: AuditVerificationMetric[];
  auditPipeline: AuditPipelineStep[];
  recommendedActions: DecisionAuditRecommendation[];
  pillowEvaluations: PillowAuditEvaluationMetric[];
  auditPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE214: boolean;
};
