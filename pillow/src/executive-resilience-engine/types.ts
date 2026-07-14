/** PILLOW-ERES-001 — Executive Resilience Engine types (E5-14). */

import type {
  EXECUTIVE_RESILIENCE_PIPELINE,
  RESILIENCE_PRINCIPLES,
  GOVERNED_RESILIENCE_DOMAINS,
  RESILIENCE_CLASSIFICATIONS,
  RESILIENCE_ANALYSIS_DOMAINS,
  PILLOW_RESILIENCE_EVALUATIONS,
  RECOVERY_STATUS_LEVELS,
  INCIDENT_SEVERITY_LEVELS,
} from "./paths.js";

export type ExecutiveResilienceEngineVersion = "E5-14";

export type ExecutiveResiliencePipelinePhase = (typeof EXECUTIVE_RESILIENCE_PIPELINE)[number];
export type ResiliencePrinciple = (typeof RESILIENCE_PRINCIPLES)[number];
export type GovernedResilienceDomain = (typeof GOVERNED_RESILIENCE_DOMAINS)[number];
export type ResilienceClassification = (typeof RESILIENCE_CLASSIFICATIONS)[number];
export type ResilienceAnalysisDomain = (typeof RESILIENCE_ANALYSIS_DOMAINS)[number];
export type PillowResilienceEvaluation = (typeof PILLOW_RESILIENCE_EVALUATIONS)[number];
export type RecoveryStatusLevel = (typeof RECOVERY_STATUS_LEVELS)[number];
export type IncidentSeverityLevel = (typeof INCIDENT_SEVERITY_LEVELS)[number];

export type ResilienceIncidentRecord = {
  resilienceId: string;
  incidentTitle: string;
  incidentCategory: GovernedResilienceDomain;
  affectedSystems: string;
  severity: IncidentSeverityLevel;
  businessImpact: string;
  strategicImpact: string;
  recoveryStrategy: string;
  recoveryStatus: RecoveryStatusLevel;
  recoveryTime: string;
  responsibleExecutive: string;
  confidence: number;
  evidence: string[];
  timestamp: string;
  classification: ResilienceClassification;
};

export type EnterpriseHealthEntry = {
  healthId: string;
  domain: string;
  score: number;
  status: string;
  summary: string;
};

export type ContinuityStatusEntry = {
  continuityId: string;
  domain: GovernedResilienceDomain;
  label: string;
  availability: number;
  status: string;
  lastValidated: string;
};

export type ActiveIncidentEntry = {
  incidentId: string;
  resilienceId: string;
  incidentTitle: string;
  severity: IncidentSeverityLevel;
  recoveryStatus: RecoveryStatusLevel;
  affectedSystems: string;
};

export type RecoveryProgressEntry = {
  progressId: string;
  resilienceId: string;
  incidentTitle: string;
  recoveryStrategy: string;
  progress: number;
  recoveryStatus: RecoveryStatusLevel;
  recoveryTime: string;
};

export type OperationalReadinessEntry = {
  readinessId: string;
  domain: string;
  score: number;
  status: string;
  summary: string;
};

export type ResilienceAnalysisMetric = {
  domain: ResilienceAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveResilienceRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowResilienceEvaluationMetric = {
  domain: PillowResilienceEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveResiliencePipelineStep = {
  phase: ExecutiveResiliencePipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ResilienceMonitoringStatus = {
  backgroundMonitoring: string;
  totalIncidents: number;
  activeIncidents: number;
  recoveredIncidents: number;
  resilienceHealthScore: number;
  lastScanAt: string;
  nextScanAt: string;
};

export type ResilienceExecutiveReport = {
  currentStatus: string;
  enterpriseHealthScore: number;
  activeIncidents: number;
  recoveryReadiness: number;
  executiveSummary: string;
  generatedAt: string;
};

export type ResilienceMetrics = {
  totalIncidents: number;
  activeIncidentCount: number;
  recoveredCount: number;
  averageRecoveryTime: string;
  enterpriseHealthScore: number;
  operationalReadinessScore: number;
  continuityAvailability: number;
};

export type ResilienceHealthStatus = {
  status: string;
  healthScore: number;
  incidentRegisterCount: number;
  unresolvedCriticalCount: number;
  auditEventCount: number;
  lastEventAt: string | null;
};

export type ResilienceAuditLogEntry = {
  auditId: string;
  resilienceId: string;
  event: string;
  actor: string;
  previousStatus: string;
  newStatus: string;
  details: string;
  timestamp: string;
};

export type ExecutiveResilienceEngine = {
  engineVersion: ExecutiveResilienceEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  resilienceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  enterpriseHealthScore: number;
  operationalReadinessScore: number;
  recoveryReadinessScore: number;
  totalIncidentCount: number;
  activeIncidentCount: number;
  recoveredIncidentCount: number;
  unresolvedCriticalCount: number;
  resilienceIncidentRegister: ResilienceIncidentRecord[];
  enterpriseHealth: EnterpriseHealthEntry[];
  continuityStatus: ContinuityStatusEntry[];
  activeIncidents: ActiveIncidentEntry[];
  recoveryProgress: RecoveryProgressEntry[];
  operationalReadiness: OperationalReadinessEntry[];
  resilienceAnalysis: ResilienceAnalysisMetric[];
  executiveResiliencePipeline: ExecutiveResiliencePipelineStep[];
  recommendedActions: ExecutiveResilienceRecommendation[];
  pillowEvaluations: PillowResilienceEvaluationMetric[];
  resiliencePrinciples: ResiliencePrinciple[];
  governedDomains: GovernedResilienceDomain[];
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
    executiveTrustEngine: string;
    enterpriseConstitutionalGuardian: string;
    executiveIntelligenceProgramme: string;
    executiveDecisionEngine: string;
    financialExecutiveProgramme: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  resilienceAuditHistory: ResilienceAuditLogEntry[];
  monitoringStatus: ResilienceMonitoringStatus;
  executiveReport: ResilienceExecutiveReport;
  metrics: ResilienceMetrics;
  healthStatus: ResilienceHealthStatus;
  readyForE515: boolean;
};
