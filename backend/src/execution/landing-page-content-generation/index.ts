export {
  CONTENT_SIGNAL_TYPES,
  contentSignalSchema,
  validateContentSignal,
} from "./models/content-signal.js";
export type { ContentSignalType, ContentSignal } from "./models/content-signal.js";

export {
  contentSectionSchema,
  validateContentSection,
  renderContentSection,
} from "./models/content-section.js";
export type { ContentSection } from "./models/content-section.js";

export {
  landingPageContentSchema,
  validateLandingPageContent,
} from "./models/landing-page-content.js";
export type {
  LandingPageContentId,
  LandingPageContent,
  LandingPageContentCreateInput,
} from "./models/landing-page-content.js";

export type {
  ContentRepositoryQuery,
  ContentRepository,
} from "./repositories/content-repository.js";

export {
  InMemoryContentRepository,
  createInMemoryContentRepository,
} from "./repositories/in-memory-content-repository.js";

export {
  CONTENT_SIGNAL_WEIGHTS,
  scoreLandingPageContent,
  landingPageContentScoring,
} from "./scoring/landing-page-content-scoring.js";
export type {
  ContentBlueprintInput,
  ContentOfferInput,
  ContentBrandInput,
  LandingPageContentInput,
  LandingPageContentBreakdown,
  OfferStyle,
} from "./scoring/landing-page-content-scoring.js";

export {
  LandingPageContentGenerationEngine,
  defaultLandingPageContentGenerationEngine,
} from "./engines/landing-page-content-generation-engine.js";

export {
  LANDING_PAGE_CONTENT_GENERATION_MODULE_ID,
  LANDING_PAGE_CONTENT_GENERATION_MODULE_VERSION,
  LANDING_PAGE_CONTENT_GENERATION_CAPABILITIES,
  LANDING_PAGE_CONTENT_GENERATION_MODULE_CONTRACT,
  LandingPageContentGenerationModule,
  createLandingPageContentGenerationModule,
  landingPageContentGenerationModule,
} from "./contract/landing-page-content-generation-module.js";
export type {
  LandingPageContentGenerationModuleId,
  LandingPageContentGenerationCapability,
  LandingPageContentGenerationModuleContract,
} from "./contract/landing-page-content-generation-module.js";
