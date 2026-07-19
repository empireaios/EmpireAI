/** PILLOW-AME-001 — Autonomous Marketing Engine exports (R5-19). */

export {
  AutonomousMarketingEngine,
  createAutonomousMarketingEngine,
  resetAutonomousMarketingEngineForTesting,
  type AutonomousMarketingEngineDependencies,
} from "./engine.js";

export {
  buildAutonomousMarketingEngineConfiguration,
  DEFAULT_AUTONOMOUS_MARKETING_ENGINE_CONFIGURATION,
  type AutonomousMarketingEngineConfiguration,
} from "./configuration.js";

export {
  AUTONOMOUS_MARKETING_ENGINE_SYSTEM_PATH,
  AME_METADATA_VERSION,
  AUTONOMOUS_MARKETING_ENGINE_ID,
  AME_CAPABILITIES,
  OPTIMIZATION_CATEGORIES,
  EXECUTION_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  AutonomousMarketingEngineVersion,
  AutonomousMarketingEngineRecord,
  AutonomousMarketingRecord,
  AutonomousMarketingRunReport,
  AutonomousMarketingEngineState,
  AutonomousMarketingCockpitSnapshot,
  AutonomousMarketingHealthReport,
  AutonomousMarketingPerformanceStats,
  ConnectAutonomousMarketingEngineInput,
  MonitorPerformanceInput,
  AutonomousMarketingActionInput,
  AmeCapability,
  OptimizationCategory,
  ExecutionStatus,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
