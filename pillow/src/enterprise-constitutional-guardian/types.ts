/** PILLOW-ECGUARD-001 — Enterprise Constitutional Guardian types (E5-13). */

import type {
  CONSTITUTIONAL_GUARDIAN_PIPELINE,
  GUARDIAN_PRINCIPLES,
  GOVERNED_PROTECTION_DOMAINS,
  PROTECTION_CLASSIFICATIONS,
  CONSTITUTIONAL_ANALYSIS_DOMAINS,
  PILLOW_GUARDIAN_EVALUATIONS,
  PROTECTION_EVENT_STATUS_LEVELS,
  THREAT_SEVERITY_LEVELS,
} from "./paths.js";

export type EnterpriseConstitutionalGuardianVersion = "E5-13";

export type ConstitutionalGuardianPipelinePhase = (typeof CONSTITUTIONAL_GUARDIAN_PIPELINE)[number];
export type GuardianPrinciple = (typeof GUARDIAN_PRINCIPLES)[number];
export type GovernedProtectionDomain = (typeof GOVERNED_PROTECTION_DOMAINS)[number];
export type ProtectionClassification = (typeof PROTECTION_CLASSIFICATIONS)[number];
export type ConstitutionalAnalysisDomain = (typeof CONSTITUTIONAL_ANALYSIS_DOMAINS)[number];
export type PillowGuardianEvaluation = (typeof PILLOW_GUARDIAN_EVALUATIONS)[number];
export type ProtectionEventStatusLevel = (typeof PROTECTION_EVENT_STATUS_LEVELS)[number];
export type ThreatSeverityLevel = (typeof THREAT_SEVERITY_LEVELS)[number];

export type GuardianProtectionEvent = {
  guardianEventId: string;
  protectedAsset: string;
  protectionCategory: GovernedProtectionDomain;
  detectedThreat: string;
  severity: ThreatSeverityLevel;
  businessImpact: string;
  strategicImpact: string;
  recommendedProtection: string;
  protectiveActionTaken: string;
  currentStatus: ProtectionEventStatusLevel;
  confidence: number;
  evidence: string[];
  timestamp: string;
  classification: ProtectionClassification;
};

export type ConstitutionHealthEntry = {
  healthId: string;
  domain: string;
  score: number;
  status: string;
  summary: string;
};

export type ProtectedAssetEntry = {
  assetId: string;
  assetName: string;
  category: GovernedProtectionDomain;
  protectionLevel: string;
  lastValidated: string;
  status: string;
};

export type ConstitutionViolationEntry = {
  violationId: string;
  guardianEventId: string;
  protectedAsset: string;
  detectedThreat: string;
  severity: ThreatSeverityLevel;
  status: ProtectionEventStatusLevel;
  resolved: boolean;
};

export type RepositoryIntegrityEntry = {
  integrityId: string;
  domain: string;
  score: number;
  buildStatus: string;
  importIntegrity: string;
  status: string;
};

export type ArchitectureIntegrityEntry = {
  architectureId: string;
  domain: string;
  score: number;
  canonicalCompliance: string;
  driftDetected: boolean;
  status: string;
};

export type ProtectionEventEntry = {
  eventId: string;
  guardianEventId: string;
  protectedAsset: string;
  event: string;
  severity: ThreatSeverityLevel;
  actionTaken: string;
  timestamp: string;
};

export type ConstitutionalAnalysisMetric = {
  domain: ConstitutionalAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveGuardianRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowGuardianEvaluationMetric = {
  domain: PillowGuardianEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ConstitutionalGuardianPipelineStep = {
  phase: ConstitutionalGuardianPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type GuardianMonitoringStatus = {
  backgroundMonitoring: string;
  totalProtectionEvents: number;
  activeViolations: number;
  resolvedEvents: number;
  constitutionHealthScore: number;
  lastScanAt: string;
  nextScanAt: string;
};

export type GuardianExecutiveReport = {
  currentStatus: string;
  constitutionHealthScore: number;
  protectedAssetCount: number;
  activeViolations: number;
  executiveSummary: string;
  generatedAt: string;
};

export type GuardianMetrics = {
  totalEvents: number;
  activeViolationCount: number;
  resolvedCount: number;
  protectedAssetCount: number;
  averageConfidence: number;
  constitutionHealthScore: number;
  repositoryIntegrityScore: number;
  architectureIntegrityScore: number;
};

export type GuardianHealthStatus = {
  status: string;
  healthScore: number;
  protectionEventCount: number;
  unresolvedCriticalCount: number;
  auditEventCount: number;
  lastEventAt: string | null;
};

export type GuardianAuditLogEntry = {
  auditId: string;
  guardianEventId: string;
  event: string;
  actor: string;
  previousStatus: string;
  newStatus: string;
  details: string;
  timestamp: string;
};

export type EnterpriseConstitutionalGuardian = {
  engineVersion: EnterpriseConstitutionalGuardianVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  constitutionHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  constitutionHealthScore: number;
  protectedAssetCount: number;
  activeViolationCount: number;
  resolvedEventCount: number;
  unresolvedCriticalCount: number;
  guardianProtectionRegister: GuardianProtectionEvent[];
  constitutionHealthEntries: ConstitutionHealthEntry[];
  protectedAssets: ProtectedAssetEntry[];
  constitutionViolations: ConstitutionViolationEntry[];
  repositoryIntegrity: RepositoryIntegrityEntry[];
  architectureIntegrity: ArchitectureIntegrityEntry[];
  protectionEvents: ProtectionEventEntry[];
  constitutionalAnalysis: ConstitutionalAnalysisMetric[];
  constitutionalGuardianPipeline: ConstitutionalGuardianPipelineStep[];
  recommendedActions: ExecutiveGuardianRecommendation[];
  pillowEvaluations: PillowGuardianEvaluationMetric[];
  guardianPrinciples: GuardianPrinciple[];
  governedDomains: GovernedProtectionDomain[];
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
    executiveIntelligenceProgramme: string;
    executiveDecisionEngine: string;
    financialExecutiveProgramme: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  guardianAuditHistory: GuardianAuditLogEntry[];
  monitoringStatus: GuardianMonitoringStatus;
  executiveReport: GuardianExecutiveReport;
  metrics: GuardianMetrics;
  healthStatus: GuardianHealthStatus;
  readyForE514: boolean;
};
