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
