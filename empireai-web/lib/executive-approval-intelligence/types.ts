/** E2-07 — Executive Approval Intelligence frontend types (mirrors Pillow PILLOW-EAI-001). */

export type ExecutiveApprovalRequest = {
  approvalId: string;
  decisionId: string;
  title: string;
  approvalType: string;
  domain: string;
  authorityLevel: string;
  purpose: string;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  riskLevel: string;
  dependencies: string[];
  requiredEvidence: string[];
  recommendedAuthority: string;
  confidence: number;
  approvalOutcome: string;
  escalated: boolean;
  status: string;
};

export type ApprovalQueueItem = {
  order: number;
  approvalId: string;
  title: string;
  approvalType: string;
  authorityLevel: string;
  recommendedAuthority: string;
  riskLevel: string;
  confidence: number;
  status: string;
};

export type ApprovalEscalation = {
  order: number;
  approvalId: string;
  title: string;
  trigger: string;
  reason: string;
  requiredAuthority: string;
};

export type ApprovalRuleMetric = {
  rule: string;
  label: string;
  status: string;
  summary: string;
};

export type ApprovalPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ApprovalIntelligenceRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowApprovalEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveApprovalIntelligence = {
  intelligenceVersion: string;
  computedAt: string;
  intelligenceSummary: string;
  intelligenceHealth: string;
  approvalHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  pendingApprovalCount: number;
  grandKingApprovalCount: number;
  automaticApprovalCount: number;
  escalationCount: number;
  pendingApprovals: ExecutiveApprovalRequest[];
  approvalQueue: ApprovalQueueItem[];
  escalations: ApprovalEscalation[];
  approvalRules: ApprovalRuleMetric[];
  approvalPipeline: ApprovalPipelineStep[];
  recommendedActions: ApprovalIntelligenceRecommendation[];
  pillowEvaluations: PillowApprovalEvaluationMetric[];
  approvalPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE208: boolean;
};
