export {
  SUPPLIER_PLATFORMS,
  supplierPlatformSchema,
  validateSupplierPlatform,
  normalizeSupplierPlatform,
} from "./models/supplier-platform.js";
export type { SupplierPlatform } from "./models/supplier-platform.js";

export {
  SUPPLIER_HEALTH_STATES,
  supplierHealthSchema,
  validateSupplierHealth,
  createDefaultSupplierHealth,
} from "./models/supplier-health.js";
export type { SupplierHealthState, SupplierHealth, SupplierHealthInput } from "./models/supplier-health.js";

export {
  SUPPLIER_CONNECTOR_CAPABILITY_KINDS,
  supplierConnectorCapabilitySchema,
  validateSupplierConnectorCapability,
} from "./models/supplier-capabilities.js";
export type {
  SupplierConnectorCapabilityKind,
  SupplierConnectorCapability,
  SupplierConnectorCapabilityInput,
} from "./models/supplier-capabilities.js";

export {
  SUPPLIER_SYNC_MODES,
  syncMetadataSchema,
  validateSyncMetadata,
  createDefaultSyncMetadata,
} from "./models/sync-metadata.js";
export type { SupplierSyncMode, SyncMetadata } from "./models/sync-metadata.js";

export {
  SUPPLIER_CONNECTOR_STATUSES,
  SUPPLIER_INTEGRATION_MODES,
  supplierConnectorSchema,
  validateSupplierConnector,
} from "./models/supplier-connector.js";
export type {
  SupplierConnectorStatus,
  SupplierIntegrationMode,
  SupplierConnector,
} from "./models/supplier-connector.js";

export {
  SUPPLIER_CONNECTOR_SIGNAL_TYPES,
  supplierConnectorSignalSchema,
  validateSupplierConnectorSignal,
} from "./models/supplier-connector-signal.js";
export type {
  SupplierConnectorSignalType,
  SupplierConnectorSignal,
} from "./models/supplier-connector-signal.js";

export {
  supplierConnectorRecordSchema,
  validateSupplierConnectorRecord,
} from "./models/supplier-connector-record.js";
export type {
  SupplierConnectorRecordId,
  SupplierConnectorRecord,
  SupplierConnectorRecordCreateInput,
} from "./models/supplier-connector-record.js";

export {
  SUPPLIER_ADAPTER_TEMPLATES,
  CJ_DROPSHIPPING_ADAPTER,
  ALIEXPRESS_ADAPTER,
  ZENDROP_ADAPTER,
  AUTODS_ADAPTER,
  resolveSupplierAdapterTemplate,
  resolveSupplierAdapterByConnectorId,
} from "./adapters/supplier-adapter-registry.js";
export type { SupplierAdapterTemplate } from "./adapters/supplier-adapter-registry.js";

export type {
  SupplierConnectorFrameworkRepositoryQuery,
  SupplierConnectorFrameworkRepository,
} from "./repositories/supplier-connector-framework-repository.js";

export {
  InMemorySupplierConnectorFrameworkRepository,
  createInMemorySupplierConnectorFrameworkRepository,
} from "./repositories/in-memory-supplier-connector-framework-repository.js";

export {
  SUPPLIER_CONNECTOR_SIGNAL_WEIGHTS,
  prepareSupplierConnector,
  prepareAllSupplierConnectors,
  supplierConnectorScoring,
} from "./scoring/supplier-connector-scoring.js";
export type {
  PrepareSupplierConnectorInput,
  PrepareSupplierConnectorBreakdown,
} from "./scoring/supplier-connector-scoring.js";

export {
  SupplierConnectorFrameworkEngine,
  defaultSupplierConnectorFrameworkEngine,
} from "./engines/supplier-connector-framework-engine.js";

export {
  SUPPLIER_CONNECTOR_FRAMEWORK_MODULE_ID,
  SUPPLIER_CONNECTOR_FRAMEWORK_MODULE_VERSION,
  SUPPLIER_CONNECTOR_FRAMEWORK_CAPABILITIES,
  SUPPLIER_CONNECTOR_FRAMEWORK_MODULE_CONTRACT,
  SupplierConnectorFrameworkModule,
  createSupplierConnectorFrameworkModule,
  supplierConnectorFrameworkModule,
} from "./contract/supplier-connector-framework-module.js";
export type {
  SupplierConnectorFrameworkModuleId,
  SupplierConnectorFrameworkCapability,
  SupplierConnectorFrameworkModuleContract,
} from "./contract/supplier-connector-framework-module.js";
