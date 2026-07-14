/** PILLOW-EPEV-001 — Executive Policy Evolution types (E5-11). */

import type {
  POLICY_EVOLUTION_PIPELINE,
  POLICY_EVOLUTION_PRINCIPLES,
  GOVERNED_POLICY_EVOLUTION_DOMAINS,
  POLICY_EVOLUTION_CLASSIFICATIONS,
  POLICY_EVOLUTION_ANALYSIS_DOMAINS,
  PILLOW_POLICY_EVOLUTION_EVALUATIONS,
  APPROVAL_STATUS_LEVELS,
} from "./paths.js";

export type ExecutivePolicyEvolutionVersion = "E5-11";

export type PolicyEvolutionPipelinePhase = (typeof POLICY_EVOLUTION_PIPELINE)[number];
export type PolicyEvolutionPrinciple = (typeof POLICY_EVOLUTION_PRINCIPLES)[number];
export type GovernedPolicyEvolutionDomain = (typeof GOVERNED_POLICY_EVOLUTION_DOMAINS)[number];
export type PolicyEvolutionClassification = (typeof POLICY_EVOLUTION_CLASSIFICATIONS)[number];
export type PolicyEvolutionAnalysisDomain = (typeof POLICY_EVOLUTION_ANALYSIS_DOMAINS)[number];
export type PillowPolicyEvolutionEvaluation = (typeof PILLOW_POLICY_EVOLUTION_EVALUATIONS)[number];
export type ApprovalStatusLevel = (typeof APPROVAL_STATUS_LEVELS)[number];

export type PolicyEvolutionRecord = {
  evolutionId: string;
  policyId: string;
  policyName: string;
  domain: GovernedPolicyEvolutionDomain;
  evolutionReason: string;
  currentVersion: string;
  proposedVersion: string;
  businessJustification: string;
  strategicImpact: string;
  governanceImpact: string;
  riskAssessment: string;
  approvalStatus: ApprovalStatusLevel;
  confidence: number;
  evidence: string[];
  effectiveDate: string;
  classification: PolicyEvolutionClassification;
};

export type PolicyVersionEntry = {
  versionId: string;
  policyId: string;
  policyName: string;
  version: string;
  domain: GovernedPolicyEvolutionDomain;
  status: string;
  effectiveDate: string;
  owner: string;
};

export type EvolutionQueueEntry = {
  queueId: string;
  evolutionId: string;
  policyName: string;
  proposedVersion: string;
  classification: PolicyEvolutionClassification;
  approvalStatus: ApprovalStatusLevel;
  priority: number;
  scheduledDate: string;
};

export type ImprovementOpportunityEntry = {
  opportunityId: string;
  policyId: string;
  policyName: string;
  domain: GovernedPolicyEvolutionDomain;
  opportunity: string;
  expectedImpact: string;
  confidence: number;
  status: string;
};

export type PolicyEffectivenessEntry = {
  effectivenessId: string;
  policyId: string;
  policyName: string;
  domain: GovernedPolicyEvolutionDomain;
  effectivenessScore: number;
  complianceRate: number;
  adoptionRate: number;
  status: string;
};

export type GovernanceStabilityEntry = {
  stabilityId: string;
  domain: string;
  score: number;
  status: string;
  summary: string;
};

export type PolicyEvolutionAnalysisMetric = {
  domain: PolicyEvolutionAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutivePolicyEvolutionRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowPolicyEvolutionEvaluationMetric = {
  domain: PillowPolicyEvolutionEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type PolicyEvolutionPipelineStep = {
  phase: PolicyEvolutionPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type PolicyEvolutionMonitoringStatus = {
  backgroundMonitoring: string;
  pendingEvolutionCount: number;
  approvedEvolutionCount: number;
  publishedEvolutionCount: number;
  policyStabilityScore: number;
  lastScanAt: string;
  nextScanAt: string;
};

export type PolicyEvolutionExecutiveReport = {
  currentStatus: string;
  totalEvolutions: number;
  pendingEvolutions: number;
  publishedEvolutions: number;
  executiveSummary: string;
  generatedAt: string;
};

export type PolicyEvolutionMetrics = {
  totalEvolutions: number;
  pendingCount: number;
  approvedCount: number;
  publishedCount: number;
  averageConfidence: number;
  policyStabilityScore: number;
  governanceStabilityScore: number;
};

export type PolicyEvolutionHealthStatus = {
  status: string;
  healthScore: number;
  evolutionRegisterCount: number;
  regressionRiskCount: number;
  auditEventCount: number;
  lastEventAt: string | null;
};

export type PolicyEvolutionAuditLogEntry = {
  auditId: string;
  evolutionId: string;
  event: string;
  actor: string;
  previousStatus: string;
  newStatus: string;
  details: string;
  timestamp: string;
};

export type ExecutivePolicyEvolution = {
  engineVersion: ExecutivePolicyEvolutionVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  evolutionHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  totalEvolutionCount: number;
  pendingEvolutionCount: number;
  approvedEvolutionCount: number;
  publishedEvolutionCount: number;
  regressionRiskCount: number;
  policyEvolutionRegister: PolicyEvolutionRecord[];
  policyVersions: PolicyVersionEntry[];
  evolutionQueue: EvolutionQueueEntry[];
  improvementOpportunities: ImprovementOpportunityEntry[];
  policyEffectiveness: PolicyEffectivenessEntry[];
  governanceStability: GovernanceStabilityEntry[];
  policyEvolutionAnalysis: PolicyEvolutionAnalysisMetric[];
  policyEvolutionPipeline: PolicyEvolutionPipelineStep[];
  recommendedActions: ExecutivePolicyEvolutionRecommendation[];
  pillowEvaluations: PillowPolicyEvolutionEvaluationMetric[];
  evolutionPrinciples: PolicyEvolutionPrinciple[];
  governedDomains: GovernedPolicyEvolutionDomain[];
  pillowAdvisory: string[];
  integrations: {
    enterpriseGovernanceFramework: string;
    executiveConstitutionalMonitor: string;
    enterpriseAuditEngine: string;
    executiveComplianceEngine: string;
    executiveEthicsEngine: string;
    executiveAccountabilityEngine: string;
    executiveTransparencyEngine: string;
    executiveExceptionManager: string;
    enterpriseRiskGovernance: string;
    executiveReviewBoard: string;
    executivePolicyEngine: string;
    executiveIntelligenceProgramme: string;
    executiveDecisionEngine: string;
    financialExecutiveProgramme: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  evolutionAuditHistory: PolicyEvolutionAuditLogEntry[];
  monitoringStatus: PolicyEvolutionMonitoringStatus;
  executiveReport: PolicyEvolutionExecutiveReport;
  metrics: PolicyEvolutionMetrics;
  healthStatus: PolicyEvolutionHealthStatus;
  readyForE512: boolean;
};
