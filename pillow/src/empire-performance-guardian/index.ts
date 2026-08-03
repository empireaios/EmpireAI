export {
  EmpirePerformanceGuardian,
  createEmpirePerformanceGuardian,
  resetEmpirePerformanceGuardianForTesting,
  type EmpirePerformanceGuardianDependencies,
  type EmpirePerformanceGuardianOptions,
} from "./engine.js";
export {
  buildEmpirePerformanceGuardianConfiguration,
  DEFAULT_EMPIRE_PERFORMANCE_GUARDIAN_CONFIGURATION,
  type EmpirePerformanceGuardianConfiguration,
} from "./configuration.js";
export {
  EMPIRE_PERFORMANCE_GUARDIAN_SYSTEM_PATH,
  EMPIRE_PERFORMANCE_GUARDIAN_ID,
  EPG_METADATA_VERSION,
  EPG_CAPABILITIES,
} from "./paths.js";
export type {
  EmpirePerformanceGuardianState,
  EmpirePerformanceGuardianInput,
  PerformanceRecord,
  PerformanceRecommendation,
  EmpirePerformanceGuardianRunReport,
  EmpirePerformanceGuardianCockpitSnapshot,
  EmpirePerformanceGuardianEngineRecord,
} from "./types.js";
