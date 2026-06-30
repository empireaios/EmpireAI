export {
  LANDING_PAGE_SIGNAL_TYPES,
  landingPageSignalSchema,
  validateLandingPageSignal,
} from "./models/landing-page-signal.js";
export type { LandingPageSignalType, LandingPageSignal } from "./models/landing-page-signal.js";

export {
  LANDING_PAGE_SECTION_TYPES,
  landingPageSectionSchema,
  validateLandingPageSection,
} from "./models/landing-page-section.js";
export type { LandingPageSectionType, LandingPageSection } from "./models/landing-page-section.js";

export {
  landingPageBlueprintSchema,
  validateLandingPageBlueprint,
} from "./models/landing-page-blueprint.js";
export type {
  LandingPageBlueprintId,
  LandingPageBlueprint,
  LandingPageBlueprintCreateInput,
} from "./models/landing-page-blueprint.js";

export type {
  BlueprintRepositoryQuery,
  BlueprintRepository,
} from "./repositories/blueprint-repository.js";

export {
  InMemoryBlueprintRepository,
  createInMemoryBlueprintRepository,
} from "./repositories/in-memory-blueprint-repository.js";

export {
  LANDING_PAGE_SIGNAL_WEIGHTS,
  scoreLandingPageBlueprint,
  landingPageBlueprintScoring,
} from "./scoring/landing-page-blueprint-scoring.js";
export type {
  BlueprintProductOfferInput,
  BlueprintBrandInput,
  LandingPageBlueprintInput,
  LandingPageBlueprintBreakdown,
} from "./scoring/landing-page-blueprint-scoring.js";

export {
  LandingPageBlueprintEngine,
  defaultLandingPageBlueprintEngine,
} from "./engines/landing-page-blueprint-engine.js";

export {
  LANDING_PAGE_BLUEPRINT_MODULE_ID,
  LANDING_PAGE_BLUEPRINT_MODULE_VERSION,
  LANDING_PAGE_BLUEPRINT_CAPABILITIES,
  LANDING_PAGE_BLUEPRINT_MODULE_CONTRACT,
  LandingPageBlueprintModule,
  createLandingPageBlueprintModule,
  landingPageBlueprintModule,
} from "./contract/landing-page-blueprint-module.js";
export type {
  LandingPageBlueprintModuleId,
  LandingPageBlueprintCapability,
  LandingPageBlueprintModuleContract,
} from "./contract/landing-page-blueprint-module.js";
