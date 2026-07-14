/** PILLOW-EEE-001 — Executive Escalation Engine types (E2-09). */

import type {
  ESCALATION_PIPELINE,
  ESCALATION_PRINCIPLES,
  GOVERNED_ESCALATION_DOMAINS,
  ESCALATION_CLASSIFICATIONS,
  ESCALATION_LEVELS,
  ESCALATION_RULE_DOMAINS,
  PILLOW_ESCALATION_EVALUATIONS,
} from "./paths.js";

export type ExecutiveEscalationEngineVersion = "E2-09";

export type EscalationPipelinePhase = (typeof ESCALATION_PIPELINE)[number];
export type EscalationPrinciple = (typeof ESCALATION_PRINCIPLES)[number];
export type GovernedEscalationDomain = (typeof GOVERNED_ESCALATION_DOMAINS)[number];
export type EscalationClassification = (typeof ESCALATION_CLASSIFICATIONS)[number];
export type EscalationLevel = (typeof ESCALATION_LEVELS)[number];
export type EscalationRuleDomain = (typeof ESCALATION_RULE_DOMAINS)[number];
export type PillowEscalationEvaluation = (typeof PILLOW_ESCALATION_EVALUATIONS)[number];

export type EscalationPipelineStep = {
  phase: EscalationPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type EnterpriseEscalation = {
  escalationId: string;
  title: string;
  description: string;
  category: EscalationClassification;
  domain: GovernedEscalationDomain;
  trigger: string;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  severity: string;
  priority: number;
  escalationLevel: EscalationLevel;
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
  escalationLevel: EscalationLevel;
  priority: number;
  requiredAuthority: string;
  status: string;
};

export type AuthorityRoutingEntry = {
  escalationId: string;
  title: string;
  escalationLevel: EscalationLevel;
  requiredAuthority: string;
  routingReason: string;
  status: string;
};

export type EscalationResolutionEntry = {
  escalationId: string;
  title: string;
  escalationLevel: EscalationLevel;
  resolutionStatus: string;
  resolutionProgress: number;
  recommendedAction: string;
};

export type EscalationRuleMetric = {
  rule: EscalationRuleDomain;
  label: string;
  status: string;
  summary: string;
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
  domain: PillowEscalationEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveEscalationEngine = {
  engineVersion: ExecutiveEscalationEngineVersion;
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
  escalationRules: EscalationRuleMetric[];
  recommendedActions: ExecutiveEscalationRecommendation[];
  pillowEvaluations: PillowEscalationEvaluationMetric[];
  escalationPrinciples: EscalationPrinciple[];
  governedDomains: GovernedEscalationDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveDecisionArchitecture: string;
    riskAssessmentEngine: string;
    executiveApprovalIntelligence: string;
    crisisDecisionEngine: string;
    conflictResolutionEngine: string;
    guardianStatus: string;
    executivePlanningProgramme: string;
    corporateVisionEngine: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE210: boolean;
};
