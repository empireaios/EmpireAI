/** E4-04 — Threat Detection Engine frontend types (mirrors Pillow PILLOW-TDE-001). */

export type ThreatRecord = {
  threatId: string;
  title: string;
  category: string;
  domain: string;
  source: string;
  affectedBusiness: string;
  probability: number;
  impact: number;
  severity: string;
  urgency: string;
  businessImpact: string;
  financialImpact: string;
  strategicImpact: string;
  mitigationRecommendation: string;
  confidence: number;
  evidence: string[];
};

export type CriticalThreatEntry = {
  criticalId: string;
  threatId: string;
  title: string;
  severity: string;
  probability: number;
  impact: number;
  urgency: string;
  status: string;
};

export type EmergingThreatEntry = {
  emergingId: string;
  threatId: string;
  title: string;
  category: string;
  probability: number;
  timeHorizon: string;
  discoverySignal: string;
  status: string;
};

export type ThreatTrendEntry = {
  trendId: string;
  trend: string;
  direction: string;
  affectedThreats: string;
  detectionSignal: string;
  confidence: number;
  status: string;
};

export type BusinessImpactEntry = {
  impactId: string;
  threatId: string;
  title: string;
  businessImpact: string;
  financialImpact: string;
  strategicImpact: string;
  severity: string;
};

export type RiskHeatmapEntry = {
  heatmapId: string;
  domain: string;
  threatCount: number;
  avgProbability: number;
  avgImpact: number;
  riskLevel: string;
  status: string;
};

export type MitigationStatusEntry = {
  mitigationId: string;
  threatId: string;
  title: string;
  mitigationRecommendation: string;
  status: string;
  residualRisk: string;
  owner: string;
};

export type ThreatAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ThreatDetectionRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowThreatEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ThreatDetectionPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type ThreatDetectionEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  threatDetectionHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  detectedThreatCount: number;
  criticalThreatCount: number;
  emergingThreatCount: number;
  averageThreatScore: number;
  threatDashboard: ThreatRecord[];
  criticalThreats: CriticalThreatEntry[];
  emergingThreats: EmergingThreatEntry[];
  threatTrends: ThreatTrendEntry[];
  businessImpact: BusinessImpactEntry[];
  riskHeatmap: RiskHeatmapEntry[];
  mitigationStatus: MitigationStatusEntry[];
  threatAnalysis: ThreatAnalysisMetric[];
  threatDetectionPipeline: ThreatDetectionPipelineStep[];
  recommendedActions: ThreatDetectionRecommendation[];
  pillowEvaluations: PillowThreatEvaluationMetric[];
  threatPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE405: boolean;
};
