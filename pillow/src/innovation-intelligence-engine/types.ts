/** PILLOW-INE-001 — Innovation Intelligence Engine types (E4-07). */

import type {
  INNOVATION_INTELLIGENCE_PIPELINE,
  INNOVATION_INTELLIGENCE_PRINCIPLES,
  GOVERNED_INNOVATION_DOMAINS,
  INNOVATION_CLASSIFICATIONS,
  INNOVATION_ANALYSIS_DOMAINS,
  PILLOW_INNOVATION_EVALUATIONS,
} from "./paths.js";

export type InnovationIntelligenceEngineVersion = "E4-07";

export type InnovationIntelligencePipelinePhase = (typeof INNOVATION_INTELLIGENCE_PIPELINE)[number];
export type InnovationIntelligencePrinciple = (typeof INNOVATION_INTELLIGENCE_PRINCIPLES)[number];
export type GovernedInnovationDomain = (typeof GOVERNED_INNOVATION_DOMAINS)[number];
export type InnovationClassification = (typeof INNOVATION_CLASSIFICATIONS)[number];
export type InnovationAnalysisDomain = (typeof INNOVATION_ANALYSIS_DOMAINS)[number];
export type PillowInnovationEvaluation = (typeof PILLOW_INNOVATION_EVALUATIONS)[number];

export type InnovationIntelligencePipelineStep = {
  phase: InnovationIntelligencePipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type InnovationRecord = {
  innovationId: string;
  title: string;
  category: InnovationClassification;
  domain: GovernedInnovationDomain;
  source: string;
  industry: string;
  technology: string;
  innovationType: string;
  businessImpact: string;
  financialImpact: string;
  strategicImpact: string;
  adoptionReadiness: number;
  implementationComplexity: number;
  priority: string;
  confidence: number;
  evidence: string[];
};

export type EmergingTechnologyEntry = {
  technologyId: string;
  innovationId: string;
  title: string;
  technology: string;
  adoptionReadiness: number;
  disruptionPotential: string;
  timeHorizon: string;
  status: string;
};

export type DisruptiveInnovationEntry = {
  disruptiveId: string;
  innovationId: string;
  title: string;
  category: string;
  businessImpact: string;
  strategicImpact: string;
  priority: string;
  status: string;
};

export type StrategicInnovationOpportunityEntry = {
  opportunityId: string;
  innovationId: string;
  title: string;
  strategicImpact: string;
  adoptionReadiness: number;
  financialImpact: string;
  status: string;
};

export type InnovationReadinessEntry = {
  readinessId: string;
  innovationId: string;
  title: string;
  adoptionReadiness: number;
  implementationComplexity: number;
  marketReadiness: string;
  status: string;
};

export type InnovationBusinessImpactEntry = {
  impactId: string;
  innovationId: string;
  title: string;
  businessImpact: string;
  financialImpact: string;
  strategicImpact: string;
  priority: string;
};

export type InnovationRiskEntry = {
  riskId: string;
  innovationId: string;
  title: string;
  riskLevel: number;
  severity: string;
  riskType: string;
  mitigation: string;
  status: string;
};

export type InnovationAnalysisMetric = {
  domain: InnovationAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type InnovationIntelligenceRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowInnovationEvaluationMetric = {
  domain: PillowInnovationEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type InnovationIntelligenceEngine = {
  engineVersion: InnovationIntelligenceEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  innovationIntelligenceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  discoveredInnovationCount: number;
  disruptiveInnovationCount: number;
  emergingTechnologyCount: number;
  averageAdoptionReadiness: number;
  innovationPipeline: InnovationRecord[];
  emergingTechnologies: EmergingTechnologyEntry[];
  disruptiveInnovations: DisruptiveInnovationEntry[];
  strategicOpportunities: StrategicInnovationOpportunityEntry[];
  innovationReadiness: InnovationReadinessEntry[];
  businessImpact: InnovationBusinessImpactEntry[];
  innovationRisks: InnovationRiskEntry[];
  innovationAnalysis: InnovationAnalysisMetric[];
  innovationIntelligencePipeline: InnovationIntelligencePipelineStep[];
  recommendedActions: InnovationIntelligenceRecommendation[];
  pillowEvaluations: PillowInnovationEvaluationMetric[];
  innovationPrinciples: InnovationIntelligencePrinciple[];
  governedDomains: GovernedInnovationDomain[];
  pillowAdvisory: string[];
  integrations: {
    marketIntelligenceEngine: string;
    competitorIntelligenceEngine: string;
    opportunityDiscoveryEngine: string;
    threatDetectionEngine: string;
    industryIntelligenceEngine: string;
    customerBehaviourIntelligence: string;
    financialExecutiveCertification: string;
    executiveDecisionCertification: string;
    corporateVisionEngine: string;
    executiveRecommendationEngine: string;
    knowledgeEvolution: string;
    guardianStatus: string;
    executivePlanningProgramme: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE408: boolean;
};
