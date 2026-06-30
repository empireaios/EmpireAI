export {
  KPI_METRIC_KEYS,
  KPI_UNITS,
  KPI_PERIODS,
  KPI_LIFECYCLE_EVENTS,
  kpiMetricSchema,
  CANONICAL_KPI_IDS,
  validateKpiMetric,
  computeDelta,
  computeProgressToTarget,
} from "./models/kpi-metric.js";
export type {
  KpiMetricKey,
  KpiUnit,
  KpiPeriod,
  KpiLifecycleEvent,
  KpiMetric,
  KpiObservation,
  KpiLifecycleRecord,
  KpiDashboardEntry,
  KpiDashboard,
  KpiObservationInput,
} from "./models/kpi-metric.js";

export type { KpiRepository } from "./repositories/kpi-repository.js";
export {
  SqliteKpiRepository,
  getKpiRepository,
  resetKpiRepository,
  createKpiLifecycleRecord,
  createKpiObservation,
} from "./repositories/sqlite-kpi-repository.js";

export { createDefaultKpiMetrics } from "./services/kpi-default-metrics.js";

export {
  KpiNotFoundError,
  initializeKpiEngine,
  recordKpiObservation,
  updateKpiTarget,
  getKpiMetric,
  getKpiByKey,
  listKpiMetrics,
  listKpiObservations,
  listWorkspaceKpiObservations,
  listKpiLifecycle,
  listWorkspaceKpiLifecycle,
  getKpiDashboard,
  syncKpisFromLedger,
  recordKpiBatch,
} from "./services/kpi-engine-service.js";

export { registerKpiEngineRoutes } from "./routes/kpi-engine-routes.js";
export { kpiEngineTools } from "./tools/kpi-engine-tools.js";

export {
  KPI_ENGINE_MODULE_ID,
  KPI_ENGINE_CAPABILITIES,
  createKpiEngineModuleContract,
} from "./contract/kpi-engine-module.js";
export type {
  KpiEngineCapability,
  KpiEngineModuleContract,
} from "./contract/kpi-engine-module.js";
