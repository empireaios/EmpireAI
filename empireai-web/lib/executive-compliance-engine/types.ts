/** E5-04 — Executive Compliance Engine frontend types (mirrors Pillow PILLOW-ECOMP-001). */

export type ComplianceRecord = {
  complianceId: string;
  complianceCategory: string;
  applicablePolicy: string;
  applicableConstitution: string;
  scope: string;
  classification: string;
  validationStatus: string;
  violationSeverity: string;
  businessImpact: string;
  strategicImpact: string;
  correctiveAction: string;
  priority: string;
  confidence: number;
  evidence: string[];
  timestamp: string;
};

export type ComplianceViolationEntry = {
  violationId: string;
  title: string;
  complianceId: string;
  domain: string;
  classification: string;
  severity: string;
  businessImpact: string;
  correctiveAction: string;
  status: string;
};

export type CriticalViolationEntry = {
  criticalId: string;
  title: string;
  domain: string;
  severity: string;
  affectedSystem: string;
  requiredCorrection: string;
  status: string;
};

export type CorrectionProgressEntry = {
  progressId: string;
  violationId: string;
  title: string;
  domain: string;
  owner: string;
  progress: number;
  dueDate: string;
  status: string;
};

export type ComplianceTrendEntry = {
  trendId: string;
  domain: string;
  label: string;
  currentScore: number;
  previousScore: number;
  direction: string;
  status: string;
};

export type ComplianceAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveComplianceRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowComplianceEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveCompliancePipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type ExecutiveComplianceEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  complianceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  complianceScore: number;
  activeComplianceRecordCount: number;
  activeViolationCount: number;
  criticalViolationCount: number;
  averageCorrectionProgress: number;
  fullyCompliantCount: number;
  complianceRecords: ComplianceRecord[];
  activeViolations: ComplianceViolationEntry[];
  criticalViolations: CriticalViolationEntry[];
  correctionProgress: CorrectionProgressEntry[];
  complianceTrends: ComplianceTrendEntry[];
  complianceAnalysis: ComplianceAnalysisMetric[];
  executiveCompliancePipeline: ExecutiveCompliancePipelineStep[];
  recommendedActions: ExecutiveComplianceRecommendation[];
  pillowEvaluations: PillowComplianceEvaluationMetric[];
  compliancePrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  policyRegistry?: Array<{
    policyId: string;
    title: string;
    category: string;
    version: string;
    enabled: boolean;
    severity: string;
    owner: string;
  }>;
  monitoringStatus?: {
    realTimeValidation: string;
    driftDetection: string;
    complianceScore: number;
    activeViolationCount: number;
  };
  executiveReport?: {
    currentStatus: string;
    complianceScore: number;
    executiveSummary: string;
    policyEffectiveness: string;
  };
  complianceScorecard?: {
    overallScore: number;
    grade: string;
    correctionProgress: number;
  };
  healthStatus?: {
    status: string;
    enabledPolicyCount: number;
    evaluationCount: number;
  };
  metrics?: {
    totalEvaluations: number;
    passCount: number;
    violationCount: number;
    criticalCount: number;
  };
  readyForE505: boolean;
};
