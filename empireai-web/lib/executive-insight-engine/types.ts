/** E4-10 — Executive Insight Engine frontend types (mirrors Pillow PILLOW-EIE-001). */

export type InsightRecord = {
  insightId: string;
  title: string;
  category: string;
  domain: string;
  strategicObjective: string;
  sourceIntelligence: string;
  businessContext: string;
  keyFinding: string;
  businessImpact: string;
  financialImpact: string;
  strategicImpact: string;
  priority: string;
  recommendedAction: string;
  confidence: number;
  evidence: string[];
  lastUpdated: string;
};

export type TopPriorityEntry = {
  priorityId: string;
  insightId: string;
  title: string;
  priority: string;
  urgency: string;
  recommendedAction: string;
  confidence: number;
  status: string;
};

export type StrategicFindingEntry = {
  findingId: string;
  insightId: string;
  title: string;
  keyFinding: string;
  strategicImpact: string;
  confidence: number;
  status: string;
};

export type CriticalOpportunityEntry = {
  opportunityId: string;
  insightId: string;
  title: string;
  opportunityValue: string;
  recommendedAction: string;
  confidence: number;
  status: string;
};

export type CriticalRiskEntry = {
  riskId: string;
  insightId: string;
  title: string;
  riskExposure: string;
  recommendedAction: string;
  confidence: number;
  status: string;
};

export type ConfidenceLevelEntry = {
  levelId: string;
  insightId: string;
  title: string;
  confidence: number;
  evidenceQuality: string;
  validationStatus: string;
};

export type InsightAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveInsightRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowInsightEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type InsightPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type ExecutiveInsightEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  insightIntelligenceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeInsightCount: number;
  criticalPriorityCount: number;
  strategicFindingCount: number;
  averageInsightConfidence: number;
  executiveInsights: InsightRecord[];
  topPriorities: TopPriorityEntry[];
  strategicFindings: StrategicFindingEntry[];
  criticalOpportunities: CriticalOpportunityEntry[];
  criticalRisks: CriticalRiskEntry[];
  recommendedActions: ExecutiveInsightRecommendation[];
  confidenceLevels: ConfidenceLevelEntry[];
  insightAnalysis: InsightAnalysisMetric[];
  insightPipeline: InsightPipelineStep[];
  pillowEvaluations: PillowInsightEvaluationMetric[];
  insightPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE411: boolean;
};
