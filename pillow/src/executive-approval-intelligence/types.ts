/** PILLOW-EAI-001 — Executive Approval Intelligence types (E2-07). */

import type {
  APPROVAL_PIPELINE,
  APPROVAL_PRINCIPLES,
  GOVERNED_APPROVAL_DOMAINS,
  APPROVAL_CLASSIFICATIONS,
  APPROVAL_LEVELS,
  APPROVAL_RULES,
  ESCALATION_TRIGGERS,
  PILLOW_APPROVAL_EVALUATIONS,
} from "./paths.js";

export type ExecutiveApprovalIntelligenceVersion = "E2-07";

export type ApprovalPipelinePhase = (typeof APPROVAL_PIPELINE)[number];
export type ApprovalPrinciple = (typeof APPROVAL_PRINCIPLES)[number];
export type GovernedApprovalDomain = (typeof GOVERNED_APPROVAL_DOMAINS)[number];
export type ApprovalClassification = (typeof APPROVAL_CLASSIFICATIONS)[number];
export type ApprovalLevel = (typeof APPROVAL_LEVELS)[number];
export type ApprovalRule = (typeof APPROVAL_RULES)[number];
export type EscalationTrigger = (typeof ESCALATION_TRIGGERS)[number];
export type PillowApprovalEvaluation = (typeof PILLOW_APPROVAL_EVALUATIONS)[number];

export type ApprovalPipelineStep = {
  phase: ApprovalPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExecutiveApprovalRequest = {
  approvalId: string;
  decisionId: string;
  title: string;
  approvalType: ApprovalClassification;
  domain: GovernedApprovalDomain;
  authorityLevel: ApprovalLevel;
  purpose: string;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  riskLevel: string;
  dependencies: string[];
  requiredEvidence: string[];
  recommendedAuthority: ApprovalLevel;
  confidence: number;
  approvalOutcome: string;
  escalated: boolean;
  status: string;
};

export type ApprovalQueueItem = {
  order: number;
  approvalId: string;
  title: string;
  approvalType: ApprovalClassification;
  authorityLevel: ApprovalLevel;
  recommendedAuthority: ApprovalLevel;
  riskLevel: string;
  confidence: number;
  status: string;
};

export type ApprovalEscalation = {
  order: number;
  approvalId: string;
  title: string;
  trigger: EscalationTrigger;
  reason: string;
  requiredAuthority: ApprovalLevel;
};

export type ApprovalRuleMetric = {
  rule: ApprovalRule;
  label: string;
  status: string;
  summary: string;
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
  domain: PillowApprovalEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveApprovalIntelligence = {
  intelligenceVersion: ExecutiveApprovalIntelligenceVersion;
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
  approvalPrinciples: ApprovalPrinciple[];
  governedDomains: GovernedApprovalDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveDecisionArchitecture: string;
    riskAssessmentEngine: string;
    decisionSimulationEngine: string;
    executiveRecommendationEngine: string;
    conflictResolutionEngine: string;
    pillowApprovalGates: string;
    executivePlanningProgramme: string;
    corporateVisionEngine: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE208: boolean;
};
