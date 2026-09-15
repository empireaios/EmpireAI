export * from "./ceo-performance-counters.js";
export { registerShadowCeoRoutes } from "./routes.js";
export { runIntegratedVerticalSlice } from "./integrated-vertical-slice.js";
export {
  detectShadowCeoOperatingIntent,
  admitAndExecuteShadowCeoFromChat,
  shadowCeoPlanAsExecutionViolations,
} from "./chat-admission.js";
export type { ShadowCeoChatAdmission } from "./chat-admission.js";
export {
  resolveShadowCeoDataRoot,
  resolveShadowCeoDbPath,
  resolveShadowCeoAuthorityDir,
} from "./durable-paths.js";
export {
  persistRequestOwner,
  getRequestOwner,
  findOwnerByDigest,
  ownershipBundle,
} from "./request-owner.js";
export type { RequestOwnerRecord } from "./request-owner.js";
export {
  assertActionPermitted,
  parsePermittedActionsFromMessage,
  isSuppliedCandidateEvaluationAsk,
} from "./action-permit.js";
export {
  bindSuppliedProducts,
  runCandidateEvaluationEpisode,
  formatEligibleSelectedAnswer,
} from "./candidate-evaluation-episode.js";
