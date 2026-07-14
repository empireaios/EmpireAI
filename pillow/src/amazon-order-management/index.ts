/** PILLOW-AMZO-001 — Amazon Order Management exports (R1-04). */

export {
  AmazonOrderManagementEngine,
  createAmazonOrderManagementEngine,
  resetAmazonOrderManagementForTesting,
} from "./engine.js";

export {
  buildAmazonOrderManagementConfiguration,
  DEFAULT_AMAZON_ORDER_MANAGEMENT_CONFIGURATION,
  type AmazonOrderManagementConfiguration,
} from "./configuration.js";

export {
  AMAZON_ORDER_MANAGEMENT_SYSTEM_PATH,
  AMAZON_ORDER_METADATA_VERSION,
  AMAZON_ORDER_MARKETPLACE_ID,
  AMAZON_ORDERS_API_PATHS,
  ORDER_STATUSES,
  LIFECYCLE_EVENT_TYPES,
} from "./paths.js";

export type {
  AmazonOrderManagementEngineVersion,
  AmazonOrderRecord,
  AmazonOrderItem,
  AmazonOrderSyncReport,
  AmazonOrderManagementState,
  AmazonOrderCockpitSnapshot,
  AmazonOrderHealthReport,
  AmazonOrderPerformanceStats,
  AmazonOrderChangeSet,
  AmazonOrderLifecycleEvent,
  SyncAmazonOrdersInput,
  FetchAmazonOrderInput,
  ProcessAmazonOrderEventInput,
  OrderStatus,
  FulfilmentStatus,
  LifecycleEventType,
  EngineStatus,
  HealthStatus,
} from "./types.js";
