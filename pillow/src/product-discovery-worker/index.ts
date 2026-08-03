export {
  ProductDiscoveryWorker,
  createProductDiscoveryWorker,
  resetProductDiscoveryWorkerForTesting,
  type ProductDiscoveryWorkerOptions,
} from "./engine.js";
export type { ProductDiscoveryWorkerDependencies } from "./integrations.js";
export {
  buildProductDiscoveryWorkerConfiguration,
  DEFAULT_PRODUCT_DISCOVERY_WORKER_CONFIGURATION,
  type ProductDiscoveryWorkerConfiguration,
} from "./configuration.js";
export {
  PRODUCT_DISCOVERY_WORKER_ID,
  PRODUCT_DISCOVERY_WORKER_SYSTEM_PATH,
  PRODUCT_DISCOVERY_WORKER_IDENTITY,
  PDW_METADATA_VERSION,
  PRODUCT_DISCOVERY_REPORT_VERSION,
  DISCOVERY_SOURCES,
  PRODUCT_CATEGORIES,
  APPROVED_MARKETPLACES,
  APPROVED_SUPPLIER_PLATFORMS,
  PDW_CAPABILITIES,
  INTEGRATION_TARGETS as PDW_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  ProductDiscoveryWorkerState,
  ProductDiscoveryReport as PdwProductDiscoveryReport,
  ProductDiscoveryWorkerInput,
  ProductDiscoveryWorkerRunReport,
  ProductDiscoveryWorkerCatalog,
  ProductDiscoveryWorkerCockpitSnapshot,
  ProductDiscoveryWorkerEngineRecord,
  ProductDiscoveryWorkerValidationReport,
  EvidenceItem as PdwEvidenceItem,
  DiscoverySource as PdwDiscoverySource,
  ProductCategory as PdwProductCategory,
  IntegrationHandshake as PdwIntegrationHandshake,
} from "./types.js";
