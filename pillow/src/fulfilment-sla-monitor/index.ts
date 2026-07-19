/** PILLOW-FSM-001 — Fulfilment SLA Monitor exports (R2-18). */

export {
  FulfilmentSlaMonitorEngine,
  createFulfilmentSlaMonitorEngine,
  resetFulfilmentSlaMonitorForTesting,
} from "./engine.js";

export {
  buildFulfilmentSlaMonitorConfiguration,
  DEFAULT_FULFILMENT_SLA_MONITOR_CONFIGURATION,
  type FulfilmentSlaMonitorConfiguration,
} from "./configuration.js";

export {
  FULFILMENT_SLA_MONITOR_SYSTEM_PATH,
  FSM_METADATA_VERSION,
  SUPPORTED_SUPPLIER_IDENTIFIERS as FSM_SUPPORTED_SUPPLIER_IDENTIFIERS,
  SUPPORTED_CARRIER_IDENTIFIERS as FSM_SUPPORTED_CARRIER_IDENTIFIERS,
  COMPLIANCE_STATUSES,
  SLA_ALERT_TYPES,
} from "./paths.js";

export type {
  FulfilmentSlaMonitorVersion,
  SlaRecord,
  SlaReport,
  SlaHistoryEntry,
  FulfilmentSlaMonitorState,
  SlaCockpitSnapshot,
  SlaHealthReport,
  SlaPerformanceStats,
  MonitorFulfilmentSlaInput,
  ComplianceStatus,
  SlaAlertType,
  SupportedSupplierIdentifier as FsmSupportedSupplierIdentifier,
  SupportedCarrierIdentifier as FsmSupportedCarrierIdentifier,
} from "./types.js";
