/** E5-12 — Executive Trust Engine frontend types (mirrors Pillow PILLOW-ETRUST-001). */

export type TrustAssessmentRecord = {
  trustId: string;
  subject: string;
  category: string;
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
  classification: string;
};

export type ExecutiveTrustEngine = {
  engineVersion: string;
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
  executiveTrustScores: Array<{
    scoreId: string;
    domain: string;
    label: string;
    trustScore: number;
    confidenceScore: number;
    level: string;
    status: string;
  }>;
  governanceTrustScores: Array<{
    scoreId: string;
    engine: string;
    trustScore: number;
    confidenceScore: number;
    complianceRate: number;
    status: string;
  }>;
  decisionConfidenceEntries: Array<{
    confidenceId: string;
    subject: string;
    category: string;
    confidenceScore: number;
    trustScore: number;
    evidenceCount: number;
    status: string;
  }>;
  trustTrends: Array<{
    trendId: string;
    domain: string;
    subject: string;
    trend: string;
    velocity: string;
    direction: string;
    currentScore: number;
    status: string;
  }>;
  trustHistory: Array<{
    historyId: string;
    trustId: string;
    subject: string;
    event: string;
    previousScore: number;
    newScore: number;
    timestamp: string;
  }>;
  confidenceAnalysis: Array<{
    analysisId: string;
    domain: string;
    label: string;
    score: number;
    confidence: number;
    status: string;
    summary: string;
  }>;
  trustAnalysis: Array<{ domain: string; label: string; score: number; status: string; summary: string }>;
  executiveTrustPipeline: Array<{ phase: string; label: string; order: number; status: string }>;
  recommendedActions: Array<{
    id: string;
    title: string;
    category: string;
    why: string;
    what: string;
    how: string;
    confidencePercent: number;
  }>;
  pillowEvaluations: Array<{ domain: string; label: string; status: string; summary: string }>;
  trustPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  monitoringStatus: {
    backgroundMonitoring: string;
    totalAssessments: number;
    lowTrustCount: number;
    criticalTrustCount: number;
    trustHealthScore: number;
    lastScanAt: string;
    nextScanAt: string;
  };
  executiveReport: {
    currentStatus: string;
    executiveTrustScore: number;
    governanceTrustScore: number;
    decisionConfidence: number;
    executiveSummary: string;
    generatedAt: string;
  };
  metrics: {
    totalAssessments: number;
    averageTrustScore: number;
    averageConfidenceScore: number;
    highTrustCount: number;
    lowTrustCount: number;
    governanceTrustScore: number;
    executiveTrustScore: number;
  };
  healthStatus: {
    status: string;
    healthScore: number;
    assessmentCount: number;
    unsupportedRatingCount: number;
    auditEventCount: number;
    lastEventAt: string | null;
  };
  readyForE513: boolean;
};
