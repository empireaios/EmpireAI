/** E3-11 — Capital Risk Engine frontend types (mirrors Pillow PILLOW-CRE-001). */

export type CapitalRisk = {
  riskId: string;
  title: string;
  category: string;
  domain: string;
  businessUnit: string;
  strategicObjective: string;
  capitalExposure: string;
  probability: string;
  impact: string;
  riskScore: number;
  businessImpact: string;
  financialImpact: string;
  mitigationStrategy: string;
  residualRisk: string;
  confidence: number;
  evidence: string[];
  status: string;
};

export type CapitalExposureEntry = {
  riskId: string;
  title: string;
  category: string;
  domain: string;
  capitalExposure: string;
  riskScore: number;
  residualRisk: string;
  status: string;
};

export type RiskDistributionEntry = {
  category: string;
  riskCount: number;
  totalExposure: string;
  averageScore: number;
  severity: string;
};

export type RiskTrendEntry = {
  period: string;
  totalExposure: string;
  highRiskCount: number;
  mitigatedCount: number;
  residualExposure: string;
  trend: string;
};

export type CapitalRiskMitigationEntry = {
  riskId: string;
  title: string;
  mitigationStrategy: string;
  progress: string;
  residualRisk: string;
  owner: string;
  status: string;
};

export type LiquidityPositionEntry = {
  metric: string;
  value: string;
  target: string;
  buffer: string;
  status: string;
};

export type FinancialStabilityEntry = {
  metric: string;
  value: string;
  riskLevel: string;
  trend: string;
  status: string;
};

export type CapitalProtectionEntry = {
  domain: string;
  protectionScore: number;
  exposure: string;
  mitigationCoverage: string;
  status: string;
};

export type CapitalRiskRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type CapitalRiskEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  capitalRiskHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeRiskCount: number;
  highRiskCount: number;
  averageRiskScore: number;
  totalCapitalExposure: string;
  mitigatedRiskCount: number;
  capitalRisks: CapitalRisk[];
  capitalExposure: CapitalExposureEntry[];
  riskDistribution: RiskDistributionEntry[];
  riskTrends: RiskTrendEntry[];
  mitigationStatus: CapitalRiskMitigationEntry[];
  liquidityPosition: LiquidityPositionEntry[];
  financialStability: FinancialStabilityEntry[];
  capitalProtection: CapitalProtectionEntry[];
  riskAnalysis: Array<{ domain: string; label: string; score: number; status: string; summary: string }>;
  capitalRiskPipeline: Array<{ phase: string; label: string; order: number; status: string }>;
  recommendedActions: CapitalRiskRecommendation[];
  pillowEvaluations: Array<{ domain: string; label: string; status: string; summary: string }>;
  riskPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE312: boolean;
};
