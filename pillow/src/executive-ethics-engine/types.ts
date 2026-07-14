/** PILLOW-EETH-001 — Executive Ethics Engine types (E5-05). */

import type {
  EXECUTIVE_ETHICS_PIPELINE,
  ETHICS_PRINCIPLES,
  GOVERNED_ETHICS_DOMAINS,
  ETHICS_CLASSIFICATIONS,
  ETHICS_ANALYSIS_DOMAINS,
  PILLOW_ETHICS_EVALUATIONS,
} from "./paths.js";

export type ExecutiveEthicsEngineVersion = "E5-05";

export type ExecutiveEthicsPipelinePhase = (typeof EXECUTIVE_ETHICS_PIPELINE)[number];
export type EthicsPrinciple = (typeof ETHICS_PRINCIPLES)[number];
export type GovernedEthicsDomain = (typeof GOVERNED_ETHICS_DOMAINS)[number];
export type EthicsClassification = (typeof ETHICS_CLASSIFICATIONS)[number];
export type EthicsAnalysisDomain = (typeof ETHICS_ANALYSIS_DOMAINS)[number];
export type PillowEthicsEvaluation = (typeof PILLOW_ETHICS_EVALUATIONS)[number];

export type ExecutiveEthicsPipelineStep = {
  phase: ExecutiveEthicsPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type EthicalAssessment = {
  assessmentId: string;
  executiveAction: string;
  category: GovernedEthicsDomain;
  businessContext: string;
  ethicalConsiderations: string;
  stakeholders: string[];
  benefits: string;
  potentialHarm: string;
  businessImpact: string;
  strategicImpact: string;
  ethicsRating: EthicsClassification;
  recommendedAction: string;
  confidence: number;
  evidence: string[];
  timestamp: string;
};

export type EthicalRiskEntry = {
  riskId: string;
  title: string;
  assessmentId: string;
  domain: GovernedEthicsDomain;
  classification: EthicsClassification;
  severity: string;
  potentialHarm: string;
  recommendedAction: string;
  status: string;
};

export type EthicsTrendEntry = {
  trendId: string;
  domain: GovernedEthicsDomain;
  label: string;
  currentRating: number;
  previousRating: number;
  direction: string;
  status: string;
};

export type EthicsAnalysisMetric = {
  domain: EthicsAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveEthicsRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowEthicsEvaluationMetric = {
  domain: PillowEthicsEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveEthicsEngine = {
  engineVersion: ExecutiveEthicsEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  ethicsHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  executiveEthicsRating: number;
  ethicalAssessmentCount: number;
  ethicalRiskCount: number;
  criticalEthicalRiskCount: number;
  fullyEthicalCount: number;
  ethicalAssessments: EthicalAssessment[];
  potentialEthicalRisks: EthicalRiskEntry[];
  ethicsTrends: EthicsTrendEntry[];
  ethicsAnalysis: EthicsAnalysisMetric[];
  executiveEthicsPipeline: ExecutiveEthicsPipelineStep[];
  recommendedActions: ExecutiveEthicsRecommendation[];
  pillowEvaluations: PillowEthicsEvaluationMetric[];
  ethicsPrinciples: EthicsPrinciple[];
  governedDomains: GovernedEthicsDomain[];
  pillowAdvisory: string[];
  integrations: {
    enterpriseGovernanceFramework: string;
    executiveConstitutionalMonitor: string;
    enterpriseAuditEngine: string;
    executiveComplianceEngine: string;
    executiveIntelligenceProgramme: string;
    executiveDecisionEngine: string;
    financialExecutiveProgramme: string;
    executivePolicyEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE506: boolean;
};
