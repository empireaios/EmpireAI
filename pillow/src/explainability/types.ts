/** PILLOW-EX-001 — Explainability Architecture types (P7-07). */

export type ExplainabilityArchitectureVersion = "P7-07";

export type ExplainabilityClassification =
  | "strategic"
  | "architectural"
  | "engineering"
  | "business"
  | "commerce"
  | "runtime"
  | "production"
  | "recovery"
  | "performance"
  | "security"
  | "knowledge"
  | "constitutional";

export type ExplainabilityEvidenceKind =
  | "vision"
  | "soul"
  | "ctd"
  | "constitution"
  | "roadmap"
  | "current_mission"
  | "architecture"
  | "repository"
  | "production_truth"
  | "journey"
  | "runtime"
  | "historical"
  | "validation";

export type ExplainabilityEvidence = {
  kind: ExplainabilityEvidenceKind;
  source: string;
  summary: string;
  reference?: string;
};

export type ExplainabilityConfidence = {
  confidencePercent: number;
  confidenceClassification: string;
  supportingEvidence: string[];
  knownAssumptions: string[];
  knownUnknowns: string[];
  reevaluationConditions: string[];
};

export type ExplainabilityRecommendation = {
  id: string;
  classification: ExplainabilityClassification;
  title: string;
  system: string;
  why: string;
  what: string;
  how: string;
  proof: string;
  businessImpact: string;
  engineeringImpact: string;
  architectureImpact: string;
  productionImpact: string;
  risk: string;
  expectedBenefit: string;
  confidence: ExplainabilityConfidence;
  evidence: ExplainabilityEvidence[];
  alternativeOptions: string[];
  computedAt: string;
};

export type ExplainabilitySystemPanel = {
  system: string;
  status: string;
  summary: string;
  explanations: string[];
};

export type ExplainabilityArchitecture = {
  architectureVersion: ExplainabilityArchitectureVersion;
  computedAt: string;
  grandKingSummary: string;
  currentRecommendation: ExplainabilityRecommendation | null;
  recommendations: ExplainabilityRecommendation[];
  systemsCovered: string[];
  pillow: ExplainabilitySystemPanel;
  ecc: ExplainabilitySystemPanel;
  supervisor: ExplainabilitySystemPanel;
  builder: ExplainabilitySystemPanel;
  guardian: ExplainabilitySystemPanel;
  vie: ExplainabilitySystemPanel;
  recovery: ExplainabilitySystemPanel;
  automation: ExplainabilitySystemPanel;
};
