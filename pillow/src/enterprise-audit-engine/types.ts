/** PILLOW-EAUD-001 — Enterprise Audit Engine types (E5-03). */

import type {
  ENTERPRISE_AUDIT_PIPELINE,
  AUDIT_PRINCIPLES,
  GOVERNED_AUDIT_DOMAINS,
  AUDIT_CLASSIFICATIONS,
  AUDIT_ANALYSIS_DOMAINS,
  PILLOW_AUDIT_EVALUATIONS,
} from "./paths.js";

export type EnterpriseAuditEngineVersion = "E5-03";

export type EnterpriseAuditPipelinePhase = (typeof ENTERPRISE_AUDIT_PIPELINE)[number];
export type AuditPrinciple = (typeof AUDIT_PRINCIPLES)[number];
export type GovernedAuditDomain = (typeof GOVERNED_AUDIT_DOMAINS)[number];
export type AuditClassification = (typeof AUDIT_CLASSIFICATIONS)[number];
export type AuditAnalysisDomain = (typeof AUDIT_ANALYSIS_DOMAINS)[number];
export type PillowAuditEvaluation = (typeof PILLOW_AUDIT_EVALUATIONS)[number];

export type EnterpriseAuditPipelineStep = {
  phase: EnterpriseAuditPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type AuditRecord = {
  auditId: string;
  auditName: string;
  category: AuditClassification;
  domain: GovernedAuditDomain;
  scope: string;
  owner: string;
  evidence: string[];
  findings: string[];
  rootCause: string;
  severity: string;
  businessImpact: string;
  strategicImpact: string;
  correctiveActions: string[];
  priority: string;
  confidence: number;
  timestamp: string;
  status: string;
};

export type AuditScheduleEntry = {
  scheduleId: string;
  auditName: string;
  domain: GovernedAuditDomain;
  category: AuditClassification;
  scheduledAt: string;
  frequency: string;
  owner: string;
  status: string;
};

export type CriticalFindingEntry = {
  findingId: string;
  title: string;
  auditId: string;
  domain: GovernedAuditDomain;
  severity: string;
  rootCause: string;
  businessImpact: string;
  correctiveAction: string;
  status: string;
};

export type CorrectiveActionEntry = {
  actionId: string;
  findingId: string;
  title: string;
  domain: GovernedAuditDomain;
  owner: string;
  dueDate: string;
  progress: number;
  status: string;
};

export type AuditCoverageEntry = {
  coverageId: string;
  domain: GovernedAuditDomain;
  label: string;
  coverageRate: number;
  lastAudited: string;
  nextScheduled: string;
  status: string;
};

export type AuditAnalysisMetric = {
  domain: AuditAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type EnterpriseAuditRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowAuditEvaluationMetric = {
  domain: PillowAuditEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type EnterpriseAuditEngine = {
  engineVersion: EnterpriseAuditEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  auditHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeAuditCount: number;
  criticalFindingCount: number;
  openCorrectiveActionCount: number;
  auditCoverageRate: number;
  averageAuditConfidence: number;
  resolvedFindingCount: number;
  auditRecords: AuditRecord[];
  auditSchedule: AuditScheduleEntry[];
  criticalFindings: CriticalFindingEntry[];
  correctiveActions: CorrectiveActionEntry[];
  auditCoverage: AuditCoverageEntry[];
  auditAnalysis: AuditAnalysisMetric[];
  enterpriseAuditPipeline: EnterpriseAuditPipelineStep[];
  recommendedActions: EnterpriseAuditRecommendation[];
  pillowEvaluations: PillowAuditEvaluationMetric[];
  auditPrinciples: AuditPrinciple[];
  governedDomains: GovernedAuditDomain[];
  pillowAdvisory: string[];
  integrations: {
    enterpriseGovernanceFramework: string;
    executiveConstitutionalMonitor: string;
    executiveIntelligenceProgramme: string;
    executiveDecisionEngine: string;
    financialExecutiveProgramme: string;
    decisionAuditEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE504: boolean;
};
