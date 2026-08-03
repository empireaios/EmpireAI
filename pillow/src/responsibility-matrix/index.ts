export {
  ResponsibilityMatrix,
  createResponsibilityMatrix,
  resetResponsibilityMatrixForTesting,
  type ResponsibilityMatrixOptions,
} from "./engine.js";
export {
  buildResponsibilityMatrixConfiguration,
  DEFAULT_RESPONSIBILITY_MATRIX_CONFIGURATION,
  DEFAULT_SEED_RESPONSIBILITIES,
  type ResponsibilityMatrixConfiguration,
} from "./configuration.js";
export {
  RESPONSIBILITY_MATRIX_ID,
  RESPONSIBILITY_MATRIX_SYSTEM_PATH,
  RMX_METADATA_VERSION,
  MATRIX_VERSION,
  RESPONSIBILITY_RULES,
  MATRIX_DECISIONS,
  RMX_CAPABILITIES,
} from "./paths.js";
export type {
  ResponsibilityMatrixState,
  ResponsibilityDefinition,
  ResponsibilityBinding,
  ResponsibilityMatrixCatalog,
  ResponsibilityMatrixInput,
  ResponsibilityMatrixRunReport,
  ResponsibilityMatrixCockpitSnapshot,
  ResponsibilityMatrixEngineRecord,
  ResponsibilityMatrixValidationReport,
  MatrixDecision,
  ResponsibilityRule,
} from "./types.js";
