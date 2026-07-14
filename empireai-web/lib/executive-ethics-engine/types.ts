/** E5-05 — Executive Ethics Engine frontend types (mirrors Pillow PILLOW-EETH-001). */

export type EthicalAssessment = {
  assessmentId: string;
  executiveAction: string;
  category: string;
  businessContext: string;
  ethicalConsiderations: string;
  stakeholders: string[];
  benefits: string;
  potentialHarm: string;
  businessImpact: string;
  strategicImpact: string;
  ethicsRating: string;
  recommendedAction: string;
  confidence: number;
  evidence: string[];
  timestamp: string;
};

export type EthicalRiskEntry = {
  riskId: string;
  title: string;
  assessmentId: string;
  domain: string;
  classification: string;
  severity: string;
  potentialHarm: string;
  recommendedAction: string;
  status: string;
};

export type EthicsTrendEntry = {
  trendId: string;
  domain: string;
  label: string;
  currentRating: number;
  previousRating: number;
  direction: string;
  status: string;
};

export type EthicsAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveEthicsRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowEthicsEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveEthicsPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type ExecutiveEthicsEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  ethicsHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  executiveEthicsRating: number;
  ethicalAssessmentCount: number;
  ethicalRiskCount: number;
  criticalEthicalRiskCount: number;
  fullyEthicalCount: number;
  ethicalAssessments: EthicalAssessment[];
  potentialEthicalRisks: EthicalRiskEntry[];
  ethicsTrends: EthicsTrendEntry[];
  ethicsAnalysis: EthicsAnalysisMetric[];
  executiveEthicsPipeline: ExecutiveEthicsPipelineStep[];
  recommendedActions: ExecutiveEthicsRecommendation[];
  pillowEvaluations: PillowEthicsEvaluationMetric[];
  ethicsPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE506: boolean;
};
