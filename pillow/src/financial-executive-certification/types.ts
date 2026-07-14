/** PILLOW-FEC-001 — Financial Executive Certification types (E3-16). */

import type {
  FEC_CERTIFICATION_GATES,
  FEC_CERTIFICATION_VALIDATIONS,
  FEC_INTEGRATION_VALIDATIONS,
  FEC_FINANCIAL_QUALITY_DOMAINS,
  FEC_DEFECT_SEVERITIES,
  FEC_DEFECT_CATEGORIES,
  FEC_AI_CFO_CAPABILITIES,
  FEC_WORKFLOW_VALIDATIONS,
  FEC_STRESS_TESTS,
  FEC_PERFORMANCE_BENCHMARKS,
} from "./paths.js";

export type FinancialExecutiveCertificationVersion = "E3-16";

export type FecCertificationGateId = (typeof FEC_CERTIFICATION_GATES)[number];
export type FecCertificationValidationDomain = (typeof FEC_CERTIFICATION_VALIDATIONS)[number];
export type FecIntegrationValidationDomain = (typeof FEC_INTEGRATION_VALIDATIONS)[number];
export type FecFinancialQualityDomain = (typeof FEC_FINANCIAL_QUALITY_DOMAINS)[number];
export type FecDefectSeverity = (typeof FEC_DEFECT_SEVERITIES)[number];
export type FecDefectCategory = (typeof FEC_DEFECT_CATEGORIES)[number];
export type FecAiCfoCapabilityDomain = (typeof FEC_AI_CFO_CAPABILITIES)[number];
export type FecWorkflowValidationDomain = (typeof FEC_WORKFLOW_VALIDATIONS)[number];
export type FecStressTestDomain = (typeof FEC_STRESS_TESTS)[number];
export type FecPerformanceBenchmarkDomain = (typeof FEC_PERFORMANCE_BENCHMARKS)[number];

export type FecCertificationScopeItem = {
  missionId: string;
  key: string;
  title: string;
  status: "certified" | "pending" | "failed";
  healthScore: number;
  integrated: boolean;
  evidence: string[];
};

export type FecCertificationGate = {
  gateId: FecCertificationGateId;
  gateNumber: number;
  label: string;
  result: "PASS" | "FAIL";
  summary: string;
};

export type FecCertificationValidationItem = {
  domain: FecCertificationValidationDomain;
  label: string;
  status: string;
  verified: boolean;
};

export type FecIntegrationValidationItem = {
  domain: FecIntegrationValidationDomain;
  label: string;
  status: string;
  verified: boolean;
};

export type FecFinancialQualityMetric = {
  domain: FecFinancialQualityDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type FecCertificationDefect = {
  defectId: string;
  title: string;
  severity: FecDefectSeverity;
  category: FecDefectCategory;
  recommendation: string;
};

export type FecAiCfoCapabilityItem = {
  capability: FecAiCfoCapabilityDomain;
  label: string;
  missionId: string;
  status: "operational" | "degraded" | "unavailable";
  verified: boolean;
  summary: string;
};

export type FecWorkflowValidationItem = {
  workflow: FecWorkflowValidationDomain;
  label: string;
  status: "passed" | "warning" | "failed";
  verified: boolean;
  summary: string;
};

export type FecStressTestResult = {
  test: FecStressTestDomain;
  label: string;
  result: "PASS" | "WARN" | "FAIL";
  summary: string;
};

export type FecPerformanceBenchmark = {
  benchmark: FecPerformanceBenchmarkDomain;
  label: string;
  targetMs: number;
  actualMs: number;
  status: "within_target" | "acceptable" | "exceeded";
  summary: string;
};

export type FecExecutiveReadinessAssessment = {
  readinessScore: number;
  readinessLevel: "executive_ready" | "near_ready" | "not_ready";
  aiCfoOperational: boolean;
  capabilitiesVerified: number;
  capabilitiesTotal: number;
  workflowsPassed: number;
  workflowsTotal: number;
  summary: string;
};

export type FinancialExecutiveCertification = {
  architectureVersion: FinancialExecutiveCertificationVersion;
  computedAt: string;
  certificationSummary: string;
  certificationHealth: string;
  healthScore: number;
  programmeCertified: boolean;
  phaseE3Completed: boolean;
  certificationScope: FecCertificationScopeItem[];
  certificationGates: FecCertificationGate[];
  gatesPassed: number;
  gatesTotal: number;
  allGatesPassed: boolean;
  certificationValidations: FecCertificationValidationItem[];
  integrationValidations: FecIntegrationValidationItem[];
  financialQualityReview: FecFinancialQualityMetric[];
  aiCfoCapabilityAssessment: FecAiCfoCapabilityItem[];
  workflowValidations: FecWorkflowValidationItem[];
  stressTestResults: FecStressTestResult[];
  performanceBenchmarks: FecPerformanceBenchmark[];
  executiveReadinessAssessment: FecExecutiveReadinessAssessment;
  certificationDecision: "CERTIFIED" | "CONDITIONAL" | "NOT_CERTIFIED";
  e3CompletionPercentage: number;
  defects: FecCertificationDefect[];
  criticalDefectCount: number;
  highDefectCount: number;
  mediumDefectCount: number;
  lowDefectCount: number;
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE401: boolean;
  nextPhase: string;
  nextMission: string;
};
