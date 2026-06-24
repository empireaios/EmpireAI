export {
  REACHABILITY_SIGNAL_TYPES,
  reachabilitySignalSchema,
  validateReachabilitySignal,
} from "./models/reachability-signal.js";
export type { ReachabilitySignal, ReachabilitySignalType } from "./models/reachability-signal.js";

export {
  REACHABILITY_CHANNEL_NAMES,
  REACHABILITY_CHANNEL_TYPES,
  CHANNEL_TYPE_BY_NAME,
  reachabilityChannelSchema,
  validateReachabilityChannel,
} from "./models/reachability-channel.js";
export type {
  ReachabilityChannel,
  ReachabilityChannelName,
  ReachabilityChannelType,
} from "./models/reachability-channel.js";

export {
  reachabilityProfileSchema,
  validateReachabilityProfile,
} from "./models/reachability-profile.js";
export type {
  ReachabilityProfile,
  ReachabilityProfileId,
  ReachabilityProfileCreateInput,
  ReachabilityProfileUpdateInput,
  ReachabilityDimensions,
} from "./models/reachability-profile.js";

export type {
  ReachabilityListQuery,
  ReachabilityRepository,
} from "./repositories/reachability-repository.js";

export {
  InMemoryReachabilityRepository,
  createInMemoryReachabilityRepository,
} from "./repositories/in-memory-reachability-repository.js";

export {
  REACHABILITY_SIGNAL_WEIGHTS,
  scoreBuyerReachability,
  reachabilityScoring,
} from "./scoring/reachability-scoring.js";
export type { ReachabilityScoreBreakdown } from "./scoring/reachability-scoring.js";

export {
  ReachabilityMapper,
  defaultReachabilityMapper,
} from "./mappers/reachability-mapper.js";

export {
  REACHABILITY_MODULE_ID,
  REACHABILITY_MODULE_VERSION,
  REACHABILITY_CAPABILITIES,
  REACHABILITY_MODULE_CONTRACT,
  ReachabilityModule,
  createReachabilityModule,
  reachabilityModule,
} from "./contract/reachability-module.js";
export type {
  ReachabilityModuleId,
  ReachabilityCapability,
  ReachabilityModuleContract,
} from "./contract/reachability-module.js";
