/** Pillow Executive Perspectives — internal reasoning disciplines (NOT independent agents). */



export type PerspectiveId =

  | "FINANCIAL"

  | "TECHNOLOGY"

  | "OPERATIONS"

  | "RISK"

  | "COMMERCIAL"

  | "REPOSITORY"

  | "STRATEGY";



export type PerspectiveStance = "support" | "caution" | "oppose" | "neutral";



export type RecommendationStatus =

  | "awaiting_grand_king"

  | "approved"

  | "rejected"

  | "deferred";



export type ObjectiveAlignment = "aligned" | "partial" | "misaligned";



export interface ExecutivePerspective {

  id: PerspectiveId;

  title: string;

  focus: string[];

}



export interface ExecutivePerspectivesInput {

  topic: string;

  proposalSummary: string;

  userMessage: string;

  currentObjective: string | null;

  journeyPosition: string | null;

  repositoryHealthScore: number;

  subjectType?: "general" | "engineering" | "commercial" | "repository" | "strategy";

}



export interface PerspectiveOpinionRecord {

  opinionId: string;

  perspectiveId: PerspectiveId;

  title: string;

  stance: PerspectiveStance;

  recommendation: string;

  reasoning: string;

  risks: string[];

  alternatives: string[];

  confidence: number;

  challengesAssumptions: string[];

  rejectedAlternatives?: string[];

}



export interface PerspectiveDissentRecord {

  dissentId: string;

  perspectiveId: PerspectiveId;

  title: string;

  minorityOpinion: string;

  reason: string;

  confidence: number;

  tradeOff?: string;

}



/** Pillow synthesis output — single executive recommendation (no separate CEO entity). */

export interface PillowExecutiveRecommendation {

  recommendationId: string;

  topic: string;

  currentObjective: string | null;

  recommendation: string;

  reason: string;

  expectedProfitImpact: string;

  expectedEngineeringCost: string;

  expectedRisk: string;

  confidence: number;

  evidence: string[];

  assumptions: string[];

  alternatives: string[];

  rejectedAlternatives: string[];

  objectiveAlignment: ObjectiveAlignment;

  status: RecommendationStatus;

  synthesizedAt: string;

  synthesizedBy: "pillow";

}



export interface PillowExecutiveDebateSession {

  debateId: string;

  topic: string;

  proposalSummary: string;

  opinions: PerspectiveOpinionRecord[];

  dissents: PerspectiveDissentRecord[];

  /** Hidden from Grand King unless View Executive Debate is requested. */

  pillowRecommendation: PillowExecutiveRecommendation;

  debateCompletedAt: string;

  confidentiality: "internal_only";

}



export interface PillowExecutivePerspectivesResult {

  debate: PillowExecutiveDebateSession;

  /** Grand King-facing — one recommendation only; internal debate hidden by default. */

  publicRecommendation: PillowExecutiveRecommendation;

  debateAvailable: true;

}


