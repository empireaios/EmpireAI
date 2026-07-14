/** E5-09 — Enterprise Risk Governance frontend types (mirrors Pillow PILLOW-ERISK-001). */

export type EnterpriseRiskRecord = {
  riskId: string;
  riskTitle: string;
  category: string;
  businessArea: string;
  riskDescription: string;
  probability: number;
  severity: string;
  businessImpact: string;
  financialImpact: string;
  strategicImpact: string;
  owner: string;
  mitigationPlan: string;
  residualRisk: string;
  status: string;
  confidence: number;
  evidence: string[];
  classification: string;
};

export type CriticalRiskEntry = {
  criticalId: string;
  riskId: string;
  title: string;
  category: string;
  owner: string;
  severity: string;
  mitigationProgress: number;
  status: string;
};

export type RiskHeatMapEntry = {
  heatId: string;
  riskId: string;
  title: string;
  category: string;
  probability: number;
  severity: string;
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
  category: string;
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
  category: string;
  severity: string;
  accountability: string;
  status: string;
};

export type RiskAnalysisMetric = {
  domain: string;
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
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type EnterpriseRiskPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
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

export type EnterpriseRiskGovernance = {
  engineVersion: string;
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
  riskGovernancePrinciples: string[];
  governedCategories: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  monitoringStatus?: RiskMonitoringStatus;
  executiveReport?: RiskExecutiveReport;
  metrics?: RiskMetrics;
  healthStatus?: RiskHealthStatus;
  readyForE510: boolean;
};
