/** E2-02 — Risk Assessment Engine frontend types (mirrors Pillow PILLOW-RAE-001). */

export type EnterpriseRisk = {
  riskId: string;
  title: string;
  description: string;
  category: string;
  domain: string;
  source: string;
  probability: number;
  impact: number;
  overallRiskScore: number;
  severity: string;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  dependencies: string[];
  mitigationPlan: string;
  residualRisk: string;
  confidence: number;
  evidence: string[];
  status: string;
  trend: "rising" | "stable" | "declining";
};

export type CriticalRiskItem = {
  order: number;
  riskId: string;
  title: string;
  severity: string;
  overallRiskScore: number;
  mitigationStatus: string;
  owner: string;
};

export type RiskScoreMetric = {
  dimension: string;
  label: string;
  score: number;
  status: string;
};

export type RiskTrendEntry = {
  period: string;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  overallScore: number;
};

export type MitigationStatusEntry = {
  riskId: string;
  title: string;
  mitigationPlan: string;
  status: string;
  residualRisk: string;
  progress: number;
};

export type RiskPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type RiskAssessmentRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowRiskEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type RiskAssessmentEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeRiskCount: number;
  criticalRiskCount: number;
  currentRisks: EnterpriseRisk[];
  criticalRisks: CriticalRiskItem[];
  riskScores: RiskScoreMetric[];
  riskTrends: RiskTrendEntry[];
  mitigationStatus: MitigationStatusEntry[];
  riskPipeline: RiskPipelineStep[];
  recommendedActions: RiskAssessmentRecommendation[];
  pillowEvaluations: PillowRiskEvaluationMetric[];
  riskPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE203: boolean;
};
