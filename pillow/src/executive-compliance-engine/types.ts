/** PILLOW-ECOMP-001 — Executive Compliance Engine types (E5-04). */

import type {
  EXECUTIVE_COMPLIANCE_PIPELINE,
  COMPLIANCE_PRINCIPLES,
  GOVERNED_COMPLIANCE_DOMAINS,
  COMPLIANCE_CLASSIFICATIONS,
  COMPLIANCE_ANALYSIS_DOMAINS,
  PILLOW_COMPLIANCE_EVALUATIONS,
  COMPLIANCE_POLICY_CATEGORIES,
  COMPLIANCE_EVALUATION_RESULTS,
  COMPLIANCE_ENFORCEMENT_MODES,
  COMPLIANCE_ACTION_TYPES,
} from "./paths.js";

export type ExecutiveComplianceEngineVersion = "E5-04";

export type ExecutiveCompliancePipelinePhase = (typeof EXECUTIVE_COMPLIANCE_PIPELINE)[number];
export type CompliancePrinciple = (typeof COMPLIANCE_PRINCIPLES)[number];
export type GovernedComplianceDomain = (typeof GOVERNED_COMPLIANCE_DOMAINS)[number];
export type ComplianceClassification = (typeof COMPLIANCE_CLASSIFICATIONS)[number];
export type ComplianceAnalysisDomain = (typeof COMPLIANCE_ANALYSIS_DOMAINS)[number];
export type PillowComplianceEvaluation = (typeof PILLOW_COMPLIANCE_EVALUATIONS)[number];
export type CompliancePolicyCategory = (typeof COMPLIANCE_POLICY_CATEGORIES)[number];
export type ComplianceEvaluationResult = (typeof COMPLIANCE_EVALUATION_RESULTS)[number];
export type ComplianceEnforcementMode = (typeof COMPLIANCE_ENFORCEMENT_MODES)[number];
export type ComplianceActionType = (typeof COMPLIANCE_ACTION_TYPES)[number];

export type CompliancePolicyRecord = {
  policyId: string;
  title: string;
  description: string;
  category: CompliancePolicyCategory;
  version: string;
  enabled: boolean;
  priority: number;
  severity: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  owner: string;
  metadata: Record<string, string>;
};

export type ComplianceEvaluationRequest = {
  actor: string;
  action: string;
  actionType: ComplianceActionType;
  context?: Record<string, unknown>;
  policyIds?: string[];
};

export type ComplianceEnforcementDecision = {
  result: ComplianceEvaluationResult;
  configuredMode: ComplianceEnforcementMode;
  effectiveMode: ComplianceEnforcementMode;
  allowed: boolean;
  blocked: boolean;
  message: string;
};

export type ComplianceEvaluationResponse = {
  evaluationId: string;
  result: ComplianceEvaluationResult;
  violatedPolicyIds: string[];
  explanation: string;
  severity: string;
  recommendedRemediation: string;
  timestamp: string;
  executionContext: Record<string, unknown>;
  enforcement: ComplianceEnforcementDecision;
  policiesChecked: string[];
};

export type ComplianceEvaluationLogEntry = {
  evaluationId: string;
  timestamp: string;
  actor: string;
  action: string;
  actionType: string;
  policiesChecked: string[];
  result: ComplianceEvaluationResult;
  violations: string[];
  enforcementAction: string;
  reviewer: string | null;
  explanation: string;
  executionContext: Record<string, unknown>;
};

export type ComplianceMonitoringStatus = {
  realTimeValidation: string;
  scheduledScans: string;
  periodicReviews: string;
  backgroundMonitoring: string;
  driftDetection: string;
  lastScanAt: string;
  nextScanAt: string;
  alertThresholdPercent: number;
  complianceScore: number;
  activeViolationCount: number;
  criticalViolationCount: number;
};

export type ComplianceExecutiveReport = {
  currentStatus: string;
  complianceScore: number;
  activeViolations: number;
  criticalViolations: number;
  violationTrend: number;
  executiveSummary: string;
  policyEffectiveness: string;
  generatedAt: string;
};

export type ComplianceDepartmentSummary = {
  department: string;
  violationCount: number;
  criticalCount: number;
  status: string;
};

export type ComplianceScorecard = {
  overallScore: number;
  fullyCompliantPercent: number;
  correctionProgress: number;
  grade: string;
  generatedAt: string;
};

export type ComplianceHealthStatus = {
  status: string;
  healthScore: number;
  complianceScore: number;
  policyCount: number;
  enabledPolicyCount: number;
  evaluationCount: number;
  lastEvaluationAt: string | null;
};

export type ComplianceMetrics = {
  totalEvaluations: number;
  passCount: number;
  warningCount: number;
  violationCount: number;
  criticalCount: number;
  blockCount: number;
  averageComplianceScore: number;
};

export type ExecutiveCompliancePipelineStep = {
  phase: ExecutiveCompliancePipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ComplianceRecord = {
  complianceId: string;
  complianceCategory: GovernedComplianceDomain;
  applicablePolicy: string;
  applicableConstitution: string;
  scope: string;
  classification: ComplianceClassification;
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
  domain: GovernedComplianceDomain;
  classification: ComplianceClassification;
  severity: string;
  businessImpact: string;
  correctiveAction: string;
  status: string;
};

export type CriticalViolationEntry = {
  criticalId: string;
  title: string;
  domain: GovernedComplianceDomain;
  severity: string;
  affectedSystem: string;
  requiredCorrection: string;
  status: string;
};

export type CorrectionProgressEntry = {
  progressId: string;
  violationId: string;
  title: string;
  domain: GovernedComplianceDomain;
  owner: string;
  progress: number;
  dueDate: string;
  status: string;
};

export type ComplianceTrendEntry = {
  trendId: string;
  domain: GovernedComplianceDomain;
  label: string;
  currentScore: number;
  previousScore: number;
  direction: string;
  status: string;
};

export type ComplianceAnalysisMetric = {
  domain: ComplianceAnalysisDomain;
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
  domain: PillowComplianceEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveComplianceEngine = {
  engineVersion: ExecutiveComplianceEngineVersion;
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
  compliancePrinciples: CompliancePrinciple[];
  governedDomains: GovernedComplianceDomain[];
  pillowAdvisory: string[];
  integrations: {
    enterpriseGovernanceFramework: string;
    executiveConstitutionalMonitor: string;
    enterpriseAuditEngine: string;
    executiveIntelligenceProgramme: string;
    executiveDecisionEngine: string;
    financialExecutiveProgramme: string;
    executivePolicyEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  policyRegistry: CompliancePolicyRecord[];
  monitoringStatus: ComplianceMonitoringStatus;
  executiveReport: ComplianceExecutiveReport;
  departmentSummaries: ComplianceDepartmentSummary[];
  complianceScorecard: ComplianceScorecard;
  healthStatus: ComplianceHealthStatus;
  metrics: ComplianceMetrics;
  readyForE505: boolean;
};
