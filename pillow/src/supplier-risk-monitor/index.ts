/** PILLOW-SRM-001 — Supplier Risk Monitor exports (R2-16). */

export {
  SupplierRiskMonitorEngine,
  createSupplierRiskMonitorEngine,
  resetSupplierRiskMonitorForTesting,
} from "./engine.js";

export {
  buildSupplierRiskMonitorConfiguration,
  DEFAULT_SUPPLIER_RISK_MONITOR_CONFIGURATION,
  type SupplierRiskMonitorConfiguration,
} from "./configuration.js";

export {
  SUPPLIER_RISK_MONITOR_SYSTEM_PATH,
  SRM_METADATA_VERSION,
  SUPPORTED_SUPPLIER_IDENTIFIERS as SRM_SUPPORTED_SUPPLIER_IDENTIFIERS,
  AVAILABILITY_STATUSES,
  STABILITY_STATUSES,
  FULFILMENT_RELIABILITY_STATUSES,
  RISK_ALERT_TYPES,
} from "./paths.js";

export type {
  SupplierRiskMonitorVersion,
  SupplierRiskRecord,
  SupplierRiskReport,
  SupplierRiskMonitorState,
  SupplierRiskCockpitSnapshot,
  SupplierRiskHealthReport,
  SupplierRiskPerformanceStats,
  MonitorSupplierHealthInput,
  SupportedSupplierIdentifier,
  AvailabilityStatus,
  StabilityStatus,
  FulfilmentReliabilityStatus,
} from "./types.js";
