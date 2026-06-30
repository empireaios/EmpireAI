export {
  STOREFRONT_SIGNAL_TYPES,
  storefrontSignalSchema,
  validateStorefrontSignal,
} from "./models/storefront-signal.js";
export type { StorefrontSignalType, StorefrontSignal } from "./models/storefront-signal.js";

export {
  storefrontRouteSchema,
  validateStorefrontRoute,
} from "./models/storefront-route.js";
export type { StorefrontRoute } from "./models/storefront-route.js";

export {
  STOREFRONT_ASSET_TYPES,
  storefrontAssetSchema,
  validateStorefrontAsset,
} from "./models/storefront-asset.js";
export type { StorefrontAssetType, StorefrontAsset } from "./models/storefront-asset.js";

export {
  storefrontSchema,
  validateStorefront,
} from "./models/storefront.js";
export type {
  StorefrontId,
  Storefront,
  StorefrontCreateInput,
} from "./models/storefront.js";

export type {
  StorefrontRepositoryQuery,
  StorefrontRepository,
} from "./repositories/storefront-repository.js";

export {
  InMemoryStorefrontRepository,
  createInMemoryStorefrontRepository,
} from "./repositories/in-memory-storefront-repository.js";

export {
  STOREFRONT_SIGNAL_WEIGHTS,
  scoreStorefrontAssembly,
  storefrontAssemblyScoring,
} from "./scoring/storefront-assembly-scoring.js";
export type {
  AssemblyBrandInput,
  AssemblyBlueprintInput,
  AssemblyPageInput,
  StorefrontAssemblyInput,
  StorefrontAssemblyBreakdown,
} from "./scoring/storefront-assembly-scoring.js";

export {
  StorefrontAssemblyEngine,
  defaultStorefrontAssemblyEngine,
} from "./engines/storefront-assembly-engine.js";

export {
  STOREFRONT_ASSEMBLY_MODULE_ID,
  STOREFRONT_ASSEMBLY_MODULE_VERSION,
  STOREFRONT_ASSEMBLY_CAPABILITIES,
  STOREFRONT_ASSEMBLY_MODULE_CONTRACT,
  StorefrontAssemblyModule,
  createStorefrontAssemblyModule,
  storefrontAssemblyModule,
} from "./contract/storefront-assembly-module.js";
export type {
  StorefrontAssemblyModuleId,
  StorefrontAssemblyCapability,
  StorefrontAssemblyModuleContract,
} from "./contract/storefront-assembly-module.js";
