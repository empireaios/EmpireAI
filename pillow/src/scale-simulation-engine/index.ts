/** PILLOW-SSI-001 — Scale Simulation Engine exports (X3-18). */

export {
  ScaleSimulationEngine,
  createScaleSimulationEngine,
  resetScaleSimulationEngineForTesting,
  type ScaleSimulationEngineDependencies,
  type ScaleSimulationEngineOptions,
} from "./engine.js";

export {
  buildScaleSimulationEngineConfiguration,
  DEFAULT_SCALE_SIMULATION_ENGINE_CONFIGURATION,
  type ScaleSimulationEngineConfiguration,
} from "./configuration.js";

export {
  SCALE_SIMULATION_ENGINE_SYSTEM_PATH,
  SSI_METADATA_VERSION,
  SCALE_SIMULATION_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  SIMULATION_OPERATIONS,
  SIMULATION_SCENARIOS,
  SSI_CAPABILITIES,
} from "./paths.js";

export type {
  ScaleSimulationEngineVersion,
  EngineStatus,
  OperationalState,
  SimulationOperation,
  SimulationScenario,
  SsiCapability,
  ValidationStatus,
  HealthStatus,
  ScaleSimulationRecord,
  ScaleSimulationEngineRecord,
  ScaleSimulationRecommendation,
  SimulationValidationReport,
  SsiRunReport,
  SsiHealthReport,
  SsiPerformanceStats,
  ScaleSimulationEngineState,
  SsiCockpitSnapshot,
  ConnectScaleSimulationEngineInput,
  ScaleSimulationInput,
  RunSsiDiagnosticsInput,
} from "./types.js";
