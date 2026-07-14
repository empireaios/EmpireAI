/** E4-07 — Innovation Intelligence Engine frontend types (mirrors Pillow PILLOW-INE-001). */

export type InnovationRecord = {
  innovationId: string;
  title: string;
  category: string;
  domain: string;
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
  domain: string;
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
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type InnovationIntelligencePipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type InnovationIntelligenceEngine = {
  engineVersion: string;
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
  innovationPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE408: boolean;
};
