/** PILLOW-TDE-001 — Threat Detection Engine types (E4-04). */

import type {
  THREAT_DETECTION_PIPELINE,
  THREAT_DETECTION_PRINCIPLES,
  GOVERNED_THREAT_DOMAINS,
  THREAT_CLASSIFICATIONS,
  THREAT_ANALYSIS_DOMAINS,
  PILLOW_THREAT_EVALUATIONS,
} from "./paths.js";

export type ThreatDetectionEngineVersion = "E4-04";

export type ThreatDetectionPipelinePhase = (typeof THREAT_DETECTION_PIPELINE)[number];
export type ThreatDetectionPrinciple = (typeof THREAT_DETECTION_PRINCIPLES)[number];
export type GovernedThreatDomain = (typeof GOVERNED_THREAT_DOMAINS)[number];
export type ThreatClassification = (typeof THREAT_CLASSIFICATIONS)[number];
export type ThreatAnalysisDomain = (typeof THREAT_ANALYSIS_DOMAINS)[number];
export type PillowThreatEvaluation = (typeof PILLOW_THREAT_EVALUATIONS)[number];

export type ThreatDetectionPipelineStep = {
  phase: ThreatDetectionPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ThreatRecord = {
  threatId: string;
  title: string;
  category: ThreatClassification;
  domain: GovernedThreatDomain;
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
  domain: ThreatAnalysisDomain;
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
  domain: PillowThreatEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ThreatDetectionEngine = {
  engineVersion: ThreatDetectionEngineVersion;
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
  threatPrinciples: ThreatDetectionPrinciple[];
  governedDomains: GovernedThreatDomain[];
  pillowAdvisory: string[];
  integrations: {
    marketIntelligenceEngine: string;
    competitorIntelligenceEngine: string;
    opportunityDiscoveryEngine: string;
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
  readyForE405: boolean;
};
