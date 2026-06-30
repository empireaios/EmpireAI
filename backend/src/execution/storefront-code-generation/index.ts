export {
  CODE_GENERATION_SIGNAL_TYPES,
  codeGenerationSignalSchema,
  validateCodeGenerationSignal,
} from "./models/code-generation-signal.js";
export type {
  CodeGenerationSignalType,
  CodeGenerationSignal,
} from "./models/code-generation-signal.js";

export {
  GENERATED_COMPONENT_TYPES,
  generatedComponentSchema,
  validateGeneratedComponent,
} from "./models/generated-component.js";
export type {
  GeneratedComponentType,
  GeneratedComponent,
} from "./models/generated-component.js";

export {
  generatedPageSchema,
  validateGeneratedPage,
} from "./models/generated-page.js";
export type { GeneratedPageType, GeneratedPage } from "./models/generated-page.js";

export {
  projectStructureSchema,
  deploymentMetadataSchema,
  generatedStorefrontSchema,
  validateGeneratedStorefront,
} from "./models/generated-storefront.js";
export type {
  GeneratedStorefrontId,
  ProjectStructure,
  DeploymentMetadata,
  GeneratedStorefront,
  GeneratedStorefrontCreateInput,
} from "./models/generated-storefront.js";

export type {
  CodeGenerationRepositoryQuery,
  CodeGenerationRepository,
} from "./repositories/code-generation-repository.js";

export {
  InMemoryCodeGenerationRepository,
  createInMemoryCodeGenerationRepository,
} from "./repositories/in-memory-code-generation-repository.js";

export {
  CODE_GENERATION_SIGNAL_WEIGHTS,
  scoreStorefrontCodeGeneration,
  storefrontCodeGenerationScoring,
} from "./scoring/storefront-code-generation-scoring.js";
export type {
  CodeBrandInput,
  CodeStorefrontInput,
  CodePageInput,
  StorefrontCodeGenerationInput,
  StorefrontCodeGenerationBreakdown,
} from "./scoring/storefront-code-generation-scoring.js";

export {
  StorefrontCodeGenerationEngine,
  defaultStorefrontCodeGenerationEngine,
} from "./engines/storefront-code-generation-engine.js";

export {
  STOREFRONT_CODE_GENERATION_MODULE_ID,
  STOREFRONT_CODE_GENERATION_MODULE_VERSION,
  STOREFRONT_CODE_GENERATION_CAPABILITIES,
  STOREFRONT_CODE_GENERATION_MODULE_CONTRACT,
  StorefrontCodeGenerationModule,
  createStorefrontCodeGenerationModule,
  storefrontCodeGenerationModule,
} from "./contract/storefront-code-generation-module.js";
export type {
  StorefrontCodeGenerationModuleId,
  StorefrontCodeGenerationCapability,
  StorefrontCodeGenerationModuleContract,
} from "./contract/storefront-code-generation-module.js";
