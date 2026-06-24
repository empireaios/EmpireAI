export {
  SOURCE_TRUST_SIGNAL_TYPES,
  sourceTrustSignalSchema,
  validateSourceTrustSignal,
} from "./models/source-trust-signal.js";
export type { SourceTrustSignalType, SourceTrustSignal } from "./models/source-trust-signal.js";

export {
  TRUST_TIERS,
  sourceTrustProfileSchema,
  validateSourceTrustProfile,
  resolveTrustTier,
} from "./models/source-trust-profile.js";
export type {
  SourceTrustProfileId,
  TrustTier,
  SourceTrustProfile,
  SourceTrustProfileCreateInput,
} from "./models/source-trust-profile.js";

export {
  SOURCE_TRUST_WEIGHTS,
  scoreSourceTrust,
  sourceTrustScoring,
} from "./scoring/source-trust-scoring.js";
export type {
  SourceTrustAnalysisInput,
  SourceTrustScoreBreakdown,
} from "./scoring/source-trust-scoring.js";

export type {
  SourceTrustRepositoryQuery,
  SourceTrustRepository,
} from "./repositories/source-trust-repository.js";

export {
  InMemorySourceTrustRepository,
  createInMemorySourceTrustRepository,
} from "./repositories/in-memory-source-trust-repository.js";

export { SourceTrustEngine } from "./engines/source-trust-engine.js";
export type { SourceTrustEvaluationInput } from "./engines/source-trust-engine.js";

export {
  SOURCE_TRUST_INTELLIGENCE_MODULE_ID,
  SOURCE_TRUST_INTELLIGENCE_MODULE_VERSION,
  SOURCE_TRUST_INTELLIGENCE_CAPABILITIES,
  SOURCE_TRUST_INTELLIGENCE_MODULE_CONTRACT,
  SourceTrustModule,
  createSourceTrustModule,
  sourceTrustModule,
} from "./contract/source-trust-module.js";
export type {
  SourceTrustIntelligenceModuleId,
  SourceTrustIntelligenceCapability,
  SourceTrustIntelligenceModuleContract,
} from "./contract/source-trust-module.js";
