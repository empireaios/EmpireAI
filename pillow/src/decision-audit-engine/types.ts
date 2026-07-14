/** PILLOW-DAE-001 — Decision Audit Engine types (E2-13). */

import type {
  AUDIT_PIPELINE,
  AUDIT_PRINCIPLES,
  GOVERNED_AUDIT_DOMAINS,
  AUDIT_CLASSIFICATIONS,
  AUDIT_CAPABILITIES,
  PILLOW_AUDIT_EVALUATIONS,
} from "./paths.js";

export type DecisionAuditEngineVersion = "E2-13";

export type AuditPipelinePhase = (typeof AUDIT_PIPELINE)[number];
export type AuditPrinciple = (typeof AUDIT_PRINCIPLES)[number];
export type GovernedAuditDomain = (typeof GOVERNED_AUDIT_DOMAINS)[number];
export type AuditClassification = (typeof AUDIT_CLASSIFICATIONS)[number];
export type AuditCapability = (typeof AUDIT_CAPABILITIES)[number];
export type PillowAuditEvaluation = (typeof PILLOW_AUDIT_EVALUATIONS)[number];

export type AuditPipelineStep = {
  phase: AuditPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type DecisionAuditRecord = {
  auditId: string;
  decisionId: string;
  decisionType: AuditClassification;
  domain: GovernedAuditDomain;
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
  capability: AuditCapability;
  label: string;
  status: string;
  score: number;
  summary: string;
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
  domain: PillowAuditEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type DecisionAuditEngine = {
  engineVersion: DecisionAuditEngineVersion;
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
  auditPrinciples: AuditPrinciple[];
  governedDomains: GovernedAuditDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveDecisionArchitecture: string;
    executivePolicyEngine: string;
    executiveRecommendationEngine: string;
    executiveApprovalIntelligence: string;
    knowledgeEvolution: string;
    guardianStatus: string;
    executivePlanningProgramme: string;
    corporateVisionEngine: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE214: boolean;
};
