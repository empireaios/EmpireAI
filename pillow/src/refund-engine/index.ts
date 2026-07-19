/** PILLOW-RF-001 — Refund Engine exports (R3-10). */

export {
  RefundEngine,
  createRefundEngine,
  resetRefundEngineForTesting,
} from "./engine.js";

export {
  buildRefundEngineConfiguration,
  DEFAULT_REFUND_ENGINE_CONFIGURATION,
  type RefundEngineConfiguration,
} from "./configuration.js";

export {
  REFUND_ENGINE_SYSTEM_PATH,
  RF_METADATA_VERSION,
  REFUND_ENGINE_ID,
  RF_CAPABILITIES,
  REFUND_STATUSES,
} from "./paths.js";

export type {
  RefundEngineVersion,
  RefundEngineRecord,
  RefundRecord,
  RefundEngineRunReport,
  RefundEngineState,
  RefundCockpitSnapshot,
  RefundHealthReport,
  RefundPerformanceStats,
  ConnectRefundEngineInput,
  CreateRefundRequestInput,
  ValidateRefundEligibilityInput,
  ProcessFullRefundInput,
  ProcessPartialRefundInput,
  RefundStatus,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
