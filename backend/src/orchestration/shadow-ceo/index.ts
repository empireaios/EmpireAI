/**
 * Shadow CEO control plane — public exports.
 */

export type * from "./types.js";
export {
  DEFAULT_SHADOW_CEO_MODE,
} from "./types.js";

export {
  SqliteShadowCeoRepository,
  openShadowCeoRepository,
  ensureShadowCeoTables,
} from "./repository.js";
export type { ShadowCeoRepositoryOptions } from "./repository.js";

export {
  pendingCompletion,
  completedWithEvidence,
  assertCompletable,
  buildObjective,
  loadChain,
  verifyChainIntegrity,
  runVerticalSliceDemo,
  newEphemeralId,
} from "./control-plane.js";
export type {
  CreateObjectiveInput,
  ChainIntegrityIssue,
  RunVerticalSliceDemoOptions,
} from "./control-plane.js";
