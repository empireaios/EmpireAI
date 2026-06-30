export {
  ARTIFACT_SIGNAL_TYPES,
  artifactSignalSchema,
  validateArtifactSignal,
} from "./models/artifact-signal.js";
export type { ArtifactSignalType, ArtifactSignal } from "./models/artifact-signal.js";

export {
  ARTIFACT_FILE_TYPES,
  artifactFileMetadataSchema,
  artifactFileSchema,
  validateArtifactFile,
} from "./models/artifact-file.js";
export type {
  ArtifactFileType,
  ArtifactFileMetadata,
  ArtifactFile,
} from "./models/artifact-file.js";

export {
  generatedArtifactSchema,
  validateGeneratedArtifact,
} from "./models/generated-artifact.js";
export type {
  GeneratedArtifactId,
  GeneratedArtifact,
  GeneratedArtifactCreateInput,
} from "./models/generated-artifact.js";

export type {
  ArtifactRepositoryQuery,
  ArtifactRepository,
} from "./repositories/artifact-repository.js";

export {
  InMemoryArtifactRepository,
  createInMemoryArtifactRepository,
} from "./repositories/in-memory-artifact-repository.js";

export {
  ARTIFACT_SIGNAL_WEIGHTS,
  scoreStorefrontArtifactGeneration,
  artifactGenerationScoring,
} from "./scoring/artifact-generation-scoring.js";
export type {
  ArtifactCodeGenerationInput,
  StorefrontArtifactGenerationInput,
  StorefrontArtifactGenerationBreakdown,
} from "./scoring/artifact-generation-scoring.js";

export {
  StorefrontArtifactGenerationEngine,
  defaultStorefrontArtifactGenerationEngine,
} from "./engines/storefront-artifact-generation-engine.js";

export {
  STOREFRONT_ARTIFACT_GENERATION_MODULE_ID,
  STOREFRONT_ARTIFACT_GENERATION_MODULE_VERSION,
  STOREFRONT_ARTIFACT_GENERATION_CAPABILITIES,
  STOREFRONT_ARTIFACT_GENERATION_MODULE_CONTRACT,
  StorefrontArtifactGenerationModule,
  createStorefrontArtifactGenerationModule,
  storefrontArtifactGenerationModule,
} from "./contract/storefront-artifact-generation-module.js";
export type {
  StorefrontArtifactGenerationModuleId,
  StorefrontArtifactGenerationCapability,
  StorefrontArtifactGenerationModuleContract,
} from "./contract/storefront-artifact-generation-module.js";
