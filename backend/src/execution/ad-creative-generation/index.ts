export {
  creativeStrategySchema,
  validateCreativeStrategy,
} from "./models/creative-strategy.js";
export type { CreativeStrategy } from "./models/creative-strategy.js";

export {
  STATIC_AD_FORMATS,
  staticAdFormatSchema,
  validateStaticAdCreative,
  staticAdFormatAspectRatio,
} from "./models/static-ad-creative.js";
export type { StaticAdFormat, StaticAdCreative } from "./models/static-ad-creative.js";

export {
  VIDEO_AD_DURATIONS,
  videoAdDurationSchema,
  validateVideoAdBlueprint,
} from "./models/video-ad-blueprint.js";
export type { VideoAdDuration, VideoStoryboardScene, VideoAdBlueprint } from "./models/video-ad-blueprint.js";

export {
  AD_CREATIVE_PLATFORMS,
  adCreativePlatformSchema,
  validatePlatformAdVariant,
  adCreativePlatformLabel,
} from "./models/platform-ad-variant.js";
export type { AdCreativePlatform, PlatformAdVariant } from "./models/platform-ad-variant.js";

export {
  creativeScoringSchema,
  validateCreativeScoring,
} from "./models/creative-scoring.js";
export type { CreativeScoring } from "./models/creative-scoring.js";

export {
  AD_CREATIVE_SIGNAL_TYPES,
  adCreativeSignalSchema,
  validateAdCreativeSignal,
} from "./models/ad-creative-signal.js";
export type { AdCreativeSignalType, AdCreativeSignal } from "./models/ad-creative-signal.js";

export {
  adCreativePackageSchema,
  validateAdCreativePackage,
  recommendedPrimaryCreativeSchema,
} from "./models/ad-creative-package.js";
export type {
  AdCreativePackageId,
  RecommendedPrimaryCreative,
  AdCreativePackage,
  AdCreativePackageCreateInput,
} from "./models/ad-creative-package.js";

export {
  adCreativeRecordSchema,
  validateAdCreativeRecord,
} from "./models/ad-creative-record.js";
export type {
  AdCreativeRecordId,
  AdCreativeRecord,
  AdCreativeRecordCreateInput,
} from "./models/ad-creative-record.js";

export type {
  AdCreativeRepositoryQuery,
  AdCreativeRepository,
} from "./repositories/ad-creative-repository.js";

export {
  InMemoryAdCreativeRepository,
  createInMemoryAdCreativeRepository,
} from "./repositories/in-memory-ad-creative-repository.js";

export {
  AD_CREATIVE_SIGNAL_WEIGHTS,
  generateAdCreativePackage,
  adCreativeGenerationScoring,
} from "./scoring/ad-creative-generation-scoring.js";
export type {
  AdCreativeBrandInput,
  AdCreativeOfferInput,
  AdCreativeGenerationInput,
  AdCreativeGenerationBreakdown,
} from "./scoring/ad-creative-generation-scoring.js";

export {
  AdCreativeGenerationEngine,
  defaultAdCreativeGenerationEngine,
} from "./engines/ad-creative-generation-engine.js";

export {
  AD_CREATIVE_GENERATION_MODULE_ID,
  AD_CREATIVE_GENERATION_MODULE_VERSION,
  AD_CREATIVE_GENERATION_CAPABILITIES,
  AD_CREATIVE_GENERATION_MODULE_CONTRACT,
  AdCreativeGenerationModule,
  createAdCreativeGenerationModule,
  adCreativeGenerationModule,
} from "./contract/ad-creative-generation-module.js";
export type {
  AdCreativeGenerationModuleId,
  AdCreativeGenerationCapability,
  AdCreativeGenerationModuleContract,
} from "./contract/ad-creative-generation-module.js";
