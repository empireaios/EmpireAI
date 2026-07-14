/** PILLOW-CBI-001 — Customer Behaviour Intelligence types (E4-06). */

import type {
  CUSTOMER_INTELLIGENCE_PIPELINE,
  CUSTOMER_BEHAVIOUR_PRINCIPLES,
  GOVERNED_CUSTOMER_DOMAINS,
  CUSTOMER_CLASSIFICATIONS,
  CUSTOMER_ANALYSIS_DOMAINS,
  PILLOW_CUSTOMER_EVALUATIONS,
} from "./paths.js";

export type CustomerBehaviourIntelligenceVersion = "E4-06";

export type CustomerIntelligencePipelinePhase = (typeof CUSTOMER_INTELLIGENCE_PIPELINE)[number];
export type CustomerBehaviourPrinciple = (typeof CUSTOMER_BEHAVIOUR_PRINCIPLES)[number];
export type GovernedCustomerDomain = (typeof GOVERNED_CUSTOMER_DOMAINS)[number];
export type CustomerClassification = (typeof CUSTOMER_CLASSIFICATIONS)[number];
export type CustomerAnalysisDomain = (typeof CUSTOMER_ANALYSIS_DOMAINS)[number];
export type PillowCustomerEvaluation = (typeof PILLOW_CUSTOMER_EVALUATIONS)[number];

export type CustomerIntelligencePipelineStep = {
  phase: CustomerIntelligencePipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type CustomerInsightRecord = {
  customerInsightId: string;
  customerSegment: string;
  category: CustomerClassification;
  domain: GovernedCustomerDomain;
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
  domain: CustomerAnalysisDomain;
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
  domain: PillowCustomerEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type CustomerBehaviourIntelligence = {
  engineVersion: CustomerBehaviourIntelligenceVersion;
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
  customerPrinciples: CustomerBehaviourPrinciple[];
  governedDomains: GovernedCustomerDomain[];
  pillowAdvisory: string[];
  integrations: {
    marketIntelligenceEngine: string;
    competitorIntelligenceEngine: string;
    opportunityDiscoveryEngine: string;
    threatDetectionEngine: string;
    industryIntelligenceEngine: string;
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
  readyForE407: boolean;
};
