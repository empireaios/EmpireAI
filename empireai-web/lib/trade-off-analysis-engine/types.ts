/** E2-10 — Trade-off Analysis Engine frontend types (mirrors Pillow PILLOW-TOAE-001). */

export type DecisionAlternative = {
  alternativeId: string;
  tradeOffId: string;
  label: string;
  description: string;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  operationalImpact: string;
  expectedBenefits: string[];
  expectedCosts: string[];
  riskAssessment: string;
  tradeOffScore: number;
  expectedRoi: string;
  confidence: number;
  evidence: string[];
  recommended: boolean;
};

export type TradeOffAnalysis = {
  tradeOffId: string;
  decisionId: string;
  title: string;
  description: string;
  category: string;
  domain: string;
  alternatives: string[];
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  operationalImpact: string;
  dependencies: string[];
  expectedBenefits: string[];
  expectedCosts: string[];
  riskAssessment: string;
  tradeOffScore: number;
  confidence: number;
  evidence: string[];
  recommendedOption: string;
  status: string;
};

export type TradeOffComparisonEntry = {
  tradeOffId: string;
  title: string;
  dimension: string;
  bestAlternative: string;
  score: number;
  summary: string;
};

export type TradeOffScoringMetric = {
  tradeOffId: string;
  title: string;
  alternativeId: string;
  alternativeLabel: string;
  tradeOffScore: number;
  expectedRoi: string;
  riskLevel: string;
  strategicAlignment: string;
  recommended: boolean;
};

export type TradeOffPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type TradeOffAnalysisRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowTradeOffEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type TradeOffAnalysisEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  tradeOffHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeTradeOffCount: number;
  pendingDecisionCount: number;
  recommendedOptionCount: number;
  tradeOffAnalyses: TradeOffAnalysis[];
  decisionAlternatives: DecisionAlternative[];
  tradeOffComparisons: TradeOffComparisonEntry[];
  tradeOffScoring: TradeOffScoringMetric[];
  tradeOffPipeline: TradeOffPipelineStep[];
  recommendedActions: TradeOffAnalysisRecommendation[];
  pillowEvaluations: PillowTradeOffEvaluationMetric[];
  tradeOffPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE211: boolean;
};
