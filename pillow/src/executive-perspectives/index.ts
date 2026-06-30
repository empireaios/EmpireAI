export {
  runExecutivePerspectives,
  formatExecutiveRecommendationForLlm,
} from "./synthesis-engine.js";
export {
  runExecutivePerspectivesDebate,
  countStances,
  isMinorityOpinion,
} from "./debate-engine.js";
export {
  shouldRunExecutivePerspectives,
  summarizeProposalTopic,
  inferSubjectType,
} from "./proposal-detector.js";
export { EXECUTIVE_PERSPECTIVES, DEBATE_PERSPECTIVES, SUBJECT_RELEVANCE } from "./perspectives.js";

export type {
  PerspectiveId,
  PerspectiveStance,
  RecommendationStatus,
  ObjectiveAlignment,
  ExecutivePerspective,
  ExecutivePerspectivesInput,
  PerspectiveOpinionRecord,
  PerspectiveDissentRecord,
  PillowExecutiveRecommendation,
  PillowExecutiveDebateSession,
  PillowExecutivePerspectivesResult,
} from "./types.js";

/** @deprecated Use runExecutivePerspectives — Pillow is the single executive intelligence. */
export { runExecutivePerspectives as runPillowExecutiveCouncil } from "./synthesis-engine.js";
/** @deprecated Use formatExecutiveRecommendationForLlm */
export { formatExecutiveRecommendationForLlm as formatCeoRecommendationForLlm } from "./synthesis-engine.js";
/** @deprecated Use runExecutivePerspectivesDebate */
export { runExecutivePerspectivesDebate as runExecutiveDebate } from "./debate-engine.js";
/** @deprecated Use shouldRunExecutivePerspectives */
export { shouldRunExecutivePerspectives as shouldRunExecutiveCouncil } from "./proposal-detector.js";
/** @deprecated Use EXECUTIVE_PERSPECTIVES */
export { EXECUTIVE_PERSPECTIVES as PILLOW_EXECUTIVE_PERSONAS } from "./perspectives.js";
/** @deprecated Use DEBATE_PERSPECTIVES */
export { DEBATE_PERSPECTIVES as COUNCIL_DEBATE_EXECUTIVES } from "./perspectives.js";

export type {
  PillowExecutiveRecommendation as CeoExecutiveRecommendation,
  ExecutivePerspectivesInput as ExecutiveCouncilInput,
  PerspectiveDissentRecord as ExecutiveDissentRecord,
  PerspectiveOpinionRecord as ExecutiveOpinionRecord,
  PillowExecutivePerspectivesResult as PillowExecutiveCouncilResult,
} from "./types.js";
