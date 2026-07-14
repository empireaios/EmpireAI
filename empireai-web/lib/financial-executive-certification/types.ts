/** E3-16 — Financial Executive Certification frontend types (mirrors Pillow PILLOW-FEC-001). */

export type FecCertificationScopeItem = {
  missionId: string;
  key: string;
  title: string;
  status: string;
  healthScore: number;
  integrated: boolean;
  evidence: string[];
};

export type FecCertificationGate = {
  gateId: string;
  gateNumber: number;
  label: string;
  result: "PASS" | "FAIL";
  summary: string;
};

export type FecCertificationValidationItem = {
  domain: string;
  label: string;
  status: string;
  verified: boolean;
};

export type FecIntegrationValidationItem = {
  domain: string;
  label: string;
  status: string;
  verified: boolean;
};

export type FecFinancialQualityMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type FecCertificationDefect = {
  defectId: string;
  title: string;
  severity: string;
  category: string;
  recommendation: string;
};

export type FecAiCfoCapabilityItem = {
  capability: string;
  label: string;
  missionId: string;
  status: string;
  verified: boolean;
  summary: string;
};

export type FecWorkflowValidationItem = {
  workflow: string;
  label: string;
  status: string;
  verified: boolean;
  summary: string;
};

export type FecStressTestResult = {
  test: string;
  label: string;
  result: "PASS" | "WARN" | "FAIL";
  summary: string;
};

export type FecPerformanceBenchmark = {
  benchmark: string;
  label: string;
  targetMs: number;
  actualMs: number;
  status: string;
  summary: string;
};

export type FecExecutiveReadinessAssessment = {
  readinessScore: number;
  readinessLevel: string;
  aiCfoOperational: boolean;
  capabilitiesVerified: number;
  capabilitiesTotal: number;
  workflowsPassed: number;
  workflowsTotal: number;
  summary: string;
};

export type FinancialExecutiveCertification = {
  architectureVersion: string;
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
  certificationDecision: string;
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
