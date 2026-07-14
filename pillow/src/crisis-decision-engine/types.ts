/** PILLOW-CDE-001 — Crisis Decision Engine types (E2-08). */

import type {
  CRISIS_PIPELINE,
  CRISIS_PRINCIPLES,
  GOVERNED_CRISIS_DOMAINS,
  CRISIS_CLASSIFICATIONS,
  CRISIS_SEVERITY_LEVELS,
  CRISIS_RESPONSE_DOMAINS,
  PILLOW_CRISIS_EVALUATIONS,
} from "./paths.js";

export type CrisisDecisionEngineVersion = "E2-08";

export type CrisisPipelinePhase = (typeof CRISIS_PIPELINE)[number];
export type CrisisPrinciple = (typeof CRISIS_PRINCIPLES)[number];
export type GovernedCrisisDomain = (typeof GOVERNED_CRISIS_DOMAINS)[number];
export type CrisisClassification = (typeof CRISIS_CLASSIFICATIONS)[number];
export type CrisisSeverityLevel = (typeof CRISIS_SEVERITY_LEVELS)[number];
export type CrisisResponseDomain = (typeof CRISIS_RESPONSE_DOMAINS)[number];
export type PillowCrisisEvaluation = (typeof PILLOW_CRISIS_EVALUATIONS)[number];

export type CrisisPipelineStep = {
  phase: CrisisPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type EnterpriseCrisis = {
  crisisId: string;
  title: string;
  description: string;
  category: CrisisClassification;
  domain: GovernedCrisisDomain;
  detectionSource: string;
  severity: CrisisSeverityLevel;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  riskScore: number;
  affectedSystems: string[];
  dependencies: string[];
  currentStatus: string;
  recommendedActions: string[];
  confidence: number;
  evidence: string[];
  recoveryProgress: number;
  requiredAuthority: string;
};

export type CrisisResponsePlan = {
  crisisId: string;
  title: string;
  domain: CrisisResponseDomain;
  label: string;
  value: string;
  status: string;
};

export type RecoveryProgressEntry = {
  crisisId: string;
  title: string;
  severity: CrisisSeverityLevel;
  recoveryProgress: number;
  recoveryStrategy: string;
  status: string;
};

export type ExecutiveCrisisAction = {
  order: number;
  crisisId: string;
  title: string;
  action: string;
  authority: string;
  status: string;
};

export type CrisisDecisionRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowCrisisEvaluationMetric = {
  domain: PillowCrisisEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type CrisisDecisionEngine = {
  engineVersion: CrisisDecisionEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  crisisHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeCrisisCount: number;
  criticalCrisisCount: number;
  activeCrises: EnterpriseCrisis[];
  crisisResponsePlans: CrisisResponsePlan[];
  recoveryProgress: RecoveryProgressEntry[];
  executiveActions: ExecutiveCrisisAction[];
  crisisPipeline: CrisisPipelineStep[];
  recommendedActions: CrisisDecisionRecommendation[];
  pillowEvaluations: PillowCrisisEvaluationMetric[];
  crisisPrinciples: CrisisPrinciple[];
  governedDomains: GovernedCrisisDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveDecisionArchitecture: string;
    riskAssessmentEngine: string;
    executiveApprovalIntelligence: string;
    conflictResolutionEngine: string;
    guardianStatus: string;
    executivePlanningProgramme: string;
    corporateVisionEngine: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE209: boolean;
};
