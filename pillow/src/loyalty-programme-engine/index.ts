export {
  LOYALTY_PROGRAMME_ENGINE_SYSTEM_PATH,
  LOYALTY_PROGRAMME_ENGINE_ID,
  LPE_METADATA_VERSION,
  LPE_CAPABILITIES,
  ENGINE_STATUSES,
  ENGINE_STATES,
  LOYALTY_TIERS,
  LOYALTY_ACTIVITY_TYPES,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildLoyaltyProgrammeEngineConfiguration,
  DEFAULT_LOYALTY_PROGRAMME_ENGINE_CONFIGURATION,
  type LoyaltyProgrammeEngineConfiguration,
  type PointsCalculationRule,
  type TierRule,
  type RewardRule,
} from "./configuration.js";

export {
  LoyaltyProgrammeEngine,
  createLoyaltyProgrammeEngine,
  resetLoyaltyProgrammeEngineForTesting,
  type LoyaltyProgrammeEngineOptions,
} from "./engine.js";

export type {
  LoyaltyProgrammeEngineVersion,
  LoyaltyProgrammeEngineState,
  LoyaltyEngineRecord,
  LoyaltyProgramme,
  LoyaltyMember,
  LoyaltyRecord,
  LoyaltyReward,
  LoyaltyAbuseAlert,
  LoyaltyFailure,
  LoyaltyValidationReport,
  LoyaltyRunReport,
  LoyaltyHealthReport,
  LoyaltyPerformanceStats,
  LoyaltyCockpitSnapshot,
  ConnectLoyaltyProgrammeEngineInput,
  CreateLoyaltyProgrammeInput,
  RegisterLoyaltyMemberInput,
  AwardLoyaltyPointsInput,
  RedeemLoyaltyPointsInput,
  ManageLoyaltyTierInput,
  TrackLoyaltyBalanceInput,
  TrackLoyaltyActivityInput,
  DetectLoyaltyAbuseInput,
  GenerateLoyaltyRewardsInput,
  DetectLoyaltyFailuresInput,
  EngineStatus,
  EngineState,
  LoyaltyTier,
  LoyaltyActivityType,
  HealthStatus,
} from "./types.js";

export { appendLpeLog, getLpeLogs, resetLpeLogsForTesting } from "./lpe-logging.js";
