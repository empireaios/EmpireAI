/** E4-06 — Customer Behaviour Intelligence frontend types (mirrors Pillow PILLOW-CBI-001). */

export type CustomerInsightRecord = {
  customerInsightId: string;
  customerSegment: string;
  category: string;
  domain: string;
  behaviourCategory: string;
  purchaseIntent: string;
  buyingFrequency: string;
  averageSpend: string;
  customerLifetimeValue: string;
  retentionProbability: number;
  satisfactionTrend: string;
  growthOpportunity: string;
  riskLevel: number;
  strategicRelevance: string;
  confidence: number;
  evidence: string[];
};

export type CustomerSegmentEntry = {
  segmentId: string;
  customerInsightId: string;
  customerSegment: string;
  category: string;
  segmentSize: string;
  averageSpend: string;
  strategicRelevance: string;
  status: string;
};

export type BuyingTrendEntry = {
  trendId: string;
  trend: string;
  direction: string;
  affectedSegments: string;
  behaviourSignal: string;
  confidence: number;
  status: string;
};

export type PurchaseIntentEntry = {
  intentId: string;
  customerInsightId: string;
  customerSegment: string;
  purchaseIntent: string;
  intentScore: number;
  buyingFrequency: string;
  status: string;
};

export type CustomerLifetimeValueEntry = {
  clvId: string;
  customerInsightId: string;
  customerSegment: string;
  customerLifetimeValue: string;
  averageSpend: string;
  retentionProbability: number;
  status: string;
};

export type RetentionTrendEntry = {
  retentionId: string;
  customerInsightId: string;
  customerSegment: string;
  retentionProbability: number;
  satisfactionTrend: string;
  trendDirection: string;
  status: string;
};

export type CustomerRiskEntry = {
  riskId: string;
  customerInsightId: string;
  customerSegment: string;
  riskLevel: number;
  severity: string;
  riskType: string;
  mitigation: string;
  status: string;
};

export type CustomerGrowthOpportunityEntry = {
  opportunityId: string;
  customerInsightId: string;
  customerSegment: string;
  growthOpportunity: string;
  purchaseIntent: string;
  strategicRelevance: string;
  status: string;
};

export type CustomerAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type CustomerBehaviourRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowCustomerEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type CustomerIntelligencePipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type CustomerBehaviourIntelligence = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  customerIntelligenceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  monitoredSegmentCount: number;
  highValueSegmentCount: number;
  atRiskSegmentCount: number;
  averageRetentionProbability: number;
  customerSegments: CustomerSegmentEntry[];
  buyingTrends: BuyingTrendEntry[];
  purchaseIntent: PurchaseIntentEntry[];
  customerLifetimeValue: CustomerLifetimeValueEntry[];
  retentionTrends: RetentionTrendEntry[];
  customerRisks: CustomerRiskEntry[];
  growthOpportunities: CustomerGrowthOpportunityEntry[];
  customerInsights: CustomerInsightRecord[];
  customerAnalysis: CustomerAnalysisMetric[];
  customerIntelligencePipeline: CustomerIntelligencePipelineStep[];
  recommendedActions: CustomerBehaviourRecommendation[];
  pillowEvaluations: PillowCustomerEvaluationMetric[];
  customerPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE407: boolean;
};
