/** E4-14 — Executive Advisory Engine frontend types (mirrors Pillow PILLOW-EAE-001). */

export type AdvisoryRecommendationRecord = {
  recommendationId: string;
  title: string;
  category: string;
  domain: string;
  strategicObjective: string;
  currentSituation: string;
  recommendedAction: string;
  businessImpact: string;
  financialImpact: string;
  strategicImpact: string;
  priority: string;
  urgency: string;
  expectedRoi: string;
  expectedOutcome: string;
  confidence: number;
  evidence: string[];
  lastUpdated: string;
};

export type ImmediateActionEntry = {
  actionId: string;
  recommendationId: string;
  title: string;
  recommendedAction: string;
  urgency: string;
  expectedOutcome: string;
  confidence: number;
  status: string;
};

export type StrategicActionEntry = {
  actionId: string;
  recommendationId: string;
  title: string;
  strategicObjective: string;
  recommendedAction: string;
  strategicImpact: string;
  confidence: number;
  status: string;
};

export type GrowthRecommendationEntry = {
  recommendationEntryId: string;
  recommendationId: string;
  title: string;
  expectedRoi: string;
  businessImpact: string;
  confidence: number;
  status: string;
};

export type FinancialRecommendationEntry = {
  recommendationEntryId: string;
  recommendationId: string;
  title: string;
  financialImpact: string;
  expectedRoi: string;
  confidence: number;
  status: string;
};

export type RiskRecommendationEntry = {
  recommendationEntryId: string;
  recommendationId: string;
  title: string;
  currentSituation: string;
  recommendedAction: string;
  urgency: string;
  confidence: number;
  status: string;
};

export type ExpectedOutcomeEntry = {
  outcomeId: string;
  recommendationId: string;
  title: string;
  expectedOutcome: string;
  expectedRoi: string;
  confidence: number;
  status: string;
};

export type ExecutiveConfidenceEntry = {
  confidenceId: string;
  recommendationId: string;
  title: string;
  confidence: number;
  evidenceQuality: string;
  validationStatus: string;
};

export type ExecutiveAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type PillowAdvisoryEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type AdvisoryPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type ExecutiveAdvisoryEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  advisoryIntelligenceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeRecommendationCount: number;
  immediateActionCount: number;
  strategicActionCount: number;
  averageRecommendationConfidence: number;
  topExecutiveRecommendations: AdvisoryRecommendationRecord[];
  immediateActions: ImmediateActionEntry[];
  strategicActions: StrategicActionEntry[];
  growthRecommendations: GrowthRecommendationEntry[];
  financialRecommendations: FinancialRecommendationEntry[];
  riskRecommendations: RiskRecommendationEntry[];
  expectedOutcomes: ExpectedOutcomeEntry[];
  executiveConfidence: ExecutiveConfidenceEntry[];
  executiveAnalysis: ExecutiveAnalysisMetric[];
  advisoryPipeline: AdvisoryPipelineStep[];
  pillowEvaluations: PillowAdvisoryEvaluationMetric[];
  advisoryPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE415: boolean;
};
