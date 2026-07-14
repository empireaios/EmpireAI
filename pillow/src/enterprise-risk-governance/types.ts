/** PILLOW-ERISK-001 — Enterprise Risk Governance types (E5-09). */

import type {
  ENTERPRISE_RISK_PIPELINE,
  RISK_GOVERNANCE_PRINCIPLES,
  GOVERNED_RISK_CATEGORIES,
  RISK_CLASSIFICATIONS,
  RISK_ANALYSIS_DOMAINS,
  PILLOW_RISK_EVALUATIONS,
  RISK_SEVERITY_LEVELS,
  RISK_STATUS_LEVELS,
} from "./paths.js";

export type EnterpriseRiskGovernanceVersion = "E5-09";

export type EnterpriseRiskPipelinePhase = (typeof ENTERPRISE_RISK_PIPELINE)[number];
export type RiskGovernancePrinciple = (typeof RISK_GOVERNANCE_PRINCIPLES)[number];
export type GovernedRiskCategory = (typeof GOVERNED_RISK_CATEGORIES)[number];
export type RiskClassification = (typeof RISK_CLASSIFICATIONS)[number];
export type RiskAnalysisDomain = (typeof RISK_ANALYSIS_DOMAINS)[number];
export type PillowRiskEvaluation = (typeof PILLOW_RISK_EVALUATIONS)[number];
export type RiskSeverityLevel = (typeof RISK_SEVERITY_LEVELS)[number];
export type RiskStatusLevel = (typeof RISK_STATUS_LEVELS)[number];

export type EnterpriseRiskRecord = {
  riskId: string;
  riskTitle: string;
  category: GovernedRiskCategory;
  businessArea: string;
  riskDescription: string;
  probability: number;
  severity: RiskSeverityLevel;
  businessImpact: string;
  financialImpact: string;
  strategicImpact: string;
  owner: string;
  mitigationPlan: string;
  residualRisk: string;
  status: RiskStatusLevel;
  confidence: number;
  evidence: string[];
  classification: RiskClassification;
};

export type CriticalRiskEntry = {
  criticalId: string;
  riskId: string;
  title: string;
  category: GovernedRiskCategory;
  owner: string;
  severity: RiskSeverityLevel;
  mitigationProgress: number;
  status: string;
};

export type RiskHeatMapEntry = {
  heatId: string;
  riskId: string;
  title: string;
  category: GovernedRiskCategory;
  probability: number;
  severity: RiskSeverityLevel;
  exposureScore: number;
  status: string;
};

export type MitigationProgressEntry = {
  progressId: string;
  riskId: string;
  title: string;
  owner: string;
  mitigationPlan: string;
  progress: number;
  residualRisk: string;
  status: string;
};

export type RiskTrendEntry = {
  trendId: string;
  riskId: string;
  title: string;
  category: GovernedRiskCategory;
  trend: string;
  velocity: string;
  direction: string;
  status: string;
};

export type ExecutiveOwnershipEntry = {
  ownershipId: string;
  riskId: string;
  title: string;
  owner: string;
  category: GovernedRiskCategory;
  severity: RiskSeverityLevel;
  accountability: string;
  status: string;
};

export type RiskAnalysisMetric = {
  domain: RiskAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveRiskRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowRiskEvaluationMetric = {
  domain: PillowRiskEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type EnterpriseRiskPipelineStep = {
  phase: EnterpriseRiskPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type RiskMonitoringStatus = {
  backgroundMonitoring: string;
  criticalCount: number;
  highCount: number;
  unmanagedCriticalCount: number;
  mitigationInProgressCount: number;
  lastScanAt: string;
  nextScanAt: string;
};

export type RiskExecutiveReport = {
  currentStatus: string;
  totalRisks: number;
  criticalRisks: number;
  mitigatedCount: number;
  executiveSummary: string;
  generatedAt: string;
};

export type RiskMetrics = {
  totalRisks: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  mitigatingCount: number;
  resolvedCount: number;
  averageMitigationProgress: number;
};

export type RiskHealthStatus = {
  status: string;
  healthScore: number;
  riskRegisterCount: number;
  criticalWithMitigation: number;
  auditEventCount: number;
  lastEventAt: string | null;
};

export type RiskAuditLogEntry = {
  auditId: string;
  riskId: string;
  event: string;
  actor: string;
  previousStatus: string;
  newStatus: string;
  details: string;
  timestamp: string;
};

export type EnterpriseRiskGovernance = {
  engineVersion: EnterpriseRiskGovernanceVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  riskHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  totalRiskCount: number;
  criticalRiskCount: number;
  highRiskCount: number;
  unmanagedCriticalCount: number;
  mitigationInProgressCount: number;
  enterpriseRiskRegister: EnterpriseRiskRecord[];
  criticalRisks: CriticalRiskEntry[];
  riskHeatMap: RiskHeatMapEntry[];
  mitigationProgress: MitigationProgressEntry[];
  riskTrends: RiskTrendEntry[];
  executiveOwnership: ExecutiveOwnershipEntry[];
  riskAnalysis: RiskAnalysisMetric[];
  enterpriseRiskPipeline: EnterpriseRiskPipelineStep[];
  recommendedActions: ExecutiveRiskRecommendation[];
  pillowEvaluations: PillowRiskEvaluationMetric[];
  riskGovernancePrinciples: RiskGovernancePrinciple[];
  governedCategories: GovernedRiskCategory[];
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
  riskAuditHistory: RiskAuditLogEntry[];
  monitoringStatus: RiskMonitoringStatus;
  executiveReport: RiskExecutiveReport;
  metrics: RiskMetrics;
  healthStatus: RiskHealthStatus;
  readyForE510: boolean;
};
