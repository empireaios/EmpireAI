/** PILLOW-ECE-001 — Executive Consensus Engine types (E2-11). */

import type {
  CONSENSUS_PIPELINE,
  CONSENSUS_PRINCIPLES,
  GOVERNED_CONSENSUS_DOMAINS,
  CONSENSUS_CLASSIFICATIONS,
  CONSENSUS_PARTICIPANTS,
  CONSENSUS_ANALYSIS_DIMENSIONS,
  PILLOW_CONSENSUS_EVALUATIONS,
} from "./paths.js";

export type ExecutiveConsensusEngineVersion = "E2-11";

export type ConsensusPipelinePhase = (typeof CONSENSUS_PIPELINE)[number];
export type ConsensusPrinciple = (typeof CONSENSUS_PRINCIPLES)[number];
export type GovernedConsensusDomain = (typeof GOVERNED_CONSENSUS_DOMAINS)[number];
export type ConsensusClassification = (typeof CONSENSUS_CLASSIFICATIONS)[number];
export type ConsensusParticipant = (typeof CONSENSUS_PARTICIPANTS)[number];
export type ConsensusAnalysisDimension = (typeof CONSENSUS_ANALYSIS_DIMENSIONS)[number];
export type PillowConsensusEvaluation = (typeof PILLOW_CONSENSUS_EVALUATIONS)[number];

export type ConsensusPipelineStep = {
  phase: ConsensusPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExecutivePerspective = {
  participant: ConsensusParticipant;
  label: string;
  perspective: string;
  alignment: string;
  confidence: number;
  evidence: string[];
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

export type ExecutiveConsensus = {
  consensusId: string;
  decisionId: string;
  title: string;
  purpose: string;
  category: ConsensusClassification;
  domain: GovernedConsensusDomain;
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

export type ConsensusAnalysisMetric = {
  consensusId: string;
  title: string;
  dimension: ConsensusAnalysisDimension;
  score: number;
  summary: string;
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
  domain: PillowConsensusEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveConsensusEngine = {
  engineVersion: ExecutiveConsensusEngineVersion;
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
  consensusPrinciples: ConsensusPrinciple[];
  governedDomains: GovernedConsensusDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveDecisionArchitecture: string;
    riskAssessmentEngine: string;
    decisionSimulationEngine: string;
    executiveRecommendationEngine: string;
    tradeOffAnalysisEngine: string;
    guardianStatus: string;
    executivePlanningProgramme: string;
    corporateVisionEngine: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE212: boolean;
};
