/** PILLOW-ECM-001 — Executive Constitutional Monitor types (E5-02). */

import type {
  CONSTITUTIONAL_VALIDATION_PIPELINE,
  CONSTITUTIONAL_PRINCIPLES,
  GOVERNED_CONSTITUTIONAL_DOMAINS,
  VALIDATION_CLASSIFICATIONS,
  CONSTITUTIONAL_ANALYSIS_DOMAINS,
  PILLOW_CONSTITUTIONAL_EVALUATIONS,
} from "./paths.js";

export type ExecutiveConstitutionalMonitorVersion = "E5-02";

export type ConstitutionalValidationPipelinePhase = (typeof CONSTITUTIONAL_VALIDATION_PIPELINE)[number];
export type ConstitutionalPrinciple = (typeof CONSTITUTIONAL_PRINCIPLES)[number];
export type GovernedConstitutionalDomain = (typeof GOVERNED_CONSTITUTIONAL_DOMAINS)[number];
export type ValidationClassification = (typeof VALIDATION_CLASSIFICATIONS)[number];
export type ConstitutionalAnalysisDomain = (typeof CONSTITUTIONAL_ANALYSIS_DOMAINS)[number];
export type PillowConstitutionalEvaluation = (typeof PILLOW_CONSTITUTIONAL_EVALUATIONS)[number];

export type ConstitutionalValidationPipelineStep = {
  phase: ConstitutionalValidationPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ConstitutionalValidationRecord = {
  validationId: string;
  executiveAction: string;
  applicableConstitution: string;
  applicablePolicy: string;
  domain: GovernedConstitutionalDomain;
  classification: ValidationClassification;
  validationStatus: string;
  violationSeverity: string;
  businessImpact: string;
  strategicImpact: string;
  requiredCorrection: string;
  confidence: number;
  evidence: string[];
  timestamp: string;
};

export type ConstitutionHealthEntry = {
  healthId: string;
  domain: GovernedConstitutionalDomain;
  label: string;
  healthScore: number;
  status: string;
  summary: string;
};

export type ExecutiveComplianceEntry = {
  complianceId: string;
  executiveAction: string;
  domain: GovernedConstitutionalDomain;
  complianceRate: number;
  classification: ValidationClassification;
  lastValidated: string;
  status: string;
};

export type ActiveViolationEntry = {
  violationId: string;
  title: string;
  domain: GovernedConstitutionalDomain;
  classification: ValidationClassification;
  severity: string;
  affectedSystem: string;
  requiredCorrection: string;
  status: string;
};

export type ConstitutionStatusEntry = {
  statusId: string;
  constitutionLayer: string;
  alignment: string;
  complianceRate: number;
  lastValidated: string;
  status: string;
};

export type ValidationQueueEntry = {
  queueId: string;
  executiveAction: string;
  domain: GovernedConstitutionalDomain;
  priority: string;
  queuedAt: string;
  estimatedResolution: string;
  status: string;
};

export type ConstitutionalAnalysisMetric = {
  domain: ConstitutionalAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveConstitutionalRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowConstitutionalEvaluationMetric = {
  domain: PillowConstitutionalEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveConstitutionalMonitor = {
  engineVersion: ExecutiveConstitutionalMonitorVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  constitutionalHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeValidationCount: number;
  activeViolationCount: number;
  constitutionalComplianceRate: number;
  averageValidationConfidence: number;
  fullyConstitutionalCount: number;
  constitutionalValidations: ConstitutionalValidationRecord[];
  constitutionHealth: ConstitutionHealthEntry[];
  executiveCompliance: ExecutiveComplianceEntry[];
  activeViolations: ActiveViolationEntry[];
  constitutionStatus: ConstitutionStatusEntry[];
  validationQueue: ValidationQueueEntry[];
  constitutionalAnalysis: ConstitutionalAnalysisMetric[];
  constitutionalValidationPipeline: ConstitutionalValidationPipelineStep[];
  recommendedActions: ExecutiveConstitutionalRecommendation[];
  pillowEvaluations: PillowConstitutionalEvaluationMetric[];
  constitutionalPrinciples: ConstitutionalPrinciple[];
  governedDomains: GovernedConstitutionalDomain[];
  pillowAdvisory: string[];
  integrations: {
    enterpriseGovernanceFramework: string;
    executiveIntelligenceProgramme: string;
    executiveDecisionEngine: string;
    financialExecutiveProgramme: string;
    corporateVisionEngine: string;
    executivePolicyEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE503: boolean;
};
