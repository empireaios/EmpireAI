export {
  LIFECYCLE_PHASES,
  revenueLifecycleSnapshotSchema,
  grandKingsRevenueCycleRecordSchema,
  validateGrandKingsRevenueCycleRecord,
} from "./models/grand-kings-revenue-cycle-record.js";
export type {
  LifecyclePhase,
  RevenueLifecycleSnapshot,
  AdvertisingLifecycleSnapshot,
  OrderLifecycleSnapshot,
  CapitalLifecycleSnapshot,
  KpiLifecycleSnapshot,
  GrandKingsRevenueCycleRecord,
} from "./models/grand-kings-revenue-cycle-record.js";

export {
  loadGrandKingsRevenueEnv,
  isGrandKingsRevenueEngineEnabled,
} from "./config/grand-kings-revenue-env.js";
export type { GrandKingsRevenueEnv } from "./config/grand-kings-revenue-env.js";

export type { GrandKingsRevenueRepository } from "./repositories/grand-kings-revenue-repository.js";
export {
  SqliteGrandKingsRevenueRepository,
  getGrandKingsRevenueRepository,
  resetGrandKingsRevenueRepository,
  createCycleRecord,
} from "./repositories/sqlite-grand-kings-revenue-repository.js";

export {
  collectRevenueLifecycle,
  collectAdvertisingLifecycle,
  collectOrderLifecycle,
  collectCapitalLifecycle,
  computeKpiLifecycle,
} from "./services/lifecycle-collector-service.js";
export type { LifecycleCollectInput } from "./services/lifecycle-collector-service.js";

export {
  GrandKingsRevenueBlockedError,
  runGrandKingsRevenueCycle,
  getRevenueLifecycleSnapshot,
  getAdvertisingLifecycleSnapshot,
  getOrderLifecycleSnapshot,
  getCapitalLifecycleSnapshot,
  getKpiLifecycleSnapshot,
  getGrandKingsRevenueCycleById,
  listGrandKingsRevenueCycles,
  getLatestGrandKingsRevenueCycle,
} from "./services/grand-kings-revenue-engine-service.js";
export type { RunGrandKingsRevenueCycleInput } from "./services/grand-kings-revenue-engine-service.js";

export { registerGrandKingsRevenueRoutes } from "./routes/grand-kings-revenue-routes.js";
export { grandKingsRevenueTools } from "./tools/grand-kings-revenue-tools.js";

export {
  GRAND_KINGS_REVENUE_ENGINE_MODULE_ID,
  GRAND_KINGS_REVENUE_CAPABILITIES,
  createGrandKingsRevenueEngineModuleContract,
} from "./contract/grand-kings-revenue-engine-module.js";
export type {
  GrandKingsRevenueCapability,
  GrandKingsRevenueEngineModuleContract,
} from "./contract/grand-kings-revenue-engine-module.js";
