/** E1-13 — Strategic Alignment Monitor frontend types (mirrors Pillow PILLOW-SAM-001). */

export type AlignmentAssessment = {
  alignmentId: string;
  scope: string;
  domain: string;
  relatedVision: string;
  relatedStrategicObjective: string;
  currentAlignmentScore: number;
  deviationLevel: string;
  businessImpact: string;
  strategicImpact: string;
  riskLevel: string;
  correctiveRecommendation: string;
  confidence: number;
  evidence: string[];
};

export type AlignmentScoreMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type DriftDetectionItem = {
  driftId: string;
  driftType: string;
  label: string;
  scope: string;
  severity: string;
  deviationLevel: string;
  description: string;
  correctiveAction: string;
  detectedAt: string;
};

export type AlignmentTrendItem = {
  period: string;
  overallScore: number;
  visionScore: number;
  programmeScore: number;
  trend: string;
};

export type StrategicAlignmentRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type AlignmentPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type PillowAlignmentEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type StrategicAlignmentMonitor = {
  architectureVersion: string;
  computedAt: string;
  monitorSummary: string;
  monitorHealth: string;
  overallAlignmentScore: number;
  visionAlignment: string;
  programmeAlignment: string;
  departmentAlignment: string;
  businessAlignment: string;
  currentDrift: string;
  healthScore: number;
  alignmentAssessments: AlignmentAssessment[];
  alignmentScoring: AlignmentScoreMetric[];
  driftDetections: DriftDetectionItem[];
  alignmentTrends: AlignmentTrendItem[];
  alignmentPipeline: AlignmentPipelineStep[];
  recommendedActions: StrategicAlignmentRecommendation[];
  pillowEvaluations: PillowAlignmentEvaluationMetric[];
  alignmentPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE114: boolean;
};
