/** PILLOW-EDE-001 — Executive Deliberation Engine exports. */

export {
  deliberateExecutiveRequest,
  applyExecutiveDeliberation,
  formatExecutiveDeliberationForLlm,
  toExecutiveDeliberationPublicSummary,
  alignVisibleAnswerWithDeliberation,
} from "./engine.js";

export {
  classifySignificance,
  classifyUncertainty,
  detectChallengeStance,
  detectExecutiveRiskThemes,
  looksLikeMajorStrategicRequest,
} from "./signals.js";

export type {
  DeliberationSignificance,
  ChallengeStance,
  UncertaintyLevel,
  DeliberationAlternative,
  ExecutiveDeliberationResult,
  DeliberateExecutiveInput,
  ExecutiveDeliberationPublicSummary,
} from "./types.js";

export type { ExecutiveRiskTheme } from "./signals.js";
