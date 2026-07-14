/** E2-11 — Executive Consensus Engine frontend types (mirrors Pillow PILLOW-ECE-001). */

export type ExecutivePerspective = {
  participant: string;
  label: string;
  perspective: string;
  alignment: string;
  confidence: number;
  evidence: string[];
};

export type ExecutiveConsensus = {
  consensusId: string;
  decisionId: string;
  title: string;
  purpose: string;
  category: string;
  domain: string;
  participatingPerspectives: string[];
  areasOfAgreement: string[];
  areasOfDisagreement: string[];
  supportingEvidence: string[];
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  riskAssessment: string;
  consensusStrength: number;
  confidence: number;
  recommendedDecision: string;
  status: string;
};

export type ConsensusAgreementEntry = {
  consensusId: string;
  area: string;
  summary: string;
  participants: string[];
  strength: number;
};

export type ConsensusDisagreementEntry = {
  consensusId: string;
  area: string;
  summary: string;
  dissentingPerspectives: string[];
  resolution: string;
};

export type ConsensusAnalysisMetric = {
  consensusId: string;
  title: string;
  dimension: string;
  score: number;
  summary: string;
};

export type ConsensusPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExecutiveConsensusRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowConsensusEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveConsensusEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  consensusHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeConsensusCount: number;
  strongConsensusCount: number;
  pendingConsensusCount: number;
  executivePerspectives: ExecutivePerspective[];
  activeConsensus: ExecutiveConsensus[];
  agreementAreas: ConsensusAgreementEntry[];
  disagreementAreas: ConsensusDisagreementEntry[];
  consensusAnalysis: ConsensusAnalysisMetric[];
  consensusPipeline: ConsensusPipelineStep[];
  recommendedActions: ExecutiveConsensusRecommendation[];
  pillowEvaluations: PillowConsensusEvaluationMetric[];
  consensusPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE212: boolean;
};
