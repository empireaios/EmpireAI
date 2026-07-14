/** P7-07 — Explainability Architecture frontend types (mirrors Pillow PILLOW-EX-001). */

export type ExplainabilityRecommendation = {
  id: string;
  classification: string;
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
  confidence: {
    confidencePercent: number;
    confidenceClassification: string;
    supportingEvidence: string[];
    knownAssumptions: string[];
    knownUnknowns: string[];
    reevaluationConditions: string[];
  };
  evidence: Array<{
    kind: string;
    source: string;
    summary: string;
    reference?: string;
  }>;
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
  architectureVersion: "P7-07";
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
