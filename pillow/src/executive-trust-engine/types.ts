/** PILLOW-ETRUST-001 — Executive Trust Engine types (E5-12). */

import type {
  EXECUTIVE_TRUST_PIPELINE,
  TRUST_PRINCIPLES,
  GOVERNED_TRUST_DOMAINS,
  TRUST_CLASSIFICATIONS,
  TRUST_ANALYSIS_DOMAINS,
  PILLOW_TRUST_EVALUATIONS,
  TRUST_LEVEL_THRESHOLDS,
} from "./paths.js";

export type ExecutiveTrustEngineVersion = "E5-12";

export type ExecutiveTrustPipelinePhase = (typeof EXECUTIVE_TRUST_PIPELINE)[number];
export type TrustPrinciple = (typeof TRUST_PRINCIPLES)[number];
export type GovernedTrustDomain = (typeof GOVERNED_TRUST_DOMAINS)[number];
export type TrustClassification = (typeof TRUST_CLASSIFICATIONS)[number];
export type TrustAnalysisDomain = (typeof TRUST_ANALYSIS_DOMAINS)[number];
export type PillowTrustEvaluation = (typeof PILLOW_TRUST_EVALUATIONS)[number];
export type TrustLevelThreshold = (typeof TRUST_LEVEL_THRESHOLDS)[number];

export type TrustAssessmentRecord = {
  trustId: string;
  subject: string;
  category: GovernedTrustDomain;
  trustScore: number;
  confidenceScore: number;
  supportingEvidence: string[];
  historicalPerformance: string;
  businessImpact: string;
  strategicImpact: string;
  governanceImpact: string;
  riskFactors: string;
  recommendedActions: string;
  confidence: number;
  timestamp: string;
  classification: TrustClassification;
};

export type ExecutiveTrustScoreEntry = {
  scoreId: string;
  domain: GovernedTrustDomain;
  label: string;
  trustScore: number;
  confidenceScore: number;
  level: string;
  status: string;
};

export type GovernanceTrustScoreEntry = {
  scoreId: string;
  engine: string;
  trustScore: number;
  confidenceScore: number;
  complianceRate: number;
  status: string;
};

export type DecisionConfidenceEntry = {
  confidenceId: string;
  subject: string;
  category: string;
  confidenceScore: number;
  trustScore: number;
  evidenceCount: number;
  status: string;
};

export type TrustTrendEntry = {
  trendId: string;
  domain: string;
  subject: string;
  trend: string;
  velocity: string;
  direction: string;
  currentScore: number;
  status: string;
};

export type TrustHistoryEntry = {
  historyId: string;
  trustId: string;
  subject: string;
  event: string;
  previousScore: number;
  newScore: number;
  timestamp: string;
};

export type ConfidenceAnalysisEntry = {
  analysisId: string;
  domain: TrustAnalysisDomain;
  label: string;
  score: number;
  confidence: number;
  status: string;
  summary: string;
};

export type TrustAnalysisMetric = {
  domain: TrustAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveTrustRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowTrustEvaluationMetric = {
  domain: PillowTrustEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveTrustPipelineStep = {
  phase: ExecutiveTrustPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type TrustMonitoringStatus = {
  backgroundMonitoring: string;
  totalAssessments: number;
  lowTrustCount: number;
  criticalTrustCount: number;
  trustHealthScore: number;
  lastScanAt: string;
  nextScanAt: string;
};

export type TrustExecutiveReport = {
  currentStatus: string;
  executiveTrustScore: number;
  governanceTrustScore: number;
  decisionConfidence: number;
  executiveSummary: string;
  generatedAt: string;
};

export type TrustMetrics = {
  totalAssessments: number;
  averageTrustScore: number;
  averageConfidenceScore: number;
  highTrustCount: number;
  lowTrustCount: number;
  governanceTrustScore: number;
  executiveTrustScore: number;
};

export type TrustHealthStatus = {
  status: string;
  healthScore: number;
  assessmentCount: number;
  unsupportedRatingCount: number;
  auditEventCount: number;
  lastEventAt: string | null;
};

export type TrustAuditLogEntry = {
  auditId: string;
  trustId: string;
  event: string;
  actor: string;
  previousScore: number;
  newScore: number;
  details: string;
  timestamp: string;
};

export type ExecutiveTrustEngine = {
  engineVersion: ExecutiveTrustEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  trustHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  executiveTrustScore: number;
  governanceTrustScore: number;
  decisionConfidence: number;
  totalAssessmentCount: number;
  highTrustCount: number;
  lowTrustCount: number;
  criticalTrustCount: number;
  unsupportedRatingCount: number;
  trustAssessmentRegister: TrustAssessmentRecord[];
  executiveTrustScores: ExecutiveTrustScoreEntry[];
  governanceTrustScores: GovernanceTrustScoreEntry[];
  decisionConfidenceEntries: DecisionConfidenceEntry[];
  trustTrends: TrustTrendEntry[];
  trustHistory: TrustHistoryEntry[];
  confidenceAnalysis: ConfidenceAnalysisEntry[];
  trustAnalysis: TrustAnalysisMetric[];
  executiveTrustPipeline: ExecutiveTrustPipelineStep[];
  recommendedActions: ExecutiveTrustRecommendation[];
  pillowEvaluations: PillowTrustEvaluationMetric[];
  trustPrinciples: TrustPrinciple[];
  governedDomains: GovernedTrustDomain[];
  pillowAdvisory: string[];
  integrations: {
    enterpriseGovernanceFramework: string;
    executiveConstitutionalMonitor: string;
    enterpriseAuditEngine: string;
    executiveComplianceEngine: string;
    executiveEthicsEngine: string;
    executiveAccountabilityEngine: string;
    executiveTransparencyEngine: string;
    executiveExceptionManager: string;
    enterpriseRiskGovernance: string;
    executiveReviewBoard: string;
    executivePolicyEvolution: string;
    executiveIntelligenceProgramme: string;
    executiveDecisionEngine: string;
    financialExecutiveProgramme: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  trustAuditHistory: TrustAuditLogEntry[];
  monitoringStatus: TrustMonitoringStatus;
  executiveReport: TrustExecutiveReport;
  metrics: TrustMetrics;
  healthStatus: TrustHealthStatus;
  readyForE513: boolean;
};
