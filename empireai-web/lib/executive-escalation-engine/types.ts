/** E2-09 — Executive Escalation Engine frontend types (mirrors Pillow PILLOW-EEE-001). */

export type EnterpriseEscalation = {
  escalationId: string;
  title: string;
  description: string;
  category: string;
  domain: string;
  trigger: string;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  severity: string;
  priority: number;
  escalationLevel: string;
  requiredAuthority: string;
  recommendedAction: string;
  confidence: number;
  evidence: string[];
  resolutionStatus: string;
  resolutionProgress: number;
};

export type EscalationQueueItem = {
  order: number;
  escalationId: string;
  title: string;
  escalationLevel: string;
  priority: number;
  requiredAuthority: string;
  status: string;
};

export type AuthorityRoutingEntry = {
  escalationId: string;
  title: string;
  escalationLevel: string;
  requiredAuthority: string;
  routingReason: string;
  status: string;
};

export type EscalationResolutionEntry = {
  escalationId: string;
  title: string;
  escalationLevel: string;
  resolutionStatus: string;
  resolutionProgress: number;
  recommendedAction: string;
};

export type EscalationPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExecutiveEscalationRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowEscalationEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveEscalationEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  escalationHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeEscalationCount: number;
  grandKingEscalationCount: number;
  supervisorEscalationCount: number;
  resolvedEscalationCount: number;
  activeEscalations: EnterpriseEscalation[];
  escalationQueue: EscalationQueueItem[];
  authorityRouting: AuthorityRoutingEntry[];
  resolutionStatus: EscalationResolutionEntry[];
  escalationPipeline: EscalationPipelineStep[];
  recommendedActions: ExecutiveEscalationRecommendation[];
  pillowEvaluations: PillowEscalationEvaluationMetric[];
  escalationPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE210: boolean;
};
