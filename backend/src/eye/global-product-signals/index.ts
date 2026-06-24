export {
  SIGNAL_SOURCES,
  parseSignalSource,
  SIGNAL_SOURCE_RELIABILITY,
} from "./models/signal-source.js";
export type { SignalSource } from "./models/signal-source.js";

export {
  signalEvidenceSchema,
  validateSignalEvidence,
} from "./models/signal-evidence.js";
export type { SignalEvidence, SignalEvidenceInput } from "./models/signal-evidence.js";

export {
  globalProductSignalSchema,
  validateGlobalProductSignal,
} from "./models/product-signal.js";
export type {
  GlobalProductSignal,
  GlobalProductSignalCreateInput,
  GlobalProductSignalUpdateInput,
  ProductSignal,
  ProductSignalCreateInput,
} from "./models/product-signal.js";

export type {
  ProductSignalRegistryQuery,
  ProductSignalRegistry,
} from "./repositories/product-signal-registry.js";

export {
  InMemoryProductSignalRegistry,
  createInMemoryProductSignalRegistry,
} from "./repositories/in-memory-product-signal-registry.js";

export {
  normalizeProductSignalInput,
  computeSignalConfidence,
  signalNormalization,
} from "./utilities/signal-normalization.js";
export type { RawProductSignalInput } from "./utilities/signal-normalization.js";

export {
  GLOBAL_PRODUCT_SIGNAL_MODULE_ID,
  GLOBAL_PRODUCT_SIGNAL_MODULE_VERSION,
  GLOBAL_PRODUCT_SIGNAL_CAPABILITIES,
  GLOBAL_PRODUCT_SIGNAL_MODULE_CONTRACT,
  GlobalProductSignalModule,
  createGlobalProductSignalModule,
  globalProductSignalModule,
} from "./contract/global-product-signal-module.js";
export type {
  GlobalProductSignalModuleId,
  GlobalProductSignalCapability,
  GlobalProductSignalModuleContract,
} from "./contract/global-product-signal-module.js";
