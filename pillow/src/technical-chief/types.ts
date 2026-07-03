/** PILLOW-TC-001 — Technical Chief types (Phase 3). */

export type FailureCategory =
  | "runtime"
  | "deployment"
  | "frontend"
  | "backend"
  | "database"
  | "worker"
  | "redis"
  | "authentication"
  | "api"
  | "performance"
  | "memory"
  | "architecture_drift"
  | "unknown";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type CertificationDecision = "certified" | "conditional" | "rejected";

export interface SystemDiagnosis {
  categories: FailureCategory[];
  symptoms: string[];
  affectedModules: string[];
  affectedLayers: string[];
  severity: RiskLevel;
  summary: string;
}

export interface RootCauseAnalysis {
  rootCause: string;
  upstreamCauses: string[];
  downstreamConsequences: string[];
  businessImpact: string;
  technicalImpact: string;
  recurrenceLikelihood: RiskLevel;
  confidenceScore: number;
  affectedModules: string[];
}

export interface EngineeringPlanStep {
  order: number;
  action: string;
  files: string[];
  rationale: string;
}

export interface EngineeringPlan {
  recommendedSolution: string;
  alternativeSolutions: string[];
  steps: EngineeringPlanStep[];
  requiredFiles: string[];
  expectedChanges: string[];
  acceptanceCriteria: string[];
  validationPlan: string[];
  rollbackStrategy: string;
  deploymentPlan: string;
}

export interface RiskAssessment {
  productionRisk: RiskLevel;
  architecturalRisk: RiskLevel;
  securityRisk: RiskLevel;
  performanceRisk: RiskLevel;
  dataIntegrityRisk: RiskLevel;
  businessContinuityRisk: RiskLevel;
  technicalDebtImpact: RiskLevel;
  maintenanceCost: RiskLevel;
  summary: string;
  mitigations: string[];
}

export interface ImplementationValidation {
  implementationVerified: boolean;
  architectureVerified: boolean;
  repositoryConsistencyVerified: boolean;
  runtimeVerified: boolean;
  testsVerified: boolean;
  buildVerified: boolean;
  deploymentVerified: boolean;
  productionVerified: boolean;
  businessLogicVerified: boolean;
  findings: string[];
  blockers: string[];
}

export interface CursorReviewFinding {
  code: string;
  severity: RiskLevel;
  message: string;
  file?: string;
}

export interface CursorEngineeringReview {
  approved: boolean;
  findings: CursorReviewFinding[];
  missingFiles: string[];
  incorrectAssumptions: string[];
  incompleteAreas: string[];
  dependencyIssues: string[];
  regressions: string[];
  technicalDebt: string[];
  requiredCorrections: string[];
}

export interface ExecutiveEngineeringReport {
  version: "PILLOW-TC-001";
  generatedAt: string;
  summary: string;
  diagnosis: SystemDiagnosis;
  rootCause: RootCauseAnalysis;
  filesChanged: string[];
  architectureImpact: string;
  risks: RiskAssessment;
  validation: ImplementationValidation;
  remainingRisks: string[];
  certificationDecision: CertificationDecision;
  certificationRationale: string;
}

export interface TechnicalChiefAnalysisRequest {
  problemDescription: string;
  symptomHints?: string[];
  changedFiles?: string[];
  screenPath?: string;
}

export interface TechnicalChiefAnalysisResult {
  analysisId: string;
  analyzedAt: string;
  durationMs: number;
  diagnosis: SystemDiagnosis;
  rootCause: RootCauseAnalysis;
  plan: EngineeringPlan;
  risks: RiskAssessment;
  executiveBrief: string;
}

export interface TechnicalChiefState {
  chiefVersion: "PILLOW-TC-001";
  status: "ready";
  initializedAt: string;
  totalAnalyses: number;
  totalCertifications: number;
  lastAnalysisId: string | null;
}
