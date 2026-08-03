export {
  AutonomousEmpireEvolution,
  createAutonomousEmpireEvolution,
  resetAutonomousEmpireEvolutionForTesting,
  type AutonomousEmpireEvolutionDependencies,
  type AutonomousEmpireEvolutionOptions,
} from "./engine.js";
export {
  buildAutonomousEmpireEvolutionConfiguration,
  DEFAULT_AUTONOMOUS_EMPIRE_EVOLUTION_CONFIGURATION,
  type AutonomousEmpireEvolutionConfiguration,
} from "./configuration.js";
export {
  AUTONOMOUS_EMPIRE_EVOLUTION_SYSTEM_PATH,
  AUTONOMOUS_EMPIRE_EVOLUTION_ID,
  AEE_METADATA_VERSION,
  AEE_CAPABILITIES,
} from "./paths.js";
export type {
  AutonomousEmpireEvolutionState,
  AutonomousEmpireEvolutionInput,
  EvolutionRecord,
  EvolutionRecommendation,
  AutonomousEmpireEvolutionRunReport,
  AutonomousEmpireEvolutionCockpitSnapshot,
  AutonomousEmpireEvolutionEngineRecord,
} from "./types.js";
