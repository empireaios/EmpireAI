/** E5-02 — Executive Constitutional Monitor frontend types (mirrors Pillow PILLOW-ECM-001). */

export type ConstitutionalValidationRecord = {
  validationId: string;
  executiveAction: string;
  applicableConstitution: string;
  applicablePolicy: string;
  domain: string;
  classification: string;
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
  domain: string;
  label: string;
  healthScore: number;
  status: string;
  summary: string;
};

export type ExecutiveComplianceEntry = {
  complianceId: string;
  executiveAction: string;
  domain: string;
  complianceRate: number;
  classification: string;
  lastValidated: string;
  status: string;
};

export type ActiveViolationEntry = {
  violationId: string;
  title: string;
  domain: string;
  classification: string;
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
  domain: string;
  priority: string;
  queuedAt: string;
  estimatedResolution: string;
  status: string;
};

export type ConstitutionalAnalysisMetric = {
  domain: string;
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
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ConstitutionalValidationPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type ExecutiveConstitutionalMonitor = {
  engineVersion: string;
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
  constitutionalPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE503: boolean;
};
